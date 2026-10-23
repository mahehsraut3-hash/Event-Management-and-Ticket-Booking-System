import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  MapPin,
  Ticket,
  ArrowRight,
  Sparkles,
  Server,
  Shield,
  CheckCircle2,
  Activity,
  RefreshCw,
  Lock,
  Building2,
  Flame,
  Clock
} from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';

const CATEGORIES = [
  { name: 'Technology', icon: '💻', count: '3 Events' },
  { name: 'Music', icon: '🎵', count: '3 Events' },
  { name: 'Sports', icon: '⚽', count: '3 Events' },
  { name: 'Workshops', icon: '🎨', count: '4 Events' },
  { name: 'Business', icon: '💼', count: '2 Events' },
  { name: 'Arts & Theatre', icon: '🎭', count: '1 Event' }
];

const HomePage = () => {
  const [searchInput, setSearchInput] = useState('');
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  const [healthData, setHealthData] = useState(null);
  const [healthStatus, setHealthStatus] = useState('checking');

  const { isAuthenticated, user, role, logout } = useAuth();
  const navigate = useNavigate();

  // Search submit handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchInput.trim())}`);
    } else {
      navigate('/events');
    }
  };

  // Health check
  const checkHealth = async () => {
    setHealthStatus('checking');
    try {
      const res = await api.get('/health');
      setHealthData(res.data);
      setHealthStatus('connected');
    } catch (err) {
      console.error('API health check error:', err);
      setHealthStatus('error');
    }
  };

  // Fetch Featured & Upcoming Events
  useEffect(() => {
    checkHealth();

    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        // Featured by popularity
        const featuredRes = await api.get('/events?limit=3&sort=popularity');
        if (featuredRes.data?.success) {
          setFeaturedEvents(featuredRes.data.data.events);
        }

        // Upcoming soonest
        const upcomingRes = await api.get('/events?limit=6&sort=date');
        if (upcomingRes.data?.success) {
          setUpcomingEvents(upcomingRes.data.data.events);
        }
      } catch (err) {
        console.error('Error fetching home events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-slate-50/50 py-16 md:py-24 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Phase 4: QR Gate Validation & Camera Scanner Live
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Discover Unforgettable Experiences, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              Book Tickets in Seconds
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            From tech conferences and global stadium sports to intimate acoustic concerts. Secure seats with instant cryptographic QR tickets.
          </p>

          {/* Hero Search Bar */}
          <form
            onSubmit={handleSearch}
            className="mt-8 max-w-2xl mx-auto flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-lg shadow-indigo-500/5 focus-within:ring-2 focus-within:ring-indigo-600/20 focus-within:border-indigo-600 transition"
          >
            <div className="pl-3 pr-2 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by event title, tech, music, city..."
              className="w-full py-2.5 px-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 flex-shrink-0"
            >
              <span>Explore</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Category Quick Navigation */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/events?category=${encodeURIComponent(cat.name)}`}
                className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 transition shadow-xs flex items-center gap-1.5"
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events (Most Popular) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
              <Flame className="w-4 h-4" /> Trending Experiences
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Featured Events
            </h2>
          </div>
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
          >
            View all events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingEvents ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Events Grid */}
      <section className="bg-slate-50 border-t border-slate-200/70 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                <Clock className="w-4 h-4" /> Coming Up Next
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Upcoming Events Near You
              </h2>
            </div>
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              Browse complete calendar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-sm hover:shadow-md transition text-sm"
            >
              <span>Explore All 16+ Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* System Status Dashboard (Phase 0, 1, 2) */}
      <section className="max-w-6xl mx-auto px-4 py-12 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend Health Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">API Gateway & Seed Status</h3>
                  <p className="text-xs text-slate-500">Route: <code className="text-indigo-600 font-mono">/api/events</code></p>
                </div>
              </div>

              <button
                onClick={checkHealth}
                disabled={healthStatus === 'checking'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${healthStatus === 'checking' ? 'animate-spin' : ''}`} />
                Recheck
              </button>
            </div>

            {healthStatus === 'connected' && healthData && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-emerald-900">Events Database Ready</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      16 realistic sample events seeded across Music, Technology, Sports & Workshops.
                    </p>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-emerald-200/60 text-xs font-mono text-slate-600">
                      <span>Status: <b className="text-emerald-700">200 OK</b></span>
                      <span>Env: <b>{healthData.environment}</b></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            Phase 2: Event Discovery & Search Active
          </div>
        </div>

        {/* Auth / Account Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">User Authentication</h3>
                  <p className="text-xs text-slate-500">JWT + Role-based permissions</p>
                </div>
              </div>

              {isAuthenticated && (
                <button
                  onClick={logout}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg transition"
                >
                  Log Out
                </button>
              )}
            </div>

            {isAuthenticated ? (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm uppercase">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{user?.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-200 text-indigo-800">
                        {role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{user?.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">Guest Access</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sign in to book tickets</p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition"
                >
                  <Lock className="w-3.5 h-3.5" /> Sign In
                </Link>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Phase 4: Cryptographic QR Tokens & Camera Gate Terminal Active</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
