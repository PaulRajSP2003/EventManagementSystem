import { useEffect, useState } from 'react';
import { 
  CalendarDays, 
  Users, 
  Activity, 
  ChevronRight,
  PlusCircle,
  UserPlus,
  Shield,
  Clock,
  CheckCircle,
  FileSearch}
from 'lucide-react';
import { eventAPI } from '../../api/EventData';
import { adminAPI } from '../../api/AdminData';
import type { Event, Admin } from '../../../types';
import OwnerLayout from '../components/OwnerLayout';
import { Link, useNavigate } from 'react-router-dom';

// --- Skeleton Component ---
const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-6">
    {/* Header Skeleton */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div className="space-y-3">
        <div className="h-8 w-48 bg-slate-200 rounded"></div>
        <div className="h-4 w-64 bg-slate-100 rounded"></div>
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
      </div>
    </div>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
            <div className="w-12 h-4 bg-slate-100 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="w-20 h-3 bg-slate-100 rounded"></div>
            <div className="w-14 h-6 bg-slate-200 rounded"></div>
            <div className="w-28 h-3 bg-slate-100 rounded"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Table Skeleton */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <div className="h-6 w-40 bg-slate-200 rounded mb-1"></div>
          <div className="h-4 w-32 bg-slate-100 rounded"></div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                <div className="w-32 h-4 bg-slate-100 rounded"></div>
              </div>
              <div className="w-20 h-4 bg-slate-100 rounded"></div>
              <div className="w-16 h-6 bg-slate-100 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar Skeleton */}
      <div className="space-y-4">
        <div className="h-48 bg-slate-800 rounded-xl p-4">
          <div className="w-28 h-5 bg-slate-700 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-white/5 rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="w-full h-4 bg-slate-200 rounded mb-3"></div>
          <div className="w-full h-2 bg-slate-100 rounded-full mb-4"></div>
          <div className="w-full h-4 bg-slate-200 rounded mb-3"></div>
          <div className="w-full h-2 bg-slate-100 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    activeEvents: 0,
    upcomingEvents: 0,
    totalAdmins: 0,
    activeAdmins: 0,
    eventGrowth: 0,
    adminGrowth: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    // Filter events based on search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const filtered = events.filter(event =>
        event.eventName.toLowerCase().includes(searchLower) ||
        event.email.toLowerCase().includes(searchLower) ||
        event.eventDescription?.toLowerCase().includes(searchLower)
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents(events.slice(0, 5)); // Show only 5 events by default
    }
  }, [searchTerm, events]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [eventsData, adminsData] = await Promise.all([
        eventAPI.getAll(),
        adminAPI.getAll()
      ]);
      
      setEvents(eventsData);
      setFilteredEvents(eventsData.slice(0, 5)); // Show first 5 events
      setAdmins(adminsData);
      
      const activeEvents = eventsData.filter(e => e.isActive).length;
      const upcomingEvents = eventsData.filter(e => new Date(e.from) > new Date()).length;
      const activeAdmins = adminsData.filter(a => a.isActive).length;
      
      const eventGrowth = eventsData.length > 0 ? Math.round((activeEvents / eventsData.length) * 100) : 0;
      const adminGrowth = adminsData.length > 0 ? Math.round((activeAdmins / adminsData.length) * 100) : 0;
      
      setStats({
        activeEvents,
        upcomingEvents,
        totalAdmins: adminsData.length,
        activeAdmins,
        eventGrowth,
        adminGrowth
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEventStatusColor = (event: Event) => {
    const now = new Date();
    const from = new Date(event.from);
    const to = new Date(event.to);
    if (!event.isActive) return 'bg-gray-100 text-gray-600 border-gray-200';
    if (now < from) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (now >= from && now <= to) return 'bg-green-50 text-green-600 border-green-100';
    return 'bg-orange-50 text-orange-600 border-orange-100';
  };

  const getEventStatusText = (event: Event) => {
    const now = new Date();
    const from = new Date(event.from);
    const to = new Date(event.to);
    if (!event.isActive) return 'Inactive';
    if (now < from) return 'Upcoming';
    if (now >= from && now <= to) return 'Live Now';
    return 'Completed';
  };

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-slate-50">
        {/* Sticky Header - Consistent with EventList */}
        <div className="bg-transparent backdrop-blur-md sticky top-0 z-10 px-4 py-3 border-b border-white/20">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="h-4 w-[1px] bg-slate-300/50 hidden sm:block"></div>
              <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                Dashboard Overview
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/owner/event/new"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 rounded-lg transition text-sm font-medium shadow-sm"
              >
                <PlusCircle size={16} /> New Event
              </Link>
              <Link
                to="/owner/admin/new"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
              >
                <UserPlus size={16} /> New Admin
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content - Max width container */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Search Bar - Similar to EventList */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileSearch className="text-slate-400" size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Search events by name, email, or description..."
                      className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              <p className="font-medium">Error: {error}</p>
            </div>
          )}

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* Stats Cards - Compact design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { 
                    label: 'Total Events', 
                    value: events.length, 
                    sub: `${stats.upcomingEvents} Upcoming`, 
                    icon: CalendarDays, 
                    color: 'from-blue-500 to-cyan-500', 
                    trend: `${stats.eventGrowth}%` 
                  },
                  { 
                    label: 'Active Events', 
                    value: stats.activeEvents, 
                    sub: 'Currently running', 
                    icon: Activity, 
                    color: 'from-emerald-500 to-green-500', 
                    trend: `${stats.activeEvents}/${events.length}` 
                  },
                  { 
                    label: 'Total Admins', 
                    value: admins.length, 
                    sub: 'Platform staff', 
                    icon: Users, 
                    color: 'from-purple-500 to-pink-500', 
                    trend: `${stats.adminGrowth}%` 
                  },
                  { 
                    label: 'Active Admins', 
                    value: stats.activeAdmins, 
                    sub: 'Currently online', 
                    icon: Shield, 
                    color: 'from-amber-500 to-orange-500', 
                    trend: `${stats.activeAdmins}/${admins.length}` 
                  },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                        <stat.icon className={`h-5 w-5 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
                      </div>
                      <span className="text-xs font-bold text-emerald-600">{stat.trend}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-800 mb-1">{stat.value}</p>
                      <p className="text-xs text-slate-600">{stat.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Events Table - Left side (2/3) */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 rounded-lg">
                            <CalendarDays className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold text-slate-800">Recent Events</h2>
                            <p className="text-sm text-slate-500">Latest camp activities</p>
                          </div>
                        </div>
                        <Link 
                          to="/owner/event" 
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          View All
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Event Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Date Range
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredEvents.map((event) => (
                            <tr 
                              key={event.id} 
                              className="hover:bg-slate-50 transition-colors cursor-pointer"
                              onClick={() => navigate(`/owner/event/${event.id}`)}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${event.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                  <span className="text-sm font-medium text-slate-800 capitalize">
                                    {event.eventName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  {new Date(event.from).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })} - {new Date(event.to).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getEventStatusColor(event)}`}>
                                  {getEventStatusText(event)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/owner/event/${event.id}`);
                                  }}
                                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                  View
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {filteredEvents.length === 0 && (
                        <div className="py-12 text-center text-slate-400 text-sm">
                          No events found
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar - Right side (1/3) */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Activity className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-lg">Quick Actions</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Event Management', to: '/owner/event', icon: CalendarDays },
                        { label: 'Admin Directory', to: '/owner/admin', icon: Users },
                      ].map((item, i) => (
                        <Link
                          key={i}
                          to={item.to}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* System Health */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                        System Health
                      </h3>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-700">Event Activity</span>
                          <span className="text-sm font-bold text-slate-900">
                            {stats.activeEvents}/{events.length}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                            style={{ 
                              width: `${events.length ? (stats.activeEvents / events.length) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-xl font-bold text-blue-700">{stats.upcomingEvents}</p>
                          <p className="text-xs font-medium text-blue-600">Upcoming</p>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                          <p className="text-xl font-bold text-emerald-700">{stats.activeAdmins}</p>
                          <p className="text-xs font-medium text-emerald-600">Online Now</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}