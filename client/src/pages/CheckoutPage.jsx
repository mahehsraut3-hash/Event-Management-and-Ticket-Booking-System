import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  Lock,
  Ticket,
  AlertCircle,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { loadRazorpayScript } from '../utils/loadRazorpay';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString));
};

const CheckoutPage = () => {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(location.state?.event || null);
  const [selectedTickets, setSelectedTickets] = useState(location.state?.tickets || []);
  const [loading, setLoading] = useState(!location.state?.event);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [gatewayConfig, setGatewayConfig] = useState(null);

  // Attendee Form State
  const [attendeeName, setAttendeeName] = useState(user?.name || '');
  const [attendeeEmail, setAttendeeEmail] = useState(user?.email || '');

  // Load gateway config (public key, mode)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/payments/config');
        if (res.data?.success) {
          setGatewayConfig(res.data.data);
        }
      } catch (err) {
        console.warn('Could not fetch payment gateway config:', err);
      }
    };
    fetchConfig();
  }, []);

  // If page was loaded directly without navigation state, fetch event details
  useEffect(() => {
    if (!event) {
      const fetchEvent = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/events/${eventId}`);
          if (res.data?.success && res.data?.data?.event) {
            setEvent(res.data.data.event);
            const firstTier = res.data.data.event.ticketTypes?.[0];
            if (firstTier && selectedTickets.length === 0) {
              setSelectedTickets([
                {
                  ticketTypeName: firstTier.name,
                  quantity: 1,
                  price: firstTier.price
                }
              ]);
            }
          }
        } catch (err) {
          console.error('Error loading checkout event:', err);
          setErrorMessage('Could not load event for checkout');
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    }
  }, [eventId, event, selectedTickets.length]);

  const totalAmount = selectedTickets.reduce((acc, t) => acc + t.quantity * t.price, 0);
  const totalQuantity = selectedTickets.reduce((acc, t) => acc + t.quantity, 0);

  // Process Booking and Trigger Payment Flow
  const handleProceedToPayment = async (isTestSimulate = false) => {
    setErrorMessage('');

    if (selectedTickets.length === 0 || totalQuantity === 0) {
      setErrorMessage('Please select at least 1 ticket before proceeding.');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Reserve seats atomically and create pending booking
      const bookingRes = await api.post('/bookings', {
        eventId,
        tickets: selectedTickets.map((t) => ({
          ticketTypeName: t.ticketTypeName,
          quantity: t.quantity
        }))
      });

      if (!bookingRes.data?.success || !bookingRes.data?.data?.booking) {
        throw new Error(bookingRes.data?.message || 'Failed to reserve booking');
      }

      const booking = bookingRes.data.data.booking;

      // 2. Create Payment Order
      const orderRes = await api.post('/payments/create-order', {
        bookingId: booking._id
      });

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || 'Failed to create payment order');
      }

      const orderData = orderRes.data.data;

      // If user selected instant test simulation or if in simulated mode without live Razorpay SDK keys:
      if (isTestSimulate || orderData.isSimulated) {
        // Direct test verification
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
          throw new Error('Test verification failed');
        }
      }

      // 3. Attempt to load Razorpay official checkout SDK
      const isScriptLoaded = await loadRazorpayScript();

      if (!isScriptLoaded || !window.Razorpay) {
        console.warn('Razorpay SDK could not be loaded from CDN. Falling back to reservation confirmation.');
        navigate(`/bookings/confirmation/${booking._id}`, {
          state: {
            booking,
            warning: 'Could not load Razorpay SDK. You can complete payment using the simulated checkout.'
          }
        });
        return;
      }

      // 4. Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Ticket Booking System (TBS)',
        description: `${event.title} (${totalQuantity} tickets)`,
        image: event.bannerImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=200&q=80',
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            setSubmitting(true);
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
            setSubmitting(false);
          }
        },
        prefill: {
          name: attendeeName,
          email: attendeeEmail
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            navigate(`/bookings/confirmation/${booking._id}`, {
              state: {
                booking,
                warning: 'Payment window was dismissed. You have 15 minutes before your seats are released.'
              }
            });
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', function (response) {
        setSubmitting(false);
        const reason = response.error?.description || 'Transaction declined by bank';
        navigate(
          `/payments/status/${booking._id}?status=failed&reason=${encodeURIComponent(reason)}`
        );
      });

      rzpInstance.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Payment processing failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 bg-slate-200 w-1/3 rounded-xl mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 h-72 bg-slate-200 rounded-3xl"></div>
          <div className="h-72 bg-slate-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
          <p className="text-sm text-slate-600 mt-2">Unable to proceed with checkout for this event.</p>
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top back navigation */}
      <button
        onClick={() => navigate(`/events/${eventId}`)}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Event Details
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Checkout & Payment</h1>
        <p className="text-sm text-slate-600 mt-1">
          Review your tickets, attendee credentials, and select payment method.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-8 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-2xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Booking & Payment Error</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Attendee Details & Event Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Preview Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row gap-5 items-start">
            <img
              src={event.bannerImage}
              alt={event.title}
              className="w-full sm:w-36 h-28 object-cover rounded-2xl bg-slate-100 flex-shrink-0"
            />
            <div className="flex-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 uppercase tracking-wide">
                {event.category}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug">{event.title}</h2>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{formatDate(event.startDateTime)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{event.venue}, {event.city}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attendee Contact Information */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" /> Attendee Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  required
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={attendeeEmail}
                  onChange={(e) => setAttendeeEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 text-sm"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Digital QR admission passes and receipts will be sent to this account.
                </span>
              </div>
            </div>
          </div>

          {/* Payment Gateway Information Box */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-3xl p-6">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-indigo-600 text-white rounded-2xl flex-shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-indigo-950">Razorpay Payment Gateway</h4>
                  <span className="px-2 py-0.5 bg-indigo-200 text-indigo-900 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {gatewayConfig?.isSimulated ? 'Simulation / Test Mode' : 'Test Mode'}
                  </span>
                </div>
                <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
                  Secured with cryptographic HMAC-SHA256 signature verification and automatic 15-minute reservation expiry locks. Card, UPI, Netbanking, and Wallets supported.
                </p>
                <div className="mt-3 flex items-center gap-4 text-[11px] text-indigo-700 font-semibold">
                  <span>🔒 256-Bit SSL Encryption</span>
                  <span>⏱️ 15-Min Inventory Hold</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Reservation Button */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm sticky top-24 space-y-6">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-indigo-600" /> Order Summary
            </h3>

            {/* Selected items */}
            <div className="space-y-3">
              {selectedTickets.map((ticket, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{ticket.ticketTypeName}</span>
                    <span className="text-slate-400 block">{ticket.quantity} × ${ticket.price}</span>
                  </div>
                  <span className="font-extrabold text-slate-900">${ticket.quantity * ticket.price}</span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({totalQuantity} tickets)</span>
                <span>${totalAmount}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Convenience / Platform Fee</span>
                <span className="text-emerald-600 font-semibold">Free ($0.00)</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-base font-extrabold text-slate-900">
                <span>Total Due</span>
                <span className="text-indigo-600">${totalAmount}</span>
              </div>
            </div>

            {/* Guarantee Pills */}
            <div className="space-y-2 pt-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Instant reservation with zero overselling</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>Held seats locked for 15 minutes</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Pay Button */}
              <button
                type="button"
                onClick={() => handleProceedToPayment(false)}
                disabled={submitting || totalQuantity === 0}
                className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay with Razorpay (${totalAmount})</span>
                  </>
                )}
              </button>

              {/* Instant Test Mode Simulation Button */}
              <button
                type="button"
                onClick={() => handleProceedToPayment(true)}
                disabled={submitting || totalQuantity === 0}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-2xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant Test Payment (1-Click)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
