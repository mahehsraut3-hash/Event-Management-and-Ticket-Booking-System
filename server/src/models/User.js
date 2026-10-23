const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { memoryStore, generateId, attachUserMethods, isMongoLive } = require('./dataStore');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ['attendee', 'organizer', 'admin'],
        message: '{VALUE} is not a valid role'
      },
      default: 'attendee'
    },
    isApproved: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['approved', 'pending', 'suspended'],
      default: 'approved'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  if (!this.passwordHash.startsWith('$2a$') && !this.passwordHash.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }
  next();
});

const MongooseUser = mongoose.models.User || mongoose.model('User', userSchema);

// Resilient wrapper: uses real Mongoose when MongoDB is connected, otherwise uses memoryStore
const User = {
  // Underlying mongoose schema for reference
  schema: userSchema,
  mongooseModel: MongooseUser,

  findOne: (query) => {
    if (isMongoLive()) {
      return MongooseUser.findOne(query);
    }
    // Return a thenable query object that supports .select()
    let selectFields = '';
    const executor = async () => {
      let found = null;
      if (query.email) {
        found = memoryStore.users.find(u => u.email.toLowerCase() === query.email.toLowerCase());
      } else if (query._id) {
        found = memoryStore.users.find(u => u._id.toString() === query._id.toString());
      }
      if (!found) return null;
      const userObj = attachUserMethods(found);
      if (!selectFields.includes('+passwordHash') && !selectFields.includes('passwordHash')) {
        delete userObj.passwordHash;
      }
      return userObj;
    };

    return {
      select: function (fields) {
        selectFields = fields;
        return this;
      },
      then: (resolve, reject) => executor().then(resolve, reject),
      catch: (reject) => executor().catch(reject)
    };
  },

  findById: (id) => {
    if (isMongoLive()) {
      return MongooseUser.findById(id);
    }
    let selectFields = '';
    const executor = async () => {
      const found = memoryStore.users.find(u => u._id.toString() === id.toString());
      if (!found) return null;
      const userObj = attachUserMethods(found);
      if (selectFields.includes('-passwordHash')) {
        delete userObj.passwordHash;
      }
      return userObj;
    };

    return {
      select: function (fields) {
        selectFields = fields;
        return this;
      },
      then: (resolve, reject) => executor().then(resolve, reject),
      catch: (reject) => executor().catch(reject)
    };
  },

  create: async (data) => {
    if (isMongoLive()) {
      return await MongooseUser.create(data);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = (data.passwordHash && (data.passwordHash.startsWith('$2a$') || data.passwordHash.startsWith('$2b$')))
      ? data.passwordHash
      : await bcrypt.hash(data.passwordHash || data.password, salt);

    const newId = generateId();
    const newUser = {
      _id: newId,
      id: newId,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: data.role || 'attendee',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memoryStore.users.push(newUser);
    return attachUserMethods(newUser);
  },

  countDocuments: async (query = {}) => {
    if (isMongoLive()) {
      return await MongooseUser.countDocuments(query);
    }
    return memoryStore.users.length;
  },

  find: (filter = {}) => {
    if (isMongoLive()) {
      return MongooseUser.find(filter);
    }
    let selectFields = '';
    const executor = async () => {
      let results = memoryStore.users.filter(u => {
        if (filter.role && u.role !== filter.role) return false;
        if (filter.status && u.status !== filter.status) return false;
        return true;
      });

      return results.map(u => {
        const copy = JSON.parse(JSON.stringify(u));
        if (selectFields.includes('-passwordHash')) {
          delete copy.passwordHash;
        }
        return copy;
      });
    };

    return {
      select: function (fields) {
        selectFields = fields;
        return this;
      },
      sort: function () {
        return this;
      },
      then: (resolve, reject) => executor().then(resolve, reject),
      catch: (reject) => executor().catch(reject)
    };
  },

  findByIdAndUpdate: async (id, update, options = {}) => {
    if (isMongoLive()) {
      return await MongooseUser.findByIdAndUpdate(id, update, options);
    }
    const index = memoryStore.users.findIndex(u => u._id.toString() === id.toString());
    if (index === -1) return null;
    const current = memoryStore.users[index];
    if (update.$set) {
      Object.assign(current, update.$set);
    } else {
      Object.assign(current, update);
    }
    current.updatedAt = new Date();
    return JSON.parse(JSON.stringify(current));
  }
};

module.exports = User;
