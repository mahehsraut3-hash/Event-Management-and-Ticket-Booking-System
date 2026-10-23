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
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { loadRazorpayScript } from '../utils/loadRazorpay';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString));
};

const formatCountdown = (seconds) => {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const BookingConfirmationPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [paying, setPaying] = useState(false);
  const [paySuccessMessage, setPaySuccessMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState(location.state?.warning || '');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins default
  const [isExpired, setIsExpired] = useState(false);

  // Fetch booking if page loaded directly or to sync live status
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!booking) setLoading(true);
        const res = await api.get(`/bookings/${id}`);
        if (res.data?.success && res.data?.data?.booking) {
          const b = res.data.data.booking;
          setBooking(b);
          if (b.bookingStatus === 'expired') {
            setIsExpired(true);
          }
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
  }, [id]);

  // Live 15-minute expiration countdown
  useEffect(() => {
    if (!booking || booking.paymentStatus === 'paid' || booking.bookingStatus === 'cancelled') {
      return;
    }

    const expiryTimestamp = booking.expiresAt
      ? new Date(booking.expiresAt).getTime()
      : new Date(booking.createdAt).getTime() + 15 * 60 * 1000;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expiryTimestamp - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsExpired(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  // Trigger Razorpay Gateway or Simulated Payment
  const handlePay = async (isSimulated = false) => {
    if (isExpired) {
      setError('This booking has expired. Please select tickets again.');
      return;
    }

    try {
      setPaying(true);
      setError('');
      setWarningMessage('');

      // 1. Create order
      const orderRes = await api.post('/payments/create-order', {
        bookingId: booking._id
      });

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || 'Failed to create payment order');
      }

      const orderData = orderRes.data.data;

      // Fast-path test simulation
      if (isSimulated || orderData.isSimulated) {
        const verifyRes = await api.post('/payments/verify', {
          bookingId: booking._id,
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: `sig_sim_${Date.now()}`
        });

        if (verifyRes.data?.success) {
          navigate(`/payments/status/${booking._id}?status=success`);
          return;
        } else {
          throw new Error('Simulation verification failed');
        }
      }

      // 2. Load Razorpay CDN script
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        throw new Error('Razorpay script could not be loaded. Please try simulated payment.');
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Ticket Booking System (TBS)',
        description: `${booking.event?.title || 'Event Booking'}`,
        image: booking.event?.bannerImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=200&q=80',
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            setPaying(true);
            const verifyRes = await api.post('/payments/verify', {
              bookingId: booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data?.success) {
              navigate(
                `/payments/status/${booking._id}?status=success&paymentId=${response.razorpay_payment_id}`
              );
            } else {
              navigate(
                `/payments/status/${booking._id}?status=failed&reason=Signature+verification+failed`
              );
            }
          } catch (vErr) {
            console.error('Verification error:', vErr);
            navigate(
              `/payments/status/${booking._id}?status=failed&reason=${encodeURIComponent(
                vErr.response?.data?.message || 'Verification failed'
              )}`
            );
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: booking.user?.name || '',
          email: booking.user?.email || ''
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
            setWarningMessage('Payment window dismissed. Your held seats remain locked until timer expires.');
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', function (response) {
        setPaying(false);
        const reason = response.error?.description || 'Transaction declined';
        navigate(
          `/payments/status/${booking._id}?status=failed&reason=${encodeURIComponent(reason)}`
        );
      });

      rzpInstance.open();
    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err.response?.data?.message || err.message || 'Payment initiation failed.');
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

  if (error && !booking) {
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
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-3xl mb-4 shadow-sm animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {isPaid ? 'Booking Confirmed & Paid!' : 'Booking Reserved!'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Reference ID:{' '}
          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            #{booking._id?.slice(-8).toUpperCase()}
          </span>
        </p>
      </div>

      {/* Warning / Error banners */}
      {warningMessage && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3.5 rounded-2xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-3.5 rounded-2xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Card */}
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Payment Status
              </h3>

              {!isPaid && !isCancelled && !isExpired && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Expires in: {formatCountdown(timeLeft)}</span>
                </div>
              )}
            </div>

            {isPaid ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-900 text-sm">Payment Verified (Razorpay)</span>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Your admission tickets and QR codes are generated and ready for gate check-in.
                    </p>
                  </div>
                </div>
                <Link
                  to="/bookings"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
                >
                  <Ticket className="w-4 h-4" /> View Tickets
                </Link>
              </div>
            ) : isExpired ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-900 text-sm">Reservation Window Expired</span>
                    <p className="text-xs text-rose-700 mt-0.5">
                      The 15-minute hold expired. Inventory has been released back to other attendees.
                    </p>
                  </div>
                </div>
                <Link
                  to={`/events/${booking.event?._id || booking.event}`}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Book Again
                </Link>
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
                      Complete payment via Razorpay before the 15-minute timer expires.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handlePay(false)}
                    disabled={paying || isExpired}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {paying ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay with Razorpay</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handlePay(true)}
                    disabled={paying || isExpired}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    title="Simulate payment instantly without modal"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Test Pay</span>
                  </button>
                </div>
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
