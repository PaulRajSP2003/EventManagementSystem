import React from 'react';
import { 
    FiAlertTriangle, 
    FiTrash2, 
    FiX, 
    FiLoader,
    FiCheckSquare,
    FiUser
} from 'react-icons/fi';

interface TaskDeleteDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    mode: 'single' | 'all';
    itemName?: string; // For single delete: task title
    leaderName?: string; // For all delete: leader name
    loading?: boolean;
}

const TaskDeleteDialog: React.FC<TaskDeleteDialogProps> = ({
    open,
    onClose,
    onConfirm,
    mode,
    itemName,
    leaderName,
    loading
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="relative h-24 bg-rose-50 flex items-center justify-center overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 scale-150 rotate-12">
                         <FiAlertTriangle className="w-24 h-24 text-rose-600" />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shadow-xl shadow-rose-100 ring-4 ring-rose-50 border border-rose-200 animate-bounce-subtle">
                        <FiTrash2 className="w-8 h-8" />
                    </div>
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-rose-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all"
                        disabled={loading}
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 text-center space-y-4">
                    <h3 className="text-2xl font-bold text-slate-800 font-outfit uppercase tracking-tight">Confirm Deletion</h3>
                    <div className="space-y-3">
                        <p className="text-slate-500 font-medium leading-relaxed italic text-sm">
                            {mode === 'single' 
                                ? "Are you sure you want to delete this task? This action cannot be undone."
                                : "Are you sure you want to delete all tasks associated with this leader? This will deactivate everything related to them."
                            }
                        </p>
                        
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3 justify-center">
                            {mode === 'single' ? (
                                <>
                                    <FiCheckSquare className="text-indigo-500 w-5 h-5" />
                                    <span className="font-bold text-slate-700 uppercase tracking-tighter truncate max-w-[250px]">
                                        {itemName || 'Untitled Task'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <FiUser className="text-indigo-500 w-5 h-5" />
                                    <span className="font-bold text-slate-700 uppercase tracking-tighter truncate max-w-[250px]">
                                        {leaderName || 'Leader Information'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer / Buttons */}
                <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all uppercase tracking-widest text-xs"
                        disabled={loading}
                    >
                         Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-[1.5] flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-600 text-white rounded-2xl font-bold font-outfit uppercase tracking-widest text-xs shadow-xl shadow-rose-100 hover:bg-rose-700 hover:-translate-y-0.5 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <>
                                <FiLoader className="w-4 h-4 animate-spin text-rose-100" /> Deleting...
                            </>
                        ) : (
                            <>
                                <FiTrash2 className="w-4 h-4" /> Delete Permanently
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
                .animate-in {
                    animation: fade-in 0.2s ease-out;
                }
                .fade-in {
                    opacity: 0;
                    animation: fadeIn 0.2s forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .zoom-in-95 {
                    transform: scale(0.95);
                    animation: zoomIn 0.3s forwards cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes zoomIn {
                    from { transform: scale(0.95); }
                    to { transform: scale(1); }
                }
                .slide-in-from-bottom-4 {
                    transform: translateY(16px);
                    animation: slideIn 0.3s forwards cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideIn {
                    from { transform: translateY(16px); }
                    to { transform: translateY(0); }
                }
            `}} />
        </div>
    );
};

export default TaskDeleteDialog;
