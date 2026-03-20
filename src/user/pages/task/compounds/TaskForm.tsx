import React, { useState } from 'react';
import {
    FiCheck,
    FiLoader,
    FiAlertCircle,
    FiType,
    FiAlignLeft,
    FiCalendar,
    FiClock,
    FiPlus,
    FiX
} from 'react-icons/fi';
import Modal from './Modal';
import type { TaskDetailData } from '../../api/TaskData';
import { createTaskDetail, createTaskDetailRequest } from '../../api/TaskData';
import { decryptData } from '../../../utils/encryption';
import CalendarPicker from './CalendarPicker';
import ClockPicker from './ClockPicker';
import RichTextEditor from './RichTextEditor';

interface TaskFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (task: TaskDetailData) => void;
    publicTaskId: string;
}

const TaskForm: React.FC<TaskFormProps> = ({
    isOpen,
    onClose,
    onSuccess,
    publicTaskId
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Custom Pickers State
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [startTime, setStartTime] = useState<{ hour: number; minute: number } | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<{ hour: number; minute: number } | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError('Tasks title is required');
            return;
        }

        try {
            setLoading(true);
            const storedData = localStorage.getItem('login-data');
            const decrypted = decryptData<{ token: string }>(storedData);
            const token = decrypted?.token || '';

            // Combine Date & Time
            const finalStart = startDate && startTime ? new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate(),
                startTime.hour,
                startTime.minute
            ) : null;

            const finalEnd = endDate && endTime ? new Date(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate(),
                endTime.hour,
                endTime.minute
            ) : null;

            if (finalStart && finalEnd && finalStart >= finalEnd) {
                setError('End must be after start time');
                setLoading(false);
                return;
            }

            const normalizedDesc = (!description || description === '<br>') ? '' : description;
            const request = createTaskDetailRequest(
                title,
                normalizedDesc,
                finalStart,
                finalEnd
            );

            const response = await createTaskDetail(token, publicTaskId, request);

            if (response.success) {
                onSuccess(response.data);
                // Reset form
                setTitle('');
                setDescription('');
                setStartDate(null);
                setStartTime(null);
                setEndDate(null);
                setEndTime(null);
            } else {
                setError(response.message);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to initialize objective');
        } finally {
            setLoading(false);
        }
    };

    const getLiveStatus = () => {
        const now = new Date();
        const start = startDate && startTime ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startTime.hour, startTime.minute) : null;
        const end = endDate && endTime ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endTime.hour, endTime.minute) : null;

        if (start && now < start) {
            const ms = start.getTime() - now.getTime();
            const h = Math.floor(ms / (1000 * 60 * 60));
            const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            return { label: 'STANDBY', message: `Time to start: ${h}h ${m}m`, color: 'bg-blue-50 text-blue-700 border-blue-200' };
        }

        if (start && end && now >= start && now < end) {
            const ms = end.getTime() - now.getTime();
            const d = Math.floor(ms / (1000 * 60 * 60 * 24));
            const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            return { label: 'LIVE', message: `Time to end: ${d > 0 ? d + 'd ' : ''}${h}h ${m}m`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', pulse: true };
        }

        if (end && now >= end) {
            return { label: 'ENDED', message: 'Time Closed: End Passed', color: 'bg-rose-50 text-rose-700 border-rose-200' };
        }

        return { label: 'UNSCHEDULED', message: 'Set timeline to see status', color: 'bg-slate-50 text-slate-500 border-slate-200' };
    };

    const statusInfo = getLiveStatus();
    
    const getDuration = () => {
        const start = startDate && startTime ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startTime.hour, startTime.minute) : null;
        const end = endDate && endTime ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endTime.hour, endTime.minute) : null;

        if (!start || !end || start >= end) return null;
        
        const ms = end.getTime() - start.getTime();
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);

        return parts.length > 0 ? parts.join(' ') : '0m';
    };

    const duration = getDuration();



    // Compute whether start and end are on the same day
    const isSameDay = startDate && endDate &&
        startDate.getDate() === endDate.getDate() &&
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getFullYear() === endDate.getFullYear();


    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            widthClass="w-[90vw] max-w-7xl"
            heightClass="h-[90vh]"
            hideHeader={true}
        >
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row h-full overflow-hidden">
                {/* Left Column - Config */}
                <div className="w-full md:w-[35%] lg:w-[30%] flex flex-col border-r border-slate-200 bg-white relative">
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 z-10" />
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {/* Header Section */}
                        <div className="flex items-center justify-between mt-2 pb-6 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-100 shrink-0">
                                    <FiPlus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight">New Tasks</h3>
                                    <p className="text-sm text-slate-500">Initialize requirement</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all md:hidden"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-600">
                                <FiAlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                <FiType className="w-4 h-4" />
                                Tasks Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Initial Resource Assessment"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 transition-all text-slate-800"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Timeline */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-slate-500 flex items-center gap-2">
                                    <FiCalendar className="w-4 h-4" />
                                    Timeline
                                </label>
                                {duration && (
                                    <div className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Duration: {duration}
                                    </div>
                                )}
                            </div>

                            {/* Start */}
                            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 text-blue-600">
                                    <FiCalendar className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Start</span>
                                </div>
                                <CalendarPicker
                                    value={startDate}
                                    onChange={setStartDate}
                                    pickerTitle="Select Start Date"
                                    placeholder="Starting Date"
                                    maxDate={endDate || undefined}
                                    mode="single"
                                />
                                <ClockPicker
                                    value={startTime}
                                    onChange={setStartTime}
                                    pickerTitle="Select Start Time"
                                    maxTime={isSameDay && endTime ? endTime : undefined}
                                />
                            </div>

                            {/* End */}
                            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <FiClock className="w-4 h-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">End</span>
                                </div>
                                <CalendarPicker
                                    value={endDate}
                                    onChange={setEndDate}
                                    pickerTitle="Select End Date"
                                    placeholder="Ending Date"
                                    minDate={startDate || undefined}
                                    mode="single"
                                />
                                <ClockPicker
                                    value={endTime}
                                    onChange={setEndTime}
                                    pickerTitle="Select End Time"
                                    minTime={isSameDay && startTime ? startTime : undefined}
                                />
                            </div>
                        </div>

                        {/* Live Data Block */}
                        <div className={`p-4 rounded-xl border ${statusInfo.color} flex flex-col gap-2 items-center justify-center text-center mt-6`}>
                            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                {statusInfo.pulse && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                {statusInfo.label}
                            </span>
                            <span className="font-medium text-sm">{statusInfo.message}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Editor */}
                <div className="w-full md:w-[65%] lg:w-[70%] flex flex-col bg-slate-50/30 overflow-hidden">
                    <div className="hidden md:flex justify-end p-4 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 p-6 pt-0 md:pt-2 flex flex-col overflow-hidden">
                        <label className="text-xs font-medium text-slate-500 flex items-center gap-2 mb-2 shrink-0">
                            <FiAlignLeft className="w-4 h-4" />
                            Description
                        </label>
                        <div className="flex-1 flex flex-col h-full">
                            <RichTextEditor
                                value={description}
                                onChange={setDescription}
                                minHeight="100%"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0 rounded-br-3xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-100 hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <FiLoader className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <FiCheck className="w-5 h-5" />
                                    Deploy Tasks
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default TaskForm;