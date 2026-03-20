import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import signalRService from '../Services/signalRService';
import type { Notification } from '../../types/Notification/types';
import { useUserAuth } from '../pages/auth/UserAuthContext';
import { encryptData, decryptData } from '../utils/encryption';

interface SignalRContextType {
  isConnected: boolean;
  connectionState: string;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string | number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  markPersonNotificationsAsRead: (type: 'student' | 'leader', personId: number) => void;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export const SignalRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useUserAuth();
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isInitialLoad = useRef(true);

  const eventId = user?.eventId;
  const storageKey = eventId ? `notifications-${eventId}` : 'notifications';

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    try {
      const encrypted = localStorage.getItem(storageKey);
      const saved = decryptData<Notification[]>(encrypted);
      if (saved) {
        const parsed = saved.map((n: Notification) => ({
          ...n,
          isRead: n.isRead ?? false
        }));
        setNotifications(parsed);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    }
    isInitialLoad.current = false;
  }, [isAuthenticated, storageKey]);

  useEffect(() => {
    if (!isAuthenticated || isInitialLoad.current) return;
    try {
      localStorage.setItem(storageKey, encryptData(notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }, [notifications, storageKey, isAuthenticated]);

  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {


    if (isAuthenticated && eventId) {
      const startSignalR = async () => {
        if (!isAuthenticated || !eventId) return;

        try {

          signalRService.startConnection(eventId.toString()).catch(error => {
            console.error('[SignalR] Background connection failed:', error);
          });
        } catch (error) {
          console.error('[SignalR] Error in startSignalR wrapper:', error);
        }
      };

      startSignalR();

      const timerId = setTimeout(() => {
        if (isAuthenticated && eventId && !signalRService.isConnected()) {

          startSignalR();
        }
      }, 3000);

      const unsubscribe = signalRService.onConnectionStateChange((state) => {

        setConnectionState(state);
      });

      const handleNotification = (notification: Notification) => {
        if (eventId && notification.eventId !== eventId) return;

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

      const handleBulk = (bulk: Notification[]) => {
        const filtered = eventId ? bulk.filter(n => n.eventId === eventId) : bulk;
        if (filtered.length === 0) return;

        setNotifications(prev => {
          const fresh = filtered.filter(newN =>
            !prev.some(oldN =>
              oldN.eventId === newN.eventId &&
              oldN.timestamp === newN.timestamp &&
              oldN.messageType === newN.messageType
            )
          ).map(n => ({ ...n, isRead: false }));

          return [...fresh, ...prev].slice(0, 50);
        });
      };

      signalRService.onNotification(handleNotification);
      signalRService.onBulkNotifications(handleBulk);

      return () => {
        clearTimeout(timerId);
        unsubscribe();
        signalRService.removeNotificationCallback(handleNotification);
        signalRService.removeBulkNotificationsCallback(handleBulk);
      };
    } else if (!isAuthenticated) {

      signalRService.stopConnection();
      setConnectionState('disconnected');
    }
  }, [isAuthenticated, eventId]);

  const markAsRead = useCallback((id: string | number) => {
    setNotifications(prev => prev.map(n =>
      n.eventId === id ? { ...n, isRead: true } : n
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const markPersonNotificationsAsRead = useCallback((type: 'student' | 'leader', personId: number) => {
    setNotifications(prev => prev.map(n => {
      if (type === 'student' && 'student' in n && n.student?.studentId === personId) {
        return { ...n, isRead: true };
      }
      if (type === 'leader' && 'leader' in n && n.leader?.leaderId === personId) {
        return { ...n, isRead: true };
      }
      return n;
    }));
  }, []);

  return (
    <SignalRContext.Provider value={{
      isConnected: connectionState === 'connected',
      connectionState,
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      markPersonNotificationsAsRead
    }}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (context === undefined) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
};
