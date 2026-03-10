import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import type { Event } from '../../../../types';

interface EventListCompoundProps {
  events: Event[];
  loading: boolean;
  error: string;
  onSelectEvent?: (eventId: number | undefined) => void;
  selectedEventId?: number | undefined;
  onDelete?: (eventId: number | undefined) => void;
}


const EventListCompound: React.FC<EventListCompoundProps> = ({
  events,
  loading,
  error,
  onSelectEvent,
  selectedEventId,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [idFilter, setIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize selected event
  useEffect(() => {
    if (selectedEventId !== undefined) {
      const initialEvent = events.find(e => e.eventId === selectedEventId) || null;
      setSelectedEvent(initialEvent);
    }
  }, [selectedEventId, events]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const filteredEvents = events.filter(event => {
    const matchesName = (event.eventName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesId = idFilter === '' || event.eventId?.toString().includes(idFilter);
    const matchesStatus = statusFilter === '' || (event.isActive ? 'active' : 'inactive') === statusFilter;

    return matchesName && matchesId && matchesStatus;
  });

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    if (onSelectEvent) {
      onSelectEvent(event.eventId);
    }
    setIsDropdownOpen(false);
    resetFilters();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setIdFilter('');
    setStatusFilter('');
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(null);
    if (onSelectEvent) {
      onSelectEvent(undefined);
    }
    resetFilters();
  };

  if (loading) {
    return (
      <div className="w-full max-w-md p-3 bg-slate-50 border border-slate-300 rounded-lg shadow-sm animate-pulse">
        <div className="h-10 bg-slate-200 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      {/* Selected View */}
      {selectedEvent ? (
        <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-indigo-600 text-white rounded-full p-2 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H3a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1h-3a1 1 0 000-2h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">
                Event #{selectedEvent.eventId}
              </span>
              <span className="font-semibold text-slate-800 text-sm truncate">
                {selectedEvent.eventName}
              </span>
              <span className="text-slate-500 text-xs truncate">
                {selectedEvent.email}
              </span>
            </div>
          </div>
          <button onClick={clearSelection} className="text-slate-400 hover:text-red-500 transition-colors ml-2 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          className="p-3 bg-white border border-slate-300 rounded-lg shadow-sm cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-colors flex justify-between items-center"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="text-slate-500 text-sm">Select an Event</span>
          <FiChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </div>
      )}

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <input
              ref={searchInputRef}
              type="text"
              className="block w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by event name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Advanced Filters */}
          <div className="p-3 border-b border-slate-200 grid grid-cols-2 gap-2 bg-slate-50">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ID</label>
              <input
                type="text"
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Event ID"
                value={idFilter}
                onChange={(e) => setIdFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
              <select
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border-b border-red-200 text-red-600 text-xs">
              {error}
            </div>
          )}

          {/* Results List */}
          <div className="max-h-56 overflow-y-auto">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div
                  key={event.eventId}
                  className={`px-3 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0 flex items-center gap-3 ${
                    selectedEventId === event.eventId ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                  }`}
                  onClick={() => handleEventSelect(event)}
                >
                  <div className="bg-indigo-100 text-indigo-600 rounded-full p-1.5 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H3a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V6a1 1 0 00-1-1h-3a1 1 0 000-2h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-slate-800 font-semibold text-sm truncate">
                      {event.eventName}
                    </span>
                    <span className="text-slate-500 text-xs truncate">
                      ID: {event.eventId} | {event.email}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {event.isActive ? (
                        <span className="text-green-600 font-medium">● Active</span>
                      ) : (
                        <span className="text-red-600 font-medium">● Inactive</span>
                      )}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-6 text-slate-400 text-center text-sm italic">
                No matching events found
              </div>
            )}
          </div>

          {filteredEvents.length > 0 && (
            <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
              Showing {filteredEvents.length} of {events.length} events
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventListCompound;
