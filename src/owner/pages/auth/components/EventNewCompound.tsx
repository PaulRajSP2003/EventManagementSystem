import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiCalendar, FiPhone, 
  FiFileText, FiGlobe, FiCheckCircle,
  FiZap, FiShield
} from 'react-icons/fi';
import { eventAPI } from '../../../api/EventData';
import type { Event } from '../../../../types';

export default function EventCreateModern() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  const [eventId, setEventId] = useState<number | null>(null);

  const initialFormState: Event = {
    id: 0,
    eventName: '',
    eventDescription: '',
    email: '',
    phoneNumber: '',
    location: '',
    from: '',
    to: '',
    isActive: true
  };

  const [formData, setFormData] = useState<Event>(initialFormState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await eventAPI.create(formData);
      setEventId(response.eventId || 0);
      setShowSuccessActions(true);
    } catch (err) {
      // Handle error if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm"
          >
            <FiArrowLeft /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Drafting Mode</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Guidance & Stats */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
              <FiZap className="absolute -right-4 -top-4 text-white/10 w-32 h-32 rotate-12" />
              <h1 className="text-3xl font-bold leading-tight relative z-10">Create a New Event</h1>
              <p className="mt-4 text-indigo-200 text-sm leading-relaxed relative z-10">
                Create a new event by filling in the required details
              </p>
              
              <div className="mt-8 space-y-4 relative z-10">
                <div className="flex items-center gap-3 text-sm bg-white/10 p-3 rounded-xl backdrop-blur-md">
                  <FiShield className="text-indigo-300" />
                  <span>Camp Handling</span>
                </div>
                <div className="flex items-center gap-3 text-sm bg-white/10 p-3 rounded-xl backdrop-blur-md">
                  <FiGlobe className="text-indigo-300" />
                  <span>Global Reach Enabled</span>
                </div>
              </div>
            </div>

            {/* Quick Tips Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h4 className="font-bold text-slate-800 text-sm mb-4">Pro Tips</h4>
              <ul className="space-y-3">
                <li className="flex gap-3 text-xs text-slate-500 italic">
                  <span className="text-indigo-500 font-bold">01</span>
                  Give your event a title that clearly explains what it’s about.
                </li>
                <li className="flex gap-3 text-xs text-slate-500 italic">
                  <span className="text-indigo-500 font-bold">02</span>
                  Add a clear, purpose-driven event title.
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: The Form */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 md:p-10 space-y-8">
                
                {/* Section: Identity */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FiFileText size={16}/>
                    </div>
                    General Information
                  </h3>
                  <div className="grid gap-6">
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Event Name</label>
                      <input
                        type="text"
                        name="eventName"
                        required
                        value={formData.eventName}
                        autoComplete='off'
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-slate-700"
                        placeholder="Camp Name Here"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Description</label>
                      <textarea
                        name="eventDescription"
                        required
                        rows={4}
                        value={formData.eventDescription}
                         autoComplete='off'
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-slate-700 resize-none"
                        placeholder="Tell about it..."
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-slate-50" />

                {/* Section: Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <FiCalendar size={16}/>
                      </div>
                      Schedule
                    </h3>
                    <div className="space-y-4">
                      <input
                        type="date"
                        name="from"
                        value={formData.from}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all outline-none text-sm"
                      />
                      <input
                        type="date"
                        name="to"
                        value={formData.to}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all outline-none text-sm"
                      />
                    </div>
                   </div>

                   <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <FiPhone size={16}/>
                      </div>
                      Contact
                    </h3>
                    <div className="space-y-4">
                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                         autoComplete='off'
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-sm"
                      />
                      <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="Phone Number"
                        onChange={handleInputChange}
                         autoComplete='off'
                        className="w-full px-5 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-sm"
                      />
                    </div>
                   </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </div>
                  <span className="text-sm font-bold text-slate-600">Public Visibility</span>
                </label>

                <div className="flex gap-4">
                  {showSuccessActions ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/owner/event/${eventId}`)}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all"
                    >
                      <FiCheckCircle /> View Event
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Processing...' : 'Save & Publish'}
                      <FiSave />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}