import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  Building2,
  Save
} from 'lucide-react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

const CATEGORIES = [
  'Technology',
  'Music',
  'Sports',
  'Workshops',
  'Business',
  'Arts & Theatre',
  'Other'
];

const CreateEditEventPage = () => {
  const { id } = useParams(); // If present, edit mode; otherwise, create mode
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [status, setStatus] = useState('published');

  // Image upload & preview
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // Ticket Tiers
  const [ticketTypes, setTicketTypes] = useState([
    { name: 'General Admission', price: 25, totalQuantity: 100 }
  ]);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If edit mode, load existing event details
  useEffect(() => {
    if (isEditMode) {
      const fetchEvent = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/events/${id}`);
          if (res.data?.success && res.data?.data?.event) {
            const ev = res.data.data.event;
            setTitle(ev.title || '');
            setDescription(ev.description || '');
            setCategory(ev.category || 'Technology');
            setVenue(ev.venue || '');
            setCity(ev.city || '');
            setStatus(ev.status || 'published');

            // Convert ISO dates to YYYY-MM-DDTHH:mm for datetime-local input
            if (ev.startDateTime) {
              setStartDateTime(new Date(ev.startDateTime).toISOString().slice(0, 16));
            }
            if (ev.endDateTime) {
              setEndDateTime(new Date(ev.endDateTime).toISOString().slice(0, 16));
            }

            if (ev.bannerImage) {
              setBannerUrl(ev.bannerImage);
              setImagePreview(ev.bannerImage);
            }

            if (Array.isArray(ev.ticketTypes) && ev.ticketTypes.length > 0) {
              setTicketTypes(
                ev.ticketTypes.map((t) => ({
                  name: t.name,
                  price: t.price,
                  totalQuantity: t.totalQuantity
                }))
              );
            }
          }
        } catch (err) {
          console.error('Error fetching event for edit:', err);
          setErrorMessage('Failed to load event details.');
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    }
  }, [id, isEditMode]);

  // Image file select handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setBannerUrl('');
    }
  };

  // Ticket Tier management
  const handleAddTier = () => {
    setTicketTypes([
      ...ticketTypes,
      { name: '', price: 0, totalQuantity: 50 }
    ]);
  };

  const handleRemoveTier = (index) => {
    if (ticketTypes.length <= 1) return;
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const handleTierChange = (index, field, value) => {
    const updated = [...ticketTypes];
    updated[index][field] = value;
    setTicketTypes(updated);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim() || !description.trim() || !venue.trim() || !city.trim() || !startDateTime || !endDateTime) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      setErrorMessage('Event end date and time must be after the start date and time.');
      return;
    }

    if (ticketTypes.some((t) => !t.name.trim() || t.totalQuantity <= 0)) {
      setErrorMessage('Every ticket tier must have a valid name and quantity greater than 0.');
      return;
    }

    try {
      setSubmitting(true);

      // Use FormData to support image upload via multer
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('venue', venue.trim());
      formData.append('city', city.trim());
      formData.append('startDateTime', new Date(startDateTime).toISOString());
      formData.append('endDateTime', new Date(endDateTime).toISOString());
      formData.append('status', status);
      formData.append('ticketTypes', JSON.stringify(ticketTypes));

      if (imageFile) {
        formData.append('bannerImage', imageFile);
      } else if (bannerUrl) {
        formData.append('bannerImage', bannerUrl);
      }

      let res;
      if (isEditMode) {
        res = await api.put(`/organizer/events/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/organizer/events', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data?.success) {
        setSuccessMessage(isEditMode ? 'Event updated successfully!' : 'Event created successfully!');
        setTimeout(() => {
          navigate('/organizer/dashboard');
        }, 1200);
      }
    } catch (err) {
      console.error('Error saving event:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="h-8 bg-slate-200 w-1/3 rounded-xl mx-auto mb-6"></div>
        <div className="h-96 bg-slate-200 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <button
        onClick={() => navigate('/organizer/dashboard')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isEditMode
            ? 'Update event details, timing, banner, and admission tiers.'
            : 'Publish a new experience and configure multi-tier ticket allocations.'}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-5 py-4 rounded-2xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-2xl text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" /> Event Details
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. NextGen Web & Cloud Conference 2026"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Publish Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition ${
                    status === 'published'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Published (Live)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition ${
                    status === 'draft'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Draft (Hidden)
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Full Description *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe the experience, schedule, speakers, and what attendees should expect..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            ></textarea>
          </div>
        </div>

        {/* Date, Time & Venue Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" /> Venue & Schedule
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="e.g. Bengaluru, Mumbai, London"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Venue Name & Hall *
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
                placeholder="e.g. Convention Center, Grand Ballroom"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </div>
        </div>

        {/* Banner Image & Upload Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" /> Event Banner Image
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Upload control */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Upload Image File (Multer)
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="banner-file-input"
                />
                <label htmlFor="banner-file-input" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <span className="text-xs font-bold text-slate-800 block">Click to upload image</span>
                  <span className="text-[10px] text-slate-400 block mt-1">PNG, JPG, WEBP up to 5MB</span>
                </label>
              </div>

              <div className="text-center text-xs text-slate-400 font-semibold uppercase">— OR —</div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Direct Image URL
                </label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => {
                    setBannerUrl(e.target.value);
                    setImagePreview(e.target.value);
                    setImageFile(null);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Live Banner Preview
              </span>
              <div className="h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setImagePreview('')}
                  />
                ) : (
                  <div className="text-center text-slate-400 text-xs">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <span>No banner chosen yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Tier Ticket Configuration */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-indigo-600" /> Ticket Tiers & Capacity
            </h2>
            <button
              type="button"
              onClick={handleAddTier}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Tier
            </button>
          </div>

          <div className="space-y-3">
            {ticketTypes.map((tier, index) => (
              <div
                key={index}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-3"
              >
                <div className="flex-1 w-full sm:w-auto">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Tier Name (e.g. VIP, General)
                  </label>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                    required
                    placeholder="General Admission"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="w-full sm:w-32">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={tier.price}
                    onChange={(e) => handleTierChange(index, 'price', parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="w-full sm:w-32">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={tier.totalQuantity}
                    onChange={(e) => handleTierChange(index, 'totalQuantity', parseInt(e.target.value, 10) || 1)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                {ticketTypes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTier(index)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition self-end sm:self-auto mt-2 sm:mt-4"
                    title="Remove Tier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/organizer/dashboard')}
            className="px-6 py-3 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Event...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditMode ? 'Update Event' : 'Publish Event'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditEventPage;
