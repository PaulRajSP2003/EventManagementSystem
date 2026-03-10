import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, X, Sun, Moon } from 'lucide-react';

// --- Sub-Components for 2D Animation ---

/**
 * Single Digit Reel: Handles directional sliding.
 * If increasing: New number comes from bottom (y: 100% -> 0), old exits top (0 -> -100%).
 * If decreasing: New number comes from top (y: -100% -> 0), old exits bottom (0 -> 100%).
 */
const Digit = ({ value, direction }: { value: string, direction: 'up' | 'down' }) => {
  const isUp = direction === 'up';

  return (
    <div className="relative overflow-hidden h-[1em] leading-none inline-block">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: isUp ? '100%' : '-100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: isUp ? '-100%' : '100%', opacity: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 120,
            damping: 30,
            mass: 1
          }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
      {/* Invisible ghost to maintain width/height ratio */}
      <span className="invisible select-none absolute" aria-hidden="true">8</span>
    </div>
  );
};

/**
 * Scrolling Number Wrapper: Detects direction by comparing current vs previous value.
 */
const RollingNumber = ({ value }: { value: number }) => {
  const prevValueRef = useRef(value);
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  useEffect(() => {
    if (value > prevValueRef.current) {
      setDirection('up');
    } else if (value < prevValueRef.current) {
      setDirection('down');
    }
    prevValueRef.current = value;
  }, [value]);

  const digits = Math.abs(value).toString().split('');
  
  return (
    <div className="flex items-center justify-center overflow-hidden tabular-nums -ml-1 first:-ml-0">
      {digits.map((digit, index) => (
        <div key={`${digits.length - index}`} className="inline-block">
          <Digit value={digit} direction={direction} />
        </div>
      ))}
    </div>
  );
};

// --- Main Modal Component ---

interface LiveCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance: {
    students: { present: number };
    leaders: { present: number };
  };
  isConnected: boolean;
}

const LiveCountModal: React.FC<LiveCountModalProps> = ({
  isOpen,
  onClose,
  attendance,
  isConnected
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-preference');
      return (saved as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme-preference', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === 'dark' ? 'light' : 'dark'));
  const isDark = theme === 'dark';

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveTimeString = currentTime.toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });

  const totalPresent = attendance.students.present + attendance.leaders.present;

  const [particlesKey, setParticlesKey] = useState(0);
  useEffect(() => {
    setParticlesKey((p) => p + 1);
  }, [totalPresent]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[70] flex flex-col min-h-screen overflow-y-auto transition-colors duration-500
        ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}
    >
      {/* Header Controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 flex items-center gap-3 z-20">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full transition-all border ${isDark 
            ? 'bg-slate-800 hover:bg-slate-700 text-yellow-300 border-slate-600' 
            : 'bg-white hover:bg-gray-100 text-amber-600 border-gray-300'}`}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={onClose}
          className={`p-3 rounded-full transition-all border ${isDark 
            ? 'bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700' 
            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'}`}
          aria-label="Close Modal"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 gap-12 max-w-7xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
              <Users className={`w-10 h-10 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div className="text-center sm:text-left">
              <h2 className={`text-4xl sm:text-6xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Live Attendance
              </h2>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                <span className={`text-xs font-bold uppercase tracking-widest ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                  {isConnected ? 'Connection Active' : 'Offline Mode'}
                </span>
              </div>
            </div>
          </div>

          <div className={`px-6 py-4 rounded-2xl border text-center sm:text-right ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-1 justify-center sm:justify-end">
              <span className={`text-lg font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{liveTimeString}</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">Local Time</p>
          </div>
        </div>

        {/* Hero Card: Grand Total */}
        <div className={`w-full max-w-5xl p-12 sm:p-20 rounded-[3rem] border relative overflow-hidden transition-colors duration-500
          ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
          
          <div className="relative z-10 text-center">
            <p className={`text-sm sm:text-lg font-black uppercase tracking-[0.5em] mb-8 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              Grand Total Present
            </p>

            <div className={`text-[10rem] sm:text-[14rem] md:text-[18rem] font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <RollingNumber value={totalPresent} />
            </div>

            {/* Particle Burst */}
            <AnimatePresence>
              <div key={particlesKey} className="absolute inset-0 pointer-events-none">
                {isDark && Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-indigo-400 rounded-full"
                    initial={{ x: '50%', y: '50%', scale: 0 }}
                    animate={{ 
                      x: `${50 + (Math.random() - 0.5) * 120}%`, 
                      y: `${50 + (Math.random() - 0.5) * 120}%`, 
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0] 
                    }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: Math.random() * 0.2 }}
                  />
                ))}
              </div>
            </AnimatePresence>
          </div>
          
          {isDark && (
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
          )}
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-5xl">
          <BreakdownCard 
            label="Students" 
            count={attendance.students.present} 
            icon={<Users className="w-8 h-8" />}
            colorClass={isDark ? "text-blue-400" : "text-blue-600"}
            isDark={isDark}
          />
          <BreakdownCard 
            label="Leaders" 
            count={attendance.leaders.present} 
            icon={<Crown className="w-8 h-8" />}
            colorClass={isDark ? "text-purple-400" : "text-purple-600"}
            isDark={isDark}
          />
        </div>

        {/* Footer info */}
        <div className={`px-6 py-3 rounded-full border flex items-center gap-3 text-xs font-bold tracking-widest uppercase
          ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-slate-500'}`}>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          LIVE DATA
        </div>
      </div>
    </motion.div>
  );
};

const BreakdownCard = ({ label, count, icon, colorClass, isDark }: any) => (
  <div className={`p-10 rounded-[2.5rem] border text-center transition-all ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
    <div className={`inline-flex p-4 rounded-2xl mb-6 ${isDark ? 'bg-slate-800' : 'bg-slate-50'} ${colorClass}`}>
      {icon}
    </div>
    <p className={`text-xs font-black uppercase tracking-widest mb-2 opacity-60 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
    <div className={`text-6xl sm:text-8xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <RollingNumber value={count} />
    </div>
  </div>
);

export default LiveCountModal;