import { useCallback } from 'react';
import { useSignalR } from '../context/SignalRContext';

export const useNotification = (_unused_eventId?: number) => {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    markPersonNotificationsAsRead
  } = useSignalR();

  const getFilteredNotifications = useCallback(
    (filter: 'all' | 'student' | 'leader') => {
      if (filter === 'all') return notifications;

      return notifications.filter(n =>
        filter === 'student' ? 'student' in n : 'leader' in n
      );
    },
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markPersonNotificationsAsRead,
    markAllAsRead,
    clearNotifications,
    getFilteredNotifications
  };
};
