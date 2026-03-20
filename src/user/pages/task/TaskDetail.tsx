import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiPlus,
    FiEdit2,
    FiCalendar,
    FiMapPin,
    FiActivity,
    FiAlertCircle,
    FiShare2,
    FiClock
} from 'react-icons/fi';
import { FaMars, FaVenus } from 'react-icons/fa6';

import type { TaskDetailsResponse, TaskDetailData } from '../api/TaskData';
import { getTaskDetails } from '../api/TaskData';
import { isAdminOrCoAdmin, fetchPermissionData, canAccess, PAGE_PERMISSIONS } from '../permission';
import { decryptData } from '../../utils/encryption';
import { StickyHeader, AccessAlert } from '../components';
import TaskForm from './compounds/TaskForm';
import TaskEdit from './compounds/TaskEdit';
import TaskView from './compounds/TaskView';
import TaskShare from './compounds/TaskShare';
import EmptyState from '../components/EmptyState';

// Reusable Components (matching LeaderDetail style)
const SectionHeader = ({ icon: Icon, title, className = "" }: { icon: any; title: string, className?: string }) => (
    <div className={`flex items-center gap-2 mb-4 mt-4 sm:mt-8 pb-2 border-b border-gray-100 ${className}`}>
        <Icon className="text-indigo-500 text-lg" />
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
);

// Live Timer Component
const LiveTimer: React.FC<{ targetDate: Date; label: string; type: 'upcoming' | 'live' | 'ended' }> = ({ targetDate, label, type }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const now = new Date().getTime();
        const target = targetDate.getTime();
        const difference = type === 'live' ? target - now : target - now;

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000),
            total: difference
        };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, type]);

    const getGradient = () => {
        switch (type) {
            case 'live':
                return 'from-emerald-500 to-green-600';
            case 'upcoming':
                return 'from-blue-500 to-indigo-600';
            default:
                return 'from-amber-500 to-orange-600';
        }
    };

    const getBgGradient = () => {
        switch (type) {
            case 'live':
                return 'from-emerald-50 to-green-50';
            case 'upcoming':
                return 'from-blue-50 to-indigo-50';
            default:
                return 'from-amber-50 to-orange-50';
        }
    };

    const getBorderColor = () => {
        switch (type) {
            case 'live':
                return 'border-emerald-200';
            case 'upcoming':
                return 'border-blue-200';
            default:
                return 'border-amber-200';
        }
    };

    const formatNumber = (num: number) => String(num).padStart(2, '0');

    return (
        <div className={`bg-gradient-to-br ${getBgGradient()} rounded-2xl border ${getBorderColor()} p-6 shadow-sm`}>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-white bg-opacity-90 shadow-sm ${type === 'live' ? 'text-emerald-700' : type === 'upcoming' ? 'text-blue-700' : 'text-amber-700'
                        }`}>
                        <div className="flex items-center gap-1.5">
                            {type === 'live' ? (
                                <>
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span>LIVE NOW</span>
                                </>
                            ) : type === 'upcoming' ? (
                                <>
                                    <FiClock className="w-3.5 h-3.5" />
                                    <span>UPCOMING</span>
                                </>
                            ) : (
                                <>
                                    <FiAlertCircle className="w-3.5 h-3.5" />
                                    <span>ENDED</span>
                                </>
                            )}
                        </div>
                    </span>
                    <h4 className="text-lg font-bold text-gray-800 mt-3">{label}</h4>
                </div>
                <FiClock className={`w-6 h-6 ${type === 'live' ? 'text-emerald-500' : type === 'upcoming' ? 'text-blue-500' : 'text-amber-500'}`} />
            </div>

            {timeLeft.total > 0 ? (
                <div className="grid grid-cols-4 gap-3 mt-2">
                    <div className="text-center">
                        <div className={`bg-white rounded-xl p-3 shadow-sm border ${getBorderColor()}`}>
                            <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-br ${getGradient()} bg-clip-text text-transparent`}>
                                {formatNumber(timeLeft.days)}
                            </div>
                            <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase mt-1">Days</div>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className={`bg-white rounded-xl p-3 shadow-sm border ${getBorderColor()}`}>
                            <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-br ${getGradient()} bg-clip-text text-transparent`}>
                                {formatNumber(timeLeft.hours)}
                            </div>
                            <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase mt-1">Hours</div>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className={`bg-white rounded-xl p-3 shadow-sm border ${getBorderColor()}`}>
                            <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-br ${getGradient()} bg-clip-text text-transparent`}>
                                {formatNumber(timeLeft.minutes)}
                            </div>
                            <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase mt-1">Mins</div>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className={`bg-white rounded-xl p-3 shadow-sm border ${getBorderColor()} relative overflow-hidden`}>
                            {type === 'live' && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                            )}
                            <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-br ${getGradient()} bg-clip-text text-transparent relative z-10`}>
                                {formatNumber(timeLeft.seconds)}
                            </div>
                            <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase mt-1 relative z-10">Secs</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4">
                    <p className="text-gray-500 font-medium">
                        {type === 'live' ? 'Mission objective has ended' : 'Time has elapsed'}
                    </p>
                </div>
            )}

            {type === 'live' && timeLeft.total > 0 && (
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 bg-white bg-opacity-60 rounded-lg px-3 py-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-medium">Mission is currently active - {timeLeft.hours}h {timeLeft.minutes}m remaining</span>
                </div>
            )}
        </div>
    );
};

// Skeleton Component
const TaskDetailSkeleton = () => {
    return (
        <div className="max-w-6xl mx-auto px-4 mt-2 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="h-2 w-full bg-indigo-500 opacity-50"></div>
                        <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                        <div className="px-6 pb-6 text-center -mt-12">
                            <div className="inline-block p-1 bg-white rounded-full">
                                <div className="h-24 w-24 rounded-full bg-slate-200 animate-pulse" />
                            </div>
                            <div className="h-7 w-48 mx-auto mt-4 mb-2 bg-slate-200 animate-pulse rounded" />
                            <div className="h-4 w-32 mx-auto mb-6 bg-slate-200 animate-pulse rounded" />
                            <div className="flex justify-center gap-2">
                                <div className="h-6 w-20 bg-slate-200 animate-pulse rounded-full" />
                                <div className="h-6 w-24 bg-slate-200 animate-pulse rounded-full" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                        <div className="h-5 w-24 bg-slate-200 animate-pulse rounded" />
                        <div className="space-y-3">
                            <div className="h-10 w-full bg-slate-200 animate-pulse rounded-lg" />
                            <div className="h-10 w-full bg-slate-200 animate-pulse rounded-lg" />
                        </div>
                    </div>
                </div>
                {/* RIGHT COLUMN */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-8">
                        {[1, 2].map((i) => (
                            <div key={i} className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 bg-slate-200 animate-pulse rounded-full" />
                                    <div className="h-6 w-40 bg-slate-200 animate-pulse rounded" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="h-14 w-full bg-slate-200 animate-pulse rounded-xl" />
                                    <div className="h-14 w-full bg-slate-200 animate-pulse rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TaskDetail: React.FC = () => {
    const { leaderId, publicTaskId, taskId } = useParams<{ leaderId: string; publicTaskId: string; taskId?: string }>();
    const navigate = useNavigate();

    const [data, setData] = useState<TaskDetailsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [permissionData, setPermissionData] = useState<any>(null);
    const [permissionLoading, setPermissionLoading] = useState(true);
    const [permissionError, setPermissionError] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const hasPageAccess = () => {
        return canAccess(permissionData, PAGE_PERMISSIONS.TASK_DETAILS);
    };

    // Modals
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskDetailData | null>(null);
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState<{
        url: string;
        title: string;
        startTime?: string;
        endTime?: string;
        duration?: string;
        recipientName?: string;
        recipientGender?: 'male' | 'female';
        senderName?: string;
        senderRole?: string;
    }>({ url: '', title: '' });

    const fetchData = async () => {
        try {
            setLoading(true);
            const storedData = localStorage.getItem('login-data');
            const decrypted = decryptData<{ token: string }>(storedData);
            const token = decrypted?.token || '';

            if (!leaderId) {
                setError("Operational link lost. Target identification failed.");
                setLoading(false);
                return;
            }

            const response = await getTaskDetails(token, publicTaskId || '', Number(leaderId));
            if (response.success) {
                setData(response.data);
            } else {
                setError(response.message);
            }
        } catch (err: any) {
            if (err.status === 403) {
                setAccessDenied(true);
                setErrorMessage("You do not have permission to view this mission.");
            } else {
                setError(err.message || 'System synchronization failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTaskAdded = (newTask: TaskDetailData) => {
        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                taskDetailData: [{ ...newTask, hideDelete: true } as any, ...prev.taskDetailData]
            };
        });
        setAddModalOpen(false);
    };

    const handleTaskUpdated = (updatedTask: TaskDetailData) => {
        setData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                taskDetailData: prev.taskDetailData.map(t =>
                    t.taskId === updatedTask.taskId ? { ...updatedTask, hideDelete: true } as any : t
                )
            };
        });
        setEditModalOpen(false);
    };

    useEffect(() => {
        const init = async () => {
            try {
                setPermissionLoading(true);
                setPermissionError(false);
                const perm = await fetchPermissionData();
                setPermissionData(perm);
                fetchData();
            } catch (err: any) {
                console.error("Permission check failed", err);
                setPermissionData(null);
                setPermissionError(true);
                setAccessDenied(true);
                if (err.message === 'Forbidden' || err?.message?.includes('403')) {
                    setErrorMessage("Access Forbidden: You don't have permission to access this resource");
                } else if (err.message === 'Unauthorized' || err?.message?.includes('401')) {
                    setErrorMessage("Unauthorized: Please log in to access this page");
                } else {
                    setErrorMessage(err.message || 'Failed to load permissions');
                }
            } finally {
                setPermissionLoading(false);
            }
        };
        init();
    }, [publicTaskId]);

    useEffect(() => {
        if (data && taskId) {
            const task = data.taskDetailData?.find((t: any) => String(t.taskId) === String(taskId));
            if (task) {
                setSelectedTask(task as TaskDetailData);
                setViewModalOpen(true);
            }
        }
    }, [data, taskId]);

    const getInitials = (name: string) => name?.trim()[0]?.toUpperCase() || '';

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'TBD';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const getDuration = (start: string | null, end: string | null) => {
        if (!start || !end) return '';
        try {
            const startDate = new Date(start);
            const endDate = new Date(end);
            const diffMs = endDate.getTime() - startDate.getTime();
            if (diffMs <= 0) return '';

            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            const parts = [];
            if (days > 0) parts.push(`${days}d`);
            if (hours > 0) parts.push(`${hours}h`);
            if (minutes > 0) parts.push(`${minutes}m`);

            return parts.join(' ') || '0m';
        } catch {
            return '';
        }
    };

    // Find next upcoming and currently live events
    const getNextEvents = () => {
        const now = new Date();
        const tasks = data?.taskDetailData || [];

        // Find live events (currently active)
        const liveEvents = tasks.filter(task => {
            if (!task.isActive || !task.start || !task.end) return false;
            const start = new Date(task.start);
            const end = new Date(task.end);
            return now >= start && now < end;
        });

        // Find upcoming events (future start dates)
        const upcomingEvents = tasks.filter(task => {
            if (!task.isActive || !task.start) return false;
            const start = new Date(task.start);
            return start > now;
        }).sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime());

        // Find recently ended events (within last 24 hours)
        const recentlyEnded = tasks.filter(task => {
            if (!task.isActive || !task.end) return false;
            const end = new Date(task.end);
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            return end < now && end > twentyFourHoursAgo;
        }).sort((a, b) => new Date(b.end!).getTime() - new Date(a.end!).getTime());

        return {
            live: liveEvents[0] || null,
            upcoming: upcomingEvents[0] || null,
            recentEnded: recentlyEnded[0] || null
        };
    };

    if (permissionLoading || (loading && !data)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
                <StickyHeader title="Profile Task Details">
                    {publicTaskId && (
                        <button
                            disabled
                            className="px-3 py-1.5 rounded-lg border flex items-center gap-1.5 bg-slate-50 text-slate-400 border-slate-200 shadow-sm opacity-50 cursor-not-allowed"
                        >
                            <FiShare2 className="w-4 h-4" />
                            <span className="text-sm font-medium hidden sm:inline">Share Mission</span>
                        </button>
                    )}
                </StickyHeader>
                <TaskDetailSkeleton />
            </div>
        );
    }

    if (permissionData && !hasPageAccess()) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
                <AccessAlert message={errorMessage || "You do not have access to view this mission."} />
            </div>
        );
    }

    if (accessDenied || permissionError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <EmptyState
                        icon="alert"
                        title="Permission Sync Error"
                        description={errorMessage || "Unable to verify your access credentials. Please try again."}
                        action={{ label: "Retry Synchronization", onClick: () => window.location.reload() }}
                    />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <EmptyState
                        icon="alert"
                        title="Operation Error"
                        description={error}
                        action={{ label: "Retry Synchronization", onClick: fetchData }}
                    />
                </div>
            </div>
        );
    }

    const leader = data?.leaderData;
    const master = data?.taskMasterData;
    const details = data?.taskDetailData || [];
    const { live, upcoming, recentEnded } = getNextEvents();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
            <StickyHeader title="Profile Task Details">
                {publicTaskId && isAdminOrCoAdmin(permissionData) && (
                    <button
                        onClick={() => {
                            const shareUrl = `${window.location.origin}/user/task/${leaderId}/${publicTaskId}`;
                            
                            setShareData({ 
                                url: shareUrl, 
                                title: 'Profile Task Details',
                                startTime: 'Various',
                                endTime: 'Various',
                                duration: '',
                                recipientName: leader?.name || '',
                                recipientGender: leader?.gender as any || 'male',
                                senderName: permissionData?.name || 'Admin',
                                senderRole: permissionData?.role || 'User Management'
                            });
                            setShareModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg border flex items-center gap-1.5 bg-white text-slate-500 border-slate-200 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
                    >
                        <FiShare2 className="w-4 h-4" />
                        <span className="text-sm font-medium hidden sm:inline">Share Mission</span>
                    </button>
                )}
            </StickyHeader>

            <div className="max-w-6xl mx-auto px-4 mt-2 sm:mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN - Profile & Actions */}
                    <div className="space-y-6">
                        {/* Profile Card - Matching LeaderDetail style */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden relative">
                            <div className="h-2 w-full bg-indigo-500"></div>
                            <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                            <div className="px-6 pb-6 text-center -mt-12 relative">
                                <div className="w-24 h-24 mx-auto bg-white p-1 rounded-full relative z-10 border-4 border-indigo-500">
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                                        {getInitials(leader?.name || '')}
                                    </div>
                                </div>
                                <h1 className="text-2xl font-bold text-slate-800 mt-3 capitalize">{leader?.name}</h1>
                                <p className="text-slate-500 text-sm flex items-center justify-center gap-2 mt-1">
                                    <span>ID: #{leader?.id}</span>
                                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                    <span className="capitalize">{leader?.type}</span>
                                </p>
                                <div className="flex justify-center gap-2 mt-4 flex-wrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${master?.isActive
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {master?.isActive ? 'Active' : 'Standby'}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-700 flex items-center gap-1">
                                        {leader?.gender === "male" ? <FaMars /> : <FaVenus />} {leader?.gender}
                                    </span>
                                </div>
                                <div className="mt-4 text-xs text-slate-400 flex items-center justify-center gap-1">
                                    <FiMapPin className="w-3 h-3" />
                                    <span className="capitalize">{leader?.place}</span>
                                </div>
                            </div>
                        </div>

                        {/* Mission Control Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <FiActivity className="text-indigo-500" /> Mission Control
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Authorized By</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                            {getInitials(master?.createdBy || '')}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800">{master?.createdBy.split('@')[0]}</p>
                                            <p className="text-xs text-slate-400">{master?.createdBy}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Authorized At</p>
                                    <div className="flex items-center gap-2">
                                        <FiCalendar className="text-indigo-400 w-5 h-5" />
                                        <span className="font-medium text-slate-800">{master && formatDate(master.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-800 mb-4">Mission Stats</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 p-3 bg-indigo-50 rounded-lg text-center border border-indigo-100/50">
                                    <div className="text-xl sm:text-2xl font-bold text-indigo-600">{details.length}</div>
                                    <div className="text-[10px] sm:text-xs font-bold text-indigo-500 uppercase">Total Taskss</div>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-lg text-center border border-emerald-100/50">
                                    <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                                        {details.filter(t => t.status === 'Completed').length}
                                    </div>
                                    <div className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase">Completed</div>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg text-center border border-purple-100/50">
                                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                                        {details.filter(t => t.status === 'In Progress').length}
                                    </div>
                                    <div className="text-[10px] sm:text-xs font-bold text-purple-600 uppercase">Operational</div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-lg text-center border border-amber-100/50">
                                    <div className="text-xl sm:text-2xl font-bold text-amber-600">
                                        {details.filter(t => t.status === 'Upcoming').length}
                                    </div>
                                    <div className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase">Pending</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg text-center border border-slate-200">
                                    <div className="text-xl sm:text-2xl font-bold text-slate-600">
                                        {details.filter(t => t.status === 'Not Scheduled').length}
                                    </div>
                                    <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Unscheduled</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Tasks List */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Next Upcoming Event Timer Section */}
                        {(live || upcoming || recentEnded) && (
                            <div className="space-y-4">
                                {live && live.start && live.end && (
                                    <LiveTimer
                                        targetDate={new Date(live.end)}
                                        label={`LIVE: ${live.title}`}
                                        type="live"
                                    />
                                )}
                                {!live && upcoming && upcoming.start && (
                                    <LiveTimer
                                        targetDate={new Date(upcoming.start)}
                                        label={`Next: ${upcoming.title}`}
                                        type="upcoming"
                                    />
                                )}
                                {!live && !upcoming && recentEnded && recentEnded.end && (
                                    <LiveTimer
                                        targetDate={new Date(recentEnded.end)}
                                        label={`Recently Ended: ${recentEnded.title}`}
                                        type="ended"
                                    />
                                )}
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 shrink-0 gap-4">
                                <SectionHeader icon={FiActivity} title="Operational Tasks" className="!mt-0 !mb-0" />
                                {isAdminOrCoAdmin(permissionData) && details.length > 0 && (
                                    <button
                                        onClick={() => setAddModalOpen(true)}
                                        className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow"
                                    >
                                        <FiPlus className="w-4 h-4" /> Add Task
                                    </button>
                                )}
                            </div>

                            {details.length === 0 ? (
                                <EmptyState
                                    icon="calendar"
                                    title="No objectives yet"
                                    description="Get started by adding your first operational objective to this mission."
                                    buttonText={isAdminOrCoAdmin(permissionData) ? "Add First Tasks" : undefined}
                                    onClick={isAdminOrCoAdmin(permissionData) ? () => setAddModalOpen(true) : undefined}
                                />
                            ) : (
                                <div className="space-y-4">
                                    {details.map((task: any) => {
                                        const now = new Date();
                                        const start = task.start ? new Date(task.start) : null;
                                        const end = task.end ? new Date(task.end) : null;
                                        let liveStatus = { label: 'UNSCHEDULED', message: 'No timeline', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', pulse: false };

                                        if (!task.isActive) liveStatus = { label: 'CLOSED', message: 'Mission Aborted / Closed', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', pulse: false };
                                        else if (start && now < start) {
                                            const ms = start.getTime() - now.getTime();
                                            const h = Math.floor(ms / (1000 * 60 * 60));
                                            const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
                                            liveStatus = { label: 'STANDBY', message: `Start in: ${h}h ${m}m`, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', pulse: false };
                                        } else if (start && end && now >= start && now < end) {
                                            const ms = end.getTime() - now.getTime();
                                            const d = Math.floor(ms / (1000 * 60 * 60 * 24));
                                            const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                            const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
                                            liveStatus = { label: 'LIVE', message: `Ends in: ${d > 0 ? d + 'd ' : ''}${h}h ${m}m`, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', pulse: true };
                                        } else if (end && now >= end) {
                                            liveStatus = { label: 'ENDED', message: 'End Passed', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', pulse: false };
                                        }

                                        return (
                                            <div
                                                key={task.taskId}
                                                onClick={() => { setSelectedTask(task); setViewModalOpen(true); }}
                                                className="group relative bg-white rounded-xl border border-slate-200 hover:border-indigo-200 transition-all hover:shadow-md cursor-pointer"
                                            >
                                                {/* Progress Bar */}
                                                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 rounded-t-xl overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${task.status === 'Completed' ? 'bg-green-500' :
                                                            task.status === 'In Progress' ? 'bg-indigo-500' :
                                                                task.status === 'Pending' ? 'bg-yellow-500' :
                                                                    'bg-rose-500'
                                                            }`}
                                                        style={{ width: task.status === 'Completed' ? '100%' : '60%' }}
                                                    />
                                                </div>

                                                <div className="p-4 sm:p-5 pb-4">
                                                    {/* Inactive Alert */}
                                                    {!task.isActive && (
                                                        <div className="mb-4 bg-rose-50 border border-rose-100 rounded-lg p-3 flex items-start gap-2 text-rose-700">
                                                            <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm font-bold">This Tasks is Inactive</p>
                                                                <p className="text-xs mt-0.5 opacity-90">This objective has been marked as inactive and is no longer operational.</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Header - Stack on mobile, row on desktop */}
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-lg shrink-0 ${task.status === 'Completed' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                                                                task.status === 'In Progress' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                                                                    task.status === 'Pending' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                                                                        'bg-gradient-to-br from-rose-500 to-pink-600'
                                                                }`}>
                                                                {getInitials(task.title)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-semibold text-gray-900 capitalize leading-tight mb-0.5 truncate">{task.title}</h4>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${task.status === 'Completed' ? 'text-green-600' :
                                                                        task.status === 'In Progress' ? 'text-indigo-600' :
                                                                            task.status === 'Pending' ? 'text-yellow-600' :
                                                                                'text-rose-600'
                                                                        }`}>
                                                                        {task.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Duration Live Status Badge - Full width on mobile */}
                                                        <div className="flex items-center sm:items-start w-full sm:w-auto">
                                                            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start ${liveStatus.bg} ${liveStatus.border} ${liveStatus.color} shadow-sm`}>
                                                                {liveStatus.pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                                                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide shrink-0 hidden sm:inline">{liveStatus.label}:</span>
                                                                <span className="text-[10px] sm:text-xs font-medium truncate">{liveStatus.message}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Details Row - Stack on mobile, row on desktop */}
                                                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                                                            <div>
                                                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Start Date</p>
                                                                <p className="text-xs sm:text-sm font-semibold text-slate-700 break-words">{formatDate(task.start)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">End Date</p>
                                                                <p className="text-xs sm:text-sm font-semibold text-slate-700 break-words">{formatDate(task.end)}</p>
                                                            </div>
                                                        </div>

                                                        {/* Actions - Stack on mobile, row on desktop */}
                                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                                            <div className="flex items-center gap-2">
                                                                {isAdminOrCoAdmin(permissionData) && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const shareUrl = `${window.location.origin}/user/task/${leaderId}/${publicTaskId}/${task.taskId}`;
                                                                            
                                                                            setShareData({ 
                                                                                url: shareUrl, 
                                                                                title: task.title,
                                                                                startTime: formatDate(task.start),
                                                                                endTime: formatDate(task.end),
                                                                                duration: getDuration(task.start, task.end),
                                                                                recipientName: leader?.name || '',
                                                                                recipientGender: leader?.gender as any || 'male',
                                                                                senderName: permissionData?.name || 'Admin',
                                                                                senderRole: permissionData?.role || 'User Management'
                                                                            });
                                                                            setShareModalOpen(true);
                                                                        }}
                                                                        className="p-2 border rounded-lg transition-all shadow-sm flex items-center justify-center bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 flex-1 sm:flex-none"
                                                                        title="Share Tasks"
                                                                    >
                                                                        <FiShare2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                {isAdminOrCoAdmin(permissionData) && (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setEditModalOpen(true); }}
                                                                        className="hidden sm:flex px-4 py-2 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:border-indigo-200 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm items-center justify-center gap-1.5 flex-1 sm:flex-none"
                                                                    >
                                                                        <FiEdit2 className="w-3.5 h-3.5" /> Edit
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setViewModalOpen(true); }}
                                                                className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm text-center"
                                                            >
                                                                View Details
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <TaskForm
                isOpen={isAddModalOpen}
                onClose={() => setAddModalOpen(false)}
                onSuccess={handleTaskAdded}
                publicTaskId={publicTaskId || ''}
            />
            <TaskEdit
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSuccess={handleTaskUpdated}
                publicTaskId={publicTaskId || ''}
                task={selectedTask}
            />
            <TaskView
                isOpen={isViewModalOpen}
                onClose={() => {
                    setViewModalOpen(false);
                    if (taskId) {
                        navigate(`/user/task/${leaderId}/${publicTaskId}`, { replace: true });
                    }
                }}
                task={selectedTask}
                permissionData={permissionData}
            />
            <TaskShare
                isOpen={isShareModalOpen}
                onClose={() => setShareModalOpen(false)}
                shareUrl={shareData.url}
                title={shareData.title}
                startTime={shareData.startTime}
                endTime={shareData.endTime}
                duration={shareData.duration}
                recipientName={shareData.recipientName}
                recipientGender={shareData.recipientGender}
                senderName={shareData.senderName}
                senderRole={shareData.senderRole}
            />

            {/* Add animation keyframes to global CSS */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
};

export default TaskDetail;