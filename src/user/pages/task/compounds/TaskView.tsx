import React from 'react';
import {
    FiEye,
    FiType,
    FiAlignLeft,
    FiCalendar,
    FiClock,
    FiX,
    FiShare2
} from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import Modal from './Modal';
import TaskShare from './TaskShare';
import TaskChat from './TaskChat';
import type { TaskDetailData } from '../../api/TaskData';
import { canAccess, PAGE_PERMISSIONS } from '../../permission';

interface TaskViewProps {
    isOpen: boolean;
    onClose: () => void;
    task: TaskDetailData | null;
    permissionData?: any;
}

const TaskView: React.FC<TaskViewProps> = ({ isOpen, onClose, task, permissionData }) => {
    const [currentTime, setCurrentTime] = React.useState(new Date());
    const [isShareModalOpen, setShareModalOpen] = React.useState(false);
    const { leaderId, publicTaskId } = useParams<{ leaderId: string; publicTaskId: string }>();
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            // Give a small timeout for layout to finish
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = 0;
                }
            }, 100);
        }
    }, [isOpen]);

    // Update time every second - moved above early returns to follow Rules of Hooks
    React.useEffect(() => {
        if (!isOpen || !task) return;
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen, task]);

    if (!task) return null;
    if (!canAccess(permissionData, PAGE_PERMISSIONS.TASK_DETAILS)) return null;

    const handleShareClick = () => {
        setShareModalOpen(true);
    };

    const shareUrl = leaderId && publicTaskId && task ? `${window.location.origin}/user/task/${leaderId}/${publicTaskId}/${task.taskId}` : '';

    // Helper functions
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'Not set';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const formatTime = (dateString?: string | null) => {
        if (!dateString) return '--:--';
        try {
            return new Date(dateString).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '--:--';
        }
    };

    const calculateDuration = () => {
        if (!task || !task.start || !task.end) return null;
        try {
            const start = new Date(task.start);
            const end = new Date(task.end);
            const diffMs = end.getTime() - start.getTime();
            if (diffMs <= 0) return null;

            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            const parts = [];
            if (days > 0) parts.push(`${days}d`);
            if (hours > 0) parts.push(`${hours}h`);
            if (minutes > 0) parts.push(`${minutes}m`);

            return parts.length > 0 ? parts.join(' ') : '0m';
        } catch {
            return null;
        }
    };

    const getStatusColor = (active: boolean) => {
        return active ? {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-700',
            dot: 'bg-emerald-500',
            gradient: 'from-emerald-500 to-teal-500'
        } : {
            bg: 'bg-rose-50',
            border: 'border-rose-200',
            text: 'text-rose-700',
            dot: 'bg-rose-500',
            gradient: 'from-rose-500 to-pink-500'
        };
    };

    const statusColors = getStatusColor(task.isActive);

    const getLiveStatus = () => {
        const now = currentTime;
        const start = task.start ? new Date(task.start) : null;
        const end = task.end ? new Date(task.end) : null;

        if (!task.isActive)
            return {
                label: 'CLOSED',
                message: 'Mission Aborted / Closed',
                color: 'bg-slate-100 text-slate-600 border-slate-300'
            };

        if (start && now < start) {
            const ms = start.getTime() - now.getTime();

            const h = Math.floor(ms / (1000 * 60 * 60));
            const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((ms % (1000 * 60)) / 1000);

            return {
                label: 'STANDBY',
                message: `Time Left: ${h}h ${m}m ${s}s`,
                color: 'bg-blue-50 text-blue-700 border-blue-200'
            };
        }

        if (start && end && now >= start && now < end) {
            const ms = end.getTime() - now.getTime();

            const d = Math.floor(ms / (1000 * 60 * 60 * 24));
            const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((ms % (1000 * 60)) / 1000);

            return {
                label: 'LIVE',
                message: `Time to end: ${d > 0 ? d + 'd ' : ''}${h}h ${m}m ${s}s`,
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                pulse: true
            };
        }

        if (end && now >= end) {
            return {
                label: 'ENDED',
                message: 'Time Closed: End Passed',
                color: 'bg-rose-50 text-rose-700 border-rose-200'
            };
        }

        return {
            label: 'UNSCHEDULED',
            message: 'No timeline defined',
            color: 'bg-slate-50 text-slate-500 border-slate-200'
        };
    };

    const statusInfo = getLiveStatus();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            widthClass="w-full sm:w-[90vw] lg:w-[85vw] max-w-none"
            heightClass="h-full sm:h-[90vh]"
            hideHeader={true}
        >
            <div className="flex flex-col h-full overflow-hidden relative">
                {/* Mobile Header - only visible on small screens */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-white shrink-0">
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${statusColors.gradient} shrink-0`}>
                            <FiEye className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base leading-tight truncate">{task.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={handleShareClick}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            <FiShare2 className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Desktop Global Controls */}
                <div className="hidden md:flex absolute top-4 right-4 z-[60] items-center gap-3">
                    <button
                        type="button"
                        onClick={handleShareClick}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:scale-105 transition-all active:scale-95"
                        title="Share Tasks Link"
                    >
                        <FiShare2 className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:scale-105 transition-all active:scale-95"
                        title="Close Mission View"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Main scrollable container on mobile, fixed height on desktop */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 w-full bg-white md:h-[75vh] lg:h-[80vh] overflow-y-auto md:overflow-hidden"
                >
                    {/* Mobile: Stack vertically with auto height, Desktop: Row layout with shared height */}
                    <div className="flex flex-col md:flex-row md:h-full">
                        <div className="w-full md:w-[25%] lg:w-[25%] flex flex-col border-r border-slate-200 bg-white relative shrink-0 md:overflow-y-auto custom-scrollbar md:h-full">
                            <div className={`hidden md:block absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${statusColors.gradient} z-10`} />
                            <div className="p-4 sm:p-5 space-y-5">
                                {/* Header Section - hidden on mobile as it's in global header */}
                                <div className="hidden md:flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${statusColors.gradient} shadow-${task.isActive ? 'emerald' : 'rose'}-100 shrink-0`}>
                                            <FiEye className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{task.title}</h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Display */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${statusColors.dot}`} />
                                        Operational Status
                                    </label>
                                    <div className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${statusColors.bg} ${statusColors.border} ${statusColors.text}`}>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded-full ${task.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                            <span className="font-bold uppercase tracking-widest">{task.isActive ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                        <FiType className="w-4 h-4" />
                                        Tasks Title
                                    </label>
                                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium">
                                        {task.title}
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="space-y-4">
                                    <label className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                        <FiCalendar className="w-4 h-4" />
                                        Timeline
                                    </label>

                                    {/* Start */}
                                    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex items-center justify-between text-blue-600 mb-2">
                                            <div className="flex items-center gap-2">
                                                <FiCalendar className="w-4 h-4" />
                                                <span className="text-xs font-medium uppercase tracking-wider">Start</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 flex items-center gap-2">
                                                <FiCalendar className="text-slate-400" />
                                                {formatDate(task.start)}
                                            </div>
                                            <div className="px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 flex items-center gap-2">
                                                <FiClock className="text-slate-400" />
                                                {formatTime(task.start)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* End */}
                                    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="flex items-center justify-between text-emerald-600 mb-2">
                                            <div className="flex items-center gap-2">
                                                <FiClock className="w-4 h-4" />
                                                <span className="text-xs font-medium uppercase tracking-wider">End</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 flex items-center gap-2">
                                                <FiCalendar className="text-slate-400" />
                                                {formatDate(task.end)}
                                            </div>
                                            <div className="px-3 py-2 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 flex items-center gap-2">
                                                <FiClock className="text-slate-400" />
                                                {formatTime(task.end)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    {calculateDuration() && (
                                        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FiClock className="text-indigo-500 w-4 h-4" />
                                                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider text-[10px]">Total Duration</span>
                                            </div>
                                            <span className="font-black text-indigo-600 text-sm">
                                                {calculateDuration()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Live Data Block - Glass Morph (Compact) */}
                                <div className={`relative mt-4 overflow-hidden rounded-2xl ${statusInfo.color}`}>

                                    {/* Background blur effect */}
                                    <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-xl" />

                                    {/* Content */}
                                    <div className="relative p-4 border border-white/50 dark:border-black/50">

                                        {/* Header */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-1 h-5 rounded-full bg-current opacity-50" />

                                            <div className="flex flex-col gap-1">
                                                {/* Line 1 */}
                                                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                                                    {statusInfo.label}
                                                </span>

                                                {/* Line 2 */}
                                                {statusInfo.pulse && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[9px] font-mono uppercase opacity-70">
                                                            Live
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 h-px bg-current opacity-20 self-center" />
                                        </div>

                                        {/* Main Message - Reduced Size */}
                                        <div className="my-4 text-center">
                                            <span className="text-2xl md:text-3xl font-black tracking-tight leading-none">
                                                {statusInfo.message}
                                            </span>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-end mt-3 pt-2 border-t border-current/20">
                                            <div className="text-[9px] font-mono opacity-60">
                                                {new Date().toLocaleTimeString()}
                                            </div>
                                        </div>

                                        {/* Corner accents */}
                                        <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-current/30" />
                                        <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-current/30" />
                                        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 border-current/30" />
                                        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 border-current/30" />
                                    </div>
                                </div>


                                {/* Created By Info */}
                                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium tracking-wide">Created By</span>
                                        <span className="text-slate-700 font-semibold">{task.createdBy || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium tracking-wide">Created At</span>
                                        <span className="text-slate-700 font-semibold">
                                            {task.createdAt ? (() => {
                                                const d = new Date(task.createdAt);
                                                const day = d.getDate().toString().padStart(2, '0');
                                                const month = d.toLocaleString('en-US', { month: 'short' });
                                                const year = d.getFullYear();
                                                let hours = d.getHours();
                                                const minutes = d.getMinutes().toString().padStart(2, '0');
                                                const ampm = hours >= 12 ? 'PM' : 'AM';
                                                hours = hours % 12;
                                                hours = hours ? hours : 12;
                                                const hoursStr = hours.toString().padStart(2, '0');
                                                return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
                                            })() : 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Column - Editor Display */}
                        <div className="w-full md:w-[50%] lg:w-[50%] flex flex-col bg-slate-50/30 md:overflow-y-auto custom-scrollbar border-r border-slate-200 shrink-0 md:h-full">
                            <div className="p-4 sm:p-6 flex flex-col md:min-h-full">
                                <label className="text-xs font-medium text-slate-500 flex items-center gap-2 mb-2 shrink-0">
                                    <FiAlignLeft className="w-4 h-4" />
                                    Description
                                </label>
                                <div className="bg-transparent rounded-xl p-6 prose prose-sm max-w-none">
                                    {task.description ? (
                                        <div dangerouslySetInnerHTML={{ __html: task.description }} />
                                    ) : (
                                        <p className="text-slate-400 italic">No description provided.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Chat Column - Coordination Channel */}
                        <div className="w-full md:w-[25%] lg:w-[25%] flex flex-col bg-white overflow-hidden relative shrink-0 h-[500px] md:h-full">
                            <div className="flex-1 flex flex-col h-full bg-[#f8fafc]">
                                <TaskChat
                                    taskDetailId={task.taskId}
                                    taskTitle={task.title}
                                    createdBy={task.createdBy || 'Unknown'}
                                    permissionData={permissionData}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <TaskShare
                isOpen={isShareModalOpen}
                onClose={() => setShareModalOpen(false)}
                shareUrl={shareUrl}
                title={task.title}
            />
        </Modal>
    );
};

export default TaskView;