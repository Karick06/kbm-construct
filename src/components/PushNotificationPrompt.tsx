'use client';

import { useEffect, useState } from 'react';
import { syncQueuedRequests } from '@/lib/offline-first';

const DISMISS_KEY = 'kbm_push_prompt_dismissed';

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = localStorage.getItem(DISMISS_KEY) === 'true';
    const supportsNotifications = 'Notification' in window;
    const supportsSW = 'serviceWorker' in navigator;

    if (!dismissed && supportsNotifications && supportsSW && Notification.permission === 'default') {
      setShowPrompt(true);
    }

    const handleOnline = async () => {
      const result = await syncQueuedRequests();
      if (result.synced > 0 && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.showNotification('KBM Construct', {
            body: `${result.synced} offline update(s) synced successfully.`,
            icon: '/icon-192.svg',
            badge: '/icon-192.svg',
            data: '/timesheets-overview',
          });
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const enableNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setShowPrompt(false);

    if (permission === 'granted' && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        registration.showNotification('KBM Construct', {
          body: 'Push notifications enabled for updates and alerts.',
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          data: '/',
        });
      }
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-xl">
      <p className="text-sm font-semibold text-[var(--body-ink)]">Enable push notifications</p>
      <p className="mt-1 text-xs text-[var(--body-muted)]">Get alerts for timesheets, chat activity, and offline sync status.</p>
      <div className="mt-3 flex justify-end gap-2">
        <button onClick={dismissPrompt} className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--body-ink)]">
          Not now
        </button>
        <button onClick={enableNotifications} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white">
          Enable
        </button>
      </div>
    </div>
  );
}
