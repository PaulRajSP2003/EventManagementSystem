import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiUser, FiRefreshCw } from 'react-icons/fi';
import { getTaskChatMessages, sendChatMessage } from '../../api/TaskChatData';
import type { ChatMessage } from '../../api/TaskChatData';
import { decryptData } from '../../../utils/encryption';

interface TaskChatProps {
    taskDetailId: number;
    taskTitle: string;
    createdBy: string;
    permissionData?: any;
}

const TaskChat: React.FC<TaskChatProps> = ({ taskDetailId, taskTitle, permissionData }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUserEmail = permissionData?.email || '';

    const fetchMessages = async () => {
        try {
            const storedData = localStorage.getItem('login-data');
            const decrypted = decryptData<{ token: string }>(storedData);
            const token = decrypted?.token || '';

            const response = await getTaskChatMessages(taskDetailId, {
                'Authorization': `Bearer ${token}`
            });

            if (response.success && response.data) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error('Failed to load chat messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (taskDetailId) {
            fetchMessages();
        }
    }, [taskDetailId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const storedData = localStorage.getItem('login-data');
            const decrypted = decryptData<{ token: string }>(storedData);
            const token = decrypted?.token || '';

            const response = await sendChatMessage(taskDetailId, newMessage, {
                'Authorization': `Bearer ${token}`
            });

            if (response.success && response.data) {
                setMessages(prev => [...prev, response.data]);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const getSenderColor = (name: string) => {
        const colors = [
            'text-blue-600',
            'text-rose-600',
            'text-emerald-600',
            'text-amber-600',
            'text-purple-600',
            'text-cyan-600'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };


    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
    };

    return (
        <div className="flex flex-col h-full bg-[#efeae2] relative overflow-hidden font-sans">
            {/* Background Doodle Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: `url("https://www.transparenttextures.com/patterns/p6.png")`,
                    backgroundColor: '#efeae2'
                }}
            />

            {/* Header */}
            <div className="px-4 py-3 bg-[#f0f2f5] border-b border-slate-200 shrink-0 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold shadow-sm">
                            <FiUser className="w-6 h-6" />
                        </div>
                        <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight">{taskTitle || 'Operation Intel'}</h3>
                        <p className="text-[11px] text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                            Coordination Channel
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar z-10">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 opacity-60">
                        <div className="bg-white/50 px-4 py-2 rounded-lg text-[11px] uppercase tracking-widest font-bold border border-slate-200 shadow-sm text-slate-500">
                            Task Discussion Panel
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sentBy === currentUserEmail;
                        const senderName = msg.sentBy.split('@')[0];
                        const showName = !isMe && (index === 0 || messages[index - 1]?.sentBy !== msg.sentBy);
                        const isNextFromSame = messages[index + 1]?.sentBy === msg.sentBy;

                        return (
                            <div
                                key={msg.chatId || index}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isNextFromSame ? 'mb-0.5' : 'mb-3'}`}
                            >
                                <div
                                    className={`relative max-w-[90%] sm:max-w-[75%] px-3 py-2 shadow-sm transition-all duration-200 ${isMe
                                        ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-none'
                                        : 'bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-100'
                                        }`}
                                >
                                    {/* Bubble Tail */}
                                    {showName && !isMe && (
                                        <div className="absolute top-0 left-[-6px] w-3 h-3 bg-white" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
                                    )}
                                    {(index === 0 || messages[index - 1]?.sentBy !== msg.sentBy) && isMe && (
                                        <div className="absolute top-0 right-[-6px] w-3 h-3 bg-emerald-600" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
                                    )}

                                    {!isMe && showName && (
                                        <div className={`text-[11px] font-bold mb-0.5 tracking-wide uppercase ${getSenderColor(senderName)}`}>
                                            {senderName}
                                        </div>
                                    )}

                                    <div className="text-[14px] sm:text-[15px] leading-relaxed pr-8 min-w-[60px]">
                                        {msg.message}
                                    </div>

                                    <div className={`absolute bottom-1 right-2 flex items-center gap-1 opacity-70`}>
                                        <span className={`text-[9px] tabular-nums ${isMe ? 'text-emerald-50' : 'text-slate-400'}`}>
                                            {formatMessageTime(msg.sentAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-2.5 bg-[#f0f2f5] shrink-0 z-10">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fetchMessages()}
                        disabled={loading}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 bg-white text-slate-500 shadow-sm border border-slate-100 hover:bg-slate-50 active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Refresh Intelligence"
                    >
                        <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex-1 relative flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message"
                            className="w-full bg-transparent border-none text-slate-700 text-sm focus:outline-none py-1"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 ${newMessage.trim() && !sending
                            ? 'bg-emerald-600 text-white shadow-md active:scale-95'
                            : 'bg-white text-slate-400 shadow-sm border border-slate-100'
                            }`}
                    >
                        <FiSend className={`w-5 h-5 ${newMessage.trim() && !sending ? 'ml-0.5' : ''}`} />
                    </button>
                </form>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.1);
                    border-radius: 20px;
                }
            `}} />
        </div>
    );
};

export default TaskChat;
