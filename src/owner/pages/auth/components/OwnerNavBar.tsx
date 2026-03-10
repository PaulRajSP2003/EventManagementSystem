import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useState, useEffect } from 'react';

export default function OwnerNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // State for user email to handle hydration or storage changes
  const [ownerEmail, setOwnerEmail] = useState('Owner');

  useEffect(() => {
    const email = localStorage.getItem('ownerEmail');
    if (email) setOwnerEmail(email);
  }, []);

  // FIX: Use strict matching or specific path checks to prevent multiple active tabs
  const isActive = (path: string) => {
    const current = location.pathname;
    // Check if the current path starts with the link path to handle sub-routes
    const active = current.startsWith(`/owner/${path}`);
    
    return active
      ? 'text-indigo-600 bg-white/60 shadow-[inset_0_0_0_1px_rgba(79,70,229,0.2)] font-semibold'
      : 'text-slate-500 hover:text-slate-900 hover:bg-white/40';
  };

  const handleLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    navigate('/owner/login');
  };

  const dropdownItems = {
    admin: [
      { label: 'View List', path: '/owner/admin' },
      { label: 'Add New', path: '/owner/admin/new' }
    ],
    events: [
      { label: 'View List', path: '/owner/event' },
      { label: 'Add New', path: '/owner/event/new' }
    ]
  };

  return (
    <nav className="bg-white/70 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Left: Brand + Navigation */}
          <div className="flex items-center gap-10 h-full">
            <Link
              to="/owner/dashboard"
              className="text-xl font-black tracking-tighter text-slate-900 group"
            >
              OWNER<span className="text-indigo-600 group-hover:animate-pulse">.</span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/owner/dashboard"
                className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 text-[14px] ${isActive('dashboard')}`}
              >
                Dashboard
              </Link>

              {/* Events Dropdown */}
              <div
                className="relative h-20 flex items-center"
                onMouseEnter={() => setOpenDropdown('events')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-[14px] ${isActive('event')}`}
                >
                  Events
                  <FiChevronDown className={`mt-0.5 transition-transform duration-300 ${openDropdown === 'events' ? 'rotate-180' : ''}`} />
                </button>
                
                {openDropdown === 'events' && (
                  <div className="absolute top-[70%] left-0 w-48 bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl shadow-indigo-100/50 rounded-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {dropdownItems.events.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setOpenDropdown(null)}
                        className="block px-5 py-2.5 text-sm text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Dropdown */}
              <div
                className="relative h-20 flex items-center"
                onMouseEnter={() => setOpenDropdown('admin')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-[14px] ${isActive('admin')}`}
                >
                  Admins
                  <FiChevronDown className={`mt-0.5 transition-transform duration-300 ${openDropdown === 'admin' ? 'rotate-180' : ''}`} />
                </button>
                
                {openDropdown === 'admin' && (
                  <div className="absolute top-[70%] left-0 w-48 bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl shadow-indigo-100/50 rounded-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {dropdownItems.admin.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setOpenDropdown(null)}
                        className="block px-5 py-2.5 text-sm text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: User + Logout */}
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Verified</p>
              <p className="text-sm font-semibold text-slate-700">{ownerEmail}</p>
            </div>

            <button
              onClick={handleLogout}
              className="group flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
            >
              <FiLogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}