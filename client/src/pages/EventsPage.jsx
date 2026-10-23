import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Tag,
  DollarSign,
  ArrowUpDown,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Inbox,
  X
} from 'lucide-react';
import api from '../services/api';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';

const CATEGORIES = ['All', 'Technology', 'Music', 'Sports', 'Workshops', 'Business', 'Arts & Theatre'];

const EventsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'All');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || 'date');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [datePreset, setDatePreset] = useState(searchParams.get('datePreset') || 'all');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Dynamic filter options from server
  const [cities, setCities] = useState([]);
  
  // Events Data & Async State
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ totalEvents: 0, totalPages: 1, currentPage: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch distinct cities for dropdown
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.get('/events/cities');
        if (res.data?.success && res.data?.data?.cities) {
          setCities(res.data.data.cities);
        }
      } catch (err) {
        console.warn('Could not fetch cities list:', err);
      }
    };
    fetchCities();
  }, []);

  // Compute date range based on preset
  const getDateRange = (preset) => {
    const now = new Date();
    if (preset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      return { startDate: start, endDate: end };
    }
    if (preset === 'weekend') {
      const dayOfWeek = now.getDay();
      const distanceToSat = (6 - dayOfWeek + 7) % 7;
      const saturday = new Date(now.getTime() + distanceToSat * 24 * 3600 * 1000);
      saturday.setHours(0, 0, 0, 0);
      const sunday = new Date(saturday.getTime() + 2 * 24 * 3600 * 1000);
      sunday.setHours(23, 59, 59, 999);
      return { startDate: saturday.toISOString(), endDate: sunday.toISOString() };
    }
    if (preset === 'month') {
      const end = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();
      return { startDate: now.toISOString(), endDate: end };
    }
    return { startDate: '', endDate: '' };
  };

  // Fetch Events from API
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { startDate, endDate } = getDateRange(datePreset);

    const params = {
      page: currentPage,
      limit: 9,
      sort: selectedSort
    };

    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
    if (selectedCity && selectedCity !== 'All') params.city = selectedCity;
    if (minPrice !== '') params.minPrice = minPrice;
    if (maxPrice !== '') params.maxPrice = maxPrice;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    try {
      const res = await api.get('/events', { params });
      if (res.data?.success && res.data?.data) {
        setEvents(res.data.data.events);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.response?.data?.message || 'Unable to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedCity, selectedSort, minPrice, maxPrice, datePreset, currentPage]);

  // Sync params and trigger fetch
  useEffect(() => {
    fetchEvents();

    // Update browser URL query params
    const newParams = {};
    if (searchTerm) newParams.search = searchTerm;
    if (selectedCategory !== 'All') newParams.category = selectedCategory;
    if (selectedCity !== 'All') newParams.city = selectedCity;
    if (selectedSort !== 'date') newParams.sort = selectedSort;
    if (minPrice !== '') newParams.minPrice = minPrice;
    if (maxPrice !== '') newParams.maxPrice = maxPrice;
    if (datePreset !== 'all') newParams.datePreset = datePreset;
    if (currentPage > 1) newParams.page = currentPage;

    setSearchParams(newParams, { replace: true });
  }, [fetchEvents, setSearchParams]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents();
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedCity('All');
    setSelectedSort('date');
    setMinPrice('');
    setMaxPrice('');
    setDatePreset('all');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategory !== 'All' ||
    selectedCity !== 'All' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    datePreset !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header & Search Bar */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Discover Events
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
          Browse upcoming conferences, concerts, workshops, and sports matches around the world.
        </p>

        {/* Global Search & Mobile Filter Toggle */}
        <div className="mt-6 flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by event title, venue, or keywords..."
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200/90 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 text-sm shadow-sm transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            )}
          </button>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm sticky top-24 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span>Filters</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" /> Category
              </label>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                      selectedCategory === cat
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* City Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" /> City
              </label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              >
                <option value="All">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Preset */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Date
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', label: 'Any Date' },
                  { id: 'today', label: 'Today' },
                  { id: 'weekend', label: 'This Weekend' },
                  { id: 'month', label: 'Next 30 Days' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setDatePreset(preset.id);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-center ${
                      datePreset === preset.id
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" /> Max Price ($)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-1/2 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-1/2 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Events Content Area */}
        <main className="lg:col-span-3">
          {/* Top Bar: Results Count & Sorting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
            <span className="text-sm font-semibold text-slate-700">
              Showing <span className="text-indigo-600">{pagination.totalEvents}</span> published events
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label htmlFor="sort-select" className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </label>
              <select
                id="sort-select"
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              >
                <option value="date">Date: Soonest First</option>
                <option value="date_desc">Date: Furthest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popularity">Popularity (Most Sold)</option>
              </select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center my-6">
              <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-rose-900">Failed to load events</h3>
              <p className="text-sm text-rose-700 mt-1 max-w-md mx-auto">{error}</p>
              <button
                onClick={fetchEvents}
                className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && events.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-8 shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No events found</h3>
              <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                We couldn't find any events matching your selected criteria. Try adjusting your search keywords, city, or date range.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition"
                >
                  <RotateCcw className="w-4 h-4" /> Reset All Filters
                </button>
              )}
            </div>
          )}

          {/* Events Grid */}
          {!loading && !error && events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && pagination.totalPages > 1 && (
            <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <span className="text-xs sm:text-sm font-medium text-slate-600">
                Page <span className="font-bold text-slate-900">{pagination.currentPage}</span> of{' '}
                <span className="font-bold text-slate-900">{pagination.totalPages}</span>
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Slide-over / Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          ></div>

          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <span className="font-bold text-lg text-slate-900">Filter Events</span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Filter Controls */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="All">All Cities</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Date</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all', label: 'Any Date' },
                      { id: 'today', label: 'Today' },
                      { id: 'weekend', label: 'Weekend' },
                      { id: 'month', label: '30 Days' }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setDatePreset(p.id)}
                        className={`py-2 text-xs rounded-xl font-medium ${
                          datePreset === p.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => {
                  handleResetFilters();
                  setMobileFilterOpen(false);
                }}
                className="w-1/2 py-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-1/2 py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
