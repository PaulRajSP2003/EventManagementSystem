import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Users,
    Crown,
    TrendingUp,
    CircleCheck,
    CircleX,
    ArrowRight,
    Filter,
    Mail,
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { fetchPermissionData } from '../permission';
import type { Notification as ApiNotification } from '../../../types/Notification/types';

const Digit = ({ value }: { value: string }) => {
    return (
        <div className="relative overflow-hidden h-[1em] leading-none inline-flex">
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
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

const RollingNumber = ({ value, className = '' }: { value: number; className?: string }) => {
    const digits = Math.abs(value).toString().split('');

    return (
        <span className={`inline-flex items-center justify-start tabular-nums ${className}`} style={{ gap: 0, letterSpacing: 'normal' }}>
            {digits.map((digit, index) => (
                <Digit key={`${digits.length - index}-${index}`} value={digit} />
            ))}
        </span>
    );
};

interface AttendanceData {
    attendance: {
        student: {
            registered: number;
            present: number;
            absent: number;
        };
        leader: {
            registered: number;
            present: number;
            absent: number;
        };
    };
}

interface Notification {
    id: string;
    type: 'student' | 'leader';
    studentId?: number;
    leaderId?: number;
    name: string;
    message: string;
    messageType?: string;
    timestamp: string;
    email: string;
    isRead?: boolean;
    previousStatus?: string;
    newStatus?: string;
}
interface SidebarData {
    open: boolean;
    lockedEmail?: string;
    isLocked?: boolean;
}

const getRelativeTimeString = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just Now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

const convertApiNotification = (apiNotif: ApiNotification): Notification => {
    const isStudent = 'student' in apiNotif;

    let studentId: number | undefined = undefined;
    let leaderId: number | undefined = undefined;
    let name = 'Unknown';
    let previousStatus: string | undefined = undefined;
    let newStatus: string | undefined = undefined;

    if (isStudent && apiNotif.student) {
        studentId = apiNotif.student.studentId;
        name = apiNotif.student.name || 'Unknown Student';
        previousStatus = apiNotif.student.previousStatus;
        newStatus = apiNotif.student.status;
    } else if (!isStudent && apiNotif.leader) {
        leaderId = apiNotif.leader.leaderId;
        name = apiNotif.leader.name || 'Unknown Leader';
        previousStatus = apiNotif.leader.previousStatus;
        newStatus = apiNotif.leader.status;
    }

    let messageType = apiNotif.messageType;
    if (!messageType) {
        const message = apiNotif.message || '';
        if (message.includes('added')) messageType = `${isStudent ? 'student' : 'leader'}_added`;
        else if (message.includes('marked as')) messageType = `${isStudent ? 'student' : 'leader'}_status_changed`;
    }

    const uniqueId = `${apiNotif.eventId}-${apiNotif.timestamp}-${apiNotif.messageType || 'unknown'}`;

    const converted: Notification = {
        id: uniqueId,
        type: isStudent ? 'student' : 'leader',
        studentId,
        leaderId,
        name,
        message: apiNotif.message || 'No message',
        messageType,
        timestamp: apiNotif.timestamp || new Date().toISOString(),
        email: extractEmailFromMessage(apiNotif.message || ''),
        isRead: apiNotif.isRead || false,
        previousStatus,
        newStatus,
    };

    return converted;
};

const extractEmailFromMessage = (message: string): string => {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const matches = message.match(emailRegex);
    return matches ? matches[0] : '';
};

type FilterType = 'all' | 'student' | 'leader';
type NotificationFilterType = 'all' | 'student' | 'leader';

import { useNavigate } from 'react-router-dom';

const SideDashboard = () => {
    const navigate = useNavigate();
    const [sidebarData, setSidebarData] = useState<SidebarData>(() => {
        try {
            const saved = localStorage.getItem('sidebardata');
            if (!saved) return { open: false, isLocked: false, lockedEmail: '' };
            const parsed = JSON.parse(saved);
            return {
                open: !!parsed.open,
                isLocked: parsed.isLocked || false,
                lockedEmail: parsed.lockedEmail || ''
            };
        } catch {
            return { open: false, isLocked: false, lockedEmail: '' };
        }
    });

    const [emailInput, setEmailInput] = useState('');
    const [attendanceData, setAttendanceData] = useState<AttendanceData>({
        attendance: {
            student: { registered: 0, present: 0, absent: 0 },
            leader: { registered: 0, present: 0, absent: 0 }
        }
    });

    const [eventId, setEventId] = useState<number>();
    const [loading, setLoading] = useState(true);
    const [filter] = useState<FilterType>('all');
    const [notificationFilter, setNotificationFilter] = useState<NotificationFilterType>('all');
    const [, setCurrentTime] = useState(Date.now());
    const [isTabActive, setIsTabActive] = useState(true);
    const [localReadStatus, setLocalReadStatus] = useState<Record<string, boolean>>({});

    // Fetch eventId from permissions
    useEffect(() => {
        const loadEventId = async () => {
            try {
                const permissionData = await fetchPermissionData();
                setEventId(permissionData.eventId);
                // Fetch attendance stats for this event
                await fetchAttendanceStats(permissionData.eventId);
            } catch (error) {
                console.error('Failed to load permission data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadEventId();
    }, []);

    // Fetch attendance stats from API
    const fetchAttendanceStats = async (eventId: number) => {
        try {
            const apiUrl = 'https://localhost:7135';
            const response = await fetch(`${apiUrl}/api/Notification/stats/${eventId}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const stats = await response.json();
                setAttendanceData({
                    attendance: {
                        student: {
                            registered: stats.student?.registered || 0,
                            present: stats.student?.present || 0,
                            absent: stats.student?.absent || 0,
                        },
                        leader: {
                            registered: stats.leader?.registered || 0,
                            present: stats.leader?.present || 0,
                            absent: stats.leader?.absent || 0,
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to fetch attendance stats:', error);
        }
    };

    // Initialize notification hook with eventId
    const {
        notifications: apiNotifications,
        unreadCount,
        isConnected,
        markPersonNotificationsAsRead,
        clearNotifications
    } = useNotification(eventId);

    // Update attendance data when new notifications arrive
    useEffect(() => {
        if (!apiNotifications.length || !eventId) return;

        // Get the latest notification (first in array)
        const latestNotification = apiNotifications[0];

        // Update attendance data from the latest notification's dashboard data
        if (latestNotification.dashboard) {
            setAttendanceData({
                attendance: {
                    student: {
                        registered: latestNotification.dashboard.student?.registered || 0,
                        present: latestNotification.dashboard.student?.present || 0,
                        absent: latestNotification.dashboard.student?.absent || 0,
                    },
                    leader: {
                        registered: latestNotification.dashboard.leader?.registered || 0,
                        present: latestNotification.dashboard.leader?.present || 0,
                        absent: latestNotification.dashboard.leader?.absent || 0,
                    }
                }
            });
        }
    }, [apiNotifications, eventId]);

    // Convert API notifications to component format and sort by timestamp (newest first)
    const notifications = useMemo(() => {
        return apiNotifications
            .map(convertApiNotification)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [apiNotifications]);

    // Persist sidebar state
    useEffect(() => {
        localStorage.setItem('sidebardata', JSON.stringify(sidebarData));
    }, [sidebarData]);

    // Sync sidebar state across tabs
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === 'sidebardata' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    setSidebarData({
                        open: !!data.open,
                        isLocked: data.isLocked || false,
                        lockedEmail: data.lockedEmail || ''
                    });
                } catch { }
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    // Update relative time display
    useEffect(() => {
        const id = setInterval(() => setCurrentTime(Date.now()), 60000);
        return () => clearInterval(id);
    }, []);

    // Track tab visibility
    useEffect(() => {
        const onChange = () => setIsTabActive(!document.hidden);
        document.addEventListener('visibilitychange', onChange);
        return () => document.removeEventListener('visibilitychange', onChange);
    }, []);

    const handleLockToggle = () => {
        if (!sidebarData.isLocked) {
            // Lock with email
            if (emailInput.trim()) {
                setSidebarData(prev => ({
                    ...prev,
                    isLocked: true,
                    lockedEmail: emailInput.trim().toLowerCase()
                }));
            }
        } else {
            // Unlock
            setSidebarData(prev => ({
                ...prev,
                isLocked: false,
                lockedEmail: ''
            }));
            setEmailInput('');
        }
    };

    const data = attendanceData.attendance;

    const getFilteredData = () => {
        switch (filter) {
            case 'student':
                return {
                    ...data.student,
                    totalRegistered: data.student.registered,
                    totalPresent: data.student.present,
                    totalAbsent: data.student.absent,
                };
            case 'leader':
                return {
                    ...data.leader,
                    totalRegistered: data.leader.registered,
                    totalPresent: data.leader.present,
                    totalAbsent: data.leader.absent,
                };
            default:
                return {
                    registered: data.student.registered + data.leader.registered,
                    present: data.student.present + data.leader.present,
                    absent: data.student.absent + data.leader.absent,
                    totalRegistered: data.student.registered + data.leader.registered,
                    totalPresent: data.student.present + data.leader.present,
                    totalAbsent: data.student.absent + data.leader.absent,
                };
        }
    };

    const filteredData = getFilteredData();

    const sidebarVariants = {
        collapsed: { x: 'calc(100% - 48px)' },
        expanded: { x: 0 },
    };

    const toggleSidebar = () => {
        setSidebarData((prev) => ({ ...prev, open: !prev.open }));
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Immediately remove from UI (optimistic update)
        if (notification.type === 'student' && notification.studentId) {
            // This will remove ALL notifications with this studentId
            await markPersonNotificationsAsRead('student', notification.studentId);
            navigate(`/user/student/${notification.studentId}`);
        } else if (notification.type === 'leader' && notification.leaderId) {
            // This will remove ALL notifications with this leaderId
            await markPersonNotificationsAsRead('leader', notification.leaderId);
            navigate(`/user/leader/${notification.leaderId}`);
        }

        // Clear local read status since notifications are removed
        setLocalReadStatus({});
    };

    const handleClearNotifications = () => {
        clearNotifications();
        setLocalReadStatus({});
    };

    const getFilteredNotifications = () => {
        // First apply type filter
        let filtered = notificationFilter === 'all'
            ? notifications
            : notifications.filter((n) => n.type === notificationFilter);

        // Then apply email filter if locked
        if (sidebarData.isLocked && sidebarData.lockedEmail) {
            filtered = filtered.filter(n =>
                n.email && n.email.toLowerCase().includes(sidebarData.lockedEmail!.toLowerCase())
            );
        }

        return filtered;
    };

    const filteredNotifications = getFilteredNotifications();

    // Calculate effective read status (combine API and local)
    const getNotificationReadStatus = (notification: Notification): boolean => {
        // If we have local override, use that
        if (localReadStatus[notification.id] !== undefined) {
            return localReadStatus[notification.id];
        }
        // Otherwise use the API read status
        return notification.isRead || false;
    };

    if (loading) {
        return (
            <motion.aside
                initial="collapsed"
                animate={sidebarData.open ? 'expanded' : 'collapsed'}
                variants={sidebarVariants}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed top-20 right-0 z-40 h-[calc(100vh-5rem)] w-96 bg-white dark:bg-gray-800 rounded-tl-2xl border-l border-y border-gray-200 dark:border-gray-700 flex items-stretch overflow-hidden"
            >
                <button
                    onClick={toggleSidebar}
                    className="w-12 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 flex flex-col items-center py-6 cursor-pointer transition-all duration-300 shrink-0 group relative"
                >
                    {!sidebarData.open ? (
                        <>
                            <ChevronLeft className="text-white mb-4 group-hover:-translate-x-0.5 transition-transform" size={20} />
                            <div className="[writing-mode:vertical-lr] rotate-180 text-white text-xs font-medium tracking-wider whitespace-nowrap">
                                ATTENDANCE
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                                <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                                <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                            </div>
                        </>
                    ) : (
                        <ChevronRight className="text-white group-hover:translate-x-0.5 transition-transform" size={24} />
                    )}
                </button>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </motion.aside>
        );
    }

    return (
        <motion.aside
            initial="collapsed"
            animate={sidebarData.open ? 'expanded' : 'collapsed'}
            variants={sidebarVariants}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-20 right-0 z-40 h-[calc(100vh-5rem)] w-96 bg-white dark:bg-gray-800 rounded-tl-2xl border-l border-y border-gray-200 dark:border-gray-700 flex items-stretch overflow-hidden"
            style={{ overscrollBehavior: 'contain' }}
        >
            {/* Trigger Tab */}
            <button
                onClick={toggleSidebar}
                className="w-12 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 flex flex-col items-center py-6 cursor-pointer transition-all duration-300 shrink-0 group relative"
            >
                {!sidebarData.open ? (
                    <>
                        <ChevronLeft className="text-white mb-4 group-hover:-translate-x-0.5 transition-transform" size={20} />
                        <div className="[writing-mode:vertical-lr] rotate-180 text-white text-xs font-medium tracking-wider whitespace-nowrap">
                            ATTENDANCE
                        </div>
                        {unreadCount > 0 && (
                            <div className="absolute bottom-6 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                        <div className="mt-4 space-y-2">
                            <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                        </div>
                    </>
                ) : (
                    <ChevronRight className="text-white group-hover:translate-x-0.5 transition-transform" size={24} />
                )}
            </button>

            {/* Scrollable content area */}
            <div
                className="flex-1 overflow-y-auto scrollbar-hide"
                style={{ overscrollBehaviorY: 'contain' }}
            >
                <div className="p-5">
                    {/* Connection Status Indicator */}
                    <div className="mb-2 flex items-center justify-end">
                        <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-[10px] text-gray-500">
                                {isConnected ? 'Live' : 'Disconnected'}
                            </span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                        <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Live Overview</h2>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Students */}
                    {(filter === 'all' || filter === 'student') && (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Users size={16} className="text-blue-600 dark:text-blue-400" />
                                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Students</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <CompactStat label="Registered" value={data.student.registered} color="blue" />
                                <CompactStat label="Present" value={data.student.present} color="green" icon={<CircleCheck size={12} />} />
                                <CompactStat label="Absent" value={data.student.absent} color="red" icon={<CircleX size={12} />} />
                            </div>
                        </div>
                    )}

                    {/* Leaders */}
                    {(filter === 'all' || filter === 'leader') && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Crown size={16} className="text-purple-600 dark:text-purple-400" />
                                <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">Leaders</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <CompactStat label="Registered" value={data.leader.registered} color="purple" />
                                <CompactStat label="Present" value={data.leader.present} color="green" icon={<CircleCheck size={12} />} />
                                <CompactStat label="Absent" value={data.leader.absent} color="red" icon={<CircleX size={12} />} />
                            </div>
                        </div>
                    )}

                    {/* Total Participants */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-800/20 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-gray-600 dark:text-gray-400" />
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {filter === 'student' ? 'Students' : filter === 'leader' ? 'Leaders' : 'Total Participants'}
                                </h3>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {filter === 'all' ? 'All members' : filter === 'student' ? 'Only students' : 'Only leaders'}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Registered</div>
                                <div className="text-xl font-bold text-gray-800 dark:text-white">
                                    <RollingNumber value={filteredData.totalRegistered} />
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Present</div>
                                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                    <RollingNumber value={filteredData.totalPresent} />
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Absent</div>
                                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                    <RollingNumber value={filteredData.totalAbsent} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-4">
                        <button
                            onClick={() => navigate('/user/dashboard')}
                            className="w-full flex items-center justify-center gap-1 px-2.5 py-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 rounded-lg transition-all duration-200 border border-indigo-200 dark:border-indigo-800/50 group"
                        >
                            <span>View Dashboard</span>
                        </button>
                    </div>

                    {/* Notifications */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                    Notifications
                                </h4>
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none animate-pulse">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="relative">
                                    <select
                                        value={notificationFilter}
                                        onChange={(e) => setNotificationFilter(e.target.value as NotificationFilterType)}
                                        className="h-7 appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        <option value="all">All</option>
                                        <option value="student">Students</option>
                                        <option value="leader">Leaders</option>
                                    </select>
                                    <Filter
                                        size={14}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    />
                                </div>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={handleClearNotifications}
                                        className="h-7 text-xs font-medium px-2.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/40 rounded-md border border-red-200 dark:border-red-700/50 transition-colors flex items-center gap-1 whitespace-nowrap"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Email Filter Section */}
                        <div className="mb-4 p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                {sidebarData.isLocked ? (
                                    // Show locked email with badge - properly aligned
                                    <div className="flex-1 flex items-center gap-2 min-w-0"> {/* Added min-w-0 for truncation */}
                                        <div className="flex-1 flex items-center gap-2 h-9 px-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                            <Mail size={14} className="text-gray-400 shrink-0" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                                {sidebarData.lockedEmail}
                                            </span>
                                            <span className="shrink-0 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                                Filtered
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        type="email"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        placeholder="Enter email to filter"
                                        className="flex-1 h-9 px-3 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                )}
                                <button
                                    onClick={handleLockToggle}
                                    disabled={!emailInput.trim() && !sidebarData.isLocked}
                                    className={`h-9 px-3 rounded-lg flex items-center gap-2 transition-all duration-200 shrink-0 ${sidebarData.isLocked
                                        ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/40 border border-red-200 dark:border-red-700/50'
                                        : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 border border-indigo-200 dark:border-indigo-700/50'
                                        } ${!emailInput.trim() && !sidebarData.isLocked ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {sidebarData.isLocked ? (
                                        <>
                                            <span className="text-sm font-medium">Unlock</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-sm font-medium">Lock</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {filteredNotifications.length > 0 ? (
                                    filteredNotifications.map((notification, index) => {
                                        const isStudent = notification.type === 'student';
                                        const relativeTime = getRelativeTimeString(notification.timestamp);
                                        const isRead = getNotificationReadStatus(notification);

                                        // Determine if this is a new notification
                                        const isNew = index === 0 &&
                                            (Date.now() - new Date(notification.timestamp).getTime()) < 5000;

                                        return (
                                            <motion.div
                                                key={notification.id}
                                                layout
                                                initial={{
                                                    opacity: 0,
                                                    y: -20,  // Changed from x to y for smoother entrance
                                                    scale: 0.95
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                    scale: 1,
                                                    transition: {
                                                        type: "spring",
                                                        stiffness: 400,
                                                        damping: 35,
                                                        mass: 0.8,
                                                        opacity: { duration: 0.2 }
                                                    }
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                    y: -10,
                                                    transition: {
                                                        duration: 0.2,
                                                        ease: "easeOut"
                                                    }
                                                }}
                                                whileHover={{
                                                    scale: 1.01,
                                                    transition: { duration: 0.1 }
                                                }}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`group relative overflow-hidden rounded-xl border p-4 transition-colors duration-200 cursor-pointer ${isRead ? 'bg-gray-50/50' : 'bg-white dark:bg-slate-900'
                                                    } ${isStudent
                                                        ? 'border-blue-100 dark:border-blue-900/50 hover:border-blue-400'
                                                        : 'border-purple-100 dark:border-purple-900/50 hover:border-purple-400'
                                                    } ${isNew ? 'shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30' : ''
                                                    }`}
                                                style={{
                                                    transformOrigin: "top center",
                                                    willChange: "transform, opacity"
                                                }}
                                            >
                                                {/* Top Row: The Tag and ID Box Combined */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-0">
                                                        {/* Role Tag */}
                                                        <div className={`px-2 py-1 text-[10px] font-black rounded-l-md border ${isStudent
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'bg-purple-600 border-purple-600 text-white'
                                                            }`}>
                                                            {isStudent ? 'STUDENT' : 'LEADER'}
                                                        </div>

                                                        {/* ID Box joined to the tag */}
                                                        <div className={`px-3 py-1 text-[11px] font-mono font-bold rounded-r-md border border-l-0 ${isStudent
                                                            ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                                                            : 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300'
                                                            }`}>
                                                            #{isStudent ? notification.studentId : notification.leaderId}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-medium text-gray-400">{relativeTime}</span>
                                                        {!isRead && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ delay: 0.2 }}
                                                                className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Middle Row: Name and Message */}
                                                <div className="space-y-1">
                                                    <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100 capitalize">
                                                        {notification.name}
                                                    </h5>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                </div>

                                                {/* Footer: Meta details */}
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    whileHover={{ opacity: 1 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="mt-4 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {notification.email && (
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                                                <Mail size={12} className="shrink-0" />
                                                                <span className="truncate max-w-[150px]">{notification.email}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer">
                                                        <span>VIEW PROFILE</span>
                                                        <ArrowRight size={12} />
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700"
                                    >
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No notifications found</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {sidebarData.isLocked
                                                ? `No notifications with email: ${sidebarData.lockedEmail}`
                                                : notifications.length === 0
                                                    ? 'All recent additions have been cleared'
                                                    : 'Try changing the filter'}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-[10px] text-gray-400">
                        <span>Auto-updates</span>
                        <span>• {isTabActive ? 'Live' : 'Inactive'}</span>
                    </div>
                </div>
            </div>
        </motion.aside>
    );
};

const CompactStat = ({
    label,
    value,
    color,
    icon,
}: {
    label: string;
    value: number;
    color: 'blue' | 'green' | 'red' | 'purple';
    icon?: React.ReactNode;
}) => {
    const colors = {
        blue: 'text-blue-700 dark:text-blue-300',
        green: 'text-green-700 dark:text-green-300',
        red: 'text-red-700 dark:text-red-300',
        purple: 'text-purple-700 dark:text-purple-300',
    };

    const bgColors = {
        blue: 'bg-blue-100/80 dark:bg-blue-900/40',
        green: 'bg-green-100/80 dark:bg-green-900/40',
        red: 'bg-red-100/80 dark:bg-red-900/40',
        purple: 'bg-purple-100/80 dark:bg-purple-900/40',
    };

    return (
        <div className={`${bgColors[color]} rounded-lg p-2 text-center`}>
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
                {icon && <span className={colors[color]}>{icon}</span>}
                <div className={`text-[10px] font-medium ${colors[color]} opacity-80`}>{label}</div>
            </div>
            <div className={`text-base font-bold ${colors[color]}`}>
                <RollingNumber value={value} />
            </div>
        </div>
    );
};

export default SideDashboard;