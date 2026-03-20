// src/owner/pages/event/EventDetails.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiEdit, 
  FiCalendar, 
  FiMail, 
  FiPhone, 
  FiFileText, 
  FiMapPin,
  FiInfo,
  FiCopy,
  FiCheck
} from 'react-icons/fi';
import { eventAPI } from '../../api/EventData';
import type { Event } from '../../../types';
import OwnerLayout from '../components/OwnerLayout';
import StickyHeader from '../components/StickyHeader';

const EventDetailsSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6 animate-pulse">
    <div className="h-64 bg-slate-200 rounded-2xl shadow-sm border border-slate-200"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm h-28"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm h-64"></div>
      <div className="bg-slate-100 rounded-xl border border-slate-200 h-64"></div>
    </div>
  </div>
);

export default function EventDetails() {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!paramId) {
      setError('No event ID in URL');
      setLoading(false);
      return;
    }
    const numericId = Number(paramId);
    if (isNaN(numericId)) {
      setError('Invalid event ID');
      setLoading(false);
      return;
    }
    loadEvent(numericId);
  }, [paramId]);

  const loadEvent = async (eventId: number) => {
    try {
      setLoading(true);
      setError('');
      await new Promise(res => setTimeout(res, 600));
      const data = await eventAPI.getById(eventId);
      if (data) {
        setEvent(data);
      } else {
        setError('Event not found');
      }
    } catch (err: any) {
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const calculateDuration = (from?: string, to?: string) => {
    if (!from || !to) return '—';
    const start = new Date(from);
    const end = new Date(to);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${diff} day${diff !== 1 ? 's' : ''}`;
  };

  return (
    <OwnerLayout>
      <div className="min-h-screen bg-slate-50 pb-12">
        <StickyHeader 
          title="Event Details"
          onBack={() => navigate(-1)}
        >
          <button
            disabled={loading || !!error}
            onClick={() => navigate(`/owner/event/edit/${event?.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition text-sm font-medium shadow-sm disabled:opacity-50"
          >
            <FiEdit /> Edit Event
          </button>
        </StickyHeader>

        {loading ? (
          <EventDetailsSkeleton />
        ) : error || !event ? (
          <div className="max-w-6xl mx-auto px-4 mt-8">
            <div className="lg:max-w-4xl mx-auto p-8 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
              <FiInfo className="mx-auto w-12 h-12 mb-4 opacity-50" />
              <h2 className="text-xl font-bold mb-2">Notice</h2>
              <p>{error || 'Event could not be found'}</p>
              <button
                onClick={() => navigate('/owner/event')}
                className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition"
              >
                Return to List
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-2xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase border ${
                      event.isActive 
                      ? 'bg-emerald-400/20 border-emerald-400/30 text-emerald-200' 
                      : 'bg-slate-400/20 border-slate-400/30 text-slate-300'
                    }`}>
                      {event.isActive ? '● Active' : '○ Inactive'}
                    </span>
                    <span className="text-indigo-200 text-xs sm:text-sm font-medium flex items-center gap-1 capitalize">
                      <FiMapPin size={14} /> {event.location}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black mb-3 sm:mb-4 tracking-tight leading-tight capitalize">
                    {event.eventName}
                  </h1>
                  <p className="text-indigo-100 text-sm sm:text-lg max-w-2xl leading-relaxed opacity-90 capitalize">
                    {event.eventDescription || 'No description provided for this event.'}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center w-full sm:w-auto sm:min-w-[140px]">
                  <div className="text-[10px] sm:text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Entry ID</div>
                  <div className="text-2xl sm:text-4xl font-black tracking-tighter">#{event.id}</div>
                </div>
              </div>
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Start Date */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                    <FiCalendar size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{formatDate(event.from)}</p>
                  </div>
                </div>
              </div>

              {/* End Date */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-lg bg-purple-100 text-purple-600 flex-shrink-0">
                    <FiCalendar size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{formatDate(event.to)}</p>
                  </div>
                </div>
              </div>

              {/* Email with Copy Action */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group/card relative">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-lg bg-emerald-100 text-emerald-600 flex-shrink-0">
                    <FiMail size={18} />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-bold text-slate-800 truncate lowercase">{event.email || '—'}</p>
                  </div>
                  {event.email && (
                    <button 
                      onClick={() => handleCopyEmail(event.email!)}
                      className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-emerald-600 transition-all active:scale-90"
                      title="Copy Email"
                    >
                      {copied ? <FiCheck size={14} className="text-emerald-600" /> : <FiCopy size={14} />}
                    </button>
                  )}
                </div>
                {copied && (
                  <span className="absolute -top-2 right-4 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm animate-bounce">
                    Copied!
                  </span>
                )}
              </div>

              {/* Phone */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-lg bg-orange-100 text-orange-600 flex-shrink-0">
                    <FiPhone size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{event.phoneNumber || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <FiFileText className="text-slate-400 w-6 h-6" />
                    <h2 className="text-xl font-bold text-slate-800">Full Description</h2>
                  </div>
                  <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {event.eventDescription || 'No further details available.'}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-100 rounded-xl border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                    Logistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Duration:</span>
                      <span className="font-bold text-slate-700">{calculateDuration(event.from, event.to)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Location:</span>
                      <span className="font-bold text-slate-700">{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
