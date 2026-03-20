import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    widthClass?: string;
    heightClass?: string;
    hideHeader?: boolean;
}

const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children,
    widthClass = "max-w-xl",
    heightClass = "max-h-[90vh]",
    hideHeader = false
}) => {
    useEffect(() => {
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Body */}
            <div className={`relative bg-white rounded-3xl shadow-2xl w-full ${widthClass} ${heightClass} overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 ring-8 ring-white/10`}>
                {/* Header */}
                {!hideHeader && (
                    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className={`flex-1 overflow-y-auto ${hideHeader ? 'p-0' : 'p-8'} custom-scrollbar`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
