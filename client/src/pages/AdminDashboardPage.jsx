import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Calendar,
  DollarSign,
  Ticket,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Lock,
  Unlock,
  Check,
  Building2,
  Clock
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString));
};

const AdminDashboardPage = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // overview | organizers | events
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [events, setEvents] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Search & Filters
  const [orgSearch, setOrgSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('all'); // all | approved | suspended | pending
  const [eventSearch, setEventSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all'); // all | published | draft | cancelled

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, orgsRes, eventsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/organizers'),
        api.get('/admin/events')
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.data.overview);
      if (orgsRes.data?.success) setOrganizers(orgsRes.data.data.organizers);
      if (eventsRes.data?.success) setEvents(eventsRes.data.data.events);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast.error(err.response?.data?.message || 'Failed to load administrator data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Update Organizer Status
  const handleUpdateOrgStatus = async (orgId, newStatus) => {
    try {
      setActionLoadingId(orgId);
      const res = await api.patch(`/admin/organizers/${orgId}/status`, { status: newStatus });
      if (res.data?.success) {
        toast.success(`Organizer status updated to ${newStatus}`);
        setOrganizers((prev) =>
          prev.map((o) => (o._id === orgId ? { ...o, status: newStatus, isApproved: newStatus === 'approved' } : o))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update organizer status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Moderate Event Status
  const handleModerateEvent = async (eventId, newStatus) => {
    try {
      setActionLoadingId(eventId);
      const res = await api.patch(`/admin/events/${eventId}/moderate`, {
        status: newStatus,
        moderationNote: `Status updated to ${newStatus} by admin`
      });
      if (res.data?.success) {
        toast.success(`Event moderated to '${newStatus}'`);
        setEvents((prev) =>
          prev.map((e) => (e._id === eventId ? { ...e, status: newStatus } : e))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to moderate event');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrganizers = organizers.filter((o) => {
    if (orgFilter !== 'all' && o.status !== orgFilter) return false;
    if (orgSearch.trim()) {
      const q = orgSearch.toLowerCase();
      return o.name?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredEvents = events.filter((e) => {
    if (eventFilter !== 'all' && e.status !== eventFilter) return false;
    if (eventSearch.trim()) {
      const q = eventSearch.toLowerCase();
      return (
        e.title?.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q) ||
        e.organizer?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
            <span>Super Administrator Console</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Platform Moderation & Controls
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review organizers, approve listings, moderate events, and monitor platform health.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-8 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & Metrics', icon: ShieldCheck },
          { id: 'organizers', label: `Organizers (${organizers.length})`, icon: Users },
          { id: 'events', label: `Events Moderation (${events.length})`, icon: Calendar }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Users</span>
                <span className="text-3xl font-extrabold text-slate-900 block mt-1">{stats?.totalUsers || 0}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {stats?.totalAttendees || 0} attendees • {stats?.totalOrganizers || 0} organizers
                </span>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Platform Events</span>
                <span className="text-3xl font-extrabold text-slate-900 block mt-1">{stats?.totalEvents || 0}</span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                  {stats?.publishedEvents || 0} active & published
                </span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Gross Ticket Volume</span>
                <span className="text-3xl font-extrabold text-slate-900 block mt-1">${stats?.grossRevenue || 0}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {stats?.paidBookings || 0} paid booking transactions
                </span>
              </div>
              <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Gate Check-Ins</span>
                <span className="text-3xl font-extrabold text-slate-900 block mt-1">{stats?.checkedInTickets || 0}</span>
                <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">
                  {stats?.totalTicketsIssued || 0} total tickets generated
                </span>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <Ticket className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                System Health
              </span>
              <h3 className="text-xl sm:text-2xl font-bold mt-2">Security, Rate Limiting & Nodemailer Active</h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                Helmet security headers, strict brute-force rate limiters on auth routes, and cryptographic QR gate verification are currently protecting platform traffic.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('organizers')}
                className="px-5 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl text-xs font-bold transition"
              >
                Manage Organizers
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition"
              >
                Moderate Events
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIZERS APPROVAL */}
      {activeTab === 'organizers' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                placeholder="Search organizer by name, email..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['all', 'approved', 'suspended', 'pending'].map((status) => (
                <button
                  key={status}
                  onClick={() => setOrgFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                    orgFilter === status
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-4 px-6">Organizer</th>
                    <th className="py-4 px-4">Catalog</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Joined</th>
                    <th className="py-4 px-6 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrganizers.map((org) => {
                    const isOrgLoading = actionLoadingId === org._id;
                    return (
                      <tr key={org._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                              {org.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">{org.name}</span>
                              <span className="text-xs text-slate-400 font-mono block mt-0.5">{org.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                          <span className="font-bold text-slate-900">{org.eventsCount}</span> total events ({org.publishedEventsCount} published)
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          {org.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                          ) : org.status === 'suspended' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3.5 h-3.5" /> Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3.5 h-3.5" /> Pending
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                          {formatDate(org.createdAt)}
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {org.status !== 'approved' && (
                              <button
                                onClick={() => handleUpdateOrgStatus(org._id, 'approved')}
                                disabled={isOrgLoading}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition flex items-center gap-1 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                            )}

                            {org.status !== 'suspended' && (
                              <button
                                onClick={() => handleUpdateOrgStatus(org._id, 'suspended')}
                                disabled={isOrgLoading}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition flex items-center gap-1 disabled:opacity-50"
                              >
                                <Lock className="w-3.5 h-3.5" /> Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVENT MODERATION */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search event title, venue, organizer..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['all', 'published', 'draft', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setEventFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                    eventFilter === status
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-4 px-6">Event</th>
                    <th className="py-4 px-4">Organizer</th>
                    <th className="py-4 px-4">Date & City</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-6 text-right">Moderator Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredEvents.map((ev) => {
                    const isEvLoading = actionLoadingId === ev._id;
                    return (
                      <tr key={ev._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={ev.bannerImage}
                              alt={ev.title}
                              className="w-12 h-10 object-cover rounded-xl bg-slate-200 flex-shrink-0"
                            />
                            <div>
                              <Link
                                to={`/events/${ev._id}`}
                                className="font-bold text-slate-900 hover:text-indigo-600 transition block leading-tight line-clamp-1"
                              >
                                {ev.title}
                              </Link>
                              <span className="text-[11px] text-slate-400 block mt-0.5">{ev.category}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                          <span className="font-bold block text-slate-800">{ev.organizer?.name || 'Organizer'}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{ev.organizer?.email}</span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                          <span className="font-semibold block text-slate-700">{formatDate(ev.startDateTime)}</span>
                          <span>{ev.city}</span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          {ev.status === 'published' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              Published
                            </span>
                          ) : ev.status === 'draft' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              Draft
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                              Cancelled
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {ev.status !== 'published' && (
                              <button
                                onClick={() => handleModerateEvent(ev._id, 'published')}
                                disabled={isEvLoading}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                              >
                                Publish
                              </button>
                            )}

                            {ev.status === 'published' && (
                              <button
                                onClick={() => handleModerateEvent(ev._id, 'draft')}
                                disabled={isEvLoading}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                              >
                                Draft
                              </button>
                            )}

                            {ev.status !== 'cancelled' && (
                              <button
                                onClick={() => handleModerateEvent(ev._id, 'cancelled')}
                                disabled={isEvLoading}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            )}

                            <Link
                              to={`/events/${ev._id}`}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 transition"
                              title="Preview Public Page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
