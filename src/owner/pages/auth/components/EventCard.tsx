import type { Event } from '../../../../types';
import { Link } from 'react-router-dom';

interface EventCardProps {
  event: Event;
  onDelete?: (eventId: number) => void;
}

export default function EventCard({ event, onDelete }: EventCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{event.eventName}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          event.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-slate-100 text-slate-800'
        }`}>
          {event.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.eventDescription}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-slate-700">
          <span className="font-medium w-20 text-sm">Dates:</span>
          <span className="text-sm">{formatDate(event.from)} - {formatDate(event.to)}</span>
        </div>
        <div className="flex items-center text-slate-700">
          <span className="font-medium w-20 text-sm">Email:</span>
          <span className="text-sm">{event.email}</span>
        </div>
        <div className="flex items-center text-slate-700">
          <span className="font-medium w-20 text-sm">Phone:</span>
          <span className="text-sm">{event.phoneNumber}</span>
        </div>
        {event.eventId && (
          <div className="flex items-center text-slate-700">
            <span className="font-medium w-20 text-sm">Event ID:</span>
            <span className="text-sm">{event.eventId}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Link
          to={`/owner/event/${event.eventId}`}
          className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-center text-sm font-medium"
        >
          View Details
        </Link>
        <Link
          to={`/owner/event/edit/${event.eventId}`}
          className="flex-1 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-center text-sm font-medium"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete?.(event.eventId || 0)}
          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
