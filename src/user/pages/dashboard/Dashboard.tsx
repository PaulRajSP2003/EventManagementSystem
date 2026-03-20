import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  BedDouble,
  UserCheck,
  TrendingUp,
  Clock,
  Activity,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  PieChart,
  GraduationCap,
  Home,
  Crown,
  Venus,
  Mars,
  Timer,
} from 'lucide-react';
import LiveCountModal from './PresentCountPage';
import { fetchDashboardData, type DashboardData } from './DashboardApi';
import { motion, AnimatePresence } from 'framer-motion';
import signalRService from '../../Services/signalRService';
import { decryptData } from '../../utils/encryption';
import { fetchPermissionData } from '../permission';
import { useSignalR } from '../../context/SignalRContext';
import { StickyHeader } from '../components';

// --- Scrolling Number Animation Component (same as in LiveCountModal) ---

/**
 * Single Digit Reel: Handles the vertical sliding of a single number (0-9).
 */
const Digit = ({ value }: { value: string }) => {
  return (
    <span className="relative overflow-hidden h-[1em] leading-none" style={{ display: 'inline-block', width: 'auto' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 40,
            mass: 1.2
          }}
          className="inline-block"
          style={{ display: 'inline-block' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/**
 * Scrolling Number Wrapper: Breaks a number into digits and renders Reels with NO gaps.
 */
const RollingNumber = ({ value }: { value: number }) => {
  const digits = Math.abs(value).toString().split('');

  return (
    <span className="inline-flex items-center justify-start tabular-nums" style={{ gap: 0, letterSpacing: 'normal' }}>
      {digits.map((digit, index) => (
        <Digit key={`${digits.length - index}-${index}`} value={digit} />
      ))}
    </span>
  );
};

// --- Dashboard Component ---

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'groups'>('overview');
  const [showDetails, setShowDetails] = useState(true);
  const { isConnected } = useSignalR();
  const [eventId, setEventId] = useState<number>();
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const loadEventId = async () => {
      try {
        const permissionData = await fetchPermissionData();
        if (permissionData) {
          setEventId(permissionData.eventId);
        }
      } catch (error) {
        console.error('Failed to load permission data:', error);
      }
    };
    loadEventId();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const calculatePercentage = (value: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  const calculateAttendanceRate = (present: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((present / total) * 100)}%`;
  };

  const calculateStayingRate = (staying: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((staying / total) * 100)}%`;
  };

  const getStatusColor = (rate: string) => {
    const value = parseFloat(rate);
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };


  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {

    const handleNotification = (notification: any) => {
      if (notification.dashboard && data) {
        setData(prevData => {
          if (!prevData) return prevData;
          const newData = JSON.parse(JSON.stringify(prevData));

          if (notification.dashboard.student) {
            newData.dashboard.attendance.students.present = notification.dashboard.student.present ?? newData.dashboard.attendance.students.present;
            newData.dashboard.attendance.students.absent = notification.dashboard.student.absent ?? newData.dashboard.attendance.students.absent;
            newData.dashboard.attendance.students.registered = notification.dashboard.student.registered ?? newData.dashboard.attendance.students.registered;
          }

          if (notification.dashboard.leader) {
            newData.dashboard.attendance.leaders.present = notification.dashboard.leader.present ?? newData.dashboard.attendance.leaders.present;
            newData.dashboard.attendance.leaders.absent = notification.dashboard.leader.absent ?? newData.dashboard.attendance.leaders.absent;
            newData.dashboard.attendance.leaders.registered = notification.dashboard.leader.registered ?? newData.dashboard.attendance.leaders.registered;
          }

          newData.dashboard.attendance.overall.present = notification.dashboard.present ?? newData.dashboard.attendance.overall.present;
          newData.dashboard.attendance.overall.absent = notification.dashboard.absent ?? newData.dashboard.attendance.overall.absent;
          newData.dashboard.attendance.overall.registered = notification.dashboard.registered ?? newData.dashboard.attendance.overall.registered;
          newData.dashboard.attendance.overall.totalParticipants = notification.dashboard.total ?? newData.dashboard.attendance.overall.totalParticipants;

          setLastUpdated(new Date());
          return newData;
        });
      }
    };

    signalRService.onNotification(handleNotification);

    return () => {
      signalRService.removeNotificationCallback(handleNotification);
    };
  }, [eventId, data]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const storedData = localStorage.getItem('login-data');
      const decrypted = decryptData<{ token: string }>(storedData);
      const token = decrypted?.token || '';

      const dashboardData = await fetchDashboardData(token);
      setData(dashboardData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <StickyHeader title="Event Dashboard" showBack={false}>
          <div className="flex items-center gap-3">
            {/* LIVE COUNT BUTTON Skeleton */}
            <motion.div className="hidden sm:flex">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600/50 to-emerald-600/50 text-white/70 rounded-lg text-sm font-medium shadow-sm relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Users className="w-4 h-4 opacity-70" />
                  <span className="hidden sm:inline">Live Count</span>
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400/50 rounded-full" />
                </span>
              </motion.button>
            </motion.div>

            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 border border-indigo-200/50 bg-indigo-50/50 text-indigo-700/50 rounded-lg text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              Show
            </button>

            <div className="flex items-center gap-2 bg-slate-100/50 rounded-lg p-1">
              {(['overview', 'attendance', 'groups'] as const).map((tab) => (
                <button
                  key={tab}
                  disabled
                  className="px-4 py-2 rounded-lg text-sm font-medium capitalize text-slate-400"
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </StickyHeader>

        {/* Mobile Tab Switcher Skeleton */}
        <div className="sm:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
          <div className="bg-slate-100/50 p-1 rounded-xl flex items-center">
            {(['overview', 'attendance', 'groups'] as const).map((tab) => (
              <div key={tab} className="flex-1 py-1.5 rounded-lg">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-3 h-3 bg-slate-200 rounded-full animate-pulse" />
                  <div className="w-10 h-2 bg-slate-200 rounded animate-pulse mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 animate-pulse">
          {/* Event Info Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/50 rounded-2xl border border-gray-100/50 p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                    <div className="h-8 w-32 bg-slate-200 rounded" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                </div>
                <div className="h-4 w-40 bg-slate-200 rounded" />
              </div>
            ))}
          </div>

          {/* Attendance Section Skeleton - Three Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/50 rounded-2xl border border-gray-100/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200" />
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-slate-200 rounded" />
                      <div className="h-4 w-24 bg-slate-200 rounded" />
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                      <div className="h-8 w-16 bg-slate-200 rounded" />
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                      <div className="h-8 w-16 bg-slate-200 rounded ml-auto" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="bg-slate-100/50 rounded-xl p-3 space-y-2">
                        <div className="h-4 w-full bg-slate-200 rounded" />
                        <div className="h-6 w-12 bg-slate-200 rounded mx-auto" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded" />
                    <div className="h-2.5 bg-slate-200 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overview Extras Skeleton - Three Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Accommodation Skeleton */}
            <div className="bg-white/50 rounded-2xl border border-gray-100/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-5 w-28 bg-slate-200 rounded" />
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                    <div className="h-8 w-16 bg-slate-200 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-slate-200 rounded" />
                    <div className="h-8 w-16 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Skeleton */}
            <div className="bg-white/50 rounded-2xl border border-gray-100/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-5 w-24 bg-slate-200 rounded" />
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="h-16 bg-slate-100/50 rounded-xl" />
                  <div className="h-16 bg-slate-100/50 rounded-xl" />
                </div>
                <div className="h-4 bg-slate-200 rounded-full" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-12 bg-slate-100/50 rounded-lg" />
                  <div className="h-12 bg-slate-100/50 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Gender Distribution Skeleton */}
            <div className="bg-white/50 rounded-2xl border border-gray-100/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-5 w-36 bg-slate-200 rounded" />
                    <div className="h-4 w-40 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-20 h-20 bg-slate-200 rounded-full" />
                  <div className="w-8 h-8 bg-slate-200 rounded-full" />
                  <div className="w-20 h-20 bg-slate-200 rounded-full" />
                </div>
                <div className="h-4 bg-slate-200 rounded-full" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-24 bg-slate-100/50 rounded-xl" />
                  <div className="h-24 bg-slate-100/50 rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Section Groups Skeleton */}
          <div className="bg-white/50 rounded-2xl border border-gray-100/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="border border-gray-100/50 rounded-xl p-4 bg-white/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-6 bg-slate-200 rounded" />
                        <div className="h-5 w-20 bg-slate-200 rounded" />
                      </div>
                      <div className="h-6 w-16 bg-slate-200 rounded-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="text-center space-y-1">
                          <div className="h-3 w-12 bg-slate-200 rounded mx-auto" />
                          <div className="h-6 w-8 bg-slate-200 rounded mx-auto" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 w-20 bg-slate-200 rounded" />
                      <div className="h-2.5 bg-slate-200 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Info Skeleton */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 py-4">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="hidden sm:block h-4 w-2 bg-slate-200 rounded" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-200 rounded-full" />
              <div className="h-4 w-12 bg-slate-200 rounded" />
            </div>
            <div className="hidden sm:block h-4 w-2 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full text-center border border-gray-100 p-8">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load dashboard data'}</p>
          <button
            onClick={handleRefresh}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  interface CountdownTimerProps {
    endDate: string;
    startDate: string;
  }

  const CountdownTimer: React.FC<CountdownTimerProps> = ({ endDate, startDate }) => {
    const [timeLeft, setTimeLeft] = useState({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    });

    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    useEffect(() => {
      setTimeLeft(calculateTimeLeft());

      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);

      return () => clearInterval(timer);
    }, [endDate]);

    const { days, hours, minutes } = timeLeft;

    const start = new Date(startDate).getTime();
    const now = new Date().getTime();

    if (now < start) {
      const daysToStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
      return (
        <span className="text-xl font-bold text-blue-600">
          Starts in {daysToStart} {daysToStart === 1 ? 'day' : 'days'}
        </span>
      );
    }

    if (days > 0 || hours > 0 || minutes > 0) {
      return (
        <div className="flex items-center gap-1 text-2xl font-bold text-slate-800">
          {days > 0 && (
            <>
              <span>{days}</span>
              <span className="text-sm text-slate-400 mr-1">d</span>
            </>
          )}
          <span>{hours.toString().padStart(2, '0')}</span>
          <span className="text-sm text-slate-400">h</span>
          <span>{minutes.toString().padStart(2, '0')}</span>
          <span className="text-sm text-slate-400">m</span>
        </div>
      );
    }

    return null;
  };

  const { dashboard } = data;
  const { eventInfo, summary, attendance, stayingStatus, genderDistribution, sectionGroups, registrationMode } = dashboard;

  const studentAttendanceRate = calculateAttendanceRate(attendance.students.present, summary.totalStudents);
  const leaderAttendanceRate = calculateAttendanceRate(attendance.leaders.present, summary.totalLeaders);
  const overallAttendanceRate = calculateAttendanceRate(attendance.overall.present, attendance.overall.totalParticipants);
  const overallStayingRate = calculateStayingRate(stayingStatus.overall.totalStaying, stayingStatus.overall.totalStaying + stayingStatus.overall.totalNotStaying);
  const malePercentage = calculatePercentage(genderDistribution.total.male, genderDistribution.total.male + genderDistribution.total.female);
  const femalePercentage = calculatePercentage(genderDistribution.total.female, genderDistribution.total.male + genderDistribution.total.female);
  const onlinePercentage = calculatePercentage(registrationMode.online, registrationMode.online + registrationMode.offline);
  const offlinePercentage = calculatePercentage(registrationMode.offline, registrationMode.online + registrationMode.offline);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <StickyHeader title="Event Dashboard" showBack={false}>
        <div className="flex items-center gap-3">
          {/* LIVE COUNT BUTTON */}
          <motion.div className="hidden sm:flex">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowLiveModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-sm relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Live Count</span>
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full"
                />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.button>
          </motion.div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showDetails ? 'Hide' : 'Show'}
          </button>

          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            {(['overview', 'attendance', 'groups'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${activeTab === tab
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </StickyHeader>

      {/* Mobile Tab Switcher (Premium Header Style) */}
      <div className="sm:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner relative">
          {/* Animated active indicator */}
          <motion.div
            className="absolute h-[calc(100%-8px)] rounded-lg bg-white shadow-sm ring-1 ring-slate-200/50"
            initial={false}
            animate={{
              width: "calc(33.33% - 4px)",
              left: activeTab === 'overview' ? '4px' : activeTab === 'attendance' ? '33.33%' : '66.66%',
            }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
          />

          {(['overview', 'attendance', 'groups'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all duration-300 relative z-10 ${activeTab === tab
                ? 'text-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <div className="flex flex-col items-center gap-0.5">
                {tab === 'overview' && <Home className="w-3 h-3" />}
                {tab === 'attendance' && <UserCheck className="w-3 h-3" />}
                {tab === 'groups' && <Users className="w-3 h-3" />}
                <span>{tab}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Event Info Cards - Only in Overview on Mobile */}
        {(!isMobile || activeTab === 'overview') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Event Duration Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4" /> Event Duration
                  </p>
                  <p className="text-2xl font-bold text-slate-800 tracking-tight">{eventInfo.duration}</p>
                </div>
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm"
                >
                  <Calendar className="w-6 h-6 text-blue-600" />
                </motion.div>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {formatDate(eventInfo.startDate)} - {formatDate(eventInfo.endDate)}
              </p>
            </motion.div>

            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-full"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                    <Timer className="w-4 h-4" /> Status
                  </p>
                  {eventInfo.daysRemaining > 0 ? (
                    <div className="text-2xl font-bold text-slate-800 tracking-tight">
                      <CountdownTimer endDate={eventInfo.endDate} startDate={eventInfo.startDate} />
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-red-500">Event Ended</span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded w-fit">Completed</span>
                    </div>
                  )}
                </div>
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className={`w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm ${eventInfo.daysRemaining > 0 ? 'from-yellow-100 to-yellow-200' : 'from-red-100 to-red-200'
                    }`}
                >
                  {eventInfo.daysRemaining > 0 ? (
                    <Clock className="w-6 h-6 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-red-600" />
                  )}
                </motion.div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                  <span>Day {eventInfo.currentDay}</span>
                  <span>{eventInfo.progress}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: eventInfo.progress }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className={`h-full rounded-full ${eventInfo.daysRemaining > 0 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                  />
                </div>
              </div>
            </motion.div>

            {/* Stayers Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-full"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                    <Home className="w-4 h-4" /> Stayers
                  </p>
                  <div className="text-2xl font-bold text-slate-800 tracking-tight">
                    <RollingNumber value={(stayingStatus?.students?.staying || 0) + (stayingStatus?.leaders?.staying || 0)} />
                  </div>
                </div>
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-sm"
                >
                  <Home className="w-6 h-6 text-green-600" />
                </motion.div>
              </div>

              <div>
                {/* Changed from <p> to <div> */}
                <div className="text-xs text-slate-500 mb-3">
                  <span className="text-blue-600 font-semibold">
                    <RollingNumber value={stayingStatus?.students?.staying || 0} />
                  </span> students ·{' '}
                  <span className="text-purple-600 font-semibold">
                    <RollingNumber value={stayingStatus?.leaders?.staying || 0} />
                  </span> leaders
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: calculateStayingRate(
                          (stayingStatus?.students?.staying || 0) + (stayingStatus?.leaders?.staying || 0),
                          (attendance?.students?.present || 0) + (attendance?.leaders?.present || 0)
                        )
                      }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-green-500 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-bold text-green-600 shrink-0">
                    {calculateStayingRate(
                      (stayingStatus?.students?.staying || 0) + (stayingStatus?.leaders?.staying || 0),
                      (attendance?.students?.present || 0) + (attendance?.leaders?.present || 0)
                    )}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Present Now Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between h-full"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                    <UserCheck className="w-4 h-4" /> Present Now
                  </p>
                  <div className="text-2xl font-bold text-slate-800 tracking-tight">
                    <RollingNumber value={attendance.students.present + attendance.leaders.present} />
                  </div>
                </div>
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-sm"
                >
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </motion.div>
              </div>

              <div>
                {/* Changed from <p> to <div> */}
                <div className="text-xs text-slate-500 mb-3">
                  <span className="text-blue-600 font-semibold">{attendance.students.present}</span> students ·{' '}
                  <span className="text-purple-600 font-semibold">{attendance.leaders.present}</span> leaders
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: overallAttendanceRate }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-purple-500 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-bold text-purple-600 shrink-0">{overallAttendanceRate}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showDetails && (
          <>
            {/* Overview Content - Visible in Overview Tab (and all on Desktop) */}
            {(!isMobile || activeTab === 'overview') && (
              <div className="space-y-8">
                {/* Attendance Section - Three Cards Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Students Attendance Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-white to-blue-50">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0.8, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm"
                        >
                          <UserCheck className="w-5 h-5 text-blue-600" />
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Students Attendance</h3>
                          <p className="text-sm text-slate-500">Current attendance status</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6 relative">
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-4 top-1/2 w-16 h-16 bg-blue-100 rounded-full opacity-20 blur-2xl"></div>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500 mb-1">Attendance Rate</p>
                          <motion.p
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className={`text-3xl font-bold ${getStatusColor(studentAttendanceRate)}`}
                          >
                            {studentAttendanceRate}
                          </motion.p>
                        </div>

                        <motion.div
                          className="text-right"
                          whileHover={{ scale: 1.1 }}
                        >
                          <p className="text-sm text-slate-500 mb-1">Total Students</p>
                          <motion.div
                            className="text-2xl font-bold text-slate-800"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <RollingNumber value={summary.totalStudents} />
                          </motion.div>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-3 text-center cursor-pointer transition-all hover:shadow-md border border-green-200/50 hover:border-green-300"
                        >
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-slate-600">Present</span>
                          </div>
                          <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.5 }}
                            className="text-xl font-bold text-green-600"
                          >
                            <RollingNumber value={attendance.students.present} />
                          </motion.div>
                          <p className="text-[10px] font-medium text-green-600 bg-green-100/50 px-2 py-0.5 rounded-full inline-block mt-1">
                            {calculatePercentage(attendance.students.present, summary.totalStudents)}
                          </p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-3 text-center cursor-pointer transition-all hover:shadow-md border border-red-200/50 hover:border-red-300"
                        >
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-medium text-slate-600">Absent</span>
                          </div>
                          <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.6 }}
                            className="text-xl font-bold text-red-600"
                          >
                            <RollingNumber value={attendance.students.absent} />
                          </motion.div>
                          <p className="text-[10px] font-medium text-red-600 bg-red-100/50 px-2 py-0.5 rounded-full inline-block mt-1">
                            {calculatePercentage(attendance.students.absent, summary.totalStudents)}
                          </p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-3 text-center cursor-pointer transition-all hover:shadow-md border border-yellow-200/50 hover:border-yellow-300"
                        >
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="text-xs font-medium text-slate-600">Pending</span>
                          </div>
                          <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.7 }}
                            className="text-xl font-bold text-yellow-600"
                          >
                            <RollingNumber value={attendance.students.registered} />
                          </motion.div>
                          <p className="text-[10px] font-medium text-yellow-600 bg-yellow-100/50 px-2 py-0.5 rounded-full inline-block mt-1">
                            {calculatePercentage(attendance.students.registered, summary.totalStudents)}
                          </p>
                        </motion.div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-slate-500">Present vs Total</span>
                          <span className="font-bold text-blue-600">{studentAttendanceRate}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: studentAttendanceRate }}
                            transition={{ duration: 1.5, delay: 0.9, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full relative"
                          >
                            <motion.div
                              className="absolute inset-0 bg-white/20"
                              animate={{ opacity: [0, 0.5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          </motion.div>
                        </div>

                        {/* Bottom Stats */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 1.0 }}
                          className="flex justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-gray-100"
                        >
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600" /> <RollingNumber value={attendance.students.present} />
                          </span>
                          <span className="flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-600" /> <RollingNumber value={attendance.students.absent} />
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-yellow-600" /> <RollingNumber value={attendance.students.registered} />
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Leaders Attendance Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 via-white to-green-50">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0.8, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 }}
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-sm"
                        >
                          <UserCheck className="w-5 h-5 text-green-600" />
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Leaders Attendance</h3>
                          <p className="text-sm text-slate-500">Current attendance status</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6 relative">
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-4 top-1/2 w-16 h-16 bg-green-100 rounded-full opacity-20 blur-2xl"></div>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500 mb-1">Attendance Rate</p>
                          <motion.p
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                            className={`text-3xl font-bold ${getStatusColor(leaderAttendanceRate)}`}
                          >
                            {leaderAttendanceRate}
                          </motion.p>
                        </div>

                        <motion.div
                          className="text-right"
                          whileHover={{ scale: 1.1 }}
                        >
                          <p className="text-sm text-slate-500 mb-1">Total Leaders</p>
                          <motion.div
                            className="text-2xl font-bold text-slate-800"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <RollingNumber value={summary.totalLeaders} />
                          </motion.div>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-3 text-center cursor-pointer transition-all hover:shadow-md border border-green-200/50 hover:border-green-300"
                        >
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-slate-600">Present</span>
                          </div>
                          <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.6 }}
                            className="text-xl font-bold text-green-600"
                          >
                            <RollingNumber value={attendance.leaders.present} />
                          </motion.div>
                          <p className="text-[10px] font-medium text-green-600 bg-green-100/50 px-2 py-0.5 rounded-full inline-block mt-1">
                            {calculatePercentage(attendance.leaders.present, summary.totalLeaders)}
                          </p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-3 text-center cursor-pointer transition-all hover:shadow-md border border-red-200/50 hover:border-red-300"
                        >
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-xs font-medium text-slate-600">Absent</span>
                          </div>
                          <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.7 }}
                            className="text-xl font-bold text-red-600"
                          >
                            <RollingNumber value={attendance.leaders.absent} />
                          </motion.div>
                          <p className="text-[10px] font-medium text-red-600 bg-red-100/50 px-2 py-0.5 rounded-full inline-block mt-1">
                            {calculatePercentage(attendance.leaders.absent, summary.totalLeaders)}
                          </p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.7 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-3 text-center cursor-pointer transition-all hover:shadow-md border border-yellow-200/50 hover:border-yellow-300"
                        >
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="text-xs font-medium text-slate-600">Pending</span>
                          </div>
                          <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.8 }}
                            className="text-xl font-bold text-yellow-600"
                          >
                            <RollingNumber value={attendance.leaders.registered} />
                          </motion.div>
                          <p className="text-[10px] font-medium text-yellow-600 bg-yellow-100/50 px-2 py-0.5 rounded-full inline-block mt-1">
                            {calculatePercentage(attendance.leaders.registered, summary.totalLeaders)}
                          </p>
                        </motion.div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-slate-500">Present vs Total</span>
                          <span className="font-bold text-green-600">{leaderAttendanceRate}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: leaderAttendanceRate }}
                            transition={{ duration: 1.5, delay: 0.9, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full relative"
                          >
                            <motion.div
                              className="absolute inset-0 bg-white/20"
                              animate={{ opacity: [0, 0.5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          </motion.div>
                        </div>

                        {/* Bottom Stats */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 1.0 }}
                          className="flex justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-gray-100"
                        >
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600" /> <RollingNumber value={attendance.leaders.present} />
                          </span>
                          <span className="flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-600" /> <RollingNumber value={attendance.leaders.absent} />
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-yellow-600" /> <RollingNumber value={attendance.leaders.registered} />
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Overall Attendance Summary Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-white to-purple-50">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0.8, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 }}
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-sm"
                        >
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Overall Attendance</h3>
                          <p className="text-sm text-slate-500">Combined statistics</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6 relative">
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-4 top-1/2 w-16 h-16 bg-purple-100 rounded-full opacity-20 blur-2xl"></div>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500 mb-1">Overall Rate</p>
                          <motion.p
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.5 }}
                            className={`text-3xl font-bold ${getStatusColor(overallAttendanceRate)}`}
                          >
                            {overallAttendanceRate}
                          </motion.p>
                        </div>

                        <motion.div
                          className="text-right"
                          whileHover={{ scale: 1.1 }}
                        >
                          <p className="text-sm text-slate-500 mb-1">Total Participants</p>
                          <motion.div
                            className="text-2xl font-bold text-slate-800"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <RollingNumber value={attendance.overall.totalParticipants} />
                          </motion.div>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-md border border-green-200/50 hover:border-green-300"
                        >
                          <p className="text-xs font-medium text-slate-500 mb-1">Present</p>
                          <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.7 }}
                            className="text-2xl font-bold text-green-600"
                          >
                            <RollingNumber value={attendance.overall.present} />
                          </motion.div>
                          <p className="text-[10px] font-medium text-green-600 bg-green-100/50 px-2 py-0.5 rounded-full inline-block mt-1">
                            {calculatePercentage(attendance.overall.present, attendance.overall.totalParticipants)}
                          </p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.7 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-md border border-red-200/50 hover:border-red-300"
                        >
                          <p className="text-xs font-medium text-slate-500 mb-1">Absent</p>
                          <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.8 }}
                            className="text-2xl font-bold text-red-600"
                          >
                            <RollingNumber value={attendance.overall.absent} />
                          </motion.div>
                          <p className="text-[10px] font-medium text-red-600 bg-red-100/50 px-2 py-0.5 rounded-full inline-block mt-1">
                            {calculatePercentage(attendance.overall.absent, attendance.overall.totalParticipants)}
                          </p>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.8 }}
                          whileHover={{ scale: 1.05, y: -4 }}
                          className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-4 text-center cursor-pointer transition-all hover:shadow-md border border-yellow-200/50 hover:border-yellow-300"
                        >
                          <p className="text-xs font-medium text-slate-500 mb-1">Pending</p>
                          <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.9 }}
                            className="text-2xl font-bold text-yellow-600"
                          >
                            <RollingNumber value={attendance.overall.registered} />
                          </motion.div>
                          <p className="text-[10px] font-medium text-yellow-600 bg-yellow-100/50 px-2 py-0.5 rounded-full inline-block mt-1">
                            {calculatePercentage(attendance.overall.registered, attendance.overall.totalParticipants)}
                          </p>
                        </motion.div>
                      </div>

                      {/* Breakdown Section */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 1.0 }}
                        className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-200/50"
                      >
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                          Attendance Breakdown
                        </h4>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600 flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Students
                              </span>
                              <span className="font-bold text-slate-800">
                                <RollingNumber value={attendance.students.present} /> / <RollingNumber value={summary.totalStudents} />
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: studentAttendanceRate }}
                                transition={{ duration: 1.5, delay: 1.1 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full relative"
                              >
                                <motion.div
                                  className="absolute inset-0 bg-white/20"
                                  animate={{ opacity: [0, 0.5, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                />
                              </motion.div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600 flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-green-600" /> Leaders
                              </span>
                              <span className="font-bold text-slate-800">
                                <RollingNumber value={attendance.leaders.present} /> / <RollingNumber value={summary.totalLeaders} />
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: leaderAttendanceRate }}
                                transition={{ duration: 1.5, delay: 1.2 }}
                                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full relative"
                              >
                                <motion.div
                                  className="absolute inset-0 bg-white/20"
                                  animate={{ opacity: [0, 0.5, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                />
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Overview Extras (Accommodation, Registration, Gender) - Only in Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6 mt-8">
                {/* First Row: Three Cards Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Accommodation Status Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-white to-purple-50">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0.8, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 }}
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-sm"
                        >
                          <BedDouble className="w-5 h-5 text-purple-600" />
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Accommodation</h3>
                          <p className="text-sm text-slate-500">Staying status overview</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Main Stats with Animation */}
                      <div className="flex items-center justify-between mb-6 relative">
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-4 top-1/2 w-16 h-16 bg-purple-100 rounded-full opacity-20 blur-2xl"></div>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500 mb-1">Overall Staying Rate</p>
                          <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.6 }}
                            className="flex items-end gap-1"
                          >
                            <span className={`text-3xl font-bold ${getStatusColor(overallStayingRate)}`}>
                              {overallStayingRate}
                            </span>
                          </motion.div>
                        </div>

                        <motion.div
                          className="text-right"
                          whileHover={{ scale: 1.1 }}
                        >
                          <p className="text-sm text-slate-500 mb-1">Total Participants</p>
                          <p className="text-2xl font-bold text-slate-800">
                            <RollingNumber value={(stayingStatus?.students?.staying || 0) + (stayingStatus?.students?.notStaying || 0) +
                              (stayingStatus?.leaders?.staying || 0) + (stayingStatus?.leaders?.notStaying || 0)} />
                          </p>
                        </motion.div>
                      </div>

                      {/* Students Section */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-slate-700">Students</span>
                          </div>
                          <motion.span
                            className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1"
                            whileHover={{ scale: 1.1 }}
                          >
                            <Users className="w-3 h-3" />
                            <span>Total: <RollingNumber value={(stayingStatus?.students?.staying || 0) + (stayingStatus?.students?.notStaying || 0)} /></span>
                          </motion.span>
                        </div>

                        {/* Students Staying Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <Home className="w-3 h-3 text-green-600" />
                              <span className="text-green-600 font-medium">Staying: <RollingNumber value={stayingStatus?.students?.staying || 0} /></span>
                            </div>
                            <div className="flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-red-500" />
                              <span className="text-red-500 font-medium">Not Staying: <RollingNumber value={stayingStatus?.students?.notStaying || 0} /></span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${((stayingStatus?.students?.staying || 0) /
                                  Math.max((stayingStatus?.students?.staying || 0) + (stayingStatus?.students?.notStaying || 0), 1)) * 100}%`
                              }}
                              transition={{ duration: 1, delay: 0.7 }}
                              className="bg-gradient-to-r from-green-400 to-green-600 h-3 flex items-center justify-end px-1"
                            >
                              {((stayingStatus?.students?.staying || 0) /
                                Math.max((stayingStatus?.students?.staying || 0) + (stayingStatus?.students?.notStaying || 0), 1)) * 100 > 15 && (
                                  <span className="text-[8px] text-white font-bold px-1">
                                    {Math.round(((stayingStatus?.students?.staying || 0) /
                                      Math.max((stayingStatus?.students?.staying || 0) + (stayingStatus?.students?.notStaying || 0), 1)) * 100)}%
                                  </span>
                                )}
                            </motion.div>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${((stayingStatus?.students?.notStaying || 0) /
                                  Math.max((stayingStatus?.students?.staying || 0) + (stayingStatus?.students?.notStaying || 0), 1)) * 100}%`
                              }}
                              transition={{ duration: 1, delay: 0.8 }}
                              className="bg-gradient-to-r from-red-400 to-red-600 h-3 flex items-center px-1"
                            >
                              {((stayingStatus?.students?.notStaying || 0) /
                                Math.max((stayingStatus?.students?.staying || 0) + (stayingStatus?.students?.notStaying || 0), 1)) * 100 > 15 && (
                                  <span className="text-[8px] text-white font-bold px-1">
                                    {Math.round(((stayingStatus?.students?.notStaying || 0) /
                                      Math.max((stayingStatus?.students?.staying || 0) + (stayingStatus?.students?.notStaying || 0), 1)) * 100)}%
                                  </span>
                                )}
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      {/* Leaders Section */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-semibold text-slate-700">Leaders</span>
                          </div>
                          <motion.span
                            className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full flex items-center gap-1"
                            whileHover={{ scale: 1.1 }}
                          >
                            <Users className="w-3 h-3" />
                            <span>Total: <RollingNumber value={(stayingStatus?.leaders?.staying || 0) + (stayingStatus?.leaders?.notStaying || 0)} /></span>
                          </motion.span>
                        </div>

                        {/* Leaders Staying Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <Home className="w-3 h-3 text-green-600" />
                              <span className="text-green-600 font-medium">Staying: <RollingNumber value={stayingStatus?.leaders?.staying || 0} /></span>
                            </div>
                            <div className="flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-red-500" />
                              <span className="text-red-500 font-medium">Not Staying: <RollingNumber value={stayingStatus?.leaders?.notStaying || 0} /></span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${((stayingStatus?.leaders?.staying || 0) /
                                  Math.max((stayingStatus?.leaders?.staying || 0) + (stayingStatus?.leaders?.notStaying || 0), 1)) * 100}%`
                              }}
                              transition={{ duration: 1, delay: 0.9 }}
                              className="bg-gradient-to-r from-green-400 to-green-600 h-3 flex items-center justify-end px-1"
                            >
                              {((stayingStatus?.leaders?.staying || 0) /
                                Math.max((stayingStatus?.leaders?.staying || 0) + (stayingStatus?.leaders?.notStaying || 0), 1)) * 100 > 15 && (
                                  <span className="text-[8px] text-white font-bold px-1">
                                    {Math.round(((stayingStatus?.leaders?.staying || 0) /
                                      Math.max((stayingStatus?.leaders?.staying || 0) + (stayingStatus?.leaders?.notStaying || 0), 1)) * 100)}%
                                  </span>
                                )}
                            </motion.div>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${((stayingStatus?.leaders?.notStaying || 0) /
                                  Math.max((stayingStatus?.leaders?.staying || 0) + (stayingStatus?.leaders?.notStaying || 0), 1)) * 100}%`
                              }}
                              transition={{ duration: 1, delay: 1.0 }}
                              className="bg-gradient-to-r from-red-400 to-red-600 h-3 flex items-center px-1"
                            >
                              {((stayingStatus?.leaders?.notStaying || 0) /
                                Math.max((stayingStatus?.leaders?.staying || 0) + (stayingStatus?.leaders?.notStaying || 0), 1)) * 100 > 15 && (
                                  <span className="text-[8px] text-white font-bold px-1">
                                    {Math.round(((stayingStatus?.leaders?.notStaying || 0) /
                                      Math.max((stayingStatus?.leaders?.staying || 0) + (stayingStatus?.leaders?.notStaying || 0), 1)) * 100)}%
                                  </span>
                                )}
                            </motion.div>
                          </div>
                        </div>
                      </div>

                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <motion.div
                          className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-3 border border-green-200/50"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <div className="flex items-center gap-1 mb-2">
                            <Home className="w-4 h-4 text-green-600" />
                            <p className="text-xs text-green-600 font-semibold">TOTAL STAYING</p>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            <RollingNumber value={(stayingStatus?.students?.staying || 0) + (stayingStatus?.leaders?.staying || 0)} />
                          </p>
                          <div className="flex justify-between text-xs mt-1 text-slate-500">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" /> S: <RollingNumber value={stayingStatus?.students?.staying || 0} />
                            </span>
                            <span className="flex items-center gap-1">
                              <Crown className="w-3 h-3" /> L: <RollingNumber value={stayingStatus?.leaders?.staying || 0} />
                            </span>
                          </div>
                        </motion.div>

                        <motion.div
                          className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-3 border border-red-200/50"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <div className="flex items-center gap-1 mb-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <p className="text-xs text-red-600 font-semibold">TOTAL NOT STAYING</p>
                          </div>
                          <p className="text-2xl font-bold text-red-600">
                            <RollingNumber value={(stayingStatus?.students?.notStaying || 0) + (stayingStatus?.leaders?.notStaying || 0)} />
                          </p>
                          <div className="flex justify-between text-xs mt-1 text-slate-500">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" /> S: <RollingNumber value={stayingStatus?.students?.notStaying || 0} />
                            </span>
                            <span className="flex items-center gap-1">
                              <Crown className="w-3 h-3" /> L: <RollingNumber value={stayingStatus?.leaders?.notStaying || 0} />
                            </span>
                          </div>
                        </motion.div>
                      </div>

                      {/* Overall Progress Indicator */}
                      <motion.div
                        className="mt-4 pt-3 border-t border-gray-100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                      >
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Overall Staying Rate</span>
                          <span className="font-medium text-purple-600">{overallStayingRate}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: overallStayingRate }}
                            transition={{ duration: 1, delay: 1.2 }}
                            className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
                          />
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Registration Mode Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 via-white to-green-50">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0.8, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-sm"
                        >
                          <Activity className="w-5 h-5 text-green-600" />
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Registration</h3>
                          <p className="text-sm text-slate-500">Online vs Offline</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Stats with Icons */}
                      <div className="space-y-4">
                        <motion.div
                          className="relative overflow-hidden"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 hover:border-blue-300 transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                              <motion.div
                                className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                              >
                                <span className="text-white text-xs font-bold">ON</span>
                              </motion.div>
                              <div>
                                <span className="text-sm font-medium text-blue-600">Online</span>
                                <p className="text-xs text-slate-500">Digital registration</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <motion.span
                                className="text-2xl font-bold text-blue-600"
                                whileHover={{ scale: 1.2 }}
                              >
                                <RollingNumber value={registrationMode?.online || 0} />
                              </motion.span>
                              <p className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full mt-1">
                                {onlinePercentage}
                              </p>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          className="relative overflow-hidden"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border border-orange-200/50 hover:border-orange-300 transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                              <motion.div
                                className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm"
                                animate={{ rotate: [0, -10, 10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                              >
                                <span className="text-white text-xs font-bold">OFF</span>
                              </motion.div>
                              <div>
                                <span className="text-sm font-medium text-orange-600">Offline</span>
                                <p className="text-xs text-slate-500">In-person registration</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <motion.span
                                className="text-2xl font-bold text-orange-600"
                                whileHover={{ scale: 1.2 }}
                              >
                                <RollingNumber value={registrationMode?.offline || 0} />
                              </motion.span>
                              <p className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full mt-1">
                                {offlinePercentage}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Progress Bar with Labels */}
                      <div className="mt-6">
                        <div className="flex justify-between text-xs text-slate-500 mb-2">
                          <span className="text-blue-600 font-medium">Online {onlinePercentage}</span>
                          <span className="text-orange-600 font-medium">Offline {offlinePercentage}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: onlinePercentage }}
                            transition={{ duration: 1, delay: 0.7 }}
                            className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 flex items-center justify-end px-1"
                          >
                            <span className="text-[10px] text-white font-bold"></span>
                          </motion.div>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: offlinePercentage }}
                            transition={{ duration: 1, delay: 0.8 }}
                            className="bg-gradient-to-r from-orange-400 to-orange-600 h-4 flex items-center px-1"
                          >
                            <span className="text-[10px] text-white font-bold"></span>
                          </motion.div>
                        </div>
                      </div>

                      {/* Total Summary */}
                      <motion.div
                        className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                      >
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-xs text-slate-500">Total Online</p>
                          <p className="text-lg font-bold text-blue-600"><RollingNumber value={registrationMode?.online || 0} /></p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2">
                          <p className="text-xs text-slate-500">Total Offline</p>
                          <p className="text-lg font-bold text-orange-600"><RollingNumber value={registrationMode?.offline || 0} /></p>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Gender Distribution Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-pink-50 via-white to-blue-50">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0.8, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3, delay: 0.7 }}
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-blue-100 flex items-center justify-center shadow-sm"
                        >
                          <Users className="w-5 h-5 text-pink-600" />
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Gender Distribution</h3>
                          <p className="text-sm text-slate-500">Male vs Female participants</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Main Stats with Floating Animation */}
                      <div className="flex items-center justify-between mb-6 relative">
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute left-8 top-1/2 w-20 h-20 bg-blue-100 rounded-full opacity-20 blur-2xl"></div>
                          <div className="absolute right-8 top-1/2 w-20 h-20 bg-pink-100 rounded-full opacity-20 blur-2xl"></div>
                        </div>

                        {/* Male Stat */}
                        <motion.div
                          className="text-center flex-1 relative"
                          whileHover={{ y: -5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="relative">
                            <motion.div
                              className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-200"
                              animate={{
                                scale: [1, 1.05, 1],
                                rotate: [0, 5, -5, 0]
                              }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                                repeatType: "reverse"
                              }}
                            >
                              <span className="text-2xl font-bold text-white">
                                <RollingNumber value={genderDistribution?.total?.male || 0} />
                              </span>
                            </motion.div>
                            <div className="absolute inset-0 bg-blue-400 rounded-full filter blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                          </div>
                          <p className="font-semibold text-slate-800 flex items-center justify-center gap-1">
                            <Mars className="w-4 h-4 text-blue-600" /> Male
                          </p>
                          <motion.p
                            className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mt-1"
                            whileHover={{ scale: 1.1 }}
                          >
                            {malePercentage}
                          </motion.p>
                        </motion.div>

                        {/* VS Divider */}
                        <motion.div
                          className="relative z-10"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-400 border-2 border-white shadow-sm">
                            VS
                          </div>
                        </motion.div>

                        {/* Female Stat */}
                        <motion.div
                          className="text-center flex-1 relative"
                          whileHover={{ y: -5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="relative">
                            <motion.div
                              className="w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-pink-200"
                              animate={{
                                scale: [1, 1.05, 1],
                                rotate: [0, -5, 5, 0]
                              }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                                repeatType: "reverse",
                                delay: 0.5
                              }}
                            >
                              <span className="text-2xl font-bold text-white">
                                <RollingNumber value={genderDistribution?.total?.female || 0} />
                              </span>
                            </motion.div>
                            <div className="absolute inset-0 bg-pink-400 rounded-full filter blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                          </div>
                          <p className="font-semibold text-slate-800 flex items-center justify-center gap-1">
                            <Venus className="w-4 h-4 text-pink-600" /> Female
                          </p>
                          <motion.p
                            className="text-sm font-medium text-pink-600 bg-pink-50 px-3 py-1 rounded-full inline-block mt-1"
                            whileHover={{ scale: 1.1 }}
                          >
                            {femalePercentage}
                          </motion.p>
                        </motion.div>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="relative mt-6 mb-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span className="text-blue-600 font-medium flex items-center gap-1">
                            <Mars className="w-3 h-3" /> Male {malePercentage}
                          </span>
                          <span className="text-pink-600 font-medium flex items-center gap-1">
                            <Venus className="w-3 h-3" /> Female {femalePercentage}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: malePercentage }}
                            transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                            className="absolute h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-l-full"
                            style={{ left: 0 }}
                          />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: femalePercentage }}
                            transition={{ duration: 1.5, delay: 1.0, ease: "easeOut" }}
                            className="absolute h-4 bg-gradient-to-r from-pink-400 to-pink-600 rounded-r-full"
                            style={{ left: malePercentage }}
                          />
                        </div>
                      </div>

                      {/* Student & Leader Cards */}
                      <div className="grid grid-cols-2 gap-3 mt-6">
                        <motion.div
                          className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-200/50 hover:border-blue-300 transition-all cursor-pointer"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-blue-700" /> Students
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Mars className="w-3 h-3 text-blue-500" />
                                <span className="text-xs text-slate-600">Male</span>
                              </div>
                              <motion.span
                                className="text-sm font-bold text-blue-600"
                                whileHover={{ scale: 1.2 }}
                              >
                                <RollingNumber value={genderDistribution?.students?.male ?? 0} />
                              </motion.span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Venus className="w-3 h-3 text-pink-500" />
                                <span className="text-xs text-slate-600">Female</span>
                              </div>
                              <motion.span
                                className="text-sm font-bold text-pink-600"
                                whileHover={{ scale: 1.2 }}
                              >
                                <RollingNumber value={genderDistribution?.students?.female ?? 0} />
                              </motion.span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-blue-200">
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Users className="w-3 h-3" /> Total
                              </span>
                              <span className="text-sm font-bold text-slate-700">
                                <RollingNumber value={(genderDistribution?.students?.male ?? 0) + (genderDistribution?.students?.female ?? 0)} />
                              </span>
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-3 border border-pink-200/50 hover:border-pink-300 transition-all cursor-pointer"
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <p className="text-xs font-semibold text-pink-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-pink-700" /> Leaders
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Mars className="w-3 h-3 text-blue-500" />
                                <span className="text-xs text-slate-600">Male</span>
                              </div>
                              <motion.span
                                className="text-sm font-bold text-blue-600"
                                whileHover={{ scale: 1.2 }}
                              >
                                <RollingNumber value={genderDistribution?.leaders?.male ?? 0} />
                              </motion.span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Venus className="w-3 h-3 text-pink-500" />
                                <span className="text-xs text-slate-600">Female</span>
                              </div>
                              <motion.span
                                className="text-sm font-bold text-pink-600"
                                whileHover={{ scale: 1.2 }}
                              >
                                <RollingNumber value={genderDistribution?.leaders?.female ?? 0} />
                              </motion.span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-pink-200">
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Users className="w-3 h-3" /> Total
                              </span>
                              <span className="text-sm font-bold text-slate-700">
                                <RollingNumber value={(genderDistribution?.leaders?.male ?? 0) + (genderDistribution?.leaders?.female ?? 0)} />
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Total Summary */}
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Top Section Groups - Only in Overview */}
            {activeTab === 'overview' && (
              <div className="mt-8">
                {/* Second Row: Section Groups - Full Width Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group/main"
                >
                  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 via-white to-amber-50">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shadow-sm"
                      >
                        <Users className="w-5 h-5 text-amber-600" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Section Groups</h3>
                        <p className="text-sm text-slate-500">Student distribution by age group</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sectionGroups?.activeGroups
                        ?.filter(group => group?.studentCount > 0)
                        .sort((a, b) => {
                          const codeA = a.groupCode || '';
                          const codeB = b.groupCode || '';
                          return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
                        })
                        .map((group, index) => {
                          const gColor = group?.tagColor || '#F59E0B';
                          const gCode = group?.groupCode || `G-${index + 1}`;

                          const totalStudents = group?.studentCount || 0;
                          const studentPercentage = calculatePercentage(totalStudents, summary.totalStudents);
                          const attendanceRate = calculateAttendanceRate(group?.attendance?.present || 0, totalStudents);
                          const stayingRate = calculateStayingRate(group?.staying?.yes || 0, totalStudents);

                          return (
                            <motion.div
                              key={group?.groupCode || group?.ageGroupId || index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                              whileHover={{
                                scale: 1.02,
                                y: -4,
                                borderColor: gColor
                              }}
                              className="group border border-gray-100 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg bg-white relative overflow-hidden"
                            >
                              {/* Background Decoration */}
                              <div
                                className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5 transition-opacity group-hover:opacity-10"
                                style={{ backgroundColor: gColor }}
                              />

                              {/* Header */}
                              <div className="flex items-center justify-between mb-3 relative">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                                    style={{ backgroundColor: gColor }}
                                  >
                                    {gCode}
                                  </div>
                                  <span className="font-semibold text-slate-800 group-hover:text-slate-900">
                                    Group {gCode}
                                  </span>
                                </div>
                                <div className="text-xs px-3 py-1 bg-slate-50 text-slate-600 rounded-full font-medium border border-slate-100">
                                  {group?.ageRange || 'N/A'}
                                </div>
                              </div>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-3 gap-2 mt-4">
                                <div className="text-center">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Students</p>
                                  <p className="text-xl font-black text-slate-800">
                                    <RollingNumber value={group?.studentCount || 0} />
                                  </p>
                                  <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                    {studentPercentage}
                                  </span>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Attendance</p>
                                  <p className={`text-xl font-black ${getStatusColor(attendanceRate)}`}>
                                    {attendanceRate}
                                  </p>
                                  <p className="text-[8px] font-medium text-slate-400 mt-1">
                                    <RollingNumber value={group?.attendance?.present || 0} />/<RollingNumber value={group?.studentCount || 0} />
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Staying</p>
                                  <p className={`text-xl font-black ${getStatusColor(stayingRate)}`}>
                                    {stayingRate}
                                  </p>
                                  <p className="text-[8px] font-medium text-slate-400 mt-1">
                                    <RollingNumber value={group?.staying?.yes || 0} /> staying
                                  </p>
                                </div>
                              </div>

                              {/* Mini progress bar with Group Code integration */}
                              <div className="mt-5 relative">
                                <div className="flex justify-between text-xs mb-1.5">
                                  <span className="font-bold text-slate-500 uppercase text-[9px] tracking-widest">Staying Rate</span>
                                  <span className="font-bold" style={{ color: gColor }}>{stayingRate}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-50">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: stayingRate }}
                                    transition={{ duration: 1, delay: 1.0 + index * 0.1, ease: "easeOut" }}
                                    className="h-full rounded-full relative flex items-center justify-end pr-1"
                                    style={{ backgroundColor: gColor }}
                                  >
                                    <div className="absolute inset-0 bg-white/20 w-full h-[50%]" />
                                    {parseInt(stayingRate) > 15 && (
                                      <span className="text-[8px] font-bold text-white/80 relative z-10 mr-1">
                                        {gCode}
                                      </span>
                                    )}
                                  </motion.div>
                                </div>
                              </div>

                              {/* Watermark Group Code */}
                              <div className="absolute bottom-1 right-2 text-[40px] font-black text-slate-100 pointer-events-none select-none opacity-40 transition-all group-hover:opacity-60 group-hover:scale-110">
                                {gCode}
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>

                    {/* Empty State */}
                    {(!sectionGroups?.activeGroups || sectionGroups.activeGroups.filter(g => g?.studentCount > 0).length === 0) && (
                      <motion.div
                        className="text-center py-12 text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        </motion.div>
                        <p className="text-lg font-medium">No active section groups found</p>
                        <p className="text-sm">There are no section groups with students at the moment.</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <div className="space-y-8">
                {/* Header with Date Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Attendance Overview</h2>
                    <p className="text-slate-500 mt-1">Track and manage attendance records</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </motion.div>
                  </div>
                </div>

                {/* Main Attendance Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Students Attendance Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative"
                  >
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-100 rounded-full opacity-20 blur-2xl pointer-events-none"></div>

                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-blue-50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center"
                          >
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                          </motion.div>
                          Students
                        </h3>
                        <motion.span
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full shadow-sm"
                          whileHover={{ scale: 1.05 }}
                        >
                          <RollingNumber value={attendance.students.present} />/{summary.totalStudents} Present
                        </motion.span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <motion.div
                          className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50 group-hover:border-green-300 transition-all hover:shadow-md"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <p className="text-xs text-green-600 mb-1 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Present
                          </p>
                          <div className="text-2xl font-bold text-green-600">
                            <RollingNumber value={attendance.students.present} />
                          </div>
                        </motion.div>

                        <motion.div
                          className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border border-red-200/50 group-hover:border-red-300 transition-all hover:shadow-md"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <p className="text-xs text-red-600 mb-1 font-medium flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Absent
                          </p>
                          <div className="text-2xl font-bold text-red-600">
                            <RollingNumber value={attendance.students.absent} />
                          </div>
                        </motion.div>

                        <motion.div
                          className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-4 border border-yellow-200/50 group-hover:border-yellow-300 transition-all hover:shadow-md"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <p className="text-xs text-yellow-600 mb-1 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </p>
                          <div className="text-2xl font-bold text-yellow-600">
                            <RollingNumber value={attendance.students.registered} />
                          </div>
                        </motion.div>

                        <motion.div
                          className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50 group-hover:border-blue-300 transition-all hover:shadow-md"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <p className="text-xs text-blue-600 mb-1 font-medium flex items-center gap-1">
                            <Users className="w-3 h-3" /> Total
                          </p>
                          <div className="text-2xl font-bold text-blue-600">
                            <RollingNumber value={summary.totalStudents} />
                          </div>
                        </motion.div>
                      </div>

                      <div className="relative mt-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-slate-500">Attendance Rate</span>
                          <span className="font-bold text-blue-600">{studentAttendanceRate}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: studentAttendanceRate }}
                            transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full relative"
                          >
                            <motion.div
                              className="absolute inset-0 bg-white/20"
                              animate={{ opacity: [0, 0.5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          </motion.div>
                        </div>

                        <div className="flex justify-between mt-3 text-[10px] text-slate-400">
                          <span>Present: <RollingNumber value={attendance.students.present} /></span>
                          <span>Absent: <RollingNumber value={attendance.students.absent} /></span>
                          <span>Pending: <RollingNumber value={attendance.students.registered} /></span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Leaders Attendance Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative"
                  >
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-100 rounded-full opacity-20 blur-2xl pointer-events-none"></div>

                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-green-50 via-white to-green-50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center"
                          >
                            <Users className="w-4 h-4 text-green-600" />
                          </motion.div>
                          Leaders
                        </h3>
                        <motion.span
                          className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full shadow-sm"
                          whileHover={{ scale: 1.05 }}
                        >
                          <RollingNumber value={attendance.leaders.present} />/{summary.totalLeaders} Present
                        </motion.span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <motion.div
                          className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50 group-hover:border-green-300 transition-all hover:shadow-md"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <p className="text-xs text-green-600 mb-1 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Present
                          </p>
                          <div className="text-2xl font-bold text-green-600">
                            <RollingNumber value={attendance.leaders.present} />
                          </div>
                        </motion.div>

                        <motion.div
                          className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border border-red-200/50 group-hover:border-red-300 transition-all hover:shadow-md"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <p className="text-xs text-red-600 mb-1 font-medium flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Absent
                          </p>
                          <div className="text-2xl font-bold text-red-600">
                            <RollingNumber value={attendance.leaders.absent} />
                          </div>
                        </motion.div>

                        <motion.div
                          className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-4 border border-yellow-200/50 group-hover:border-yellow-300 transition-all hover:shadow-md"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <p className="text-xs text-yellow-600 mb-1 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </p>
                          <div className="text-2xl font-bold text-yellow-600">
                            <RollingNumber value={attendance.leaders.registered} />
                          </div>
                        </motion.div>

                        <motion.div
                          className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50 group-hover:border-blue-300 transition-all hover:shadow-md"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <p className="text-xs text-blue-600 mb-1 font-medium flex items-center gap-1">
                            <Users className="w-3 h-3" /> Total
                          </p>
                          <div className="text-2xl font-bold text-blue-600">
                            <RollingNumber value={summary.totalLeaders} />
                          </div>
                        </motion.div>
                      </div>

                      <div className="relative mt-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-slate-500">Attendance Rate</span>
                          <span className="font-bold text-green-600">{leaderAttendanceRate}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: leaderAttendanceRate }}
                            transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full relative"
                          >
                            <motion.div
                              className="absolute inset-0 bg-white/20"
                              animate={{ opacity: [0, 0.5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          </motion.div>
                        </div>

                        <div className="flex justify-between mt-3 text-[10px] text-slate-400">
                          <span>Present: <RollingNumber value={attendance.leaders.present} /></span>
                          <span>Absent: <RollingNumber value={attendance.leaders.absent} /></span>
                          <span>Pending: <RollingNumber value={attendance.leaders.registered} /></span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Overall Attendance Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative"
                  >
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-100 rounded-full opacity-20 blur-2xl pointer-events-none"></div>

                    <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50 via-white to-purple-50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                          <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center"
                          >
                            <PieChart className="w-4 h-4 text-purple-600" />
                          </motion.div>
                          Overall
                        </h3>
                        <motion.span
                          className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full shadow-sm"
                          whileHover={{ scale: 1.05 }}
                        >
                          <RollingNumber value={attendance.overall.present} />/{attendance.overall.totalParticipants} Present
                        </motion.span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <motion.div
                          className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50 group-hover:border-green-300 transition-all hover:shadow-md"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <p className="text-xs text-green-600 mb-1 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Present
                          </p>
                          <div className="text-2xl font-bold text-green-600">
                            <RollingNumber value={attendance.overall.present} />
                          </div>
                        </motion.div>

                        <motion.div
                          className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border border-red-200/50 group-hover:border-red-300 transition-all hover:shadow-md"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <p className="text-xs text-red-600 mb-1 font-medium flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Absent
                          </p>
                          <div className="text-2xl font-bold text-red-600">
                            <RollingNumber value={attendance.overall.absent} />
                          </div>
                        </motion.div>

                        <motion.div
                          className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-4 border border-yellow-200/50 group-hover:border-yellow-300 transition-all hover:shadow-md"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <p className="text-xs text-yellow-600 mb-1 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending
                          </p>
                          <div className="text-2xl font-bold text-yellow-600">
                            <RollingNumber value={attendance.overall.registered} />
                          </div>
                        </motion.div>

                        <motion.div
                          className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50 group-hover:border-purple-300 transition-all hover:shadow-md"
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <p className="text-xs text-purple-600 mb-1 font-medium flex items-center gap-1">
                            <Users className="w-3 h-3" /> Total
                          </p>
                          <div className="text-2xl font-bold text-purple-600">
                            <RollingNumber value={attendance.overall.totalParticipants} />
                          </div>
                        </motion.div>
                      </div>

                      <div className="relative mt-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-slate-500">Overall Attendance Rate</span>
                          <span className="font-bold text-purple-600">{overallAttendanceRate}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: overallAttendanceRate }}
                            transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full relative"
                          >
                            <motion.div
                              className="absolute inset-0 bg-white/20"
                              animate={{ opacity: [0, 0.5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          </motion.div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400">Students</p>
                            <p className="text-sm font-bold text-blue-600">
                              <RollingNumber value={attendance.students.present} />/{summary.totalStudents}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400">Leaders</p>
                            <p className="text-sm font-bold text-green-600">
                              <RollingNumber value={attendance.leaders.present} />/{summary.totalLeaders}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400">Combined</p>
                            <p className="text-sm font-bold text-purple-600">
                              <RollingNumber value={attendance.overall.present} />/{attendance.overall.totalParticipants}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Groups Tab */}
            {activeTab === 'groups' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Section Groups Overview</h2>
                    <p className="text-slate-500 mt-1">View and manage age group details</p>
                  </div>
                  <motion.div
                    className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </motion.div>
                </div>

                {/* Section Group Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 via-white to-amber-50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center"
                        >
                          <Users className="w-4 h-4 text-amber-600" />
                        </motion.div>
                        Section Groups
                      </h3>
                      <motion.span
                        className="px-4 py-1.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-full shadow-sm"
                        whileHover={{ scale: 1.05 }}
                      >
                        <RollingNumber value={sectionGroups.activeGroups.filter(group => group.studentCount > 0).length} /> Active Groups
                      </motion.span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sectionGroups.activeGroups
                        .filter(group => group.studentCount > 0)
                        .sort((a, b) => {
                          const codeA = a.groupCode || '';
                          const codeB = b.groupCode || '';
                          return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
                        })
                        .map((group, index) => {
                          const totalStudents = group?.studentCount || 0;
                          const studentPercentage = calculatePercentage(totalStudents, summary.totalStudents);
                          const attendanceRate = calculateAttendanceRate(group?.attendance?.present || 0, totalStudents);
                          const stayingRate = calculateStayingRate(group?.staying?.yes || 0, totalStudents);

                          return (
                            <motion.div
                              key={group?.groupCode || group?.ageGroupId || index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              whileHover={{ y: -6, scale: 1.02 }}
                              className="group bg-white border border-slate-100 rounded-xl p-5 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                            >
                              <div
                                className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10 transition-opacity group-hover:opacity-20"
                                style={{ backgroundColor: group.tagColor }}
                              />

                              <div className="flex items-center justify-between mb-4 relative">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <motion.div
                                      whileHover={{ scale: 1.1, rotate: 5 }}
                                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                                      style={{
                                        backgroundColor: group.tagColor,
                                        background: `linear-gradient(135deg, ${group.tagColor}, ${group.tagColor}dd)`
                                      }}
                                    >
                                      {group.groupCode}
                                    </motion.div>
                                    <motion.div
                                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-800 group-hover:text-amber-600 transition-colors text-lg">
                                      Group {group.groupCode}
                                    </h4>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                      <Calendar className="w-3 h-3" /> {group.ageRange}
                                    </p>
                                  </div>
                                </div>
                                <motion.span
                                  className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full shadow-sm"
                                  whileHover={{ scale: 1.1 }}
                                  style={{ backgroundColor: `${group.tagColor}20`, color: group.tagColor }}
                                >
                                  {studentPercentage}
                                </motion.span>
                              </div>

                              <div className="mb-5">
                                <div className="flex items-baseline justify-between mb-1">
                                  <span className="text-sm text-slate-500 flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" /> Total Students
                                  </span>
                                  <span className="text-3xl font-bold text-slate-800">
                                    <RollingNumber value={group.studentCount} />
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2 overflow-hidden shadow-inner">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: studentPercentage }}
                                    transition={{ duration: 1.2, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                                    className="h-2.5 rounded-full relative"
                                    style={{
                                      background: `linear-gradient(90deg, ${group.tagColor}, ${group.tagColor}dd)`
                                    }}
                                  >
                                    <motion.div
                                      className="absolute inset-0 bg-white/20"
                                      animate={{ opacity: [0, 0.5, 0] }}
                                      transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                  </motion.div>
                                </div>
                              </div>

                              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                                <motion.div
                                  className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-3 border border-slate-200/50 group-hover:border-green-200 transition-all hover:shadow-md"
                                  whileHover={{ scale: 1.02, y: -2 }}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3 text-green-600" /> Attendance
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor(attendanceRate)}`}>
                                      {attendanceRate}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-green-600">
                                      <RollingNumber value={group.attendance.present} />
                                    </span>
                                    <span className="text-xs text-slate-400">Present</span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: attendanceRate }}
                                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                      className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full"
                                    />
                                  </div>
                                </motion.div>

                                {!isMobile && (
                                  <motion.div
                                    className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-3 border border-slate-200/50 group-hover:border-amber-200 transition-all hover:shadow-md"
                                    whileHover={{ scale: 1.02, y: -2 }}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                        <Home className="w-3 h-3 text-amber-600" /> Staying
                                      </span>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor(stayingRate)}`}>
                                        {stayingRate}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-lg font-bold text-amber-600">
                                        <RollingNumber value={group.staying.yes} />
                                      </span>
                                      <span className="text-xs text-slate-400">Staying</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: stayingRate }}
                                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-1.5 rounded-full"
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </div>

                              {!isMobile && (
                                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                                  <div>
                                    <p className="text-[10px] text-slate-400">Absent</p>
                                    <p className="text-xs font-bold text-red-600">
                                      <RollingNumber value={group.studentCount - group.attendance.present} />
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-400">Not Staying</p>
                                    <p className="text-xs font-bold text-slate-600">
                                      <RollingNumber value={group.studentCount - group.staying.yes} />
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div
                                className="absolute bottom-2 right-2 text-4xl font-black opacity-5 pointer-events-none select-none transition-all group-hover:opacity-10 group-hover:scale-110"
                                style={{ color: group.tagColor }}
                              >
                                #{group.groupCode}
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>

                    {sectionGroups.activeGroups.filter(group => group.studentCount > 0).length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-16 text-center"
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="inline-block"
                        >
                          <Users className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                        </motion.div>
                        <p className="text-slate-600 text-lg font-medium">No active groups found</p>
                        <p className="text-slate-400 text-sm mt-1">Groups with students will appear here</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </>
        )}

        {/* Footer Info */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-xs text-slate-400">
          <span>Event ID: {eventInfo.eventId}</span>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Online' : 'Offline'}</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>

        <LiveCountModal
          isOpen={showLiveModal}
          onClose={() => setShowLiveModal(false)}
          attendance={attendance}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
};

export default Dashboard;
