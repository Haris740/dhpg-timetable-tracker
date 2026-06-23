import { parse, format, addMonths } from 'date-fns';
import type { TimetableData, CustomPeriod, TimetableOverrides, TaskData } from '../types';
import { PERIOD_TIMINGS } from '../types';
import { format12To24, getDateOfNextDay, getDayName } from './time';

/**
 * Generates a Google Calendar template URL for a single event.
 */
export const generateGoogleCalendarUrl = (
  title: string,
  startTime: string, // "07:35 AM" or "07:35"
  endTime: string,   // "08:25 AM" or "08:25"
  dateStr: string,   // "YYYY-MM-DD"
  location: string = "",
  details: string = "",
  recurring: boolean = false
): string => {
  const s24 = startTime.includes('M') ? format12To24(startTime) : startTime;
  const e24 = endTime.includes('M') ? format12To24(endTime) : endTime;

  // Parse in local timezone
  const startDateTime = parse(`${dateStr} ${s24}`, 'yyyy-MM-dd HH:mm', new Date());
  const endDateTime = parse(`${dateStr} ${e24}`, 'yyyy-MM-dd HH:mm', new Date());

  const startStr = format(startDateTime, "yyyyMMdd'T'HHmmss");
  const endStr = format(endDateTime, "yyyyMMdd'T'HHmmss");

  const params: Record<string, string> = {
    action: 'TEMPLATE',
    text: title,
    dates: `${startStr}/${endStr}`,
    details: details,
    location: location
  };

  if (recurring) {
    params.recur = 'RRULE:FREQ=WEEKLY';
  }

  const searchParams = new URLSearchParams(params);

  return `https://calendar.google.com/calendar/render?${searchParams.toString()}`;
};

/**
 * Generates an iCalendar (.ics) file string representing all weekly classes, single tasks, and overrides.
 */
export const exportToICS = (
  timetable: TimetableData | null,
  weeklyCustomPeriods: { [day: string]: CustomPeriod[] } = {},
  overrides: TimetableOverrides = {},
  taskData: TaskData = {}
): string => {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Timetable Pro//Schedule Exporter//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const now = new Date();
  const recurrenceEnd = addMonths(now, 6); // Repeat weekly for 6 months
  const untilStr = format(recurrenceEnd, "yyyyMMdd'T'235959'Z'");

  const weekdayMap: Record<string, string> = {
    Sunday: 'SU',
    Monday: 'MO',
    Tuesday: 'TU',
    Wednesday: 'WE',
    Thursday: 'TH',
    Friday: 'FR',
    Saturday: 'SA'
  };

  // Helper to format Date to ICS date format (local)
  const formatICSDate = (date: Date): string => format(date, "yyyyMMdd'T'HHmmss");

  // Helper to find all dates in overrides that fall on a specific day of the week
  // to collect exclusion dates (EXDATE)
  const getExclusionDatesForPeriod = (
    dayName: string,
    periodId: string,
    startTime24: string
  ): string[] => {
    const exDates: string[] = [];
    Object.entries(overrides).forEach(([dateStr, dateOverride]) => {
      if (getDayName(dateStr) === dayName) {
        // If the period has an override (either canceled/null or modified)
        if (dateOverride.periods?.[periodId] !== undefined) {
          const dateObj = parse(`${dateStr} ${startTime24}`, 'yyyy-MM-dd HH:mm', new Date());
          exDates.push(formatICSDate(dateObj));
        }
      }
    });
    return exDates;
  };

  // 1. Export Standard Timetable (Recurring)
  if (timetable) {
    Object.entries(timetable).forEach(([dayName, dayPeriods]) => {
      const byDay = weekdayMap[dayName];
      if (!byDay) return;

      Object.entries(dayPeriods).forEach(([pNum, info]) => {
        if (!info) return;

        const timing = PERIOD_TIMINGS.find(t => t.number === parseInt(pNum));
        if (!timing) return;

        const s24 = format12To24(timing.startTime);
        const e24 = format12To24(timing.endTime);

        // Find the start date (the next occurrence of this weekday)
        const nextDate = getDateOfNextDay(dayName, now);
        const startDateTime = parse(`${format(nextDate, 'yyyy-MM-dd')} ${s24}`, 'yyyy-MM-dd HH:mm', new Date());
        const endDateTime = parse(`${format(nextDate, 'yyyy-MM-dd')} ${e24}`, 'yyyy-MM-dd HH:mm', new Date());

        const uid = `period-${dayName}-${pNum}-${startDateTime.getTime()}@timetablepro`;
        const exDates = getExclusionDatesForPeriod(dayName, pNum, s24);

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${formatICSDate(new Date())}Z`);
        lines.push(`DTSTART:${formatICSDate(startDateTime)}`);
        lines.push(`DTEND:${formatICSDate(endDateTime)}`);
        lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${untilStr}`);
        
        if (exDates.length > 0) {
          lines.push(`EXDATE:${exDates.join(',')}`);
        }

        lines.push(`SUMMARY:${info.subject}`);
        if (info.classroom) lines.push(`LOCATION:${info.classroom}`);
        lines.push(`DESCRIPTION:Teacher: ${info.teacher || 'N/A'}\\nPeriod: ${pNum}`);
        lines.push('END:VEVENT');
      });
    });
  }

  // 2. Export Weekly Custom Periods (Recurring)
  Object.entries(weeklyCustomPeriods).forEach(([dayName, customPeriods]) => {
    const byDay = weekdayMap[dayName];
    if (!byDay || !customPeriods) return;

    customPeriods.forEach((cp) => {
      const nextDate = getDateOfNextDay(dayName, now);
      const startDateTime = parse(`${format(nextDate, 'yyyy-MM-dd')} ${cp.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
      const endDateTime = parse(`${format(nextDate, 'yyyy-MM-dd')} ${cp.endTime}`, 'yyyy-MM-dd HH:mm', new Date());

      const uid = `custom-weekly-${cp.id}@timetablepro`;
      const exDates = getExclusionDatesForPeriod(dayName, cp.id, cp.startTime);

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${formatICSDate(new Date())}Z`);
      lines.push(`DTSTART:${formatICSDate(startDateTime)}`);
      lines.push(`DTEND:${formatICSDate(endDateTime)}`);
      lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${untilStr}`);

      if (exDates.length > 0) {
        lines.push(`EXDATE:${exDates.join(',')}`);
      }

      lines.push(`SUMMARY:${cp.subject}`);
      if (cp.classroom) lines.push(`LOCATION:${cp.classroom}`);
      lines.push(`DESCRIPTION:Teacher: ${cp.teacher || 'N/A'}\\nType: Custom Class`);
      lines.push('END:VEVENT');
    });
  });

  // 3. Export Date Overrides (Single instances where standard classes are overridden)
  Object.entries(overrides).forEach(([dateStr, dateOverride]) => {
    // Standard and Weekly Custom Period Overrides
    if (dateOverride.periods) {
      Object.entries(dateOverride.periods).forEach(([pId, info]) => {
        if (!info) return; // Ignore if canceled (EXDATE already covers cancellation)

        // Find time slots
        let s24 = '';
        let e24 = '';
        let description = '';

        if (pId.startsWith('period-') || !isNaN(Number(pId))) {
          const pNum = parseInt(pId.replace('period-', ''));
          const timing = PERIOD_TIMINGS.find(t => t.number === pNum);
          if (!timing) return;
          s24 = format12To24(timing.startTime);
          e24 = format12To24(timing.endTime);
          description = `Rescheduled Standard Class\\nPeriod: ${pNum}`;
        } else {
          // It's a custom weekly period ID, search in weekly custom periods
          let foundCp: CustomPeriod | undefined;
          Object.values(weeklyCustomPeriods).forEach((list) => {
            const match = list.find(item => item.id === pId);
            if (match) foundCp = match;
          });
          if (!foundCp) return;
          s24 = foundCp.startTime;
          e24 = foundCp.endTime;
          description = `Rescheduled Custom Class`;
        }

        const startDateTime = parse(`${dateStr} ${s24}`, 'yyyy-MM-dd HH:mm', new Date());
        const endDateTime = parse(`${dateStr} ${e24}`, 'yyyy-MM-dd HH:mm', new Date());
        const uid = `override-${dateStr}-${pId}@timetablepro`;

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${formatICSDate(new Date())}Z`);
        lines.push(`DTSTART:${formatICSDate(startDateTime)}`);
        lines.push(`DTEND:${formatICSDate(endDateTime)}`);
        lines.push(`SUMMARY:${info.subject}`);
        if (info.classroom) lines.push(`LOCATION:${info.classroom}`);
        lines.push(`DESCRIPTION:Teacher: ${info.teacher || 'N/A'}\\n${description}`);
        lines.push('END:VEVENT');
      });
    }

    // Temporary Custom Periods (Date Specific)
    if (dateOverride.customPeriods) {
      dateOverride.customPeriods.forEach((cp) => {
        const startDateTime = parse(`${dateStr} ${cp.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        const endDateTime = parse(`${dateStr} ${cp.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
        const uid = `temp-custom-${cp.id}@timetablepro`;

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${formatICSDate(new Date())}Z`);
        lines.push(`DTSTART:${formatICSDate(startDateTime)}`);
        lines.push(`DTEND:${formatICSDate(endDateTime)}`);
        lines.push(`SUMMARY:${cp.subject}`);
        if (cp.classroom) lines.push(`LOCATION:${cp.classroom}`);
        lines.push(`DESCRIPTION:Teacher: ${cp.teacher || 'N/A'}\\nType: Temporary Class Slot`);
        lines.push('END:VEVENT');
      });
    }
  });

  // 4. Export Tasks (Single instances)
  Object.entries(taskData).forEach(([dateStr, tasks]) => {
    if (!tasks) return;
    tasks.forEach((task) => {
      const startDateTime = parse(`${dateStr} ${task.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
      const endDateTime = parse(`${dateStr} ${task.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
      const uid = `task-${task.id}@timetablepro`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${formatICSDate(new Date())}Z`);
      lines.push(`DTSTART:${formatICSDate(startDateTime)}`);
      lines.push(`DTEND:${formatICSDate(endDateTime)}`);
      lines.push(`SUMMARY:Task: ${task.title}`);
      lines.push(`DESCRIPTION:Status: ${task.completed ? 'Completed' : 'Pending'}\\nCreated at: ${new Date(task.createdAt).toLocaleString()}`);
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};
