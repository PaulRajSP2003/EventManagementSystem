import { useEffect, useState } from 'react';
import { FiSearch, FiPlus, FiArrowLeft, FiChevronUp, FiChevronDown, FiFilter, FiEdit } from 'react-icons/fi';
import { eventAPI } from '../../api/EventData';
import type { Event } from '../../../types';
import OwnerLayout from '../components/OwnerLayout';
import { Link, useNavigate } from 'react-router-dom';

type FilterType = {
  id: string;
  eventName: string;
  email: string;
  status: string;
};

type SortConfig = {
  key: keyof Event;
  direction: 'asc' | 'desc';
};

const EventListSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6 animate-pulse">
    <div className="h-20 bg-white rounded-xl border border-slate-200 shadow-sm"></div>
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="h-12 bg-slate-50 border-b border-slate-200"></div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 border-b border-slate-100 mx-4"></div>
      ))}
    </div>
  </div>
);

export default function EventList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'desc' });
  const [filters, setFilters] = useState<FilterType>({
    id: '', eventName: '', email: '', status: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    let results = [...events];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      results = results.filter(event =>
        event.eventName.toLowerCase().includes(searchLower) ||
        event.email.toLowerCase().includes(searchLower) ||
        event.eventDescription?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (filters.id) {
      results = results.filter(e => e.id?.toString().includes(filters.id));
    }
    if (filters.eventName) {
      results = results.filter(e => e.eventName.toLowerCase().includes(filters.eventName.toLowerCase()));
    }
    if (filters.email) {
      results = results.filter(e => e.email.toLowerCase().includes(filters.email.toLowerCase()));
    }
    if (filters.status) {
      results = results.filter(e => e.isActive === (filters.status === 'active'));
    }

    // Sorting
    results.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';

      if (aValue === bValue) return 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc'
        ? (aValue < bValue ? -1 : 1)
        : (aValue > bValue ? -1 : 1);
    });

    setFilteredEvents(results);
  }, [searchTerm, events, sortConfig, filters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventAPI.getAll();
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof Event) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({ id: '', eventName: '', email: '', status: '' });
    setSearchTerm('');
    setSortConfig({ key: 'id', direction: 'desc' });
  };

  const SortIcon = ({ column }: { column: keyof Event }) => {
    if (sortConfig.key !== column) return <FiChevronUp className="opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <FiChevronUp className="text-indigo-600" /> : <FiChevronDown className="text-indigo-600" />;
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

              <div className="h-4 w-[1px] bg-slate-300/50 hidden sm:block"></div>

              <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                Event Management
              </h1>
            </div>

            <Link
              to="/owner/event/new"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium"
            >
              <FiPlus /> New Event
            </Link>

          </div>
        </div>

        {loading ? (
          <EventListSkeleton />
        ) : (
          <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-50 bg-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name, email, or description..."
                      className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <FiFilter /> Filters
                    </button>
                    {(searchTerm || Object.values(filters).some(v => v)) && (
                      <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-600 font-semibold px-2 transition-colors">
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {showFilters && (
                <div className="p-4 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-slate-100">
                  {['id', 'eventName', 'email'].map((field) => (
                    <div key={field} className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">{field}</label>
                      <input
                        type={field === 'id' ? 'number' : 'text'}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none"
                        value={filters[field as keyof FilterType]}
                        onChange={(e) => setFilters(p => ({ ...p, [field]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                    <select className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none" value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}>
                      <option value="">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                <p className="font-medium">Error: {error}</p>
              </div>
            )}

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th onClick={() => handleSort('id')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                        <div className="flex items-center gap-1">ID <SortIcon column="id" /></div>
                      </th>
                      <th onClick={() => handleSort('eventName')} className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider cursor-pointer group select-none">
                        <div className="flex items-center gap-1">Event Name <SortIcon column="eventName" /></div>
                      </th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">Email</th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">From</th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">To</th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEvents.map((event) => (
                      <tr
                        key={event.id}
                        onClick={() => navigate(`/owner/event/${event.id}`)}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-400">
                          {event.id ? `#${event.id}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors capitalize">
                            {event.eventName}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 lowercase">
                          {event.email}
                        </td>

                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          {event.from ? new Date(event.from).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          {event.to ? new Date(event.to).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1 text-[10px] uppercase font-bold rounded-full border ${event.isActive
                              ? 'bg-green-50 text-green-700 border-green-100'
                              : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                            {event.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/owner/event/edit/${event.id}`)}
                            className="inline-flex items-center justify-center px-4 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200"
                          >
                            <FiEdit className="mr-1 w-3 h-3" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredEvents.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    {searchTerm ? 'No events found matching your search.' : 'No events found.'}
                  </div>
                )}
              </div>
            </div>

            {filteredEvents.length > 0 && (
              <div className="text-xs text-slate-400 px-2">
                Showing {filteredEvents.length} of {events.length} total events
              </div>
            )}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
