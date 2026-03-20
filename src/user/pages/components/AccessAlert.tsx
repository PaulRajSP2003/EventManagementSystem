import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiChevronLeft } from 'react-icons/fi';

interface AccessAlertProps {
  message?: string;
}

const AccessAlert: React.FC<AccessAlertProps> = ({ message }) => {
  const navigate = useNavigate();
  return (
    /* Ensuring z-index (z-0) stays below NavBar (z-50) 
       as per your existing layout logic.
    */
    <div className="fixed inset-0 z-0 flex items-center justify-center px-4 pointer-events-none font-sans">

      <div className="relative w-full max-w-md pointer-events-auto">

        {/* Glassmorphic Card - Updated to White/Indigo Palette */}
        <div className="relative bg-white/80 dark:bg-gray-800/90 backdrop-blur-3xl border border-white/50 dark:border-gray-700 p-10 rounded-[3rem] shadow-[0_32px_64px_-20px_rgba(79,70,229,0.15)] text-center overflow-hidden">

          {/* Subtle Indigo Glow to match the Event System Branding */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-indigo-500/5 pointer-events-none"></div>

          {/* Icon Section - Using your primary Indigo theme */}
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-200 dark:shadow-indigo-900/20">
            <FiLock className="text-white" size={32} />
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            Restricted Access
          </h2>

          <div className="px-2">
            <p className="text-slate-600 dark:text-gray-400 text-[16px] leading-relaxed font-medium italic">
              {message || `This section is restricted based on your current administrative permissions.`}
            </p>
          </div>

          {/* Action Button - Styled to match your NavBar's Indigo brand */}
          <button
            onClick={() => navigate('/user/dashboard', { replace: true })}
            className="mt-10 w-full py-4 bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-300 rounded-2xl text-[16px] font-bold shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2 group"
          >
            <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
            Return to Dashboard
          </button>

          {/* Status Indicator - Indigo Pulsing */}
          <div className="mt-8 flex justify-center items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <p className="text-slate-400 dark:text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold">
              System Permission Gate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessAlert;
