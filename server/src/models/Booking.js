const mongoose = require('mongoose');
const { memoryStore, generateId, isMongoLive } = require('./dataStore');

const bookingTicketSchema = new mongoose.Schema(
  {
    ticketTypeName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    }
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user']
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Booking must belong to an event']
    },
    tickets: {
      type: [bookingTicketSchema],
      required: true
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'cancelled', 'expired'],
      default: 'confirmed'
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

const MongooseBooking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

// Helper to filter in-memory bookings
const filterMemoryBookings = (bookings, filter = {}) => {
  return bookings.filter(b => {
    if (filter.user && b.user?.toString() !== filter.user.toString()) {
      return false;
    }
    if (filter.event && b.event?.toString() !== filter.event.toString()) {
      return false;
    }
    if (filter.bookingStatus && b.bookingStatus !== filter.bookingStatus) {
      return false;
    }
    if (filter.paymentStatus && b.paymentStatus !== filter.paymentStatus) {
      return false;
    }
    return true;
  });
};

// Resilient wrapper: uses real Mongoose when MongoDB is connected, otherwise memoryStore
const Booking = {
  schema: bookingSchema,
  mongooseModel: MongooseBooking,

  find: (filter = {}) => {
    if (isMongoLive()) {
      return MongooseBooking.find(filter);
    }

    let populateFields = [];
    let sortOption = { createdAt: -1 };

    const executor = async () => {
      let results = filterMemoryBookings(memoryStore.bookings, filter);

      if (sortOption) {
        if (sortOption.createdAt) {
          results.sort((a, b) => (new Date(b.createdAt) - new Date(a.createdAt)) * (sortOption.createdAt === -1 ? 1 : -1));
        }
      }

      return results.map(b => {
        const copy = JSON.parse(JSON.stringify(b));
        if (populateFields.includes('event')) {
          const ev = memoryStore.events.find(e => e._id.toString() === (b.event?._id || b.event)?.toString());
          if (ev) {
            copy.event = JSON.parse(JSON.stringify(ev));
          }
        }
        if (populateFields.includes('user')) {
          const u = memoryStore.users.find(usr => usr._id.toString() === (b.user?._id || b.user)?.toString());
          if (u) {
            copy.user = {
              _id: u._id,
              name: u.name,
              email: u.email,
              role: u.role
            };
          }
        }
        return copy;
      });
    };

    const queryObj = {
      populate: function (field) {
        populateFields.push(typeof field === 'string' ? field.split(' ')[0] : field.path);
        return this;
      },
      sort: function (sortDef) {
        sortOption = sortDef;
        return this;
      },
      then: (resolve, reject) => executor().then(resolve, reject),
      catch: (reject) => executor().catch(reject)
    };

    return queryObj;
  },

  findById: (id) => {
    if (isMongoLive()) {
      return MongooseBooking.findById(id);
    }

    let populateFields = [];
    const executor = async () => {
      const found = memoryStore.bookings.find(b => b._id.toString() === id.toString());
      if (!found) return null;
      const copy = JSON.parse(JSON.stringify(found));
      if (populateFields.includes('event')) {
        const ev = memoryStore.events.find(e => e._id.toString() === (found.event?._id || found.event)?.toString());
        if (ev) {
          copy.event = JSON.parse(JSON.stringify(ev));
        }
      }
      if (populateFields.includes('user')) {
        const u = memoryStore.users.find(usr => usr._id.toString() === (found.user?._id || found.user)?.toString());
        if (u) {
          copy.user = {
            _id: u._id,
            name: u.name,
            email: u.email,
            role: u.role
          };
        }
      }
      return copy;
    };

    return {
      populate: function (field) {
        populateFields.push(typeof field === 'string' ? field.split(' ')[0] : field.path);
        return this;
      },
      then: (resolve, reject) => executor().then(resolve, reject),
      catch: (reject) => executor().catch(reject)
    };
  },

  create: async (doc) => {
    if (isMongoLive()) {
      return await MongooseBooking.create(doc);
    }
    const newId = generateId();
    const newBooking = {
      _id: newId,
      id: newId,
      ...doc,
      paymentStatus: doc.paymentStatus || 'pending',
      bookingStatus: doc.bookingStatus || 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.bookings.push(newBooking);
    return newBooking;
  },

  findByIdAndUpdate: async (id, update, options = {}) => {
    if (isMongoLive()) {
      return await MongooseBooking.findByIdAndUpdate(id, update, options);
    }
    const index = memoryStore.bookings.findIndex(b => b._id.toString() === id.toString());
    if (index === -1) return null;
    const current = memoryStore.bookings[index];
    if (update.$set) {
      Object.assign(current, update.$set);
    } else {
      Object.assign(current, update);
    }
    current.updatedAt = new Date();
    return current;
  }
};

module.exports = Booking;
