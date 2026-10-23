import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Ticket,
  Calendar,
  MapPin,
  ShieldCheck,
  CreditCard,
  Copy,
  Check
} from 'lucide-react';
import api from '../services/api';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString));
};

const PaymentStatusPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryStatus = searchParams.get('status'); // success | failed | cancelled | expired
  const queryReason = searchParams.get('reason');
  const queryPaymentId = searchParams.get('paymentId');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/bookings/${id}`);
        if (res.data?.success && res.data?.data?.booking) {
          setBooking(res.data.data.booking);
        } else {
          setError('Booking record not found.');
        }
      } catch (err) {
        console.error('Error loading payment status booking:', err);
        setError(err.response?.data?.message || 'Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <h2 className="text-xl font-bold text-slate-900">Payment Status Error</h2>
          <p className="text-sm text-slate-600 mt-2">{error || 'Unable to retrieve payment information.'}</p>
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

  const isPaid = booking.paymentStatus === 'paid' || queryStatus === 'success';
  const isExpired = booking.bookingStatus === 'expired' || queryStatus === 'expired';
  const isFailed = queryStatus === 'failed' || booking.paymentStatus === 'failed' || queryStatus === 'cancelled';

  const paymentId =
    booking.razorpayPaymentId ||
    booking.paymentDetails?.paymentId ||
    queryPaymentId ||
    `pay_mock_${booking._id.slice(-6)}`;

  const orderId =
    booking.razorpayOrderId ||
    booking.paymentDetails?.orderId ||
    `order_mock_${booking._id.slice(-6)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* 1. Status Indicator Header */}
      <div className="text-center mb-8">
        {isPaid ? (
          <>
            <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-3xl mb-4 shadow-sm animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Payment Successful!
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              Your transaction has been verified and your QR admission tickets are ready.
            </p>
          </>
        ) : isExpired ? (
          <>
            <div className="inline-flex p-4 bg-amber-100 text-amber-600 rounded-3xl mb-4 shadow-sm">
              <Clock className="w-12 h-12" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Reservation Expired
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              The 15-minute checkout window has elapsed. Held ticket seats have been returned to the event capacity.
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex p-4 bg-rose-100 text-rose-600 rounded-3xl mb-4 shadow-sm">
              <XCircle className="w-12 h-12" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Payment Unsuccessful
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              {queryReason || 'The payment could not be processed or was cancelled. Your tickets remain on hold until expiration.'}
            </p>
          </>
        )}
      </div>

      {/* 2. Main Transaction Receipt Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
        {/* Receipt Header Banner */}
        <div className="p-6 sm:p-7 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/60">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Booking Reference
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono font-bold text-slate-900 text-base">
                #{booking._id?.slice(-8).toUpperCase()}
              </span>
              <button
                onClick={() => copyToClipboard(booking._id)}
                className="text-slate-400 hover:text-slate-600 transition p-1"
                title="Copy Full ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Amount
            </span>
            <span className="text-2xl font-extrabold text-slate-900">
              ${booking.totalAmount}
            </span>
          </div>
        </div>

        {/* Transaction Metadata Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Payment Status
              </span>
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Confirmed & Paid
                </span>
              ) : isExpired ? (
                <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold text-sm">
                  <Clock className="w-4 h-4 text-amber-600" /> Expired (Seats Released)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold text-sm">
                  <XCircle className="w-4 h-4 text-rose-600" /> Payment Failed / Pending
                </span>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Payment Gateway
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-800 font-bold text-sm">
                <CreditCard className="w-4 h-4 text-indigo-600" /> Razorpay Test Gateway
              </span>
            </div>

            {isPaid && (
              <>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                    Razorpay Payment ID
                  </span>
                  <span className="font-mono text-slate-800 font-bold block truncate">
                    {paymentId}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                    Razorpay Order ID
                  </span>
                  <span className="font-mono text-slate-800 font-bold block truncate">
                    {orderId}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Event Summary Section */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Event Details
            </h3>

            <div className="flex flex-col sm:flex-row gap-4 items-start bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              {booking.event?.bannerImage && (
                <img
                  src={booking.event.bannerImage}
                  alt={booking.event.title}
                  className="w-full sm:w-28 h-20 object-cover rounded-xl bg-slate-200 flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 text-sm">{booking.event?.title}</h4>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{formatDate(booking.event?.startDateTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{booking.event?.venue}, {booking.event?.city}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Breakdown */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Tickets Reserved
            </h3>
            <div className="space-y-2">
              {booking.tickets?.map((t, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-800">
                    {t.quantity} × {t.ticketTypeName}
                  </span>
                  <span className="font-bold text-slate-900">${t.quantity * t.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {isPaid ? (
          <>
            <Link
              to="/bookings"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm transition shadow-sm"
            >
              <Ticket className="w-4 h-4" /> View QR Admission Tickets
            </Link>
            <Link
              to="/events"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl text-sm transition"
            >
              Browse Events <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : isExpired ? (
          <Link
            to={`/events/${booking.event?._id || booking.event}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm transition shadow-sm"
          >
            <RotateCcw className="w-4 h-4" /> Book Again on Event Page
          </Link>
        ) : (
          <>
            <Link
              to={`/bookings/confirmation/${booking._id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm transition shadow-sm"
            >
              <RotateCcw className="w-4 h-4" /> Retry Payment
            </Link>
            <Link
              to="/bookings"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl text-sm transition"
            >
              My Bookings
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusPage;
