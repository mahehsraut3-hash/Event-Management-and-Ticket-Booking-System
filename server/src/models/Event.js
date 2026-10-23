const mongoose = require('mongoose');
const { memoryStore, generateId, isMongoLive } = require('./dataStore');

const ticketTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide ticket tier name (e.g., General, VIP)'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Please provide ticket price'],
      min: [0, 'Price cannot be negative']
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Please provide total available tickets'],
      min: [1, 'Total quantity must be at least 1']
    },
    soldQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Sold quantity cannot be negative']
    }
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an event title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide an event description']
    },
    category: {
      type: String,
      required: [true, 'Please provide an event category'],
      trim: true
    },
    venue: {
      type: String,
      required: [true, 'Please provide a venue location'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Please provide a city'],
      trim: true
    },
    startDateTime: {
      type: Date,
      required: [true, 'Please provide event start date and time']
    },
    endDateTime: {
      type: Date,
      required: [true, 'Please provide event end date and time']
    },
    bannerImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80'
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event must have an organizer']
    },
    ticketTypes: {
      type: [ticketTypeSchema],
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled'],
      default: 'published'
    }
  },
  {
    timestamps: true
  }
);

const MongooseEvent = mongoose.models.Event || mongoose.model('Event', eventSchema);

// Helper to filter in-memory events based on query object
const filterMemoryEvents = (events, filter = {}) => {
  return events.filter(e => {
    // Status filter
    if (filter.status && e.status !== filter.status) return false;
    
    // Category filter
    if (filter.category) {
      if (typeof filter.category === 'string') {
        if (e.category.toLowerCase() !== filter.category.toLowerCase()) return false;
      } else if (filter.category.$regex) {
        const regex = new RegExp(filter.category.$regex, filter.category.$options || 'i');
        if (!regex.test(e.category)) return false;
      }
    }

    // City filter
    if (filter.city) {
      if (typeof filter.city === 'string') {
        if (e.city.toLowerCase() !== filter.city.toLowerCase()) return false;
      } else if (filter.city.$regex) {
        const regex = new RegExp(filter.city.$regex, filter.city.$options || 'i');
        if (!regex.test(e.city)) return false;
      }
    }

    // Text search (title, venue, description)
    if (filter.$or) {
      const matchAny = filter.$or.some(clause => {
        for (const [key, val] of Object.entries(clause)) {
          if (val.$regex) {
            const regex = new RegExp(val.$regex, val.$options || 'i');
            if (regex.test(e[key] || '')) return true;
          }
        }
        return false;
      });
      if (!matchAny) return false;
    }

    // Date range filter
    if (filter.startDateTime) {
      const eventStart = new Date(e.startDateTime).getTime();
      if (filter.startDateTime.$gte && eventStart < new Date(filter.startDateTime.$gte).getTime()) {
        return false;
      }
      if (filter.startDateTime.$lte && eventStart > new Date(filter.startDateTime.$lte).getTime()) {
        return false;
      }
    }

    // Min / Max ticket price
    if (filter['ticketTypes.price']) {
      const priceFilter = filter['ticketTypes.price'];
      const hasMatchingTicket = e.ticketTypes.some(t => {
        if (priceFilter.$gte !== undefined && t.price < priceFilter.$gte) return false;
        if (priceFilter.$lte !== undefined && t.price > priceFilter.$lte) return false;
        return true;
      });
      if (!hasMatchingTicket) return false;
    }

    // Organizer filter
    if (filter.organizer && e.organizer?.toString() !== filter.organizer.toString()) {
      return false;
    }

    return true;
  });
};

// Resilient wrapper: uses real Mongoose when MongoDB is connected, otherwise uses memoryStore
const Event = {
  schema: eventSchema,
  mongooseModel: MongooseEvent,

  find: (filter = {}) => {
    if (isMongoLive()) {
      return MongooseEvent.find(filter);
    }

    let sortOption = { startDateTime: 1 };
    let skipCount = 0;
    let limitCount = 0;
    let populateFields = [];

    const executor = async () => {
      let results = filterMemoryEvents(memoryStore.events, filter);

      // Sorting
      if (sortOption) {
        if (sortOption.startDateTime) {
          results.sort((a, b) => (new Date(a.startDateTime) - new Date(b.startDateTime)) * sortOption.startDateTime);
        } else if (sortOption.minPrice) {
          results.sort((a, b) => {
            const minA = Math.min(...a.ticketTypes.map(t => t.price));
            const minB = Math.min(...b.ticketTypes.map(t => t.price));
            return (minA - minB) * sortOption.minPrice;
          });
        } else if (sortOption.popularity) {
          results.sort((a, b) => {
            const soldA = a.ticketTypes.reduce((acc, t) => acc + (t.soldQuantity || 0), 0);
            const soldB = b.ticketTypes.reduce((acc, t) => acc + (t.soldQuantity || 0), 0);
            return (soldB - soldA) * sortOption.popularity;
          });
        }
      }

      // Pagination
      if (skipCount > 0) {
        results = results.slice(skipCount);
      }
      if (limitCount > 0) {
        results = results.slice(0, limitCount);
      }

      // Populate organizer
      return results.map(ev => {
        const copy = JSON.parse(JSON.stringify(ev));
        if (populateFields.includes('organizer')) {
          const org = memoryStore.users.find(u => u._id.toString() === (ev.organizer?._id || ev.organizer)?.toString());
          if (org) {
            copy.organizer = {
              _id: org._id,
              name: org.name,
              email: org.email,
              role: org.role
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
      skip: function (num) {
        skipCount = Number(num) || 0;
        return this;
      },
      limit: function (num) {
        limitCount = Number(num) || 0;
        return this;
      },
      then: (resolve, reject) => executor().then(resolve, reject),
      catch: (reject) => executor().catch(reject)
    };

    return queryObj;
  },

  findById: (id) => {
    if (isMongoLive()) {
      return MongooseEvent.findById(id);
    }

    let populateFields = [];
    const executor = async () => {
      const found = memoryStore.events.find(e => e._id.toString() === id.toString());
      if (!found) return null;
      const copy = JSON.parse(JSON.stringify(found));
      if (populateFields.includes('organizer')) {
        const org = memoryStore.users.find(u => u._id.toString() === (found.organizer?._id || found.organizer)?.toString());
        if (org) {
          copy.organizer = {
            _id: org._id,
            name: org.name,
            email: org.email,
            role: org.role
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

  countDocuments: async (filter = {}) => {
    if (isMongoLive()) {
      return await MongooseEvent.countDocuments(filter);
    }
    return filterMemoryEvents(memoryStore.events, filter).length;
  },

  distinct: async (field, filter = {}) => {
    if (isMongoLive()) {
      return await MongooseEvent.distinct(field, filter);
    }
    const matching = filterMemoryEvents(memoryStore.events, filter);
    const uniqueValues = [...new Set(matching.map(e => e[field]).filter(Boolean))];
    return uniqueValues.sort();
  },

  create: async (doc) => {
    if (isMongoLive()) {
      return await MongooseEvent.create(doc);
    }
    const newId = generateId();
    const newEvent = {
      _id: newId,
      id: newId,
      ...doc,
      status: doc.status || 'published',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.events.push(newEvent);
    return newEvent;
  },

  findByIdAndUpdate: async (id, update, options = {}) => {
    if (isMongoLive()) {
      return await MongooseEvent.findByIdAndUpdate(id, update, options);
    }
    const index = memoryStore.events.findIndex(e => e._id.toString() === id.toString());
    if (index === -1) return null;
    
    // Apply $inc or $set if present, or direct fields
    const current = memoryStore.events[index];
    if (update.$inc) {
      for (const [key, delta] of Object.entries(update.$inc)) {
        // e.g. 'ticketTypes.0.soldQuantity'
        const parts = key.split('.');
        if (parts[0] === 'ticketTypes' && parts.length === 3) {
          const idx = parseInt(parts[1], 10);
          const field = parts[2];
          if (current.ticketTypes[idx]) {
            current.ticketTypes[idx][field] = (current.ticketTypes[idx][field] || 0) + delta;
          }
        }
      }
    }
    if (update.$set) {
      Object.assign(current, update.$set);
    } else {
      Object.assign(current, update);
    }
    current.updatedAt = new Date();
    return current;
  },

  findByIdAndDelete: async (id) => {
    if (isMongoLive()) {
      return await MongooseEvent.findByIdAndDelete(id);
    }
    const index = memoryStore.events.findIndex(e => e._id.toString() === id.toString());
    if (index === -1) return null;
    const deleted = memoryStore.events.splice(index, 1);
    return deleted[0] || null;
  }
};

module.exports = Event;
