import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Building2,
  Calendar,
  Users,
  DollarSign,
  QrCode,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Download
} from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString));
};

const OrganizerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Table filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | published | draft | cancelled

  // Load stats and events
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, eventsRes] = await Promise.all([
        api.get('/organizer/stats'),
        api.get('/organizer/events')
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (eventsRes.data?.success) {
        setEvents(eventsRes.data.data.events);
      }
    } catch (err) {
      console.error('Error loading organizer dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Toggle publish / draft status
  const handleToggleStatus = async (eventId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      const res = await api.patch(`/organizer/events/${eventId}/status`, { status: newStatus });
      if (res.data?.success) {
        setActionSuccess(`Event status changed to ${newStatus}`);
        setTimeout(() => setActionSuccess(''), 3000);
        loadDashboardData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update event status.');
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId, eventTitle, totalSold) => {
    if (totalSold > 0) {
      alert(`Cannot delete "${eventTitle}" because it has ${totalSold} active ticket sales. You can unpublish it instead.`);
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const res = await api.delete(`/organizer/events/${eventId}`);
      if (res.data?.success) {
        setActionSuccess('Event successfully deleted');
        setTimeout(() => setActionSuccess(''), 3000);
        loadDashboardData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event.');
    }
  };

  // Filter events in table
  const filteredEvents = events.filter((ev) => {
    if (statusFilter !== 'all' && ev.status !== statusFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.trim().toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.city.toLowerCase().includes(q) ||
        ev.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Organizer Command Center
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Event Management & Sales
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span>. Monitor revenue, published events, and gate check-ins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/organizer/scanner"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition shadow-xs"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Gate Scanner Terminal</span>
          </Link>

          <Link
            to="/organizer/events/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Event</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-3 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Events */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Total Events
            </span>
            <span className="text-3xl font-extrabold text-slate-900 block mt-1">
              {stats?.overview?.totalEvents || events.length || 0}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Active event catalog</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Tickets Sold */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Tickets Sold
            </span>
            <span className="text-3xl font-extrabold text-slate-900 block mt-1">
              {stats?.overview?.totalTicketsSold?.toLocaleString() || 0}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              {stats?.overview?.occupancyRate || 0}% overall capacity booked
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Gross Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Gross Revenue
            </span>
            <span className="text-3xl font-extrabold text-slate-900 block mt-1">
              ${stats?.overview?.grossRevenue?.toLocaleString() || 0}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Verified booking payments</span>
          </div>
          <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Gate Check-Ins */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Gate Check-Ins
            </span>
            <span className="text-3xl font-extrabold text-slate-900 block mt-1">
              {stats?.overview?.totalCheckIns?.toLocaleString() || 0}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">Scanned via QR terminal</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Sales Analytics Chart (Recharts) */}
      {stats?.salesByEvent && stats.salesByEvent.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Ticket Sales & Capacity per Event
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Visual breakdown comparing sold tickets against total venue capacity.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg self-start sm:self-auto">
              Real-time Analytics
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.salesByEvent.slice(0, 8)}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px'
                  }}
                  formatter={(value, name) => [value, name === 'sold' ? 'Tickets Sold' : 'Total Capacity']}
                  labelFormatter={(name, payload) => payload?.[0]?.payload?.fullTitle || name}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value) => (value === 'sold' ? 'Tickets Sold' : 'Total Capacity')}
                />
                <Bar dataKey="sold" fill="#4f46e5" radius={[6, 6, 0, 0]} name="sold" />
                <Bar dataKey="capacity" fill="#cbd5e1" radius={[6, 6, 0, 0]} name="capacity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. "My Events" Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Table Filter & Search Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">My Events</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {filteredEvents.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="text-xs text-slate-500 font-medium">Loading events...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No events found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'You have not created any events yet.'}
            </p>
            <Link
              to="/organizer/events/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" /> Create First Event
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-6">Event</th>
                  <th className="py-3.5 px-4">Date & City</th>
                  <th className="py-3.5 px-4">Sold / Capacity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredEvents.map((ev) => {
                  const totalSold = ev.ticketTypes?.reduce((acc, t) => acc + (t.soldQuantity || 0), 0) || 0;
                  const totalCapacity = ev.ticketTypes?.reduce((acc, t) => acc + (t.totalQuantity || 0), 0) || 0;
                  const percentSold = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

                  return (
                    <tr key={ev._id} className="hover:bg-slate-50/70 transition">
                      {/* Event Banner & Title */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={ev.bannerImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=200&q=80'}
                            alt={ev.title}
                            className="w-14 h-11 object-cover rounded-xl bg-slate-100 flex-shrink-0"
                          />
                          <div>
                            <Link
                              to={`/events/${ev._id}`}
                              className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition line-clamp-1"
                            >
                              {ev.title}
                            </Link>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {ev.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date & City */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="text-slate-800 font-semibold block">{formatDate(ev.startDateTime)}</span>
                        <span className="text-[11px] text-slate-400">{ev.city}</span>
                      </td>

                      {/* Sales Progress Bar */}
                      <td className="py-4 px-4">
                        <div className="w-32">
                          <div className="flex justify-between text-[11px] font-mono text-slate-600 mb-1">
                            <span>{totalSold} / {totalCapacity}</span>
                            <span>{percentSold}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, percentSold)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {ev.status === 'published' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            Published
                          </span>
                        ) : ev.status === 'draft' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                            Draft
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                            Cancelled
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Attendees List */}
                          <Link
                            to={`/organizer/events/${ev._id}/attendees`}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Attendees & Export CSV"
                          >
                            <Users className="w-4 h-4" />
                          </Link>

                          {/* Gate Scanner */}
                          <Link
                            to="/organizer/scanner"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Open Gate QR Scanner"
                          >
                            <QrCode className="w-4 h-4" />
                          </Link>

                          {/* Edit Event */}
                          <Link
                            to={`/organizer/events/edit/${ev._id}`}
                            className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                            title="Edit Event"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(ev._id, ev.status)}
                            className="px-2 py-1 text-[10px] font-bold uppercase rounded-lg border border-slate-200 hover:bg-slate-100 transition text-slate-700"
                            title="Toggle Published / Draft"
                          >
                            {ev.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>

                          {/* Delete Event */}
                          <button
                            onClick={() => handleDeleteEvent(ev._id, ev.title, totalSold)}
                            disabled={totalSold > 0}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={totalSold > 0 ? 'Cannot delete event with ticket sales' : 'Delete Event'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboardPage;
