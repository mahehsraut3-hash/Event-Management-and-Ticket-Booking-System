import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Inbox,
  QrCode,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import TicketCard from '../components/TicketCard';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString));
};

const BookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // all | paid | pending | cancelled
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [successNotice, setSuccessNotice] = useState('');

  // Expandable tickets state
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [bookingTickets, setBookingTickets] = useState({});
  const [loadingTicketsId, setLoadingTicketsId] = useState(null);

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/bookings/my');
      if (res.data?.success && res.data?.data?.bookings) {
        setBookings(res.data.data.bookings);
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError(err.response?.data?.message || 'Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Fetch and toggle tickets for a paid booking
  const handleToggleTickets = async (bookingId) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null);
      return;
    }

    setExpandedBookingId(bookingId);

    if (!bookingTickets[bookingId]) {
      try {
        setLoadingTicketsId(bookingId);
        const res = await api.get(`/tickets/booking/${bookingId}`);
        if (res.data?.success && res.data?.data?.tickets) {
          setBookingTickets((prev) => ({
            ...prev,
            [bookingId]: res.data.data.tickets
          }));
        }
      } catch (err) {
        console.error('Error loading tickets for booking:', err);
      } finally {
        setLoadingTicketsId(null);
      }
    }
  };

  // Pay mock action
  const handlePay = async (bookingId) => {
    try {
      setActionLoadingId(bookingId);
      setError('');
      const res = await api.patch(`/bookings/${bookingId}/pay`);
      if (res.data?.success) {
        setSuccessNotice('Payment simulated successfully! Signed QR entry tickets generated.');
        setTimeout(() => setSuccessNotice(''), 3500);
        await fetchBookings();
        // Immediately fetch tickets for newly paid booking
        handleToggleTickets(bookingId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment simulation failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cancel booking action (releases inventory)
  const handleCancel = async (bookingId) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this booking? Reserved tickets will be released back to the event.'
    );
    if (!confirmCancel) return;

    try {
      setActionLoadingId(bookingId);
      setError('');
      const res = await api.patch(`/bookings/${bookingId}/cancel`);
      if (res.data?.success) {
        setSuccessNotice('Booking cancelled and ticket inventory restored!');
        setTimeout(() => setSuccessNotice(''), 3500);
        await fetchBookings();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter bookings according to active tab
  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'paid') return b.paymentStatus === 'paid' && b.bookingStatus !== 'cancelled';
    if (filterTab === 'pending') return b.paymentStatus === 'pending' && b.bookingStatus !== 'cancelled';
    if (filterTab === 'cancelled') return b.bookingStatus === 'cancelled';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <span className="font-semibold text-slate-700">{user?.name}</span> ({user?.email})
          </p>
        </div>

        <Link
          to="/events"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-xs"
        >
          <Calendar className="w-4 h-4" /> Discover More Events
        </Link>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl text-sm flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-3.5 rounded-2xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-6 overflow-x-auto">
        {[
          { id: 'all', label: 'All Bookings', count: bookings.length },
          { id: 'paid', label: 'Paid & Confirmed', count: bookings.filter((b) => b.paymentStatus === 'paid' && b.bookingStatus !== 'cancelled').length },
          { id: 'pending', label: 'Payment Pending', count: bookings.filter((b) => b.paymentStatus === 'pending' && b.bookingStatus !== 'cancelled').length },
          { id: 'cancelled', label: 'Cancelled', count: bookings.filter((b) => b.bookingStatus === 'cancelled').length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              filterTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              filterTab === tab.id ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200 p-6 animate-pulse h-40"></div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBookings.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm my-8">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Bookings Found</h2>
          <p className="text-sm text-slate-600 mt-2">
            {filterTab === 'all'
              ? "You haven't reserved any event tickets yet."
              : `No bookings matching the "${filterTab}" filter.`}
          </p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
          >
            Explore Events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Bookings List */}
      {!loading && filteredBookings.length > 0 && (
        <div className="space-y-6">
          {filteredBookings.map((b) => {
            const isPaid = b.paymentStatus === 'paid';
            const isCancelled = b.bookingStatus === 'cancelled';
            const eventStarted = b.event && new Date(b.event.startDateTime) <= new Date();
            const isActionLoading = actionLoadingId === b._id;
            const isExpanded = expandedBookingId === b._id;
            const tickets = bookingTickets[b._id] || [];

            return (
              <div
                key={b._id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:border-slate-300 transition duration-200"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Event Image */}
                  <div className="w-full md:w-56 h-48 md:h-auto bg-slate-100 relative flex-shrink-0">
                    <img
                      src={b.event?.bannerImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&q=80'}
                      alt={b.event?.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-md">
                        {b.event?.category || 'Event'}
                      </span>
                    </div>
                  </div>

                  {/* Booking Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Top Status & Reference Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                          #{b._id?.slice(-8).toUpperCase()}
                        </span>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2">
                          {isCancelled ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Cancelled
                            </span>
                          ) : isPaid ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid & Confirmed
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Payment
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event Title */}
                      <h3 className="text-xl font-bold text-slate-900 hover:text-indigo-600 transition">
                        {b.event?.title}
                      </h3>

                      {/* Event Date & Location */}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{formatDate(b.event?.startDateTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{b.event?.venue}, {b.event?.city}</span>
                        </div>
                      </div>

                      {/* Tickets Breakdown */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                        {b.tickets?.map((t, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200"
                          >
                            {t.quantity}× {t.ticketTypeName} (${t.price})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer Action Bar */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                          Total Amount
                        </span>
                        <span className="text-xl font-extrabold text-slate-900">
                          ${b.totalAmount}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* View QR Tickets Button (if paid) */}
                        {isPaid && !isCancelled && (
                          <button
                            onClick={() => handleToggleTickets(b._id)}
                            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>{isExpanded ? 'Hide QR Tickets' : 'View QR Tickets'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {/* Simulate Pay Now Button if pending */}
                        {!isPaid && !isCancelled && (
                          <button
                            onClick={() => handlePay(b._id)}
                            disabled={isActionLoading}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Pay Now</span>
                          </button>
                        )}

                        {/* Cancel Booking Button */}
                        {!isCancelled && !eventStarted && (
                          <button
                            onClick={() => handleCancel(b._id)}
                            disabled={isActionLoading}
                            className="px-4 py-2 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                          >
                            Cancel Booking
                          </button>
                        )}

                        {eventStarted && !isCancelled && (
                          <span className="text-xs text-slate-400 italic">Event has started</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE QR TICKETS PANEL */}
                {isExpanded && (
                  <div className="p-6 bg-slate-50 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-indigo-600" /> Digital Gate Entry Passes
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Each ticket possesses a unique cryptographic QR token signed with tamper-resistance.
                        </p>
                      </div>
                    </div>

                    {loadingTicketsId === b._id ? (
                      <div className="text-center py-8">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span className="text-xs text-slate-500 font-medium">Generating digital ticket passes...</span>
                      </div>
                    ) : tickets.length > 0 ? (
                      <div className="space-y-6">
                        {tickets.map((ticket) => (
                          <div key={ticket._id}>
                            <TicketCard ticket={ticket} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                        No individual tickets found for this booking.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
