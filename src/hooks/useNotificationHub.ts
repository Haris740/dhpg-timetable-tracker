import { useEffect, useRef, useState } from 'react';
import type { TimetableData, TaskData, CustomPeriod, TimetableOverrides, AppSettings } from '../types';
import { formatISODate, getScheduleForDate } from '../utils/time';
import { parse } from 'date-fns';

export function useNotificationHub(
  timetable: TimetableData | null,
  weeklyCustomPeriods: { [day: string]: CustomPeriod[] } = {},
  timetableOverrides: TimetableOverrides = {},
  taskData: TaskData = {},
  settings: AppSettings = { notificationsEnabled: true, notificationOffset: 0 }
) {
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
    if (
      (!timetable && Object.keys(taskData).length === 0) || 
      typeof Notification === 'undefined' || 
      permission !== 'granted' || 
      !settings.notificationsEnabled
    ) {
      clearAllTimers();
      return;
    }

    const scheduleDailyNotifications = () => {
      clearAllTimers();
      
      const now = new Date();
      const todayDateStr = formatISODate(now);
      const resolvedSchedule = getScheduleForDate(todayDateStr, timetable, weeklyCustomPeriods, timetableOverrides);
      const todaysTasks = taskData[todayDateStr] || [];
      
      console.log(`[NotificationHub] Checking schedule for ${todayDateStr}... permission: ${permission}, offset: ${settings.notificationOffset}`);
      
      // 1. Schedule Class Periods (Standard and Custom)
      resolvedSchedule.forEach(item => {
        if (item.isCanceled || !item.subject) return;

        const startTime = parse(`${todayDateStr} ${item.startTime24}`, 'yyyy-MM-dd HH:mm', now);
        // Calculate notification trigger time based on offset minutes
        const notificationTime = new Date(startTime.getTime() - (settings.notificationOffset || 0) * 60 * 1000);
        const diff = notificationTime.getTime() - now.getTime();

        if (diff > 0) {
          console.log(`[NotificationHub] Scheduling Class "${item.subject}" in ${Math.round(diff/1000)}s`);
          const timer = window.setTimeout(() => {
            const body = settings.notificationOffset > 0
              ? `Starting in ${settings.notificationOffset} mins in ${item.classroom || 'your room'} with ${item.teacher || 'your teacher'}.`
              : `Starting now in ${item.classroom || 'your room'} with ${item.teacher || 'your teacher'}.`;
            
            showNotification(
              `Class Alert: ${item.subject}`, 
              body, 
              `class-${item.id}`
            );
          }, diff);
          timersRef.current.push(timer);
        }
      });

      // 2. Schedule Personal Tasks (Notify at exact task start)
      todaysTasks.forEach(task => {
        if (task.completed) return;

        const startTime = parse(`${todayDateStr} ${task.startTime}`, 'yyyy-MM-dd HH:mm', now);
        const diff = startTime.getTime() - now.getTime();

        if (diff > 0) {
          console.log(`[NotificationHub] Scheduling Task "${task.title}" in ${Math.round(diff/1000)}s`);
          const timer = window.setTimeout(() => {
            showNotification(`Task Alert: ${task.title}`, `Your task "${task.title}" is starting now.`, `task-${task.id}`);
          }, diff);
          timersRef.current.push(timer);
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
  }, [timetable, weeklyCustomPeriods, timetableOverrides, taskData, settings, permission]);

  function clearAllTimers() {
    timersRef.current.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    timersRef.current = [];
  }

  function showNotification(title: string, body: string, tag: string) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const options = {
        body,
        icon: '/pwa-192x192.png',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        tag,
        renotify: true,
        requireInteraction: true
      };

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    }
  }

  return {
    isActive: permission === 'granted' && !!timetable && settings.notificationsEnabled,
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


