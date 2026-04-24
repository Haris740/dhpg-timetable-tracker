import { useEffect, useRef, useState } from 'react';
import { PERIOD_TIMINGS } from '../types';
import type { TimetableData } from '../types';
import { timeStringToDate } from '../utils/time';

export function useNotificationHub(timetable: TimetableData | null) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const timersRef = useRef<number[]>([]);

  // Function to refresh permission status
  const refreshPermission = () => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  };

  useEffect(() => {
    if (!timetable || typeof Notification === 'undefined' || permission !== 'granted') {
      clearAllTimers();
      return;
    }

    const scheduleDailyNotifications = () => {
      clearAllTimers();
      
      const now = new Date();
      const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
      const todaysSchedule = timetable[currentDay];
      
      console.log(`[NotificationHub] Checking schedule for ${currentDay}... permission: ${permission}`);
      
      if (!todaysSchedule) {
        console.log(`[NotificationHub] No schedule found for ${currentDay}`);
        return;
      }

      Object.entries(todaysSchedule).forEach(([periodNum, info]) => {
        const timing = PERIOD_TIMINGS.find(t => t.number === parseInt(periodNum));
        if (!timing || !info) return;

        const startTime = timeStringToDate(timing.startTime, now);
        const diff = startTime.getTime() - now.getTime();

        // If it's in the future (within the next 24 hours)
        if (diff > 0) {
          console.log(`[NotificationHub] Scheduling "${info.subject}" in ${Math.round(diff/1000)}s`);
          const timer = window.setTimeout(() => {
            console.log(`[NotificationHub] Triggering notification for ${info.subject}`);
            showNotification(info.subject, `Class starting in ${info.classroom || 'your room'} with ${info.teacher || 'your teacher'}.`);
          }, diff);
          timersRef.current.push(timer);
        } else {
          console.log(`[NotificationHub] Skipping past/current period: ${info.subject} (${timing.startTime})`);
        }
      });
    };

    scheduleDailyNotifications();

    // Re-schedule once a day at midnight
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    const timeToMidnight = nextMidnight.getTime() - new Date().getTime();
    
    const midnightTimer = window.setTimeout(() => {
      scheduleDailyNotifications();
      // After midnight, schedule the next midnight
      const dayTimer = window.setInterval(scheduleDailyNotifications, 24 * 60 * 60 * 1000);
      timersRef.current.push(dayTimer);
    }, timeToMidnight);
    
    timersRef.current.push(midnightTimer);

    return () => clearAllTimers();
  }, [timetable, permission]);

  function clearAllTimers() {
    timersRef.current.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    timersRef.current = [];
  }

  function showNotification(title: string, body: string) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const options = {
        body,
        icon: '/pwa-192x192.png',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        tag: `period-start-${title}`,
        renotify: true,
        requireInteraction: true
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(`Class Starting: ${title}`, options);
        });
      } else {
        new Notification(`Class Starting: ${title}`, options);
      }
    }
  }

  return {
    isActive: permission === 'granted' && !!timetable,
    permission,
    refreshPermission,
    requestPermission: async () => {
      if (typeof Notification !== 'undefined') {
        const res = await Notification.requestPermission();
        setPermission(res);
        return res;
      }
      return 'denied' as NotificationPermission;
    }
  };
}

