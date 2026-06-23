import { parse, isWithinInterval, isAfter, format, addDays, areIntervalsOverlapping, getDay } from 'date-fns';
import type { PeriodTiming, DayTimetable, CustomPeriod, TimetableOverrides, SubjectInfo, TimetableData } from '../types';
import { PERIOD_TIMINGS, DAYS_OF_WEEK } from '../types';

/**
 * Converts "HH:mm AM/PM" string to a Date object with today's date.
 */
export const timeStringToDate = (timeStr: string, referenceDate: Date = new Date()): Date => {
  return parse(timeStr, 'hh:mm a', referenceDate);
};

/**
 * Finds the current period based on the given date.
 */
export const getCurrentPeriod = (now: Date = new Date()): PeriodTiming | undefined => {
  return PERIOD_TIMINGS.find((period) => {
    const start = timeStringToDate(period.startTime, now);
    const end = timeStringToDate(period.endTime, now);
    return isWithinInterval(now, { start, end });
  });
};

/**
 * Finds the next upcoming period.
 */
export const getNextPeriod = (now: Date = new Date()): PeriodTiming | undefined => {
  // If we are currently in a period, the next one is literally the next index
  const current = getCurrentPeriod(now);
  if (current) {
    const nextNum = current.number + 1;
    return PERIOD_TIMINGS.find(p => p.number === nextNum);
  }

  // If we are between periods, find the first one that starts after 'now'
  return PERIOD_TIMINGS.find((period) => {
    const start = timeStringToDate(period.startTime, now);
    return isAfter(start, now);
  });
};

/**
 * Checks if a period is in the past.
 */
export const isPastPeriod = (period: PeriodTiming, now: Date = new Date()): boolean => {
  const end = timeStringToDate(period.endTime, now);
  return isAfter(now, end);
};

/**
 * Checks if a period is currently active.
 */
export const isActivePeriod = (period: PeriodTiming, now: Date = new Date()): boolean => {
  const start = timeStringToDate(period.startTime, now);
  const end = timeStringToDate(period.endTime, now);
  return isWithinInterval(now, { start, end });
};

/**
 * Converts a time string to minutes since midnight for comparison.
 */
export const getMinutesSinceMidnight = (timeStr: string): number => {
  if (!timeStr) return 0;
  try {
    const date = parse(timeStr, timeStr.includes('M') ? 'hh:mm a' : 'HH:mm', new Date());
    return date.getHours() * 60 + date.getMinutes();
  } catch (e) {
    console.error("Failed to parse time:", timeStr);
    return 0;
  }
};

/**
 * Formats a date to ISO string (YYYY-MM-DD)
 */
export const formatISODate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Gets the date of the next occurring day (e.g., "Monday") starting from a reference date.
 * If referenceDate is that day, it returns referenceDate.
 */
export const getDateOfNextDay = (dayName: string, referenceDate: Date = new Date()): Date => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const targetDay = days.indexOf(dayName);
  const currentDay = referenceDate.getDay();
  
  let daysToAdd = targetDay - currentDay;
  if (daysToAdd < 0) daysToAdd += 7;
  
  return addDays(referenceDate, daysToAdd);
};

/**
 * Checks if two time intervals overlap.
 * Format: "HH:mm" or "hh:mm a"
 */
export const areTimesOverlapping = (
  start1: string, end1: string, 
  start2: string, end2: string,
  referenceDate: Date = new Date()
): boolean => {
  const s1 = parse(start1, start1.includes('M') ? 'hh:mm a' : 'HH:mm', referenceDate);
  const e1 = parse(end1, end1.includes('M') ? 'hh:mm a' : 'HH:mm', referenceDate);
  const s2 = parse(start2, start2.includes('M') ? 'hh:mm a' : 'HH:mm', referenceDate);
  const e2 = parse(end2, end2.includes('M') ? 'hh:mm a' : 'HH:mm', referenceDate);

  return areIntervalsOverlapping(
    { start: s1, end: e1 },
    { start: s2, end: e2 }
  );
};

/**
 * Gets the day name (e.g., "Monday") from a date.
 */
export const getDayName = (date: Date | string): string => {
  try {
    const d = typeof date === 'string' ? parse(date, 'yyyy-MM-dd', new Date()) : date;
    const dayIndex = getDay(d);
    return DAYS_OF_WEEK[dayIndex] || DAYS_OF_WEEK[0];
  } catch (e) {
    return DAYS_OF_WEEK[0];
  }
};

/**
 * Finds all periods that conflict with a given time range on a specific day.
 * Only counts periods that have an actual subject (not free periods).
 */
export const getScheduleConflicts = (
  startTime: string, 
  endTime: string, 
  dayTimetable: DayTimetable,
  referenceDate: Date = new Date()
): PeriodTiming[] => {
  return PERIOD_TIMINGS.filter(period => 
    dayTimetable[period.number] && // Only conflict if it's NOT a free period
    areTimesOverlapping(startTime, endTime, period.startTime, period.endTime, referenceDate)
  );
};

/**
 * Converts "HH:mm" 24-hour time to "hh:mm AM/PM" 12-hour time
 */
export const format24To12 = (time24: string): string => {
  if (!time24) return "";
  const [hourStr, minStr] = time24.split(":");
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const hourFormatted = hour12.toString().padStart(2, "0");
  return `${hourFormatted}:${minStr} ${ampm}`;
};

/**
 * Converts "hh:mm AM/PM" 12-hour time to "HH:mm" 24-hour time
 */
export const format12To24 = (time12: string): string => {
  if (!time12) return "";
  try {
    const date = parse(time12, 'hh:mm a', new Date());
    return format(date, 'HH:mm');
  } catch (e) {
    return time12;
  }
};

export interface DailyScheduleItem {
  id: string; // "period-1", "period-2", or custom ID
  subject: string;
  teacher?: string;
  classroom?: string;
  startTime: string; // "07:35 AM"
  endTime: string;   // "08:25 AM"
  startTime24: string; // "07:35"
  endTime24: string;   // "08:25"
  periodNumber?: number; // defined if standard period
  isCustom: boolean;
  isCanceled: boolean;
}

/**
 * Merges the standard timetable, custom weekly periods, and date overrides to produce the resolved schedule for a date.
 */
export const getScheduleForDate = (
  dateStr: string,
  timetable: TimetableData | null,
  weeklyCustomPeriods: { [day: string]: CustomPeriod[] } = {},
  overrides: TimetableOverrides = {}
): DailyScheduleItem[] => {
  const dayName = getDayName(dateStr);
  const items: DailyScheduleItem[] = [];

  // 1. Standard periods 1-8
  PERIOD_TIMINGS.forEach((timing) => {
    const pNumStr = timing.number.toString();
    const dateOverride = overrides[dateStr]?.periods?.[pNumStr];

    let info: SubjectInfo | null | undefined = undefined;

    if (dateOverride !== undefined) {
      info = dateOverride; // can be null (canceled) or SubjectInfo
    } else if (timetable && timetable[dayName]) {
      info = timetable[dayName][timing.number];
    }

    if (info !== undefined) {
      items.push({
        id: `period-${timing.number}`,
        subject: info ? info.subject : "",
        teacher: info?.teacher,
        classroom: info?.classroom,
        startTime: timing.startTime,
        endTime: timing.endTime,
        startTime24: format12To24(timing.startTime),
        endTime24: format12To24(timing.endTime),
        periodNumber: timing.number,
        isCustom: false,
        isCanceled: info === null,
      });
    } else {
      items.push({
        id: `period-${timing.number}`,
        subject: "",
        startTime: timing.startTime,
        endTime: timing.endTime,
        startTime24: format12To24(timing.startTime),
        endTime24: format12To24(timing.endTime),
        periodNumber: timing.number,
        isCustom: false,
        isCanceled: false,
      });
    }
  });

  // 2. Weekly custom periods
  const dayCustomPeriods = weeklyCustomPeriods[dayName] || [];
  dayCustomPeriods.forEach((cp) => {
    const dateOverride = overrides[dateStr]?.periods?.[cp.id];
    const isCanceled = dateOverride === null;
    const info = dateOverride !== undefined && dateOverride !== null ? dateOverride : cp;

    items.push({
      id: cp.id,
      subject: isCanceled ? "" : info.subject,
      teacher: isCanceled ? undefined : info.teacher,
      classroom: isCanceled ? undefined : info.classroom,
      startTime: format24To12(cp.startTime),
      endTime: format24To12(cp.endTime),
      startTime24: cp.startTime,
      endTime24: cp.endTime,
      isCustom: true,
      isCanceled,
    });
  });

  // 3. Temporary custom periods
  const tempCustomPeriods = overrides[dateStr]?.customPeriods || [];
  tempCustomPeriods.forEach((cp) => {
    items.push({
      id: cp.id,
      subject: cp.subject,
      teacher: cp.teacher,
      classroom: cp.classroom,
      startTime: format24To12(cp.startTime),
      endTime: format24To12(cp.endTime),
      startTime24: cp.startTime,
      endTime24: cp.endTime,
      isCustom: true,
      isCanceled: false,
    });
  });

  // Sort chronologically by start time
  return items.sort((a, b) => getMinutesSinceMidnight(a.startTime24) - getMinutesSinceMidnight(b.startTime24));
};

/**
 * Finds the currently active class in the schedule.
 */
export const getCurrentClass = (now: Date, schedule: DailyScheduleItem[]): DailyScheduleItem | undefined => {
  return schedule.find(item => {
    if (item.isCanceled || !item.subject) return false;
    const start = parse(item.startTime24, 'HH:mm', now);
    const end = parse(item.endTime24, 'HH:mm', now);
    return isWithinInterval(now, { start, end });
  });
};

/**
 * Finds the next active class in the schedule.
 */
export const getNextClass = (now: Date, schedule: DailyScheduleItem[]): DailyScheduleItem | undefined => {
  const upcoming = schedule.filter(item => {
    if (item.isCanceled || !item.subject) return false;
    const start = parse(item.startTime24, 'HH:mm', now);
    return isAfter(start, now);
  });
  return upcoming[0];
};

