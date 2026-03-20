import React, { useState, useEffect } from 'react';
import {
    FiCheck,
    FiLoader,
    FiMapPin,
    FiActivity
} from 'react-icons/fi';

import Modal from './Modal';
import type { TaskListResponse } from '../../api/TaskData';
import { updateLeaderTasksStatus } from '../../api/TaskData';

interface TaskListEditProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: { leaderId: number, publicTaskId: string, isActive: boolean }) => void;
    taskMaster: TaskListResponse | null;
    token: string;
}

const TaskListEdit: React.FC<TaskListEditProps> = ({
    isOpen,
    onClose,
    onSuccess,
    taskMaster,
    token
}) => {
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (taskMaster) {
            setIsActive(taskMaster.taskMasterData.isActive);
        }
    }, [taskMaster, isOpen]);

    if (!taskMaster) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Determine action based on desired state
            const action = isActive ? 'active' : 'inactive';

            // Use leaderData.id as the leaderId (this matches your backend)
            const leaderId = taskMaster.leaderData.id;

            console.log('Updating task master status:', {
                leaderId,
                action,
                currentStatus: taskMaster.taskMasterData.isActive,
                newStatus: isActive
            });

            // Call the actual API
            const response = await updateLeaderTasksStatus(
                token,
                leaderId,
                action
            );

            console.log('Update successful:', response);
            onSuccess(response.data);
        } catch (err: any) {
            setError(err.message || 'Update failed');
            console.error('Update error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Master Operation Status">
            <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-600">
                        <FiCheck className="w-5 h-5 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-black uppercase tracking-widest">{error}</p>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 text-2xl font-black shadow-sm">
                        {taskMaster.leaderData.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{taskMaster.leaderData.name}</h3>
                        <div className="flex items-center gap-3 text-slate-400 font-bold text-xs uppercase tracking-widest">
                            <span className="flex items-center gap-1"><FiMapPin /> {taskMaster.leaderData.place}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{taskMaster.leaderData.type}</span>
                        </div>
                        {/* Optional: Display current status badge */}
                        <div className="mt-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${taskMaster.taskMasterData.isActive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                                }`}>
                                Current: {taskMaster.taskMasterData.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                            <FiActivity className="w-4 h-4" /> Operational Status
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setIsActive(true)}
                                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${isActive
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-4 ring-emerald-500/10'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                    }`}
                            >
                                <span className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'} transition-all`} />
                                <span className="font-bold text-xs uppercase tracking-widest">Active</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsActive(false)}
                                className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${!isActive
                                    ? 'bg-rose-50 border-rose-500 text-rose-700 ring-4 ring-rose-500/10'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                    }`}
                            >
                                <span className={`w-3 h-3 rounded-full ${!isActive ? 'bg-rose-500' : 'bg-slate-200'} transition-all`} />
                                <span className="font-bold text-xs uppercase tracking-widest">Inactive</span>
                            </button>
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-medium text-center px-4 leading-relaxed">
                        {isActive
                            ? "Activating will restore all tasks for this leader to operational status."
                            : "Deactivating a task master will pause all associated objectives but will not delete data. Re-activation will restore the operational status."
                        }
                    </p>

                    {/* Warning for no change */}
                    {isActive === taskMaster.taskMasterData.isActive && (
                        <div className="text-center text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                            ⚠️ Status is already {isActive ? 'Active' : 'Inactive'}
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-8 py-4 bg-slate-50 text-slate-400 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || isActive === taskMaster.taskMasterData.isActive}
                        className={`flex-[2] px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 ${loading || isActive === taskMaster.taskMasterData.isActive
                            ? 'opacity-50 cursor-not-allowed bg-slate-600'
                            : 'hover:bg-indigo-600 hover:-translate-y-1'
                            }`}
                    >
                        {loading ? (
                            <FiLoader className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <FiCheck className="w-5 h-5" /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default TaskListEdit;