import { parse, isWithinInterval, isAfter } from 'date-fns';
import type { PeriodTiming } from '../types';
import { PERIOD_TIMINGS } from '../types';

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
