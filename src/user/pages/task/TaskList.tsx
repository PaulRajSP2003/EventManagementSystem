import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    FiSearch,
    FiEdit2,
    FiShare2,
    FiLoader,
    FiCalendar,
    FiMapPin,
    FiPlus,
    FiActivity,
    FiX,
    FiCheckCircle,
    FiChevronRight,
    FiFilter,
} from 'react-icons/fi';
import type { TaskListResponse } from '../api/TaskData';
import { getAllTasks, createTaskMaster } from '../api/TaskData';
import {
    isAdminOrCoAdmin,
    fetchPermissionData,
    type PermissionData
} from '../permission';
import { decryptData } from '../../utils/encryption';
import { StickyHeader, AccessAlert } from '../components';
import TaskListEdit from './compounds/TaskListEdit';
import LeaderListCompound from '../components/LeaderListCompound';
import Modal from './compounds/Modal';
import TaskShare from './compounds/TaskShare';
import EmptyState from '../components/EmptyState';
import type { Leader } from '../../../types';

// Skeleton component for loading state
const TaskListSkeleton = () => {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="h-12 bg-slate-50 border-b border-slate-200"></div>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 border-b border-slate-100 mx-4 flex items-center">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg mr-4"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                            <div className="h-2 bg-slate-50 rounded w-1/6"></div>
                        </div>
                        <div className="w-20 h-6 bg-slate-50 rounded-full"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

type FilterType = {
    id: string;
    name: string;
    gender: string;
    place: string;
    type: string;
    status: string;
};

const TaskList: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [tasks, setTasks] = useState<TaskListResponse[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<TaskListResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [permissionData, setPermissionData] = useState<PermissionData | null>(null);
    const [permissionLoading, setPermissionLoading] = useState(true);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskListResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState({ url: '', title: '' });

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<FilterType>({
        id: '',
        name: '',
        gender: '',
        place: '',
        type: '',
        status: ''
    });

    // Leader Selection State
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const storedData = localStorage.getItem('login-data');
            const decrypted = decryptData<{ token: string }>(storedData);
            const token = decrypted?.token || '';

            const response = await getAllTasks(token);
            if (response.success) {
                setTasks(response.data);
                setFilteredTasks(response.data);
            } else {
                setError(response.message);
            }
        } catch (err: any) {
            if (err.status === 403) {
                setError('403'); // special marker
            } else {
                setError(err.message || 'Failed to fetch tasks');
            }
            console.error(err.message || 'Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleTaskMasterUpdate = (data: { leaderId: number, publicTaskId: string, isActive: boolean }) => {
        setTasks(prev => prev.map(t =>
            t.taskMasterData.publicTaskId === data.publicTaskId
                ? { ...t, taskMasterData: { ...t.taskMasterData, isActive: data.isActive } }
                : t
        ));
        setEditModalOpen(false);
    };

    useEffect(() => {
        const init = async () => {
            try {
                setPermissionLoading(true);
                const perm = await fetchPermissionData();
                setPermissionData(perm);

                if (!isAdminOrCoAdmin(perm)) {
                    setPermissionLoading(false);
                    return;
                }
                await fetchTasks();

                // Handle initial modal state from navigation
                const state = location.state as { openAddModal?: boolean, leaderData?: Leader } | null;
                if (state?.openAddModal) {
                    setAddModalOpen(true);
                    if (state.leaderData) {
                        setSelectedLeader(state.leaderData);
                    }
                }
            } catch (err) {
                console.error("Permission error:", err);
            } finally {
                setPermissionLoading(false);
            }
        };
        init();
    }, [location.state]);

    useEffect(() => {
        let filtered = [...tasks];

        // Apply search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase().trim();
            const searchTerms = searchLower.split(/\s+/).filter(term => term.length > 0);

            filtered = filtered.filter(task => {
                const searchableText = [
                    String(task.leaderData.id || ''),
                    task.leaderData.name || '',
                    task.leaderData.place || '',
                    task.leaderData.type || '',
                    task.taskMasterData.createdBy || ''
                ].join(' ').toLowerCase();

                return searchTerms.every(term => searchableText.includes(term));
            });
        }

        // Apply individual filters
        if (filters.id) {
            const idFilter = filters.id.trim();
            filtered = filtered.filter(task => String(task.leaderData.id) === idFilter);
        }

        if (filters.name) {
            const nameSearchLower = filters.name.toLowerCase().trim();
            const nameTerms = nameSearchLower.split(/\s+/).filter(term => term.length > 0);
            filtered = filtered.filter(task => {
                const leaderName = task.leaderData.name.toLowerCase();
                return nameTerms.every(term => leaderName.includes(term));
            });
        }

        if (filters.gender) {
            filtered = filtered.filter(task => task.leaderData.gender === filters.gender);
        }

        if (filters.place) {
            const placeSearchLower = filters.place.toLowerCase().trim();
            const placeTerms = placeSearchLower.split(/\s+/).filter(term => term.length > 0);
            filtered = filtered.filter(task => {
                const leaderPlace = task.leaderData.place.toLowerCase();
                return placeTerms.every(term => leaderPlace.includes(term));
            });
        }

        if (filters.status) {
            filtered = filtered.filter(task =>
                filters.status === 'active' ? task.taskMasterData.isActive : !task.taskMasterData.isActive
            );
        }

        if (filters.type) {
            filtered = filtered.filter(task => task.leaderData.type === filters.type);
        }

        setFilteredTasks(filtered);
    }, [searchTerm, tasks, filters]);

    const handleCreateTaskMaster = async () => {
        if (!selectedLeader) return;

        try {
            setIsCreating(true);
            const storedData = localStorage.getItem('login-data');
            const decrypted = decryptData<{ token: string }>(storedData);
            const token = decrypted?.token || '';

            const response = await createTaskMaster(token, selectedLeader.id);
            if (response.success) {
                // Update local state even before navigation
                const newTask: TaskListResponse = {
                    leaderData: response.data.leaderData,
                    taskMasterData: response.data.taskMasterData
                };
                setTasks(prev => [newTask, ...prev]);

                setAddModalOpen(false);
                setModalError(null);
                navigate(`/user/task/${selectedLeader.id}/${response.data.taskMasterData.publicTaskId}`);
            } else {
                setModalError(response.message || "Failed to assign leader.");
            }
        } catch (err: any) {
            setModalError(err.message || "Operation failed.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleShareClick = (e: React.MouseEvent, task: TaskListResponse) => {
        e.stopPropagation();
        const shareUrl = `${window.location.origin}/user/task/${task.leaderData.id}/${task.taskMasterData.publicTaskId}`;
        setShareData({
            url: shareUrl,
            title: `Mission: ${task.leaderData.name}`
        });
        setShareModalOpen(true);
    };

    const handleEditClick = (e: React.MouseEvent, task: TaskListResponse) => {
        e.stopPropagation();
        setSelectedTask(task);
        setEditModalOpen(true);
    };

    const handleRowClick = (task: TaskListResponse) => {
        navigate(`/user/task/${task.leaderData.id}/${task.taskMasterData.publicTaskId}`);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilters({
            id: '',
            name: '',
            gender: '',
            place: '',
            type: '',
            status: ''
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatLeaderType = (type: string): string => {
        switch (type) {
            case 'leader1': return 'Leader 1';
            case 'leader2': return 'Leader 2';
            case 'guest': return 'Guest';
            case 'participant': return 'Participant';
            default: return type;
        }
    };

    if ((permissionData && !isAdminOrCoAdmin(permissionData)) || error === '403') {
        if (permissionLoading) return <TaskListSkeleton />; // Show skeleton inside full layout if needed, but normally handled by return below
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
                <AccessAlert message="Only Command Staff (Admins) may access the master operation logs." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-12">
            <StickyHeader title="Task Management">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setAddModalOpen(true); setModalError(null); }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium flex items-center gap-2"
                    >
                        <FiPlus className="w-4 h-4" /> New Task Profile
                    </button>
                </div>
            </StickyHeader>

            <main className="max-w-6xl mx-auto px-4 mt-2 sm:mt-8 space-y-6">
                {/* Search & Filter Bar */}
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <div className="p-4 border-b border-slate-50">
                        <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiSearch className="text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name, place, type..."
                                    className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg sm:bg-slate-50 bg-transparent text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <FiX className="text-slate-400 hover:text-slate-600" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all border ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'sm:bg-white bg-transparent border-slate-300 text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <FiFilter /> <span className="hidden xs:inline">Filters</span>
                                </button>
                                {(searchTerm || Object.values(filters).some(v => v)) && (
                                    <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-red-600 font-semibold px-1 sm:px-2 transition-colors">
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="p-3 border-b border-slate-100">
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Leader ID</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder=""
                                        value={filters.id}
                                        onChange={(e) => setFilters(p => ({ ...p, id: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Leader Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder=""
                                        value={filters.name}
                                        onChange={(e) => setFilters(p => ({ ...p, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Gender</label>
                                    <select
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={filters.gender}
                                        onChange={(e) => setFilters(p => ({ ...p, gender: e.target.value }))}
                                    >
                                        <option value="">All</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Place</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder=""
                                        value={filters.place}
                                        onChange={(e) => setFilters(p => ({ ...p, place: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Leader Type</label>
                                    <select
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={filters.type}
                                        onChange={(e) => setFilters(p => ({ ...p, type: e.target.value }))}
                                    >
                                        <option value="">All Types</option>
                                        <option value="leader1">Leader 1</option>
                                        <option value="leader2">Leader 2</option>
                                        <option value="participant">Participant</option>
                                        <option value="guest">Guest</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                                    <select
                                        className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={filters.status}
                                        onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Standby</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {(permissionLoading || loading) ? (
                    <TaskListSkeleton />
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden sm:block bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/80 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                                                ID
                                            </th>
                                            <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                                                Leader
                                            </th>
                                            <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                                                Created
                                            </th>
                                            <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                                                Created By
                                            </th>
                                            <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-center">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-wider text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {error ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4">
                                                    <EmptyState
                                                        icon="alert"
                                                        title="Synchronization Error"
                                                        description={error}
                                                        action={{ label: "Retry Intercept", onClick: fetchTasks }}
                                                    />
                                                </td>
                                            </tr>
                                        ) : filteredTasks.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4">
                                                    <EmptyState
                                                        icon={searchTerm || Object.values(filters).some(v => v) ? "search" : "inbox"}
                                                        title={searchTerm || Object.values(filters).some(v => v) ? "No Intelligence Found" : "No Active Missions"}
                                                        description={searchTerm || Object.values(filters).some(v => v) ? "Your search parameters yielded no results in the current log." : "No mission masters have been initialized for this operation yet."}
                                                        buttonText={searchTerm || Object.values(filters).some(v => v) ? "Clear Search" : "Initialize New Mission"}
                                                        onClick={searchTerm || Object.values(filters).some(v => v) ? clearFilters : () => { setAddModalOpen(true); setModalError(null); }}
                                                    />
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTasks.map((task) => (
                                                <tr
                                                    key={task.taskMasterData.publicTaskId}
                                                    onClick={() => handleRowClick(task)}
                                                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                                >
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-400 font-mono">
                                                        {task.leaderData.id}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-slate-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 text-sm">
                                                                {task.leaderData.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors capitalize">
                                                                    {task.leaderData.name}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                    <span className="flex items-center gap-1">
                                                                        <FiMapPin className="w-3 h-3" /> {task.leaderData.place}
                                                                    </span>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                                    <span className="capitalize">{formatLeaderType(task.leaderData.type)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                            <FiCalendar className="w-4 h-4 text-slate-400" />
                                                            {formatDate(task.taskMasterData.createdAt)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {task.taskMasterData.createdBy.split('@')[0]}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center justify-center w-20 py-1 text-[10px] uppercase font-bold rounded-full border ${task.taskMasterData.isActive
                                                            ? 'bg-green-50 text-green-700 border-green-100'
                                                            : 'bg-slate-50 text-slate-600 border-slate-200'
                                                            }`}>
                                                            {task.taskMasterData.isActive ? 'Active' : 'Standby'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={(e) => handleShareClick(e, task)}
                                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                                                                title="Share Mission"
                                                            >
                                                                <FiShare2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleEditClick(e, task)}
                                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                                                                title="Edit"
                                                            >
                                                                <FiEdit2 className="w-4 h-4" />
                                                            </button>
                                                            <div className="w-6 h-6 flex items-center justify-center text-slate-300 group-hover:text-indigo-400 transition-all group-hover:translate-x-1">
                                                                <FiChevronRight className="w-5 h-5" />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-4">
                            {filteredTasks.map((task) => (
                                <div
                                    key={task.taskMasterData.publicTaskId}
                                    onClick={() => handleRowClick(task)}
                                    className="rounded-xl border border-slate-200 overflow-hidden p-4 shadow-sm bg-white"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-slate-100 rounded-xl flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                                                {task.leaderData.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-base font-semibold text-slate-800 capitalize flex items-center gap-2">
                                                    {task.leaderData.name}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <FiMapPin className="w-3 h-3" /> {task.leaderData.place}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 text-[10px] uppercase font-bold rounded-full border ${task.taskMasterData.isActive
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-slate-50 text-slate-600 border-slate-200'
                                            }`}>
                                            {task.taskMasterData.isActive ? 'Active' : 'Standby'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm border-t border-slate-100 pt-3">
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Type</span>
                                            <span className="text-xs font-medium text-slate-700 capitalize">
                                                {formatLeaderType(task.leaderData.type)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Created</span>
                                            <span className="text-xs text-slate-600">
                                                {formatDate(task.taskMasterData.createdAt)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Created By</span>
                                            <span className="text-xs text-slate-600">
                                                {task.taskMasterData.createdBy.split('@')[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Actions</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <button
                                                    onClick={(e) => handleShareClick(e, task)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                                                >
                                                    <FiShare2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {error ? (
                                <EmptyState
                                    icon="alert"
                                    title="Synchronization Error"
                                    description={error}
                                    action={{ label: "Retry Intercept", onClick: fetchTasks }}
                                />
                            ) : filteredTasks.length === 0 ? (
                                <EmptyState
                                    icon={searchTerm || Object.values(filters).some(v => v) ? "search" : "inbox"}
                                    title={searchTerm || Object.values(filters).some(v => v) ? "No Intelligence Found" : "No Active Missions"}
                                    description={searchTerm || Object.values(filters).some(v => v) ? "Your search parameters yielded no results in the current log." : "No mission masters have been initialized for this operation yet."}
                                    buttonText={searchTerm || Object.values(filters).some(v => v) ? "Clear Search" : "Initialize New Mission"}
                                    onClick={searchTerm || Object.values(filters).some(v => v) ? clearFilters : () => { setAddModalOpen(true); setModalError(null); }}
                                />
                            ) : null}
                        </div>

                        {/* Results count */}
                        <div className="text-xs text-slate-400 px-2">
                            Showing {filteredTasks.length} of {tasks.length} total missions
                        </div>
                    </>
                )}
            </main>

            <TaskListEdit
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSuccess={handleTaskMasterUpdate}
                taskMaster={selectedTask}
                token={decryptData<{ token: string }>(localStorage.getItem('login-data'))?.token || ''}
            />

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => { setAddModalOpen(false); setSelectedLeader(null); setModalError(null); }}
                title="Create Task Profile"
            >
                <div className={`flex flex-col transition-all duration-500 ${selectedLeader ? 'space-y-0' : 'space-y-6'}`}>
                    {/* Collapsible Header Section */}
                    <div className={`
                        text-center space-y-2 flex-shrink-0 transition-all duration-500 ease-in-out overflow-hidden
                        ${selectedLeader ? 'max-h-0 opacity-0 scale-95' : 'max-h-40 opacity-100 scale-100'}
                    `}>
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-500 mb-4 border border-slate-100">
                            <FiActivity className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Select Target Leader</h3>
                        <p className="text-xs text-slate-400">
                            Authorization required for task profile initialization
                        </p>
                    </div>

                    {/* LeaderListCompound container */}
                    <div className="flex flex-col items-center flex-1 min-h-[300px] relative">
                        {modalError && (
                            <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-xs font-semibold mb-4 flex items-center gap-2">
                                <FiX className="shrink-0" />
                                <span>{modalError}</span>
                            </div>
                        )}
                        <LeaderListCompound
                            onLeaderSelect={(l) => { setSelectedLeader(l); setModalError(null); }}
                            initialLeaderId={selectedLeader?.id}
                            excludeIds={tasks.map(t => t.leaderData.id)}
                        />

                        {/* Leader Evaluation Card - only shrinks on deselect */}
                        <div className={`
                w-full overflow-hidden transition-all duration-300 ease-in-out
                ${selectedLeader ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}
            `}>
                            {selectedLeader && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                            {selectedLeader.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 truncate text-base capitalize">
                                                {selectedLeader.name}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                    <FiMapPin className="w-3 h-3 text-indigo-400" />
                                                    <span className="truncate">{selectedLeader.place}</span>
                                                </div>
                                                <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                <div className="px-2 py-0.5 bg-white border border-indigo-50 text-indigo-600 text-[10px] uppercase font-bold rounded-lg shadow-sm">
                                                    {formatLeaderType(selectedLeader.type)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => { setAddModalOpen(false); setSelectedLeader(null); }}
                            className="flex-1 px-8 py-4 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl font-medium text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                        >
                            <FiX className="w-4 h-4" /> Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!selectedLeader || isCreating}
                            onClick={handleCreateTaskMaster}
                            className={`flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-3 ${(!selectedLeader || isCreating)
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-indigo-700 hover:-translate-y-0.5'
                                }`}
                        >
                            {isCreating ? (
                                <FiLoader className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <FiCheckCircle className="w-5 h-5" /> Authorize Mission
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
            <TaskShare
                isOpen={isShareModalOpen}
                onClose={() => setShareModalOpen(false)}
                shareUrl={shareData.url}
                title={shareData.title}
            />
        </div>
    );
};

export default TaskList;