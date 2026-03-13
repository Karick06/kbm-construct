'use client';

import { useEffect } from 'react';

export default function RegisterServiceWorker() {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let hasRefreshed = false;

    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);

            // Check for updates periodically
            interval = setInterval(() => {
              registration.update();
            }, 60000); // Check every minute

            registration.addEventListener('updatefound', () => {
              const installing = registration.installing;
              if (!installing) return;
              installing.addEventListener('statechange', () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
                }
              });
            });

            navigator.serviceWorker.addEventListener('controllerchange', () => {
              if (hasRefreshed) return;
              hasRefreshed = true;
              window.location.reload();
            });
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => registration.unregister());
        });
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return null;
}
