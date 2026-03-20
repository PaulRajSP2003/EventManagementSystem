import React, { useState, useEffect } from 'react';
import { isAdminOrCoAdmin, fetchPermissionData, type PermissionData } from '../permission';
import EmptyState from '../components/EmptyState';
import { useNavigate, useParams } from 'react-router-dom';
import { studentAPI } from '../api/StudentData';
import {
    FiActivity, FiEdit, FiSearch, FiFilter, FiHome, FiUsers, FiKey, FiUserPlus, FiCalendar, FiUser, FiClock,
    FiMail, FiPhone
} from 'react-icons/fi';
import { HiOutlineHeart, HiOutlineDocumentText } from 'react-icons/hi';
import { BsPersonCheck, BsPeople } from 'react-icons/bs';
import AccessAlert from '../components/AccessAlert';
import { StickyHeader } from '../components';

const SkeletonBlock = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const StudentHistorySkeleton = () => {
    return (
        <div className="max-w-6xl mx-auto px-4 mt-6">
            {/* Student Info Card Skeleton */}
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

interface Treatment {
    id: number;
    treaterName: string;
    description: string;
    createdAt: string;
    createdBy: string;
}

interface MedicalReport {
    id: number;
    reportId: number;
    title: string;
    description: string;
    severity: number;
    createdAt: string;
    createdBy: string;
    treatments: Treatment[];
}

interface ParentalStayer {
    id: number;
    stayingWith: number;
    leaderName: string;
    sourceCode: string;
    createdAt: string;
    isActive: boolean;
}

interface StudentHistoryResponse {
    id: number;
    primaryId: number;
    name: string;
    status: string;
    phone: string;
    place: string;
    roomHistory: RoomHistoryItem[];
    followingGroupHistory: GroupHistoryItem[];
    subGroupHistory: GroupHistoryItem[];
    waitingListHistory: WaitingListItem[];
    keyTransactions: KeyTransaction[];
    medicalReports: MedicalReport[];
    parentalStayersHistory: ParentalStayer[];
    currentParentalStayer: ParentalStayer | null;
}

const tabs = [
    { id: 'all', label: 'All', icon: FiActivity },
    { id: 'rooms', label: 'Rooms', icon: FiHome },
    { id: 'groups', label: 'Groups', icon: FiUsers },
    { id: 'medical', label: 'Medical', icon: HiOutlineHeart },
    { id: 'keys', label: 'Keys', icon: FiKey },
    { id: 'waiting-list', label: 'Waiting List', icon: FiClock },
    { id: 'parental', label: 'Parental', icon: FiUserPlus },
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

const StudentHistory: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [historyData, setHistoryData] = useState<StudentHistoryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [accessDenied, setAccessDenied] = useState(false);

    // Permission data state
    const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
    const [permissionLoading, setPermissionLoading] = useState(true);
    const [permissionError, setPermissionError] = useState<boolean>(false);
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
    const isAdmin = permissionData && isAdminOrCoAdmin(permissionData);

    useEffect(() => {
        // Only load history if user is admin and has access
        if (!isAdmin || accessDenied || permissionError) {
            setLoading(false);
            return;
        }

        const loadHistory = async () => {
            try {
                setLoading(true);
                setError(null);

                const studentId = parseInt(id || '0', 10);
                if (studentId === 0) {
                    setError('Invalid student ID');
                    return;
                }

                const data = await studentAPI.getHistory(studentId);
                setHistoryData(data);
            } catch (error) {
                console.error('Failed to load student history:', error);

                // Check if it's a 403 Forbidden error
                const errorMessage = error instanceof Error ? error.message : 'Failed to load student history';

                if (errorMessage.toLowerCase().includes('forbidden') ||
                    errorMessage.toLowerCase().includes('permission') ||
                    errorMessage.toLowerCase().includes('unauthorized')) {
                    setAccessDenied(true);
                    setErrorMessage(errorMessage);
                } else {
                    setError(errorMessage);
                }
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [id, isAdmin, accessDenied, permissionError]);

    const handleDisabledEditClick = () => {
        alert('Editing is disabled for this student');
    };

    // Show loading while permissions are loading
    if (permissionLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
                <StickyHeader title="Student History" />
                <StudentHistorySkeleton />
            </div>
        );
    }

    // Show access denied if not admin/co-admin or permission error
    if (!isAdmin || permissionError || accessDenied) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
                <AccessAlert message={errorMessage || "This page is only accessible to administrators."} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
                <StickyHeader title="Student History" />
                <StudentHistorySkeleton />
            </div>
        );
    }

    if (error || !historyData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
                <StickyHeader title="Student History" />
                <div className="max-w-6xl mx-auto py-16 px-4">
                    <EmptyState
                        title="Error Loading Data"
                        message={error || 'Failed to load student history'}
                        buttonText="Go Back"
                        navigatePath={`/user/student/${id}`}
                    />
                </div>
            </div>
        );
    }

    const {
        id: studentId,
        name,
        status,
        phone,
        place,
        roomHistory = [],
        followingGroupHistory = [],
        subGroupHistory = [],
        waitingListHistory = [],
        keyTransactions = [],
        medicalReports = [],
        parentalStayersHistory = [],
        currentParentalStayer
    } = historyData;

    const computedStats = [
        { label: 'Rooms', value: roomHistory.length, icon: FiHome, bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
        { label: 'Groups', value: followingGroupHistory.length + subGroupHistory.length, icon: FiUsers, bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
        { label: 'Medical', value: medicalReports.length, icon: HiOutlineHeart, bgColor: 'bg-rose-100', textColor: 'text-rose-600' },
        { label: 'Keys', value: keyTransactions.length, icon: FiKey, bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
    ];

    const filteredRoomHistory = roomHistory.filter(item =>
        item.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredFollowingGroupHistory = followingGroupHistory.filter(item =>
        item.groupName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSubGroupHistory = subGroupHistory.filter(item =>
        item.groupName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredWaitingListHistory = waitingListHistory.filter(item =>
        item.sourceCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredKeyTransactions = keyTransactions.filter(item =>
        item.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredMedicalReports = medicalReports.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredParentalHistory = parentalStayersHistory.filter(item =>
        item.leaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
            {/* Header */}
            <StickyHeader title="Student History">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/user/student/replacement/${studentId}`)}
                        className="flex items-center gap-2 px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
                    >
                        <FiActivity className="w-4 h-4" /> Replacement
                    </button>

                    <div className="relative group">
                        <button
                            onClick={() => {
                                if (status?.toLowerCase() === 'registered') {
                                    navigate(`/user/student/edit/${studentId}`);
                                } else {
                                    handleDisabledEditClick();
                                }
                            }}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition text-sm font-medium ${
                                status?.toLowerCase() === 'registered'
                                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                    : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            <FiEdit />
                            Edit Profile
                        </button>
                        {/* Tooltip - only shows when button is disabled */}
                        {status?.toLowerCase() !== 'registered' && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 text-white text-[11px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                Only status "Registered" students can be edited.
                            </div>
                        )}
                    </div>
                </div>
            </StickyHeader>

            {/* Main Content - Rest of the component remains exactly the same */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Student Info Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                {name ? name.substring(0, 2).toUpperCase() : "NA"}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 capitalize">{name}</h2>
                                <div className="flex items-center gap-4 mt-1">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status?.toLowerCase() === 'present' ? 'bg-green-100 text-green-700' :
                                        status?.toLowerCase() === 'registered' ? 'bg-orange-100 text-orange-700' :
                                            status?.toLowerCase() === 'absent' ? 'bg-red-100 text-red-700' :
                                                'bg-slate-100 text-slate-700'
                                        }`}>
                                        {status ? status.charAt(0).toUpperCase() + status.slice(1) : ""}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:pl-6 sm:border-l border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <FiMail className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Place</p>
                                    <p className="text-sm font-medium text-slate-700 capitalize">{place || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                    <FiPhone className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</p>
                                    <p className="text-sm font-medium text-slate-700">{phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {computedStats.map((stat, index) => (
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
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
                                <FiFilter className="w-4 h-4" />
                                <span>Filter</span>
                            </button>
                            <select className="px-4 py-2.5 border border-gray-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
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
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
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
                    {(activeTab === 'all' || activeTab === 'rooms') && filteredRoomHistory.length > 0 && (
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
                                    <span className="text-sm text-slate-500">Total: {filteredRoomHistory.length}</span>
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
                                        {filteredRoomHistory.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-slate-800">{item.roomName}</div>
                                                        <div className="text-xs text-slate-500">{item.roomCode}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
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
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.isActive
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
                        (filteredFollowingGroupHistory.length > 0 || filteredSubGroupHistory.length > 0) && (
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
                                            Total: {filteredFollowingGroupHistory.length + filteredSubGroupHistory.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Following Groups */}
                                {filteredFollowingGroupHistory.length > 0 && (
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
                                                    {filteredFollowingGroupHistory.map((item) => (
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
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.isActive
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
                                {filteredSubGroupHistory.length > 0 && (
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
                                                    {filteredSubGroupHistory.map((item) => (
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
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.isActive
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

                    {/* Medical Reports Section */}
                    {(activeTab === 'all' || activeTab === 'medical') && filteredMedicalReports.length > 0 && (
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                                        <HiOutlineHeart className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-800">Medical Reports</h3>
                                        <p className="text-sm text-slate-500">Health records and treatments</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                {filteredMedicalReports.map((report) => (
                                    <div key={report.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                                                    <HiOutlineDocumentText className="w-5 h-5 text-rose-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800 capitalize">{report.title}</h4>
                                                    <p className="text-sm text-slate-600 mt-1 capitalize">{report.description}</p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${report.severity === 1 ? 'bg-green-100 text-green-700' :
                                                report.severity === 2 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                Severity {report.severity}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                            <span className="flex items-center gap-1">
                                                <FiCalendar className="w-4 h-4" />
                                                {formatDateShort(report.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FiUser className="w-4 h-4" />
                                                {report.createdBy}
                                            </span>
                                        </div>

                                        {report.treatments && report.treatments.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <h5 className="text-sm font-semibold text-slate-700 mb-3">Treatments</h5>
                                                <div className="space-y-3">
                                                    {report.treatments.map((treatment) => (
                                                        <div key={treatment.id} className="bg-slate-50 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-medium text-slate-800 capitalize">{treatment.treaterName}</span>
                                                                <span className="text-xs text-slate-500">{formatDateShort(treatment.createdAt)}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-600 capitalize">{treatment.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Key Transactions Section */}
                    {(activeTab === 'all' || activeTab === 'keys') && filteredKeyTransactions.length > 0 && (
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
                                        {filteredKeyTransactions.map((item) => (
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

                    {/* Parental Stayers Section */}
                    {(activeTab === 'all' || activeTab === 'parental') &&
                        (currentParentalStayer || filteredParentalHistory.length > 0) && (
                            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                                            <FiUserPlus className="w-5 h-5 text-teal-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-800">Parental Stayers</h3>
                                            <p className="text-sm text-slate-500">Parent/guardian stay history</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Parental Stayer */}
                                {currentParentalStayer && (
                                    <div className="p-6 bg-gradient-to-r from-teal-50 to-white border-b border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                                                <BsPersonCheck className="w-6 h-6 text-teal-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-teal-800 mb-1">Current Parental Stayer</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide block">Leader</span>
                                                        <span className="text-sm font-medium text-slate-800">{currentParentalStayer.leaderName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide block">Source Code</span>
                                                        <span className="text-sm font-medium text-slate-800">{currentParentalStayer.sourceCode}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide block">Since</span>
                                                        <span className="text-sm font-medium text-slate-800">{formatDateShort(currentParentalStayer.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Parental Stayers History */}
                                {filteredParentalHistory.length > 0 && (
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
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Leader</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Source</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">From</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {filteredParentalHistory.map((item) => (
                                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-slate-800">{item.leaderName}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium">
                                                                    {item.sourceCode}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-slate-800">{formatDateShort(item.createdAt)}</div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.isActive
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-slate-100 text-slate-600'
                                                                    }`}>
                                                                    {item.isActive ? 'Active' : 'Inactive'}
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

                    {/* Waiting List Section */}
                    {(activeTab === 'all' || activeTab === 'waiting-list') && filteredWaitingListHistory.length > 0 && (
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
                                        {filteredWaitingListHistory.map((item) => (
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
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.isActive
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
                        (activeTab === 'rooms' && filteredRoomHistory.length === 0) ||
                        (activeTab === 'groups' && filteredFollowingGroupHistory.length === 0 && filteredSubGroupHistory.length === 0) ||
                        (activeTab === 'medical' && filteredMedicalReports.length === 0) ||
                        (activeTab === 'keys' && filteredKeyTransactions.length === 0) ||
                        (activeTab === 'waiting-list' && filteredWaitingListHistory.length === 0) ||
                        (activeTab === 'parental' && filteredParentalHistory.length === 0 && !currentParentalStayer)
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

export default StudentHistory;
