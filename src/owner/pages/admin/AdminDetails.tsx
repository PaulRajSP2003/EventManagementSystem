import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, Shield, Calendar, User, Clock, FileText, Activity } from 'lucide-react';
import { FiArrowLeft, FiCalendar, FiCheck, FiCopy } from 'react-icons/fi';
import { adminAPI } from '../../api/AdminData';
import { eventAPI } from '../../api/EventData';
import type { Admin, Event } from '../../../types';
import OwnerLayout from '../components/OwnerLayout';

// --- SKELETON LOADER COMPONENT ---
const AdminDetailsSkeleton = () => (
  <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6 animate-pulse">
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
      <div className="h-40 bg-slate-200" />
      <div className="px-8 pb-8">
        <div className="relative -mt-16 flex items-end space-x-6">
          <div className="h-32 w-32 rounded-3xl bg-white p-1.5 shadow-xl">
            <div className="h-full w-full rounded-2xl bg-slate-100" />
          </div>
          <div className="mb-2 space-y-3">
            <div className="h-8 w-48 bg-slate-200 rounded-lg" />
            <div className="h-4 w-32 bg-slate-100 rounded-md" />
          </div>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-50 border border-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="h-64 bg-white rounded-3xl border border-slate-200" />
      <div className="lg:col-span-2 h-64 bg-white rounded-3xl border border-slate-200" />
    </div>
  </div>
);

export default function AdminDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const adminId = parseInt(id || '0');
        const adminData = await adminAPI.getById(adminId);

        if (adminData) {
          setAdmin(adminData);
          const eventData = await eventAPI.getById(adminData.eventId);
          if (eventData) setEvent(eventData);
        } else {
          setError('Admin record not found');
        }
      } catch (err) {
        setError('An error occurred while fetching admin details');
      } finally {
        setTimeout(() => setLoading(false), 500); // Slight delay for smooth transition
      }
    };
    loadData();
  }, [id]);

  // Shared Header logic
  const Header = (
    <div className="bg-transparent backdrop-blur-md sticky top-0 z-10 px-4 py-3 border-b border-white/20">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium group">
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          <div className="h-4 w-[1px] bg-slate-300/50 hidden sm:block"></div>
          <h1 className="text-lg font-bold text-slate-800 hidden sm:block">Admin Details</h1>
        </div>
        <button onClick={() => navigate('/owner/admin')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium shadow-sm">
          <FiCalendar /> View List
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <OwnerLayout>
        <div className="min-h-screen bg-slate-50 pb-12">
          {Header}
          <AdminDetailsSkeleton />
        </div>
      </OwnerLayout>
    );
  }

  if (error || !admin) {
    return (
      <OwnerLayout>
        <div className="min-h-screen bg-slate-50 pb-12">
          {Header}
          <div className="max-w-xl mx-auto mt-20 p-8 bg-white border border-red-100 rounded-2xl shadow-sm text-center">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-red-500" size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Not Found</h2>
            <p className="text-slate-500 mb-6">{error || 'The requested admin does not exist.'}</p>
            <button onClick={() => navigate('/owner/admin')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
              Back to Directory
            </button>
          </div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-slate-50 pb-12">
        {Header}

        <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
          {/* Main Profile Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/subtle-white-feathers.png')]"></div>
            </div>

            <div className="px-8 pb-8">
              <div className="relative -mt-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-end space-x-6">
                  <div className="h-32 w-32 rounded-3xl bg-white p-1.5 shadow-xl border border-slate-100">
                    <div className="h-full w-full rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <User size={64} strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="mb-2">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{admin.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-0.5 rounded-full text-xs font-bold uppercase">
                        {admin.role}
                      </span>
                      <span className="text-slate-400 text-sm font-medium">ID: #{admin.id}</span>
                    </div>
                  </div>
                </div>

                <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border ${admin.isActive
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                  <div className={`w-2 h-2 rounded-full ${admin.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {admin.isActive ? 'Active Member' : 'Inactive'}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Assigned Event', value: event?.eventName || `Event #${admin.eventId}` },
                  { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Access Level', value: `Level ${admin.assignRole}` },
                  { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Joined Date', value: admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A' }
                ].map((stat, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 ${stat.bg} ${stat.color} rounded-lg group-hover:scale-110 transition-transform`}>
                        <stat.icon size={18} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <p className="text-slate-800 font-bold truncate">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Connectivity */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Activity size={20} className="text-indigo-500" />
                Connectivity
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">
                    Email Address
                  </label>

                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Mail size={16} className="text-slate-400 shrink-0" />

                    <span className="truncate text-sm text-slate-700 font-medium flex-1">
                      {admin.email || '—'}
                    </span>

                    {admin.email && (
                      <button
                        onClick={() => handleCopyEmail(admin.email)}
                        className="p-2 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-all active:scale-90"
                        title="Copy Email"
                      >
                        {copied ? (
                          <FiCheck className="text-emerald-600" />
                        ) : (
                          <FiCopy />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Phone Number</label>
                  <div className="flex items-center gap-3 text-slate-700 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Phone size={16} className="text-slate-400" />
                    <span className="text-sm">{admin.contactNumber || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Notes & Audit */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 min-h-[160px]">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-indigo-500" />
                  Notes & Internal Data
                </h2>
                <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/50">
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {admin.remark || 'No internal notes have been added to this administrator profile.'}
                  </p>
                </div>
              </div>

              {/* System Audit - NO BLACK BACKGROUND */}
              <div className="bg-slate-100 p-8 rounded-3xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">System Audit Log</h3>
                  <Shield size={16} className="text-slate-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Created At</span>
                    <span className="text-xs font-mono text-indigo-600 font-bold">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Last Modified</span>
                    <span className="text-xs font-mono text-indigo-600 font-bold">{admin.updatedAt ? new Date(admin.updatedAt).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
}