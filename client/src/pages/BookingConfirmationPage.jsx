import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  ArrowRight,
  CreditCard,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString));
};

const BookingConfirmationPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [paying, setPaying] = useState(false);
  const [paySuccessMessage, setPaySuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch booking if page loaded directly
  useEffect(() => {
    if (!booking) {
      const fetchBooking = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/bookings/${id}`);
          if (res.data?.success && res.data?.data?.booking) {
            setBooking(res.data.data.booking);
          } else {
            setError('Booking not found');
          }
        } catch (err) {
          console.error('Error fetching booking confirmation:', err);
          setError(err.response?.data?.message || 'Unable to retrieve booking.');
        } finally {
          setLoading(false);
        }
      };
      fetchBooking();
    }
  }, [id, booking]);

  // Mock Payment handler
  const handlePayNow = async () => {
    try {
      setPaying(true);
      setError('');
      const res = await api.patch(`/bookings/${id}/pay`);
      if (res.data?.success && res.data?.data?.booking) {
        setBooking(res.data.data.booking);
        setPaySuccessMessage('Payment successful! Your reservation is fully confirmed.');
      }
    } catch (err) {
      console.error('Mock payment error:', err);
      setError(err.response?.data?.message || 'Payment simulation failed.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4"></div>
        <div className="h-8 bg-slate-200 w-1/2 rounded-xl mx-auto mb-4"></div>
        <div className="h-64 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Booking Error</h2>
          <p className="text-sm text-slate-600 mt-2">{error || 'Booking could not be loaded.'}</p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
          >
            Explore Events
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = booking.paymentStatus === 'paid';
  const isCancelled = booking.bookingStatus === 'cancelled';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Success Celebration Header */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-3xl mb-4 shadow-sm animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Booking Confirmed!
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Your event tickets are reserved. Reference ID:{' '}
          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            #{booking._id?.slice(-8).toUpperCase()}
          </span>
        </p>
      </div>

      {paySuccessMessage && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl text-sm flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{paySuccessMessage}</span>
        </div>
      )}

      {/* Main Confirmation Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
        {/* Event Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
              {booking.event?.category || 'Live Event'}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-2 leading-snug">
              {booking.event?.title}
            </h2>
            <div className="mt-3 space-y-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{formatDate(booking.event?.startDateTime)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{booking.event?.venue}, {booking.event?.city}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block font-medium">Total Price</span>
            <span className="text-2xl font-extrabold text-white">${booking.totalAmount}</span>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Reserved Ticket Tiers
            </h3>
            <div className="space-y-2">
              {booking.tickets?.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">{t.ticketTypeName}</span>
                      <span className="text-xs text-slate-400 block">{t.quantity} ticket(s) × ${t.price}</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900">${t.quantity * t.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status Action Banner */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Payment Status
            </h3>

            {isPaid ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900 text-sm">Payment Confirmed (Paid)</span>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Your payment was verified. Ready for Phase 4 QR Gate Ticket Validation!
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider">
                  PAID
                </span>
              </div>
            ) : isCancelled ? (
              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-sm text-slate-600">
                This booking was cancelled and inventory was returned to the pool.
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 text-sm">Payment Status: Pending</span>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Simulate immediate payment completion using the test button.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handlePayNow}
                  disabled={paying}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
                >
                  {paying ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Pay Now (Simulate Payment)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/bookings"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition"
        >
          <Ticket className="w-4 h-4" /> Go to My Bookings
        </Link>
        <Link
          to="/events"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-sm transition"
        >
          Discover More Events <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
