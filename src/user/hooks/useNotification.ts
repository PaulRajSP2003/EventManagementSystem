import { useState, useEffect, useCallback, useRef } from 'react';
import signalRService from '../Services/signalRService';
import type { Notification } from '../../types/Notification/types';

export const useNotification = (eventId?: number) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const isInitialLoad = useRef(true);
  const storageKey = eventId ? `notifications-${eventId}` : 'notifications';

  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsedNotifications = JSON.parse(saved).map((n: Notification) => ({
            ...n,
            isRead: n.isRead ?? false
          }));

          setNotifications(parsedNotifications);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Failed to load notifications from localStorage:', error);
        setNotifications([]);
      }
    };

    loadFromStorage();
    isInitialLoad.current = false;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const newNotifications = JSON.parse(e.newValue);
          setNotifications(newNotifications);
        } catch (error) {
          console.error('Failed to parse storage event data:', error);
        }
      } else if (e.key === storageKey && !e.newValue) {
        setNotifications([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length; setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    if (isInitialLoad.current) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error);
    }
  }, [notifications, storageKey]);

  useEffect(() => {
    const checkConnection = setInterval(() => {
      setIsConnected(signalRService.isConnected());
    }, 3000);

    return () => clearInterval(checkConnection);
  }, []);

  useEffect(() => {
    const handleNotification = (notification: Notification) => {
      if (eventId && notification.eventId !== eventId) {
        return;
      }

      setNotifications(prev => {
        const exists = prev.some(n =>
          n.eventId === notification.eventId &&
          n.timestamp === notification.timestamp &&
          n.messageType === notification.messageType
        );

        if (exists) return prev;

        return [{ ...notification, isRead: false }, ...prev].slice(0, 50);
      });
    };

    const handleBulkNotifications = (bulkNotifications: Notification[]) => {
      const filteredNotifications = eventId
        ? bulkNotifications.filter(n => n.eventId === eventId)
        : bulkNotifications;

      if (filteredNotifications.length === 0) return;

      setNotifications(prev => {
        const newNotifications = filteredNotifications.filter(newNotif =>
          !prev.some(existingNotif =>
            existingNotif.eventId === newNotif.eventId &&
            existingNotif.timestamp === newNotif.timestamp &&
            existingNotif.messageType === newNotif.messageType
          )
        );

        const withReadStatus = newNotifications.map(n => ({
          ...n,
          isRead: false
        }));

        return [...withReadStatus, ...prev].slice(0, 50);
      });
    };

    signalRService.onNotification(handleNotification);
    signalRService.onBulkNotifications(handleBulkNotifications);

    return () => {
      signalRService.removeNotificationCallback(handleNotification);
      signalRService.removeBulkNotificationsCallback(handleBulkNotifications);
    };
  }, [eventId]);

  const markPersonNotificationsAsRead = useCallback((type: 'student' | 'leader', personId: number) => {
    setNotifications(prev => {
      const updated = prev.map(n => {
        if (type === 'student' && 'student' in n && n.student?.studentId === personId) {
          return { ...n, isRead: true };
        }
        if (type === 'leader' && 'leader' in n && n.leader?.leaderId === personId) {
          return { ...n, isRead: true };
        }
        return n;
      });
      return updated;
    });
  }, []);

  const markAsRead = useCallback((notificationId: number, type?: 'student' | 'leader', personId?: number) => {
    if (type && personId) {
      markPersonNotificationsAsRead(type, personId);
    } else {
      setNotifications(prev => {
        return prev.map(n => {
          if (n.eventId === notificationId) {
            return { ...n, isRead: true };
          }
          return n;
        });
      });
    }
  }, [markPersonNotificationsAsRead]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to remove notifications from localStorage:', error);
    }
  }, [storageKey]);

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