import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  ArrowLeft,
  Share2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Plus,
  Minus,
  ShoppingCart,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

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
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString));
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(dateString));
};

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Ticket quantities state: { [tierName]: number }
  const [selectedQuantities, setSelectedQuantities] = useState({});

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/events/${id}`);
        if (res.data?.success && res.data?.data?.event) {
          setEvent(res.data.data.event);
          // Initialize first available tier with 1 ticket by default
          const tiers = res.data.data.event.ticketTypes || [];
          const initial = {};
          const firstAvailable = tiers.find(t => (t.totalQuantity - t.soldQuantity) > 0);
          if (firstAvailable) {
            initial[firstAvailable.name] = 1;
          }
          setSelectedQuantities(initial);
        } else {
          setError('Event details not found');
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.response?.data?.message || 'Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Quantity control helpers
  const updateQuantity = (tierName, delta, maxAvailable) => {
    setSelectedQuantities((prev) => {
      const current = prev[tierName] || 0;
      const nextVal = Math.max(0, Math.min(Math.min(10, maxAvailable), current + delta));
      return {
        ...prev,
        [tierName]: nextVal
      };
    });
  };

  // Compute live cart totals
  const selectedTicketsList = (event?.ticketTypes || [])
    .filter((tier) => (selectedQuantities[tier.name] || 0) > 0)
    .map((tier) => ({
      ticketTypeName: tier.name,
      quantity: selectedQuantities[tier.name],
      price: tier.price
    }));

  const totalTicketsCount = selectedTicketsList.reduce((acc, t) => acc + t.quantity, 0);
  const totalAmount = selectedTicketsList.reduce((acc, t) => acc + t.quantity * t.price, 0);

  // Proceed to Checkout handler
  const handleProceedToCheckout = () => {
    if (totalTicketsCount === 0) return;

    const checkoutState = {
      event,
      tickets: selectedTicketsList,
      totalAmount
    };

    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: {
            pathname: `/checkout/${event._id}`,
            state: checkoutState
          }
        }
      });
      return;
    }

    navigate(`/checkout/${event._id}`, { state: checkoutState });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 animate-pulse">
        <div className="w-32 h-6 bg-slate-200 rounded-lg mb-6"></div>
        <div className="h-72 sm:h-96 bg-slate-200 rounded-3xl mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="w-3/4 h-8 bg-slate-200 rounded-xl"></div>
            <div className="w-1/2 h-5 bg-slate-200 rounded-lg"></div>
            <div className="h-32 bg-slate-200 rounded-2xl mt-6"></div>
          </div>
          <div className="h-64 bg-slate-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
          <p className="text-sm text-slate-600 mt-2">{error || 'This event may have been removed or unpublished.'}</p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Discover Events
          </Link>
        </div>
      </div>
    );
  }

  const categoryColorClass = categoryColors[event.category] || categoryColors.default;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Navigation & Share */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Share Event</span>
            </>
          )}
        </button>
      </div>

      {/* Hero Banner */}
      <div className="relative h-64 sm:h-96 rounded-3xl overflow-hidden shadow-md bg-slate-900 mb-8">
        <img
          src={event.bannerImage}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent"></div>

        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-sm ${categoryColorClass}`}>
            {event.category}
          </span>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 text-white/90 text-xs sm:text-sm font-medium mb-2 drop-shadow">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>{event.venue}, {event.city}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details, Description, Ticket Selector */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Info Bar */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400 block tracking-wider">Date & Time</span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {formatDate(event.startDateTime)}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-slate-400 block tracking-wider">Location & Venue</span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {event.venue}
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  {event.city}
                </span>
              </div>
            </div>
          </div>

          {/* About Event Description */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">About This Event</h2>
            <p className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">
              {event.description}
            </p>

            {/* Organizer byline */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Organized by</span>
                <span className="text-sm font-bold text-slate-900">{event.organizer?.name || 'Premier Event Host'}</span>
              </div>
            </div>
          </div>

          {/* Ticket Selector Section */}
          <div id="tickets-section" className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-indigo-600" /> Select Tickets
                </h2>
                <p className="text-xs text-slate-500 mt-1">Adjust quantity for your group (max 10 per tier)</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                Live Inventory Active
              </span>
            </div>

            <div className="space-y-4">
              {event.ticketTypes?.map((ticket, index) => {
                const remaining = (ticket.totalQuantity || 0) - (ticket.soldQuantity || 0);
                const isSoldOut = remaining <= 0;
                const quantity = selectedQuantities[ticket.name] || 0;

                return (
                  <div
                    key={ticket._id || index}
                    className={`p-5 rounded-2xl border transition-all ${
                      isSoldOut
                        ? 'border-slate-200 bg-slate-50/70 opacity-60'
                        : quantity > 0
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-600/10'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Info & Badges */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900">{ticket.name}</h3>
                          {isSoldOut ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                              Sold Out
                            </span>
                          ) : remaining < 25 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700">
                              Only {remaining} left!
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              Available ({remaining} seats)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Includes event grounds entry, primary stage access, and digital QR pass.
                        </p>
                      </div>

                      {/* Right: Price & Stepper Selector */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:flex-shrink-0">
                        <div className="text-left sm:text-right">
                          <div className="text-xl font-extrabold text-slate-900">
                            {ticket.price === 0 ? 'Free' : `$${ticket.price}`}
                          </div>
                          <span className="text-[10px] text-slate-400 block">per ticket</span>
                        </div>

                        {/* Interactive +/- Quantity Stepper */}
                        {!isSoldOut ? (
                          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => updateQuantity(ticket.name, -1, remaining)}
                              disabled={quantity <= 0}
                              className="w-8 h-8 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <span className="w-10 text-center font-bold text-sm text-slate-900">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateQuantity(ticket.name, 1, remaining)}
                              disabled={quantity >= Math.min(10, remaining)}
                              className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Order Summary & Checkout Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm sticky top-24 space-y-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Booking Summary
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs text-slate-500">{totalTicketsCount} Ticket{totalTicketsCount !== 1 ? 's' : ''} Selected</span>
                <span className="text-3xl font-extrabold text-slate-900">
                  ${totalAmount}
                </span>
              </div>
            </div>

            {/* Selected Breakdown */}
            {selectedTicketsList.length > 0 ? (
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                {selectedTicketsList.map((t) => (
                  <div key={t.ticketTypeName} className="flex items-center justify-between text-slate-600">
                    <span>{t.quantity}x {t.ticketTypeName}</span>
                    <span className="font-semibold text-slate-800">${t.quantity * t.price}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-100 text-xs text-amber-700 bg-amber-50 p-3 rounded-xl">
                Please select at least 1 ticket to proceed with checkout.
              </div>
            )}

            {/* Feature reassurance */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>No overselling • Real-time lock</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Instant cryptographic QR entry pass</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Full cancellation prior to event start</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              disabled={totalTicketsCount === 0}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Proceed to Checkout</span>
            </button>

            {!isAuthenticated && (
              <p className="text-[11px] text-center text-slate-500">
                You will be prompted to sign in or create an account to finalize your reservation.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
