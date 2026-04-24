import { useEffect, useRef } from 'react';
import { PERIOD_TIMINGS } from '../types';
import type { TimetableData } from '../types';
import { timeStringToDate } from '../utils/time';

export function useNotificationHub(timetable: TimetableData | null) {
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (!timetable || !('Notification' in window) || Notification.permission !== 'granted') {
      clearAllTimers();
      return;
    }

    const scheduleDailyNotifications = () => {
      clearAllTimers();
      
      const now = new Date();
      const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
      const todaysSchedule = timetable[currentDay];
      
      console.log(`[NotificationHub] Checking schedule for ${currentDay}...`);
      
      if (!todaysSchedule) {
        console.log(`[NotificationHub] No schedule found for ${currentDay}`);
        return;
      }

      Object.entries(todaysSchedule).forEach(([periodNum, info]) => {
        const timing = PERIOD_TIMINGS.find(t => t.number === parseInt(periodNum));
        if (!timing) return;

        const startTime = timeStringToDate(timing.startTime, now);
        const diff = startTime.getTime() - now.getTime();

        // If it's in the future (within the next 24 hours)
        if (diff > 0) {
          console.log(`[NotificationHub] Scheduling "${info.subject}" in ${Math.round(diff/1000)}s`);
          const timer = window.setTimeout(() => {
            console.log(`[NotificationHub] Triggering notification for ${info.subject}`);
            showNotification(info.subject, `Class starting in ${timing.classroom || 'your room'} with ${info.teacher || 'your teacher'}.`);
          }, diff);
          timersRef.current.push(timer);
        } else {
          console.log(`[NotificationHub] Skipping past period: ${info.subject} (${timing.startTime})`);
        }
      });
    };

    scheduleDailyNotifications();

    // Re-schedule once a day at midnight
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    const timeToMidnight = nextMidnight.getTime() - new Date().getTime();
    
    const midnightTimer = window.setTimeout(scheduleDailyNotifications, timeToMidnight);
    timersRef.current.push(midnightTimer);

    return () => clearAllTimers();
  }, [timetable]);

  function clearAllTimers() {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
  }

  function showNotification(title: string, body: string) {
    if (Notification.permission === 'granted') {
      // Use service worker notification if possible for better background performance
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(`Class Starting: ${title}`, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200],
            tag: `period-start-${title}`,
            renotify: true
          });
        });
      } else {
        new Notification(`Class Starting: ${title}`, { body, icon: '/pwa-192x192.png' });
      }
    }
  }

  return {
    isActive: Notification.permission === 'granted' && !!timetable,
    reschedule: () => {
        if (timetable) {
            // Force re-scheduling
            // This is effectively handled by the dependency array, but we can expose it
        }
    }
  };
}
