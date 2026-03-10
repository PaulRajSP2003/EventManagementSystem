import React, { useState, useEffect } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiActivity, FiMail,
  FiPhone, FiBriefcase, FiMapPin, FiCalendar, FiUser, FiUsers,
  FiCopy, FiClock, FiTrendingUp, FiAward,
  FiEye, FiEyeOff, FiCheckCircle
} from 'react-icons/fi';

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
  const [showEventDetails, setShowEventDetails] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const getProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://localhost:7135/api/user/profile', {
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

  const [error, setError] = useState<string | null>(null);

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
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-lg text-slate-500">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded-xl">
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
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-[11px] border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center min-h-[36px]">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              <FiArrowLeft /> Back
            </button>
            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
              My Profile
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEventDetails(!showEventDetails)}
              className="flex items-center gap-2 px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
            >
              {showEventDetails ? <FiEyeOff /> : <FiEye />}
              {showEventDetails ? 'Hide Event' : 'Show Event'}
            </button>
            
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {getInitials(user.name)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 capitalize">{user.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium uppercase">
                    {user.assignRole}
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    ID: #{user.id}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {isConnected ? '● Online' : '○ Offline'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:pl-6 sm:border-l border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FiMail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-700 break-all">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <FiPhone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm font-medium text-slate-700">{user.contactNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showEventDetails && (
          <>
            {/* Event Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Event Status</p>
                    <p className="text-2xl font-bold text-slate-800 capitalize">{eventStatus}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${
                    eventStatus === 'active' ? 'bg-green-100' :
                    eventStatus === 'upcoming' ? 'bg-blue-100' : 'bg-slate-100'
                  } flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {eventStatus === 'active' ? (
                      <FiActivity className={`w-6 h-6 ${
                        eventStatus === 'active' ? 'text-green-600' :
                        eventStatus === 'upcoming' ? 'text-blue-600' : 'text-slate-600'
                      }`} />
                    ) : eventStatus === 'upcoming' ? (
                      <FiClock className="w-6 h-6 text-blue-600" />
                    ) : (
                      <FiCheckCircle className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Days Left</p>
                    <p className="text-2xl font-bold text-slate-800">{daysLeft}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiClock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Progress</p>
                    <p className="text-2xl font-bold text-slate-800">{progress}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiTrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Event ID</p>
                    <p className="text-2xl font-bold text-slate-800">#{event.id}</p>
                  </div>
                  <button
                    onClick={() => handleCopyId(event.id)}
                    className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform relative"
                  >
                    <FiCopy className="w-6 h-6 text-indigo-600" />
                    {copied && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                        Copied!
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Event Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <FiBriefcase className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">Event Details</h3>
                      <p className="text-sm text-slate-500">{event.name}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    event.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {event.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Event Info */}
                  <div className="space-y-4">
                    <p className="text-slate-600 leading-relaxed">{event.description}</p>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiMapPin className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Location</p>
                        <p className="text-sm font-medium text-slate-700">{event.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiCalendar className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Event Period</p>
                        <p className="text-sm font-medium text-slate-700">
                          {formatDate(event.startDate)} - {formatDate(event.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Event Timeline */}
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <FiClock className="w-4 h-4" />
                      Event Timeline
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500">Start Date</p>
                          <p className="text-sm font-medium text-slate-700">{formatDate(event.startDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500">End Date</p>
                          <p className="text-sm font-medium text-slate-700">{formatDate(event.endDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500">Duration</p>
                          <p className="text-sm font-medium text-slate-700">
                            {Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Details Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <FiUsers className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Event Admin Details</h3>
                    <p className="text-sm text-slate-500">Contact information for event administrator</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                    <p className="text-xs font-semibold text-purple-400 uppercase mb-2">Admin Name</p>
                    <p className="text-gray-700 font-medium capitalize flex items-center gap-2">
                      <FiUser className="w-4 h-4 text-purple-500" />
                      {event.admin.name}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                    <p className="text-xs font-semibold text-purple-400 uppercase mb-2">Admin Email</p>
                    <p className="text-gray-700 font-medium break-all flex items-center gap-2">
                      <FiMail className="w-4 h-4 text-purple-500" />
                      {event.admin.email}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                    <p className="text-xs font-semibold text-purple-400 uppercase mb-2">Admin Contact</p>
                    <p className="text-gray-700 font-medium flex items-center gap-2">
                      <FiPhone className="w-4 h-4 text-purple-500" />
                      {event.admin.contactNumber}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                    <p className="text-xs font-semibold text-purple-400 uppercase mb-2">Role</p>
                    <p className="text-gray-700 font-medium capitalize flex items-center gap-2">
                      <FiAward className="w-4 h-4 text-purple-500" />
                      {event.admin.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer Info */}
        <div className="mt-8 flex items-center justify-center gap-8 text-xs text-slate-400">
          <span>Event ID: {event.id}</span>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;