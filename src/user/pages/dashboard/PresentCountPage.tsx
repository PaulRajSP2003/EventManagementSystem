import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, X, Sun, Moon } from 'lucide-react';

// --- Sub-Components for 2D Animation ---

/**
 * Single Digit Reel: Handles directional sliding.
 * If increasing: New number comes from bottom (y: 100% -> 0), old exits top (0 -> -100%).
 * If decreasing: New number comes from top (y: -100% -> 0), old exits bottom (0 -> 100%).
 */
const Digit = ({ value, direction }: { value: string; direction: 'up' | 'down' }) => {
  return (
    <div className="relative h-[1em] w-[0.6em] sm:w-[0.72em] overflow-hidden tabular-nums font-black">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          custom={direction}
          variants={{
            enter: (d) => ({
              y: d === 'up' ? '100%' : '-100%',
              opacity: 0.8
            }),
            center: {
              y: '0%',
              opacity: 1
            },
            exit: (d) => ({
              y: d === 'up' ? '-100%' : '100%',
              opacity: 0
            })
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: 0.4,
            ease: [0.32, 0.72, 0, 1] // Custom easing for smoother motion
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

/**
 * Scrolling Number Wrapper: Detects direction and renders digits.
 */
const RollingNumber = ({ value }: { value: number }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle value changes

  useEffect(() => {
    if (value !== prevValue) {
      // Set direction based on comparison
      setDirection(value > prevValue ? 'down' : 'up');
      setPrevValue(value);

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [value, prevValue]);

  // Format with commas and split into characters
  const formattedValue = Math.abs(value).toLocaleString();
  const chars = formattedValue.split('');

  return (
    <div className="flex items-center justify-center tabular-nums font-black">
      {chars.map((char, index) => {
        if (char === ',') {
          return (
            <span key={`comma-${index}`} className="opacity-40 px-0.5" style={{ fontSize: '0.5em' }}>
              {char}
            </span>
          );
        }

        // Create a stable key based on position and value
        const positionFromRight = chars.filter((c, i) => i > index && c !== ',').length;

        return (
          <div key={`digit-${positionFromRight}`} className="relative h-full flex items-center">
            <Digit value={char} direction={direction} />
          </div>
        );
      })}
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
      transition={{ duration: 0.3 }}
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
                  {isConnected ? 'Online' : 'Offline'}
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
            <AnimatePresence mode="wait">
              {isDark && (
                <motion.div
                  key={particlesKey}
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-indigo-400 rounded-full"
                      initial={{
                        x: '50%',
                        y: '50%',
                        scale: 0,
                        opacity: 0
                      }}
                      animate={{
                        x: `${50 + (Math.random() - 0.5) * 120}%`,
                        y: `${50 + (Math.random() - 0.5) * 120}%`,
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 1.2,
                        ease: "easeOut",
                        delay: Math.random() * 0.3
                      }}
                    />
                  ))}
                </motion.div>
              )}
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
        <motion.div
          className={`px-6 py-3 rounded-full border flex items-center gap-3 text-xs font-bold tracking-widest uppercase
            ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-slate-500'}`}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          LIVE DATA
        </motion.div>
      </div>
    </motion.div>
  );
};

const BreakdownCard = ({ label, count, icon, colorClass, isDark }: any) => (
  <motion.div
    className={`p-10 rounded-[2.5rem] border text-center transition-all ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
  >
    <div className={`inline-flex p-4 rounded-2xl mb-6 ${isDark ? 'bg-slate-800' : 'bg-slate-50'} ${colorClass}`}>
      {icon}
    </div>
    <p className={`text-xs font-black uppercase tracking-widest mb-2 opacity-60 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
    <div className={`text-6xl sm:text-8xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <RollingNumber value={count} />
    </div>
  </motion.div>
);

export default LiveCountModal;