import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Search,
  Download,
  QrCode,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Ticket
} from 'lucide-react';
import api from '../services/api';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

const EventAttendeesPage = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    eventTitle: '',
    totalAttendees: 0,
    checkedInCount: 0,
    attendees: []
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | checked_in | pending
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchAttendees = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.checkInStatus = statusFilter;

      const res = await api.get(`/organizer/events/${id}/attendees`, { params });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching attendees:', err);
      setError(err.response?.data?.message || 'Failed to load attendees');
    } finally {
      setLoading(false);
    }
  }, [id, search, statusFilter]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  // Handle CSV Export
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const res = await api.get(`/organizer/events/${id}/attendees/export`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendees-${id}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV Export error:', err);
      alert('Failed to download CSV export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const total = data.totalAttendees || 0;
  const checkedIn = data.checkedInCount || 0;
  const pending = total - checkedIn;
  const checkInRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Top Navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/organizer/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Organizer Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/organizer/scanner"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition shadow-xs"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Launch QR Scanner</span>
          </Link>

          <button
            onClick={handleExportCSV}
            disabled={exporting || total === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Generating CSV...' : 'Export Attendees (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* Header and Title */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>Attendee Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {data.eventTitle || 'Event Attendees'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time gate check-in status, attendee credentials, and export tools.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-2xl">
              <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
                Total Booked
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block mt-0.5">
                {total}
              </span>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-100 p-3.5 rounded-2xl">
              <span className="text-[11px] font-bold uppercase text-emerald-600 block tracking-wider">
                Checked In
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 block mt-0.5">
                {checkedIn} <span className="text-xs font-semibold text-emerald-500 font-sans">({checkInRate}%)</span>
              </span>
            </div>

            <div className="bg-amber-50/80 border border-amber-100 p-3.5 rounded-2xl">
              <span className="text-[11px] font-bold uppercase text-amber-600 block tracking-wider">
                Pending
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-amber-700 block mt-0.5">
                {pending}
              </span>
            </div>
          </div>
        </div>

        {/* Check-in Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs font-medium text-slate-500 mb-2">
            <span>Gate Check-In Progress</span>
            <span className="font-semibold text-slate-700">{checkInRate}% Checked In</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${checkInRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-3.5 rounded-2xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAttendees}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, ticket code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Attendees' },
            { id: 'checked_in', label: 'Checked In' },
            { id: 'pending', label: 'Pending Gate Entry' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={fetchAttendees}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition ml-1"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Attendees Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm text-slate-500">Loading attendee records...</p>
          </div>
        ) : data.attendees.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No attendees found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              {search || statusFilter !== 'all'
                ? 'No attendee records matched your search query or status filter.'
                : 'No tickets have been booked for this event yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-4 px-6">Attendee</th>
                  <th className="py-4 px-4">Ticket Tier</th>
                  <th className="py-4 px-4">Ticket Code</th>
                  <th className="py-4 px-4">Check-In Status</th>
                  <th className="py-4 px-6 text-right">Booked At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.attendees.map((a) => (
                  <tr key={a.ticketId} className="hover:bg-slate-50/70 transition">
                    {/* Attendee Name & Email */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          {a.attendeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">
                            {a.attendeeName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono block mt-0.5">
                            {a.attendeeEmail}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Ticket Tier */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        <Ticket className="w-3.5 h-3.5 text-indigo-500" />
                        {a.tierName || 'General'}
                      </span>
                    </td>

                    {/* Ticket Code */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                        <span>{a.ticketCode}</span>
                        <button
                          onClick={() => handleCopy(a.ticketCode)}
                          className="text-slate-400 hover:text-slate-700 transition"
                          title="Copy Code"
                        >
                          {copiedCode === a.ticketCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Check-In Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {a.isUsed ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Checked In
                          </span>
                          {a.usedAt && (
                            <span className="text-[11px] text-slate-400 block mt-1">
                              {formatDate(a.usedAt)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Check-in
                        </span>
                      )}
                    </td>

                    {/* Booked At */}
                    <td className="py-4 px-6 text-right whitespace-nowrap text-xs text-slate-500">
                      {formatDate(a.purchaseDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventAttendeesPage;
