// src/owner/pages/event/EventEdit.tsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiSave,
  FiInfo,
  FiCalendar,
  FiMapPin,
} from 'react-icons/fi';
import { eventAPI } from '../../api/EventData';
import type { Event } from '../../../types';
import OwnerLayout from '../components/OwnerLayout';
import StickyHeader from '../components/StickyHeader';

const EventEditSkeleton = () => (
  <div className="min-h-screen bg-slate-50 pb-12">
    <div className="max-w-6xl mx-auto px-4 mt-8">
      <div className="lg:max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-6 bg-slate-50">
            <div className="space-y-2">
              <div className="h-7 w-64 bg-slate-300 rounded animate-pulse"></div>
              <div className="h-4 w-80 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 w-40 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 w-32 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-5 w-40 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 w-40 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-5 w-24 bg-slate-300 rounded animate-pulse"></div>
              <div className="h-32 w-full bg-slate-100 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <div className="h-10 w-48 bg-slate-300 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function EventEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

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

  useEffect(() => {
    if (!id) {
      setError('No event ID provided');
      setLoading(false);
      return;
    }

    const numericId = Number(id);
    if (isNaN(numericId)) {
      setError('Invalid event ID');
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        setLoading(true);
        const event = await eventAPI.getById(numericId);

        if (event) {
          setFormData(event);
        } else {
          setError('Event not found');
        }
      } catch (err) {
        console.error('Failed to load event:', err);
        setError('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'phoneNumber'
            ? (parseInt(value) || 0)
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      setError('Cannot update: missing event ID');
      return;
    }

    if (!formData.eventName || !formData.from || !formData.to || !formData.location) {
      setError('Please fill in all required fields (Name, Location, Dates).');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const numericId = Number(id);

      // We only send the fields that can be updated (exclude id, createdAt, updatedAt)
      const updateData: Partial<Event> = {
        id: numericId,
        eventName: formData.eventName!,
        eventDescription: formData.eventDescription || '',
        email: formData.email || '',
        location: formData.location!,
        phoneNumber: formData.phoneNumber || '',
        from: formData.from!,
        to: formData.to!,
        isActive: formData.isActive ?? true,
      };

      /*
      {
         "id": 20002,
         "eventName": "Summer Camp 2026",
         "eventDescription": "A week-long summer camp for youth development.",
         "email": "summer@example.com",
         "location": "Varkala, Kerala",
         "phoneNumber": "9876543211",
         "from": "2026-06-01",
         "to": "2026-06-07",
         "isActive": true
      }
      */

      const updatedEvent = await eventAPI.update(numericId, updateData);

      if (updatedEvent) {
        setTimeout(() => {
          navigate('/owner/event');
        }, 1500);
      } else {
        setError('Event not found – possibly deleted');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = formData.eventName
    ? `Edit Event`
    : 'Edit Event';

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-slate-50 pb-12">
        <StickyHeader 
          title={pageTitle}
          onBack={() => navigate(-1)}
        >
          <button
            onClick={() => navigate('/owner/event')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
          >
            <FiCalendar /> View Events
          </button>
        </StickyHeader>

        {loading ? (
          <EventEditSkeleton />
        ) : (
          <div className="max-w-6xl mx-auto px-4 mt-8">
            <div className="lg:max-w-4xl mx-auto">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-6 bg-slate-50">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Edit Event</h2>
                    <p className="text-slate-600 text-sm mt-1">
                      Update the event details below.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-500">
                      ID: {id || '—'}
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-3">
                      <FiInfo className="shrink-0" /> {error}
                    </div>
                  )}

                  {/* Name + Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Event Name *
                      </label>
                      <input
                        type="text"
                        name="eventName"
                        value={formData.eventName || ''}
                        onChange={handleChange}
                        required
                        autoComplete='off'
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                        placeholder="Kerala Summer Adventure Camp"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Location *
                      </label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          name="location"
                          value={formData.location || ''}
                          onChange={handleChange}
                          required
                          autoComplete='off'
                          className="w-full pl-10 px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                          placeholder="Kollam, Kerala"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="from"
                        value={formData.from || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        name="to"
                        value={formData.to || ''}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        autoComplete='off'
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                        placeholder="camp@kollam.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber?.toString() || ''}   // safer display
                        onChange={handleChange}
                        autoComplete='off'
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="eventDescription"
                      value={formData.eventDescription || ''}
                      onChange={handleChange}
                      rows={4}
                      autoComplete='off'
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all resize-y"
                      placeholder="Join us for an exciting summer camp with adventure activities, team building, and nature exploration..."
                    />
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex items-center gap-3 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive ?? true}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                    <span className="text-sm font-medium text-slate-700">
                      Make event visible (Public)
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
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
