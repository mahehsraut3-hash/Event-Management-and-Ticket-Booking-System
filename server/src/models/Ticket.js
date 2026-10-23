const mongoose = require('mongoose');
const { memoryStore, generateId, isMongoLive } = require('./dataStore');

const ticketSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Ticket must link to a booking']
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Ticket must link to an event']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Ticket must link to an attendee user']
    },
    ticketTypeName: {
      type: String,
      default: 'General Admission'
    },
    ticketCode: {
      type: String,
      required: [true, 'Ticket code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    qrData: {
      type: String,
      required: [true, 'QR verification data is required']
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    usedAt: {
      type: Date,
      default: null
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

const MongooseTicket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);

// Helper to filter in-memory tickets
const filterMemoryTickets = (tickets, filter = {}) => {
  return tickets.filter(t => {
    if (filter._id && t._id.toString() !== filter._id.toString()) return false;
    if (filter.ticketCode && t.ticketCode.toUpperCase() !== filter.ticketCode.toUpperCase()) return false;
    if (filter.booking && t.booking?.toString() !== filter.booking.toString()) return false;
    if (filter.event && t.event?.toString() !== filter.event.toString()) return false;
    if (filter.user && t.user?.toString() !== filter.user.toString()) return false;
    if (filter.isUsed !== undefined && t.isUsed !== filter.isUsed) return false;
    return true;
  });
};

// Helper to populate relations on ticket object
const populateTicket = (ticket, populateFields = []) => {
  const copy = JSON.parse(JSON.stringify(ticket));
  if (populateFields.includes('event')) {
    const ev = memoryStore.events.find(e => e._id.toString() === (ticket.event?._id || ticket.event)?.toString());
    if (ev) copy.event = JSON.parse(JSON.stringify(ev));
  }
  if (populateFields.includes('user')) {
    const u = memoryStore.users.find(usr => usr._id.toString() === (ticket.user?._id || ticket.user)?.toString());
    if (u) {
      copy.user = {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role
      };
    }
  }
  if (populateFields.includes('booking')) {
    const b = memoryStore.bookings.find(bk => bk._id.toString() === (ticket.booking?._id || ticket.booking)?.toString());
    if (b) copy.booking = JSON.parse(JSON.stringify(b));
  }
  return copy;
};

// Resilient wrapper: uses real Mongoose when MongoDB is connected, otherwise memoryStore
const Ticket = {
  schema: ticketSchema,
  mongooseModel: MongooseTicket,

  find: (filter = {}) => {
    if (isMongoLive()) {
      return MongooseTicket.find(filter);
    }

    let populateFields = [];
    const executor = async () => {
      const results = filterMemoryTickets(memoryStore.tickets, filter);
      return results.map(t => populateTicket(t, populateFields));
    };

    const queryObj = {
      populate: function (field) {
        populateFields.push(typeof field === 'string' ? field.split(' ')[0] : field.path);
        return this;
      },
      sort: function () {
        return this;
      },
      then: (resolve, reject) => executor().then(resolve, reject),
      catch: (reject) => executor().catch(reject)
    };

    return queryObj;
  },

  findOne: (filter = {}) => {
    if (isMongoLive()) {
      return MongooseTicket.findOne(filter);
    }

    let populateFields = [];
    const executor = async () => {
      const results = filterMemoryTickets(memoryStore.tickets, filter);
      if (results.length === 0) return null;
      return populateTicket(results[0], populateFields);
    };

    const queryObj = {
      populate: function (field) {
        populateFields.push(typeof field === 'string' ? field.split(' ')[0] : field.path);
        return this;
      },
      then: (resolve, reject) => executor().then(resolve, reject),
      catch: (reject) => executor().catch(reject)
    };

    return queryObj;
  },

  findById: (id) => {
    if (isMongoLive()) {
      return MongooseTicket.findById(id);
    }

    let populateFields = [];
    const executor = async () => {
      const found = memoryStore.tickets.find(t => t._id.toString() === id.toString());
      if (!found) return null;
      return populateTicket(found, populateFields);
    };

    const queryObj = {
      populate: function (field) {
        populateFields.push(typeof field === 'string' ? field.split(' ')[0] : field.path);
        return this;
      },
      then: (resolve, reject) => executor().then(resolve, reject),
      catch: (reject) => executor().catch(reject)
    };

    return queryObj;
  },

  create: async (doc) => {
    if (isMongoLive()) {
      return await MongooseTicket.create(doc);
    }
    const newId = generateId();
    const newTicket = {
      _id: newId,
      id: newId,
      ...doc,
      isUsed: doc.isUsed || false,
      usedAt: doc.usedAt || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.tickets.push(newTicket);
    return newTicket;
  },

  findByIdAndUpdate: async (id, update, options = {}) => {
    if (isMongoLive()) {
      return await MongooseTicket.findByIdAndUpdate(id, update, options);
    }
    const index = memoryStore.tickets.findIndex(t => t._id.toString() === id.toString());
    if (index === -1) return null;
    const current = memoryStore.tickets[index];
    if (update.$set) {
      Object.assign(current, update.$set);
    } else {
      Object.assign(current, update);
    }
    current.updatedAt = new Date();
    return current;
  }
};

module.exports = Ticket;
