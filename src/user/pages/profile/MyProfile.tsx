import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { StickyHeader } from '../components';
import {
  FiActivity, FiMail,
  FiPhone, FiBriefcase, FiMapPin, FiCalendar, FiUser, FiUsers,
  FiCopy, FiClock, FiTrendingUp, FiAward,
  FiCheckCircle
} from 'react-icons/fi';
import { API_BASE } from '../../../config/api';

interface ProfileData {
  event: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    location: string;
    description: string;
    isActive: boolean;
    admin: {
      id: number;
      name: string;
      email: string;
      contactNumber: string;
      role: string;
    };
  };
  user: {
    id: number;
    name: string;
    email: string;
    contactNumber: string;
    role: string;
    assignRole: string;
    isActive: boolean;
    remark: string;
    createdAt: string;
  };
}

const MyProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { isConnected } = useNotification();
  const [data, setData] = useState<ProfileData | null>(null);
  const [showEventDetails] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/user/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || 'Failed to fetch profile');
        }
        setData(json.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };
    getProfileData();
  }, []);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const calculateDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const today = new Date().getTime();

    if (today < start) return 0;
    if (today > end) return 100;

    const total = end - start;
    const elapsed = today - start;
    return Math.round((elapsed / total) * 100);
  };

  const getEventStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (today < start) return 'upcoming';
    if (today > end) return 'ended';
    return 'active';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCopyId = (id: number) => {
    navigator.clipboard.writeText(id.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4">
        <div className="bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded-xl w-full max-w-md">
          <div className="font-bold mb-2">Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { user, event } = data;
  const eventStatus = getEventStatus(event.startDate, event.endDate);
  const daysLeft = calculateDaysLeft(event.endDate);
  const progress = calculateProgress(event.startDate, event.endDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <StickyHeader 
        title="My Profile" 
        onBack={() => navigate('/user/dashboard')} 
      />
      {/* Main Content */}
      <div className="px-4 py-4 pb-6 max-w-7xl mx-auto">
        {/* User Info Card - Mobile Optimized */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-800 capitalize truncate">{user.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {user.assignRole}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    #{user.id}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {isConnected ? '●' : '○'}
                    <span className="hidden xs:inline">{isConnected ? 'Online' : 'Offline'}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FiMail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-xs font-medium text-slate-700 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FiPhone className="w-4 h-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-xs font-medium text-slate-700 truncate">{user.contactNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showEventDetails && (
          <>
            {/* Event Stats Cards - Mobile Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-slate-500">Status</p>
                  <div className={`w-8 h-8 rounded-lg ${eventStatus === 'active' ? 'bg-green-100' :
                    eventStatus === 'upcoming' ? 'bg-blue-100' : 'bg-slate-100'
                    } flex items-center justify-center`}>
                    {eventStatus === 'active' ? (
                      <FiActivity className="w-4 h-4 text-green-600" />
                    ) : eventStatus === 'upcoming' ? (
                      <FiClock className="w-4 h-4 text-blue-600" />
                    ) : (
                      <FiCheckCircle className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                </div>
                <p className="text-lg font-bold text-slate-800 capitalize">{eventStatus}</p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-slate-500">Days Left</p>
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <FiClock className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <p className="text-lg font-bold text-slate-800">{daysLeft}</p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-slate-500">Progress</p>
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FiTrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <p className="text-lg font-bold text-slate-800">{progress}%</p>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-slate-500">Event ID</p>
                  <button
                    onClick={() => handleCopyId(event.id)}
                    className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center relative"
                  >
                    <FiCopy className="w-4 h-4 text-indigo-600" />
                    {copied && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                        Copied!
                      </span>
                    )}
                  </button>
                </div>
                <p className="text-lg font-bold text-slate-800">#{event.id}</p>
              </div>
            </div>

            {/* Event Details Card - Mobile Optimized */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <FiBriefcase className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-slate-800">Event Details</h3>
                    <p className="text-xs text-slate-500 truncate">{event.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${event.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
                    }`}>
                    {event.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">{event.description}</p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiMapPin className="w-3 h-3 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="text-sm font-medium text-slate-700 break-words">{event.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiCalendar className="w-3 h-3 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500">Event Period</p>
                        <p className="text-sm font-medium text-slate-700 break-words">
                          {formatDate(event.startDate)} - {formatDate(event.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Event Timeline */}
                  <div className="bg-slate-50 rounded-xl p-4 mt-4">
                    <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      Event Timeline
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500">Start Date</p>
                          <p className="text-xs font-medium text-slate-700">{formatDate(event.startDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500">End Date</p>
                          <p className="text-xs font-medium text-slate-700">{formatDate(event.endDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500">Duration</p>
                          <p className="text-xs font-medium text-slate-700">
                            {Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Details Card - Mobile Optimized */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <FiUsers className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">Admin Details</h3>
                    <p className="text-xs text-slate-500">Event administrator</p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                    <p className="text-xs font-semibold text-purple-400 uppercase mb-1">Admin Name</p>
                    <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                      <FiUser className="w-3 h-3 text-purple-500 flex-shrink-0" />
                      <span className="truncate">{event.admin.name}</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                    <p className="text-xs font-semibold text-purple-400 uppercase mb-1">Admin Email</p>
                    <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                      <FiMail className="w-3 h-3 text-purple-500 flex-shrink-0" />
                      <span className="truncate">{event.admin.email}</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                    <p className="text-xs font-semibold text-purple-400 uppercase mb-1">Admin Contact</p>
                    <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                      <FiPhone className="w-3 h-3 text-purple-500 flex-shrink-0" />
                      <span className="truncate">{event.admin.contactNumber}</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                    <p className="text-xs font-semibold text-purple-400 uppercase mb-1">Role</p>
                    <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                      <FiAward className="w-3 h-3 text-purple-500 flex-shrink-0" />
                      <span className="truncate">{event.admin.role}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer Info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <span>Event ID: {event.id}</span>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
