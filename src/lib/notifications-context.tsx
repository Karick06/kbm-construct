'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Sample notifications that load on initial mount
const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Project Update',
    message: 'Your project "Reno Build" has been updated',
    type: 'info',
    timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    read: false,
    actionUrl: '/projects',
  },
  {
    id: '2',
    title: 'Approval Required',
    message: 'Purchase order #PO-2024-156 requires your approval',
    type: 'warning',
    timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
    read: false,
    actionUrl: '/purchase-orders',
  },
  {
    id: '3',
    title: 'Invoice Paid',
    message: 'Invoice #INV-2024-089 has been marked as paid',
    type: 'success',
    timestamp: new Date(Date.now() - 1 * 60 * 60000), // 1 hour ago
    read: false,
    actionUrl: '/invoices',
  },
  {
    id: '4',
    title: 'Contract Review',
    message: 'Client contract for "ABC Corp" is ready for review',
    type: 'info',
    timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
    read: true,
    actionUrl: '/contracts',
  },
  {
    id: '5',
    title: 'Timesheet Due',
    message: 'Your weekly timesheet is due by end of day',
    type: 'warning',
    timestamp: new Date(Date.now() - 4 * 60 * 60000), // 4 hours ago
    read: true,
    actionUrl: '/my-timesheets',
  },
  {
    id: '6',
    title: 'Leave Request Approved',
    message: 'Your leave request for 2024-02-20 has been approved',
    type: 'success',
    timestamp: new Date(Date.now() - 6 * 60 * 60000), // 6 hours ago
    read: true,
    actionUrl: '/leave',
  },
  {
    id: '7',
    title: 'Rate Update',
    message: 'Labour rates have been updated for Q1 2024',
    type: 'info',
    timestamp: new Date(Date.now() - 8 * 60 * 60000), // 8 hours ago
    read: true,
    actionUrl: '/labour-rates',
  },
  {
    id: '8',
    title: 'Team Message',
    message: 'New message from Sarah in the projects channel',
    type: 'info',
    timestamp: new Date(Date.now() - 10 * 60 * 60000), // 10 hours ago
    read: true,
    actionUrl: '/chat',
  },
  {
    id: '9',
    title: 'Compliance Alert',
    message: 'Safety incident report #SI-2024-042 has been filed',
    type: 'error',
    timestamp: new Date(Date.now() - 12 * 60 * 60000), // 12 hours ago
    read: true,
    actionUrl: '/hs-overview',
  },
];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.showNotification(newNotification.title, {
              body: newNotification.message,
              icon: '/icon-192.svg',
              badge: '/icon-192.svg',
              data: newNotification.actionUrl || '/',
              tag: `notif-${newNotification.id}`,
            });
          } else {
            new Notification(newNotification.title, { body: newNotification.message });
          }
        });
      } else {
        new Notification(newNotification.title, { body: newNotification.message });
      }
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
