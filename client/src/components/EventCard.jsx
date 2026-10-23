import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Ticket, ArrowUpRight } from 'lucide-react';

const categoryColors = {
  Technology: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Music: 'bg-violet-100 text-violet-800 border-violet-200',
  Sports: 'bg-amber-100 text-amber-800 border-amber-200',
  Workshops: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Business: 'bg-sky-100 text-sky-800 border-sky-200',
  'Arts & Theatre': 'bg-rose-100 text-rose-800 border-rose-200',
  default: 'bg-slate-100 text-slate-800 border-slate-200'
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

const getLowestPrice = (ticketTypes) => {
  if (!ticketTypes || ticketTypes.length === 0) return null;
  const prices = ticketTypes.map((t) => t.price);
  const minPrice = Math.min(...prices);
  return minPrice === 0 ? 'Free' : `$${minPrice}`;
};

const EventCard = ({ event }) => {
  if (!event) return null;

  const minPrice = getLowestPrice(event.ticketTypes);
  const colorClass = categoryColors[event.category] || categoryColors.default;

  // Calculate total remaining tickets
  const totalCapacity = event.ticketTypes?.reduce((acc, t) => acc + (t.totalQuantity || 0), 0) || 0;
  const totalSold = event.ticketTypes?.reduce((acc, t) => acc + (t.soldQuantity || 0), 0) || 0;
  const seatsLeft = totalCapacity - totalSold;
  const isSellingFast = totalCapacity > 0 && seatsLeft <= totalCapacity * 0.25;

  return (
    <Link
      to={`/events/${event._id}`}
      className="group bg-white rounded-3xl border border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden"
    >
      {/* Banner Image Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
        <img
          src={event.bannerImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm backdrop-blur-md ${colorClass}`}>
            {event.category}
          </span>
        </div>

        {/* Selling Fast Pill */}
        {isSellingFast && seatsLeft > 0 && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-sm uppercase tracking-wider animate-pulse">
              Selling Fast
            </span>
          </div>
        )}

        {/* City Overlay on Image bottom */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-medium drop-shadow-md">
          <MapPin className="w-3.5 h-3.5 text-rose-400" />
          <span>{event.city}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Date & Time */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(event.startDateTime)}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-indigo-600 transition line-clamp-2 mb-2">
            {event.title}
          </h3>

          {/* Venue */}
          <p className="text-xs text-slate-500 line-clamp-1 mb-4">
            {event.venue}
          </p>
        </div>

        {/* Bottom Price & CTA Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">Starting from</span>
            <span className="text-base font-extrabold text-slate-900">
              {minPrice || 'Free'}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white px-3 py-1.5 rounded-xl transition duration-200">
            Details
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
