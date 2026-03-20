import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSave, FiInfo, FiCalendar } from 'react-icons/fi';
import { adminAPI } from '../../api/AdminData';
import { eventAPI } from '../../api/EventData';
import type { Admin, Event } from '../../../types';
import OwnerLayout from '../components/OwnerLayout';
import EventListCompound from '../components/EventListCompound';
import StickyHeader from '../components/StickyHeader';

const AdminEditSkeleton = () => (
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

            <div className="space-y-2 pt-2">
              <div className="h-5 w-28 bg-slate-300 rounded animate-pulse"></div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-11 bg-slate-200 rounded-full animate-pulse"></div>
                <div className="h-5 w-20 bg-slate-300 rounded animate-pulse"></div>
              </div>
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

export default function AdminEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [formData, setFormData] = useState<Partial<Admin> | null>(null);

  useEffect(() => {
    const adminId = parseInt(id || '0');
    if (adminId <= 0 || isNaN(adminId)) {
      setError('Invalid admin ID');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        setSuccess('');

        const [adminData, eventsData, adminsData] = await Promise.all([
          adminAPI.getById(adminId),
          eventAPI.getAll(),
          adminAPI.getAll(),
        ]);

        if (!isMounted) return;

        if (adminData) {
          // Ensure assignRole has a default value if not present
          const adminWithDefaults = {
            ...adminData,
            assignRole: adminData.assignRole ?? 1,
            // Make sure password starts empty in edit form
            password: '',
          };
          setFormData(adminWithDefaults);
        } else {
          setError('Admin not found');
        }

        setEvents(eventsData || []);
        setAdmins(adminsData || []);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return;

    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev!,
      [name]:
        type === 'checkbox'
          ? checked
          : name === 'assignRole' || name === 'eventId'
            ? parseInt(value) || 0
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !formData.id) return;

    setError('');
    setSuccess('');

    // Validation — only name is required now
    if (!formData.name?.trim()) {
      setError('Name is required');
      return;
    }

    const submitData = {
      ...formData,
      assignRole: formData.assignRole ?? 1,
      eventId: formData.eventId ?? 0,
      password: formData.password ?? '',
    };

    try {
      setSaving(true);

      // Call the API to update the admin
      await adminAPI.update(formData.id, submitData);

      setSuccess('Admin updated successfully!');

      setTimeout(() => {
        navigate('/owner/admin');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update admin');
    } finally {
      setSaving(false);
    }
  };


  if (loading && !formData) {
    return (
      <OwnerLayout>
        <div className="min-h-screen bg-slate-50 pb-12">
          <StickyHeader 
            title="Edit Admin"
            onBack={() => navigate(-1)}
          >
            <button
              onClick={() => navigate('/owner/admin')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
            >
              <FiCalendar /> View List
            </button>
          </StickyHeader>

          <AdminEditSkeleton />
        </div>
      </OwnerLayout>
    );
  }

  if (!formData) {
    return (
      <OwnerLayout>
        <div className="max-w-6xl mx-auto px-4 mt-8">
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error || 'Admin not found'}
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-slate-50 pb-12">
        {/* Sticky Header */}
        <StickyHeader 
          title="Edit Admin"
          onBack={() => navigate(-1)}
        >
          <button
            onClick={() => navigate('/owner/admin')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
          >
            <FiCalendar /> View List
          </button>
        </StickyHeader>

        <div className="max-w-6xl mx-auto px-4 mt-8">
          <div className="lg:max-w-4xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl shadow-sm border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-6 rounded-t-xl">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Edit Admin</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Update the admin's information below.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-500">Admin ID: {formData.id}</div>
                  <div className="text-xs text-slate-400 mt-1">Edit Record</div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Success Message */}
                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm flex items-center gap-3">
                    <FiInfo className="shrink-0" /> {success}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-3">
                    <FiInfo className="shrink-0" /> {error}
                  </div>
                )}

                {/* Assigned Event Scope */}
                <div className="w-[400px]">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assigned Event Scope (Cannot be changed)
                  </label>
                  <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 min-h-[115px]">
                    <EventListCompound
                      events={events}
                      loading={loading}
                      error=""
                      onSelectEvent={() => { }}
                      selectedEventId={formData.eventId}
                      assignedEventIds={admins.filter(admin => admin.id !== formData?.id).map(admin => admin.eventId)}
                    />
                  </div>
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
                      value={formData.name ?? ''}
                      onChange={handleChange}
                      required
                      autoComplete='off'
                      disabled={saving}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="Enter admin name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email ?? ''}
                      disabled
                      autoComplete='off'
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-100 text-slate-900 text-sm cursor-not-allowed"
                      placeholder="email@company.com"
                    />
                  </div>
                </div>

                {/* Contact Number | Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber ?? ''}
                      onChange={handleChange}
                      disabled={saving}
                      autoComplete='off'
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password ?? ''}
                      onChange={handleChange}
                      disabled={saving}
                      autoComplete='off'
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="Leave blank to keep current password"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Enter a new password only if you want to change it. Leave empty to keep existing.
                    </p>
                  </div>
                </div>

                {/* assignRole Field (hidden) */}
                <input
                  type="hidden"
                  name="assignRole"
                  value={formData.assignRole ?? 1}
                  onChange={handleChange}
                />

                {/* Remark */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Remark
                  </label>
                  <textarea
                    name="remark"
                    value={formData.remark ?? ''}
                    onChange={handleChange}
                    disabled={saving}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all resize-y"
                    placeholder="Additional notes, comments or internal reference..."
                  />
                </div>

                {/* Admin Status Toggle */}
                <div className="pt-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Admin Status
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive ?? true}
                        onChange={handleChange}
                        disabled={saving}
                        autoComplete='off'
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 ${saving ? 'bg-slate-300' : 'bg-slate-200'} peer-focus:outline-none rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${saving ? 'cursor-not-allowed' : 'cursor-pointer'}`}></div>
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

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => navigate('/owner/admin')}
                  disabled={saving}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Updating...' : 'Update Admin'}
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
