// src/owner/pages/event/EventNew.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiSave,
  FiInfo,
  FiCalendar,
  FiMapPin,
} from 'react-icons/fi';
import { eventAPI } from '../../api/EventData';
import type { Event } from '../../../types';
import OwnerLayout from '../components/OwnerLayout';

const EventNewSkeleton = () => (
  <div className="min-h-screen bg-slate-50 pb-12">
    <div className="max-w-6xl mx-auto px-4 mt-8">
      <div className="lg:max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-6 bg-slate-50">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-slate-300 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><div className="h-5 w-32 bg-slate-300 rounded animate-pulse"></div><div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div></div>
              <div className="space-y-2"><div className="h-5 w-40 bg-slate-300 rounded animate-pulse"></div><div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><div className="h-5 w-32 bg-slate-300 rounded animate-pulse"></div><div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div></div>
              <div className="space-y-2"><div className="h-5 w-32 bg-slate-300 rounded animate-pulse"></div><div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><div className="h-5 w-40 bg-slate-300 rounded animate-pulse"></div><div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div></div>
              <div className="space-y-2"><div className="h-5 w-40 bg-slate-300 rounded animate-pulse"></div><div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div></div>
            </div>
            <div className="space-y-2">
              <div className="h-5 w-20 bg-slate-300 rounded animate-pulse"></div>
              <div className="h-24 w-full bg-slate-100 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <div className="h-10 w-40 bg-slate-300 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function EventNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<Partial<Event>>({
    eventName: '',
    eventDescription: '',
    email: '',
    location: '',
    phoneNumber: '',
    from: '',
    to: '',
    isActive: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.eventName || !formData.from || !formData.to || !formData.location) {
      setError('Please fill in all required fields (Name, Location, Dates).');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        id: 0,
        eventName: (formData.eventName ?? '').trim().toLowerCase(),
        eventDescription: (formData.eventDescription ?? '').trim().toLowerCase(),
        email: (formData.email ?? '').trim().toLowerCase(),
        location: (formData.location ?? '').trim().toLowerCase(),
        phoneNumber: (formData.phoneNumber ?? '').trim(),
        from: formData.from ?? '',
        to: formData.to ?? '',
        isActive: formData.isActive ?? true,
      };

      // This returns the full Event with real eventId from backend
      await eventAPI.create(payload);

      // Extract real ID from response (your backend returns data.eventId)
      // const realId = (createdEvent as any).eventId || createdEvent.id || 0;

      // Redirect to event list after success
      setTimeout(() => {
        navigate('/owner/event');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-slate-50 pb-12">
        {/* Sticky Header */}
        <div className="bg-transparent backdrop-blur-md sticky top-0 z-10 px-4 py-3 border-b border-white/20">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium group"
              >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                Back
              </button>
              <div className="h-4 w-[1px] bg-slate-300/50 hidden sm:block" />
              <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                New Event
              </h1>
            </div>
            <button
              onClick={() => navigate('/owner/event')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
            >
              <FiCalendar /> View Events
            </button>
          </div>
        </div>

        {loading ? (
          <EventNewSkeleton />
        ) : (
          <div className="max-w-6xl mx-auto px-4 mt-8">
            <div className="lg:max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-6 bg-slate-50">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Create New Event</h2>
                    <p className="text-slate-600 text-sm mt-1">Enter the event details below.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-500">New Record</div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-3">
                      <FiInfo className="shrink-0" /> {error}
                    </div>
                  )}

                  {/* All your inputs remain 100% unchanged */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Event Name *</label>
                      <input type="text" name="eventName" autoComplete='off' value={formData.eventName ?? ''} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" placeholder="Kerala Summer Adventure Camp" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Location *</label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" name="location" autoComplete='off' value={formData.location ?? ''} onChange={handleChange} required className="w-full pl-10 px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" placeholder="Kollam, Kerala" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Start Date *</label>
                      <input type="date" name="from" value={formData.from ?? ''} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">End Date *</label>
                      <input type="date" name="to" value={formData.to ?? ''} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Contact Email</label>
                      <input type="email" name="email" autoComplete='off' value={formData.email ?? ''} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" placeholder="camp@kollam.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Contact Phone</label>
                      <input type="tel" name="phoneNumber" autoComplete='off' value={formData.phoneNumber ?? ''} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all" placeholder="9876543210" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea name="eventDescription" autoComplete='off' value={formData.eventDescription ?? ''} onChange={handleChange} rows={4} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all resize-y" placeholder="Join us for an exciting summer camp..." />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="isActive" checked={formData.isActive ?? false} onChange={handleChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                    <span className="text-sm font-medium text-slate-700">Make Event Active</span>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Event'}
                    <FiSave size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}