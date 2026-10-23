import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Ticket, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../services/api';
import TicketCard from '../components/TicketCard';

const TicketViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/tickets/${id}`);
        if (res.data?.success && res.data?.data?.ticket) {
          setTicket(res.data.data.ticket);
        } else {
          setError('Ticket not found');
        }
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError(err.response?.data?.message || 'Failed to load ticket.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="h-8 bg-slate-200 w-1/3 rounded-xl mx-auto mb-6"></div>
        <div className="h-96 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Ticket Not Available</h2>
          <p className="text-sm text-slate-600 mt-2">{error || 'This ticket could not be found.'}</p>
          <Link
            to="/bookings"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => navigate('/bookings')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Bookings
        </button>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Cryptographically Signed QR Pass
        </span>
      </div>

      {/* Ticket Pass Component */}
      <TicketCard ticket={ticket} />

      {/* Gate Entry Guidance */}
      <div className="mt-8 max-w-xl mx-auto bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 text-xs text-indigo-900 flex items-start gap-3 print:hidden">
        <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Gate Instructions</span>
          <span>
            Please display this screen with maximum brightness at the gate, or save the PNG/printed pass. The organizer scanner will verify the signature instantly even without an internet connection.
          </span>
        </div>
      </div>
    </div>
  );
};

export default TicketViewPage;
