import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSave,
  FiInfo,
  FiCalendar,
  FiCheckCircle,
} from 'react-icons/fi';
import { adminAPI } from '../../api/AdminData';
import { eventAPI } from '../../api/EventData';
import type { Admin, Event } from '../../../types';
import OwnerLayout from '../components/OwnerLayout';
import EventListCompound from '../components/EventListCompound';
import StickyHeader from '../components/StickyHeader';

const AdminNewSkeleton = () => (
  <div className="min-h-screen bg-slate-50 pb-12">
    <div className="max-w-6xl mx-auto px-4 mt-8">
      <div className="lg:max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-6 bg-slate-50">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-slate-300 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-slate-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <div className="h-4 w-24 bg-slate-300 rounded animate-pulse ml-auto"></div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="w-[400px]">
              <div className="h-5 w-48 bg-slate-300 rounded mb-2 animate-pulse"></div>
              <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 min-h-[115px]">
                <div className="h-9 w-full bg-slate-200 rounded mb-2 animate-pulse"></div>
                <div className="h-9 w-3/4 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 w-24 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-5 w-20 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-11 w-full bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
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

export default function AdminNewModern() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [formData, setFormData] = useState<Partial<Admin>>({
    id: 0,
    name: '',
    email: '',
    contactNumber: '',
    eventId: undefined,
    role: 'admin',
    assignRole: 1, // Default value as per your API structure
    isActive: true,
    remark: '',
    password: ''
  });

  useEffect(() => {
    loadEventsAndAdmins();
  }, []);

  const loadEventsAndAdmins = async () => {
    try {
      const [eventsData, adminsData] = await Promise.all([
        eventAPI.getAll(),
        adminAPI.getAll()
      ]);
      setEvents(eventsData);
      setAdmins(adminsData);
    } catch (err) {
      console.error('Failed to load events and admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumberField = ['assignRole', 'eventId'].includes(name);

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : isNumberField ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name?.trim()) {
      setError('Full Name is required.');
      return;
    }

    if (!formData.email?.trim()) {
      setError('Work Email is required.');
      return;
    }

    if (!formData.eventId || formData.eventId <= 0) {
      setError('Please select an Event Scope.');
      return;
    }

    if (!formData.password?.trim()) {
      setError('Password is required.');
      return;
    }

    const adminData: Partial<Admin> & { id: number } = {
      id: 0,
      name: formData.name.trim().toLowerCase(),
      email: formData.email.trim().toLowerCase(),
      eventId: formData.eventId,
      password: formData.password,
      contactNumber: formData.contactNumber || '',
      role: 'admin',
      assignRole: formData.assignRole || 1,
      isActive: formData.isActive ?? true,
      remark: formData.remark || ''
    };

    try {
      setSubmitting(true);
      
      // Use the create method from adminAPI
      await adminAPI.create(adminData as Omit<Admin, 'id' | 'createdAt' | 'updatedAt'>);
      
      setSuccess('Admin created successfully!');
      
      // Option 1: Redirect after success
      setTimeout(() => {
        navigate('/owner/admin');
      }, 1500);
  
    } catch (err: any) {
      setError(err.message || 'Failed to create admin. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !events.length) {
    return (
      <OwnerLayout>
        <div className="min-h-screen bg-slate-50 pb-12">
          <StickyHeader 
            title="New Admin"
            onBack={() => navigate(-1)}
          >
            <button
              onClick={() => navigate('/owner/admin')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
            >
              <FiCalendar /> View List
            </button>
          </StickyHeader>
          <AdminNewSkeleton />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-slate-50 pb-12">
        <StickyHeader 
          title="New Admin"
          onBack={() => navigate(-1)}
        >
          <button
            onClick={() => navigate('/owner/admin')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
          >
            <FiCalendar /> View List
          </button>
        </StickyHeader>

        <div className="max-w-6xl mx-auto px-4 mt-4 sm:mt-8">
          <div className="lg:max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-6 bg-slate-50/50 rounded-t-xl">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800">Register New Admin</h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">Enter the admin's information below.</p>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Record</div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Success Message */}
                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm flex items-center gap-3">
                    <FiCheckCircle className="shrink-0" /> {success}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-3">
                    <FiInfo className="shrink-0" /> {error}
                  </div>
                )}

                {/* Assigned Event Scope */}
                <div className="w-full max-w-md">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Assigned Event Scope *
                  </label>
                  <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 min-h-[110px]">
                    <EventListCompound
                      events={events}
                      loading={loading}
                      error=""
                      onSelectEvent={(eventId) => {
                        setFormData(prev => ({ ...prev, eventId }));
                      }}
                      selectedEventId={formData.eventId}
                      assignedEventIds={admins.map(admin => admin.eventId)}
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-2 italic">
                    Select the event this admin will manage. This cannot be changed later.
                  </p>
                </div>

                {/* Full Name | Work Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      required
                      autoComplete='off'
                      disabled={submitting}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="Enter admin name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Work Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      required
                      autoComplete='off'
                      disabled={submitting}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="email@company.com"
                    />
                  </div>
                </div>

                {/* Contact Number | Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber || ''}
                      onChange={handleChange}
                      disabled={submitting}
                      autoComplete='off'
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password || ''}
                      onChange={handleChange}
                      required
                      autoComplete='off'
                      disabled={submitting}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="••••••••"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Set a secure password for the admin to log in.
                    </p>
                  </div>
                </div>

                {/* Hidden assignRole field (default value) */}
                <input
                  type="hidden"
                  name="assignRole"
                  value={formData.assignRole || 1}
                  onChange={handleChange}
                />

                {/* Remark */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Remark</label>
                  <textarea
                    name="remark"
                    value={formData.remark || ''}
                    onChange={handleChange}
                    disabled={submitting}
                    autoComplete='off'
                    rows={4}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all resize-y"
                    placeholder="Additional notes, comments or internal reference..."
                  />
                </div>

                {/* Admin Status Toggle */}
                <div className="pt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Admin Status</label>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive ?? true}
                        onChange={handleChange}
                        disabled={submitting}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 ${submitting ? 'bg-slate-300' : 'bg-slate-200'} peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${submitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}></div>
                    </label>
                    <span className="text-sm font-medium text-slate-700">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Inactive admins cannot log in or perform actions.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => navigate('/owner/admin')}
                  disabled={submitting}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Admin'}
                  <FiSave />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}
