import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiLogOut, FiChevronDown, FiUserPlus, FiX, FiMail, FiLock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/AuthAPI';

export default function OwnerNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { ownerEmail, logout } = useAuth();

  // Add Owner modal state
  const [showAddOwnerModal, setShowAddOwnerModal] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ email: '', password: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isActive = (path: string) => {
    const current = location.pathname;
    const isActivePath = current.startsWith(`/owner/${path}`);

    return isActivePath
      ? 'text-indigo-700 font-semibold'
      : 'text-slate-600 hover:text-slate-900';
  };

  const handleLogout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch { }
    logout();
    navigate('/owner/login');
  };

  const handleOpenModal = () => {
    setOwnerForm({ email: '', password: '' });
    setFormStatus(null);
    setShowAddOwnerModal(true);
  };

  const handleCloseModal = () => {
    if (formLoading) return;
    setShowAddOwnerModal(false);
    setFormStatus(null);
    setOwnerForm({ email: '', password: '' });
  };

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormStatus(null);
    try {
      const result = await authAPI.registerOwner(ownerForm);
      setFormStatus({ type: 'success', message: result.message });
      setOwnerForm({ email: '', password: '' });
    } catch (err) {
      setFormStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Registration failed',
      });
    } finally {
      setFormLoading(false);
    }
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
    <>
      <nav className="bg-white/70 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center h-20">

            {/* Left: Brand + Navigation */}
            <div className="flex items-center gap-10 h-full">
              <Link
                to="/owner/dashboard"
                className="text-xl font-black tracking-tighter text-slate-900 group"
              >
                OWNER
              </Link>

              <div className="hidden md:flex items-center gap-2">
                {/* Dashboard */}
                <Link
                  to="/owner/dashboard"
                  className={`flex items-center px-4 py-2 rounded-xl transition-colors duration-200 text-[14px] ${isActive('dashboard')}`}
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-200 text-[14px] ${isActive('event')}`}
                  >
                    Events
                    <FiChevronDown
                      className={`mt-0.5 transition-transform duration-300 ${openDropdown === 'events' ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {openDropdown === 'events' && (
                    <div className="absolute top-[70%] left-0 w-48 bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors duration-200 text-[14px] ${isActive('admin')}`}
                  >
                    Admins
                    <FiChevronDown
                      className={`mt-0.5 transition-transform duration-300 ${openDropdown === 'admin' ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {openDropdown === 'admin' && (
                    <div className="absolute top-[70%] left-0 w-48 bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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

                {/* Owner - Clickable label that opens modal */}
                <button
                  onClick={handleOpenModal}
                  className="flex items-center px-4 py-2 rounded-xl transition-colors duration-200 text-[14px] text-slate-600 hover:text-slate-900"
                >
                  Owner
                </button>
              </div>
            </div>

            {/* Right: Add Owner + User info + Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Verified</p>
                <p className="text-sm font-semibold text-slate-700">{ownerEmail}</p>
              </div>

              <button
                onClick={handleLogout}
                className="group flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95"
              >
                <FiLogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Logout</span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Add Owner Modal */}
      {showAddOwnerModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header - Blue gradient */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-7 pt-7 pb-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
                    <FiUserPlus size={22} className="text-white" />
                  </div>
                  <h2 className="text-xl font-black text-white">Add New Owner</h2>
                  <p className="text-blue-100 text-sm mt-0.5">Register a new owner account</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  disabled={formLoading}
                  className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors disabled:opacity-50"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddOwner} className="px-7 py-6 space-y-5">

              {/* Email Field - Blue focus ring */}
              <div>
                <label htmlFor="owner-email" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="owner-email"
                    type="email"
                    required
                    value={ownerForm.email}
                    onChange={(e) => setOwnerForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                    disabled={formLoading}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password Field - Blue focus ring */}
              <div>
                <label htmlFor="owner-password" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="owner-password"
                    type="password"
                    required
                    value={ownerForm.password}
                    onChange={(e) => setOwnerForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    disabled={formLoading}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Status Message */}
              {formStatus && (
                <div
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium ${formStatus.type === 'success'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                >
                  {formStatus.type === 'success'
                    ? <FiCheckCircle size={17} className="mt-0.5 shrink-0" />
                    : <FiAlertCircle size={17} className="mt-0.5 shrink-0" />
                  }
                  <span>{formStatus.message}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={formLoading}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Registering…
                    </>
                  ) : (
                    <>
                      <FiUserPlus size={15} />
                      Register Owner
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}