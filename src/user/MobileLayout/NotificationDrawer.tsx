import React from 'react';
import { FiBell, FiX, FiInfo, FiMail, FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '../../types/Notification/types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onNotificationClick
}) => {
  const navigate = useNavigate();

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just Now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h ago`;
    return then.toLocaleDateString();
  };

  const extractEmailFromMessage = (message: string): string => {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const matches = message.match(emailRegex);
    return matches ? matches[0] : '';
  };

  const getNotificationDetails = (n: Notification) => {
    if ('student' in n && n.student) {
      return {
        type: 'STUDENT',
        id: `#${n.student.studentId}`,
        title: n.student.name,
        color: 'blue',
        studentId: n.student.studentId,
        route: `/user/student/${n.student.studentId}`
      };
    }
    if ('leader' in n && n.leader) {
      return {
        type: 'LEADER',
        id: `#${n.leader.leaderId}`,
        title: n.leader.name,
        color: 'purple',
        leaderId: n.leader.leaderId,
        route: `/user/leader/${n.leader.leaderId}`
      };
    }
    return {
      type: 'EVENT',
      id: `#${n.eventId || '---'}`,
      title: 'Camp Update',
      color: 'indigo',
      route: `/event/${n.eventId}`
    };
  };

  const handleNotificationClick = (notification: Notification) => {
    const details = getNotificationDetails(notification);

    // Call the optional onNotificationClick prop if provided
    if (onNotificationClick) {
      onNotificationClick(notification);
    }

    // Navigate based on notification type
    if (details.route) {
      navigate(details.route);
      onClose(); // Close the drawer after navigation
    }
  };

  const handleViewDetailsClick = (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    handleNotificationClick(notification);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[90%] max-w-sm bg-slate-50 dark:bg-slate-900 z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <FiBell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Notifications</h2>
                  <p className="text-xs text-white/80">
                    {notifications.filter(n => !n.isRead).length} unread messages
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Actions Bar */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 shrink-0">
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span>Mark all read</span>
                </button>
                <button
                  onClick={onClearAll}
                  className="text-xs font-medium text-red-500 flex items-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <span>Clear all</span>
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence mode="popLayout">
                {notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4"
                  >
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                      <FiInfo className="w-12 h-12 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-700 dark:text-slate-300">No New Notifications</h3>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                        We'll let you know when there's something new for you.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  notifications.map((notification, idx) => {
                    const details = getNotificationDetails(notification);
                    const email = extractEmailFromMessage(notification.message);
                    const isStudent = details.type === 'STUDENT';
                    const isLeader = details.type === 'LEADER';

                    return (
                      <motion.div
                        key={notification.timestamp + idx}
                        onClick={() => handleNotificationClick(notification)}
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 35,
                            mass: 0.8,
                            opacity: { duration: 0.2 }
                          }
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.9,
                          y: -10,
                          transition: {
                            duration: 0.2,
                            ease: "easeOut"
                          }
                        }}
                        whileHover={{
                          scale: 1.01,
                          transition: { duration: 0.1 }
                        }}
                        className={`group relative overflow-hidden rounded-xl border p-4 transition-colors duration-200 cursor-pointer ${notification.isRead
                          ? 'bg-gray-50/50 dark:bg-gray-800/30'
                          : 'bg-white dark:bg-slate-900'
                          } ${isStudent
                            ? 'border-blue-100 dark:border-blue-900/50 hover:border-blue-400'
                            : isLeader
                              ? 'border-purple-100 dark:border-purple-900/50 hover:border-purple-400'
                              : 'border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-400'
                          }`}
                        style={{
                          transformOrigin: "top center",
                          willChange: "transform, opacity"
                        }}
                      >
                        {/* Top Row: The Tag and ID Box Combined */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-0">
                            {/* Role Tag */}
                            <div className={`px-2 py-1 text-[10px] font-black rounded-l-md border ${isStudent
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : isLeader
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'bg-indigo-600 border-indigo-600 text-white'
                              }`}>
                              {details.type}
                            </div>

                            {/* ID Box joined to the tag */}
                            <div className={`px-3 py-1 text-[11px] font-mono font-bold rounded-r-md border border-l-0 ${isStudent
                              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                              : isLeader
                                ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300'
                                : 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300'
                              }`}>
                              {details.id}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-gray-400">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                            {!notification.isRead && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                              />
                            )}
                          </div>
                        </div>

                        {/* Middle Row: Name and Message */}
                        <div className="space-y-1">
                          <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100 capitalize">
                            {details.title}
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                            {notification.message}
                          </p>
                        </div>

                        {/* Footer: Meta details */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="mt-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            {email && (
                              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                <FiMail size={12} className="shrink-0" />
                                <span className="truncate max-w-[150px]">{email}</span>
                              </div>
                            )}
                          </div>

                          <div
                            onClick={(e) => handleViewDetailsClick(e, notification)}
                            className="flex items-center gap-1 text-[10px] font-black text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                          >
                            <span>VIEW DETAILS</span>
                            <FiArrowRight size={12} />
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                onClick={onClose}
                className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl text-sm hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all active:scale-[0.98]"
              >
                CLOSE PANEL
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDrawer;
