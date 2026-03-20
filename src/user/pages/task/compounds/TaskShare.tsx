import React, { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { FaWhatsapp, FaEnvelope } from 'react-icons/fa6';
import Modal from './Modal';

interface TaskShareProps {
    isOpen: boolean;
    onClose: () => void;
    shareUrl: string;
    title?: string;         // Mission Title (e.g., *Group Class for Group A*)
    startTime?: string;     // Formatted Start Time
    endTime?: string;       // Formatted End Time
    duration?: string;      // Formatted Duration
    recipientName?: string; // Leader Name
    recipientGender?: 'male' | 'female';
    senderName?: string;
    senderRole?: string;
}

const TaskShare: React.FC<TaskShareProps> = ({
    isOpen,
    onClose,
    shareUrl,
    title = 'Share Tasks',
    startTime = 'TBD',
    endTime = 'TBD',
    duration = '',
    recipientName = '',
    recipientGender = 'male',
    senderName = 'Admin',
    senderRole = 'User Management'
}) => {
    const [copied, setCopied] = useState(false);

    const capitalizeWords = (str: string): string => {
        if (!str || str === '—') return str;
        return str.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };


    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const getDisplayRole = (role: string): string => {
        const r = role.toLowerCase();
        if (r === 'co-admin') return 'Co Admin';
        if (r === 'user') return 'User';
        if (r === 'admin') return 'Admin';
        return r.charAt(0).toUpperCase() + r.slice(1);
    };

    const formattedRecipientName = capitalizeWords(recipientName);
    const formattedSenderName = capitalizeWords(senderName);
    const formattedSenderRole = getDisplayRole(senderRole);
    const greeting = `Praise the Lord ${recipientGender === 'male' ? 'Bro' : 'Sis'} ${formattedRecipientName}`;

    const isProfileShare = title === 'Profile Task Details';

    // Format message for WhatsApp (using * for bold)
    const constructMessage = (isWhatsapp: boolean) => {
        const reminderText = isWhatsapp ? '*Task Reminder*' : 'Task Reminder';
        const titleText = isWhatsapp ? `*${title}*` : title;

        let message = `Bell ${reminderText}\n${greeting}\n\n`;

        if (isProfileShare) {
            message += `You can see all mission details here:\n${shareUrl}\n\n`;
        } else {
            message += `Mission Title: ${titleText}\n`;
            message += `Start: ${startTime}\n`;
            message += `End: ${endTime}`;
            if (duration) message += `\nDuration: ${duration}`;
            message += `\n\n📌 View details:\n${shareUrl}\n\n`;
        }

        message += `Be prepared and ready 👍\n\n`;
        message += `Regards,\n${formattedSenderName}\n${formattedSenderRole}\n\n`;
        message += `God bless you.`;

        return message.replace('Bell', '🔔');
    };

    const whatsappMessage = constructMessage(true);
    const emailBody = constructMessage(false);

    const shareLinks = [
        {
            name: 'WhatsApp',
            icon: <FaWhatsapp className="w-7 h-7 text-white" />,
            bg: 'bg-green-500',
            hoverBg: 'hover:bg-green-600',
            href: `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`
        },
        {
            name: 'Email',
            icon: <FaEnvelope className="w-6 h-6 text-white" />,
            bg: 'bg-slate-500',
            hoverBg: 'hover:bg-slate-600',
            href: `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodeURIComponent('🔔 Task Reminder: ' + title)}&body=${encodeURIComponent(emailBody)}`
        }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            widthClass="w-[95vw] max-w-[440px]"
            heightClass="h-auto max-h-[90vh]"
        >
            <div className="p-6 space-y-8 bg-white/50">
                {/* Social Share section */}
                <div className="space-y-4">
                    <div className="flex justify-center items-center gap-6">
                        {shareLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2.5 min-w-[72px] group"
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md ${link.bg} ${link.hoverBg}`}>
                                    {link.icon}
                                </div>
                                <span className="text-[13px] font-medium text-slate-600 group-hover:text-slate-900">
                                    {link.name}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Copy Link Form */}
                <div className="p-1 bg-slate-100/80 border border-slate-200 rounded-2xl relative flex items-center ring-1 ring-inset ring-slate-200/50">
                    <div className="flex-1 overflow-hidden px-4">
                        <input
                            readOnly
                            value={shareUrl}
                            className="w-full bg-transparent text-sm text-slate-700 font-medium outline-none select-all truncate text-center"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`px-6 py-3 font-bold text-sm rounded-xl flex items-center gap-2 shadow-sm whitespace-nowrap ${copied
                            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
                            }`}
                    >
                        {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default TaskShare;