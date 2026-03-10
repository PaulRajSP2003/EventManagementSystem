// src/user/pages/leader/LeaderHistory.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leaderAPI } from '../api/LeaderData';
import {
    FiArrowLeft, FiActivity, FiEdit, FiPhone, FiSearch, FiFilter, FiHome, FiUsers, FiKey, FiClock,
    FiUser
} from 'react-icons/fi';
import { BsPersonCheck, BsPeople, BsPersonBadge } from 'react-icons/bs';
import AccessAlert from '../components/AccessAlert';
import { isAdminOrCoAdmin, fetchPermissionData, type PermissionData } from '../permission';
import EmptyState from '../components/EmptyState';

// Skeleton component for loading state
const SkeletonBlock = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const LeaderHistorySkeleton = () => {
    return (
        <div className="max-w-6xl mx-auto px-4 mt-6">
            {/* Leader Info Card Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <SkeletonBlock className="w-16 h-16 rounded-full" />
                        <div>
                            <SkeletonBlock className="h-8 w-48 mb-2" />
                            <SkeletonBlock className="h-5 w-24" />
                        </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:pl-6 sm:border-l border-gray-200">
                        <div className="flex items-center gap-3">
                            <SkeletonBlock className="w-8 h-8 rounded-lg" />
                            <div>
                                <SkeletonBlock className="h-3 w-12 mb-1" />
                                <SkeletonBlock className="h-4 w-24" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <SkeletonBlock className="w-8 h-8 rounded-lg" />
                            <div>
                                <SkeletonBlock className="h-3 w-12 mb-1" />
                                <SkeletonBlock className="h-4 w-24" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <SkeletonBlock className="h-4 w-16 mb-2" />
                                <SkeletonBlock className="h-8 w-12" />
                            </div>
                            <SkeletonBlock className="w-12 h-12 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Search Bar Skeleton */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <SkeletonBlock className="h-11 w-full sm:w-96" />
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <SkeletonBlock className="h-11 w-24" />
                        <SkeletonBlock className="h-11 w-32" />
                    </div>
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="mb-6 border-b border-gray-200">
                <div className="flex space-x-1 overflow-x-auto pb-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <SkeletonBlock key={i} className="h-10 w-24 rounded-t-xl" />
                    ))}
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <SkeletonBlock className="w-10 h-10 rounded-xl" />
                            <div>
                                <SkeletonBlock className="h-5 w-32 mb-1" />
                                <SkeletonBlock className="h-4 w-48" />
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <SkeletonBlock className="h-32 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
};

interface RoomHistoryItem {
    id: number;
    roomId: number;
    roomCode: string;
    roomName: string;
    sourceCode: string;
    isActive: boolean;
    assignedAt: string;
    releasedAt: string | null;
    assignedBy: string;
}

interface GroupHistoryItem {
    id: number;
    groupId: number;
    groupName: string;
    isActive: boolean;
    role: string;
    createdAt: string;
    createdBy: string;
}

interface WaitingListItem {
    id: number;
    sourceCode: string;
    createdAt: string;
    assignedAt: string | null;
    assignedBy: string | null;
    isActive: boolean;
}

interface KeyTransaction {
    id: number;
    roomId: number;
    roomName: string;
    status: string;
    holderType: string;
    issuedAt: string;
    returnedAt: string | null;
    issuedBy: string;
    note?: string;
}

interface StudentUnderCare {
    studentId: number;
    studentName: string;
    relationship: string;
    sourceCode: string;
    assignedAt: string;
    isActive: boolean;
}

interface MainLeaderHistory {
    id: number;
    roomId: number;
    roomName: string;
    isActive: boolean;
    createdAt: string;
    createdBy: string;
}

interface CurrentMainLeader {
    id: number;
    roomId: number;
    roomName: string;
    isActive: boolean;
    createdAt: string;
    createdBy: string;
}

interface LeaderHistoryResponse {
    id: number;
    name: string;
    gender: string;
    phone: string;
    status: string;
    roomHistory: RoomHistoryItem[];
    followingGroupHistory: GroupHistoryItem[];
    subGroupHistory: GroupHistoryItem[];
    waitingListHistory: WaitingListItem[];
    keyTransactions: KeyTransaction[];
    studentsUnderCare: StudentUnderCare[];
    currentStudentsUnderCare: StudentUnderCare[];
    mainLeaderHistory: MainLeaderHistory[];
    currentMainLeader: CurrentMainLeader | null;
}

const tabs = [
    { id: 'all', label: 'All', icon: FiActivity },
    { id: 'rooms', label: 'Rooms', icon: FiHome },
    { id: 'groups', label: 'Groups', icon: FiUsers },
    { id: 'students', label: 'Students', icon: BsPersonCheck },
    { id: 'keys', label: 'Keys', icon: FiKey },
    { id: 'waiting-list', label: 'Waiting List', icon: FiClock },
    { id: 'main-leader', label: 'Main Leader', icon: BsPersonBadge },
];

function formatDateShort(dateString: string | null) {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString();
}

function formatTime(dateString: string | null) {
    if (!dateString) return '';
    const d = new Date(dateString);

    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function calculateDuration(startDate: string | null, endDate: string | null) {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

const LeaderHistory: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [leaderData, setLeaderData] = useState<LeaderHistoryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showAlert, setShowAlert] = useState(false);

    // Permission data state
    const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
    const [permissionLoading, setPermissionLoading] = useState(true);
    const [permissionError, setPermissionError] = useState<boolean>(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Fetch permission data on component mount
    useEffect(() => {
        const loadPermissions = async () => {
            try {
                setPermissionLoading(true);
                setPermissionError(false);
                const data = await fetchPermissionData();
                setPermissionData(data);
                
                // Check if user is admin or co-admin
                const isAdmin = isAdminOrCoAdmin(data);
                if (!isAdmin) {
                    setAccessDenied(true);
                    setErrorMessage("This page is only accessible to administrators");
                }
            } catch (error: any) {
                console.error('Failed to load permissions:', error);
                setPermissionData(null);
                setPermissionError(true);
                setAccessDenied(true);
                
                // Check for 403 Forbidden error
                if (error.message === 'Forbidden' || error.message?.includes('403')) {
                    setErrorMessage("Access Forbidden: You don't have permission to access this resource");
                } else if (error.message === 'Unauthorized' || error.message?.includes('401')) {
                    setErrorMessage("Unauthorized: Please log in to access this page");
                } else {
                    setErrorMessage(error.message || 'Failed to load permissions');
                }
            } finally {
                setPermissionLoading(false);
            }
        };

        loadPermissions();
    }, []);

    // Check if user is admin or co-admin using permissionData
    const isAllowed = permissionData && isAdminOrCoAdmin(permissionData);

    useEffect(() => {
        const loadData = async () => {
            if (!isAllowed) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                setAccessDenied(false); // Reset access denied state

                const leaderId = parseInt(id || '0', 10);
                if (leaderId === 0) {
                    setError('Invalid leader ID');
                    return;
                }

                const data = await leaderAPI.getHistory(leaderId);
                setLeaderData(data);
            } catch (error) {
                console.error('Failed to load leader history:', error);
                
                // Check if it's a 403 Forbidden error
                const errorMsg = error instanceof Error ? error.message : 'Failed to load leader history';
                
                // Handle 403 Forbidden specifically
                if (errorMsg.toLowerCase().includes('forbidden') || 
                    errorMsg.includes('403') ||
                    errorMsg.toLowerCase().includes('permission')) {
                    setAccessDenied(true);
                    setErrorMessage("Access Forbidden: You don't have permission to view this leader's history");
                } else if (errorMsg.toLowerCase().includes('unauthorized') || 
                           errorMsg.includes('401')) {
                    setAccessDenied(true);
                    setErrorMessage("Unauthorized: Please log in to access this page");
                } else {
                    setError(errorMsg);
                }
            } finally {
                setLoading(false);
            }
        };

        if (isAllowed) {
            loadData();
        } else if (permissionData && !permissionLoading && !accessDenied) {
            // User is logged in but not admin/co-admin
            setAccessDenied(true);
            setErrorMessage("This page is only accessible to administrators");
        }
    }, [id, isAllowed, permissionData, permissionLoading]);

    // Calculate stats
    const stats = leaderData ? [
        {
            label: 'Rooms',
            value: leaderData.roomHistory.length,
            icon: FiHome,
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600'
        },
        {
            label: 'Groups',
            value: leaderData.followingGroupHistory.length + leaderData.subGroupHistory.length,
            icon: FiUsers,
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-600'
        },
        {
            label: 'Students',
            value: leaderData.currentStudentsUnderCare.length,
            icon: BsPersonCheck,
            bgColor: 'bg-teal-100',
            textColor: 'text-teal-600'
        },
        {
            label: 'Keys',
            value: leaderData.keyTransactions.length,
            icon: FiKey,
            bgColor: 'bg-amber-100',
            textColor: 'text-amber-600'
        },
    ] : [];

    const handleDisabledEditClick = () => {
        if (leaderData?.status?.toLowerCase() !== 'registered') {
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 5000);
        }
    };

    const handleDisabledReplacementClick = () => {
        if (leaderData?.status?.toLowerCase() !== 'present') {
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 5000);
        }
    };

    // Show loading while permissions are loading
    if (permissionLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
                <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-[11px] border-b border-gray-100">
                    <div className="max-w-6xl mx-auto flex justify-between items-center min-h-[36px]">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
                            >
                                <FiArrowLeft /> Back
                            </button>
                            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
                            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                                Leader History
                            </h1>
                        </div>
                    </div>
                </div>
                <LeaderHistorySkeleton />
            </div>
        );
    }

    // Show access denied if not admin/co-admin OR if API returned 403
    if (!isAllowed || accessDenied || permissionError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
                <AccessAlert message={errorMessage || "You do not have access to view this leader's history."} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
                <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-[11px] border-b border-gray-100">
                    <div className="max-w-6xl mx-auto flex justify-between items-center min-h-[36px]">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
                            >
                                <FiArrowLeft /> Back
                            </button>
                            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
                            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                                Leader History
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button disabled className="flex items-center gap-2 px-4 py-2 border border-pink-200 bg-pink-50 text-pink-700 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed">
                                <FiActivity /> Replacement
                            </button>
                            <button disabled className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70">
                                <FiEdit /> Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
                <LeaderHistorySkeleton />
            </div>
        );
    }

    if (error || !leaderData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
                <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-[11px] border-b border-gray-100">
                    <div className="max-w-6xl mx-auto flex justify-between items-center min-h-[36px]">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
                            >
                                <FiArrowLeft /> Back
                            </button>
                            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
                            <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                                Leader History
                            </h1>
                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto py-16 px-4">
                    <EmptyState
                        title="Error Loading Data"
                        message={error || 'Failed to load leader history'}
                        buttonText="Go Back"
                        navigatePath={`/user/leader/${id}`}
                    />
                </div>
            </div>
        );
    }

    const isPresent = leaderData.status?.toLowerCase() === 'present';
    const isRegistered = leaderData.status?.toLowerCase() === 'registered';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-[11px] border-b border-gray-100">
                <div className="max-w-6xl mx-auto flex justify-between items-center min-h-[36px]">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
                        >
                            <FiArrowLeft /> Back
                        </button>
                        <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
                        <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                            Leader History
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <button
                                onClick={() => {
                                    if (isPresent || isRegistered) {
                                        navigate(`/user/leader/replacement/${leaderData.id}`);
                                    } else {
                                        handleDisabledReplacementClick();
                                    }
                                }}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition text-sm font-medium ${
                                    isPresent
                                        ? 'border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100'
                                        : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <FiActivity /> Replacement
                            </button>
                            {!isPresent && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 text-white text-[11px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                    Only leaders with status "Present" can make replacements
                                </div>
                            )}
                        </div>

                        <div className="relative group">
                            <button
                                onClick={() => {
                                    if (isRegistered) {
                                        navigate(`/user/leader/edit/${leaderData.id}`);
                                    } else {
                                        handleDisabledEditClick();
                                    }
                                }}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition text-sm font-medium ${
                                    isRegistered
                                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                        : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <FiEdit />
                                Edit Profile
                            </button>
                            {!isRegistered && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 text-white text-[11px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                    Only leaders with status "Registered" can be edited.
                                </div>
                            )}
                        </div>

                        {/* Alert for disabled actions */}
                        {showAlert && !isPresent && (
                            <div className="absolute top-full right-0 mt-2 bg-red-50 border border-red-200 text-red-700 text-xs p-2 rounded shadow-lg animate-pulse">
                                This action is only available for leaders with status "Present"
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Leader Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                {leaderData.name
                                    ? leaderData.name.substring(0, 2).toUpperCase()
                                    : "NA"}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 capitalize">{leaderData.name}</h2>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        leaderData.status?.toLowerCase() === 'present' ? 'bg-green-100 text-green-700' :
                                        leaderData.status?.toLowerCase() === 'registered' ? 'bg-orange-100 text-orange-700' :
                                        leaderData.status?.toLowerCase() === 'absent' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-700'
                                    }`}>
                                        {leaderData.status ? leaderData.status.charAt(0).toUpperCase() + leaderData.status.slice(1) : ""}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:pl-6 sm:border-l border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <FiUser className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Gender</p>
                                    <p className="text-sm font-medium text-slate-700 capitalize">{leaderData.gender}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                    <FiPhone className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</p>
                                    <p className="text-sm font-medium text-slate-700">{leaderData.phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                                <FiFilter className="w-4 h-4" />
                                <span>Filter</span>
                            </button>
                            <select className="px-4 py-2.5 border border-gray-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500/20">
                                <option>Last 30 days</option>
                                <option>Last 90 days</option>
                                <option>Last year</option>
                                <option>All time</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all duration-200 whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'bg-pink-50 text-pink-700 border-b-2 border-pink-500'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-8">
                    {/* Room History Section */}
                    {(activeTab === 'all' || activeTab === 'rooms') && leaderData.roomHistory.length > 0 && (
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                            <FiHome className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-800">Room History</h3>
                                            <p className="text-sm text-slate-500">Track all room assignments and changes</p>
                                        </div>
                                    </div>
                                    <span className="text-sm text-slate-500">Total: {leaderData.roomHistory.length}</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Room</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Source</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Released</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {leaderData.roomHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-slate-800">{item.roomName}</div>
                                                        <div className="text-xs text-slate-500">{item.roomCode}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-pink-50 text-pink-700 rounded-lg text-xs font-medium">
                                                        {item.sourceCode}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-800">{formatDateShort(item.assignedAt)}</div>
                                                    <div className="text-xs text-slate-500">{formatTime(item.assignedAt)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.releasedAt ? (
                                                        <>
                                                            <div className="text-sm text-slate-800">{formatDateShort(item.releasedAt)}</div>
                                                            <div className="text-xs text-slate-500">{formatTime(item.releasedAt)}</div>
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        item.isActive
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {item.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{item.assignedBy}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Groups Section */}
                    {(activeTab === 'all' || activeTab === 'groups') &&
                        (leaderData.followingGroupHistory.length > 0 || leaderData.subGroupHistory.length > 0) && (
                            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                                <FiUsers className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-800">Group Memberships</h3>
                                                <p className="text-sm text-slate-500">Following groups and subgroups</p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-slate-500">
                                            Total: {leaderData.followingGroupHistory.length + leaderData.subGroupHistory.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Following Groups */}
                                {leaderData.followingGroupHistory.length > 0 && (
                                    <>
                                        <div className="px-6 py-4 bg-gradient-to-r from-purple-50/50 to-white border-b border-gray-100">
                                            <h4 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                                                <BsPersonCheck className="w-4 h-4" />
                                                Following Groups
                                            </h4>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Group</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Added By</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {leaderData.followingGroupHistory.map((item) => (
                                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-slate-800">{item.groupName}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="capitalize text-sm text-slate-600">{item.role}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-slate-800">{formatDateShort(item.createdAt)}</div>
                                                                <div className="text-xs text-slate-500">{formatTime(item.createdAt)}</div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                    item.isActive
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                    {item.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-600">{item.createdBy}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}

                                {/* Sub Groups */}
                                {leaderData.subGroupHistory.length > 0 && (
                                    <>
                                        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-white border-y border-gray-100">
                                            <h4 className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                                                <BsPeople className="w-4 h-4" />
                                                Sub Groups
                                            </h4>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Group</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Added By</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {leaderData.subGroupHistory.map((item) => (
                                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-slate-800">{item.groupName}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="capitalize text-sm text-slate-600">{item.role}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-slate-800">{formatDateShort(item.createdAt)}</div>
                                                                <div className="text-xs text-slate-500">{formatTime(item.createdAt)}</div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                    item.isActive
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                    {item.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-600">{item.createdBy}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </section>
                        )}

                    {/* Students Under Care Section */}
                    {(activeTab === 'all' || activeTab === 'students') &&
                        (leaderData.currentStudentsUnderCare.length > 0 || leaderData.studentsUnderCare.length > 0) && (
                            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                                            <BsPersonCheck className="w-5 h-5 text-teal-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-800">Students Staying Under</h3>
                                            <p className="text-sm text-slate-500">Students currently under this leader's care</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Students */}
                                {leaderData.currentStudentsUnderCare.length > 0 && (
                                    <div className="p-6 bg-gradient-to-r from-teal-50 to-white border-b border-gray-100">
                                        <h4 className="text-sm font-semibold text-teal-700 mb-4 flex items-center gap-2">
                                            <BsPersonCheck className="w-4 h-4" />
                                            Currently Under Care ({leaderData.currentStudentsUnderCare.length})
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {leaderData.currentStudentsUnderCare.map((student) => (
                                                <div key={student.studentId} className="bg-white rounded-xl p-4 shadow-sm border border-teal-100">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h5 className="font-semibold text-slate-800 capitalize">{student.studentName}</h5>
                                                            <p className="text-xs text-slate-500 mt-1">Student ID: {student.studentId}</p>
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs font-medium">
                                                                    {student.sourceCode}
                                                                </span>
                                                                <span className="text-xs text-slate-500">
                                                                    {formatDateShort(student.assignedAt)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                            Active
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Students History */}
                                {leaderData.studentsUnderCare.length > 0 && (
                                    <>
                                        <div className="px-6 py-4 bg-gradient-to-r from-teal-50/50 to-white border-b border-gray-100">
                                            <h4 className="text-sm font-semibold text-teal-700 flex items-center gap-2">
                                                <FiClock className="w-4 h-4" />
                                                History
                                            </h4>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Source</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {leaderData.studentsUnderCare.map((item) => (
                                                        <tr key={item.studentId} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <span className="inline-flex px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium">
                                                                    {item.studentId}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="font-medium text-slate-800 capitalize">{item.studentName}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="inline-flex px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium">
                                                                    {item.sourceCode}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-slate-800">{formatDateShort(item.assignedAt)}</div>
                                                                <div className="text-xs text-slate-500">{formatTime(item.assignedAt)}</div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                                                    item.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                                                }`}>
                                                                    {item.isActive ? "Active" : "Inactive"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </section>
                        )}

                    {/* Key Transactions Section */}
                    {(activeTab === 'all' || activeTab === 'keys') && leaderData.keyTransactions.length > 0 && (
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                        <FiKey className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">Key Transactions</h3>
                                        <p className="text-sm text-slate-500">Room key issuance and returns</p>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Room</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Issued</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Returned</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Issued By</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Note</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {leaderData.keyTransactions.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-800">{item.roomName}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-800">{formatDateShort(item.issuedAt)}</div>
                                                    <div className="text-xs text-slate-500">{formatTime(item.issuedAt)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.returnedAt ? (
                                                        <>
                                                            <div className="text-sm text-slate-800">{formatDateShort(item.returnedAt)}</div>
                                                            <div className="text-xs text-slate-500">{formatTime(item.returnedAt)}</div>
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                                                        {calculateDuration(item.issuedAt, item.returnedAt)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{item.issuedBy}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{item.note || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Main Leader Section */}
                    {(activeTab === 'all' || activeTab === 'main-leader') &&
                        (leaderData.currentMainLeader || leaderData.mainLeaderHistory.length > 0) && (
                            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                            <BsPersonBadge className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-800">Main Leader History</h3>
                                            <p className="text-sm text-slate-500">Main leadership roles and assignments</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Main Leader */}
                                {leaderData.currentMainLeader && (
                                    <div className="p-6 bg-gradient-to-r from-orange-50 to-white border-b border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                                <BsPersonBadge className="w-6 h-6 text-orange-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-orange-800 mb-1">Current Main Leader</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide block">Room</span>
                                                        <span className="text-sm font-medium text-slate-800">{leaderData.currentMainLeader.roomName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide block">Since</span>
                                                        <span className="text-sm font-medium text-slate-800">{formatDateShort(leaderData.currentMainLeader.createdAt)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide block">Assigned By</span>
                                                        <span className="text-sm font-medium text-slate-800">{leaderData.currentMainLeader.createdBy}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Main Leader History */}
                                {leaderData.mainLeaderHistory.length > 0 && (
                                    <>
                                        <div className="px-6 py-4 bg-gradient-to-r from-orange-50/50 to-white border-b border-gray-100">
                                            <h4 className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                                                <FiClock className="w-4 h-4" />
                                                History
                                            </h4>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Room</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned By</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {leaderData.mainLeaderHistory.map((item) => (
                                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-slate-800">{item.roomName}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-slate-800">{formatDateShort(item.createdAt)}</div>
                                                                <div className="text-xs text-slate-500">{formatTime(item.createdAt)}</div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                    item.isActive
                                                                        ? 'bg-green-100 text-green-700'
                                                                        : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                    {item.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-600">{item.createdBy}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </section>
                        )}

                    {/* Waiting List Section */}
                    {(activeTab === 'all' || activeTab === 'waiting-list') && leaderData.waitingListHistory.length > 0 && (
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                        <FiClock className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">Waiting List History</h3>
                                        <p className="text-sm text-slate-500">Room waiting list entries</p>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Source</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {leaderData.waitingListHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium">
                                                        {item.sourceCode}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-800">{formatDateShort(item.createdAt)}</div>
                                                    <div className="text-xs text-slate-500">{formatTime(item.createdAt)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.assignedAt ? (
                                                        <div className="text-sm text-slate-800">{formatDateShort(item.assignedAt)} {formatTime(item.assignedAt)}</div>
                                                    ) : (
                                                        <span className="text-slate-400">Not assigned</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                                                        {calculateDuration(item.createdAt, item.assignedAt)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        item.isActive
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {item.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{item.assignedBy || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Empty State for tabs with no data */}
                    {activeTab !== 'all' && (
                        (activeTab === 'rooms' && leaderData.roomHistory.length === 0) ||
                        (activeTab === 'groups' && leaderData.followingGroupHistory.length === 0 && leaderData.subGroupHistory.length === 0) ||
                        (activeTab === 'students' && leaderData.currentStudentsUnderCare.length === 0 && leaderData.studentsUnderCare.length === 0) ||
                        (activeTab === 'keys' && leaderData.keyTransactions.length === 0) ||
                        (activeTab === 'waiting-list' && leaderData.waitingListHistory.length === 0) ||
                        (activeTab === 'main-leader' && !leaderData.currentMainLeader && leaderData.mainLeaderHistory.length === 0)
                    ) && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiActivity className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-2">No {tabs.find(t => t.id === activeTab)?.label} History</h3>
                                <p className="text-slate-500">No records found for this section.</p>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};

export default LeaderHistory;