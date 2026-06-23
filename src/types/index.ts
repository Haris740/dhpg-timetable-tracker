export type PeriodNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface SubjectInfo {
  subject: string;
  teacher?: string;
  classroom?: string;
}

export interface PersonalTask {
  id: string;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  completed: boolean;
  createdAt: number;
}

export type TaskData = {
  [date: string]: PersonalTask[];
};

export type CCEWorkType = 'assignment' | 'ppt' | 'presentation' | 'reading' | 'research' | 'watching' | 'note writing';

export interface CCEWork {
  id: string;
  type: CCEWorkType;
  topic: string;
  deadline?: string;
  completed: boolean;
  createdAt: number;
}

export type CCEData = {
  [subjectName: string]: CCEWork[];
};

export type DayTimetable = {
  [key in PeriodNumber]?: SubjectInfo;
};

export type TimetableData = {
  [day: string]: DayTimetable;
};

export interface PeriodTiming {
  number: PeriodNumber;
  startTime: string; // "07:35 AM"
  endTime: string;   // "08:25 AM"
}

// export const PERIOD_TIMINGS: PeriodTiming[] = [
//   { number: 1, startTime: "07:35 AM", endTime: "08:25 AM" },
//   { number: 2, startTime: "08:50 AM", endTime: "09:40 AM" },
//   { number: 3, startTime: "09:45 AM", endTime: "10:35 AM" },
//   { number: 4, startTime: "10:40 AM", endTime: "11:30 AM" },
//   { number: 5, startTime: "11:35 AM", endTime: "12:25 PM" },
//   { number: 6, startTime: "12:30 PM", endTime: "01:15 PM" },
//   { number: 7, startTime: "02:20 PM", endTime: "03:10 PM" },
//   { number: 8, startTime: "03:15 PM", endTime: "04:05 PM" },
// ];

export const PERIOD_TIMINGS: PeriodTiming[] = [
  { number: 1, startTime: "07:35 AM", endTime: "08:25 AM" },
  { number: 2, startTime: "08:50 AM", endTime: "09:40 AM" },
  { number: 3, startTime: "09:45 AM", endTime: "10:35 AM" },
  { number: 4, startTime: "10:40 AM", endTime: "11:30 AM" },
  { number: 5, startTime: "11:35 AM", endTime: "12:25 PM" },
  { number: 6, startTime: "12:30 PM", endTime: "01:15 PM" },
  { number: 7, startTime: "02:20 PM", endTime: "03:10 PM" },
  { number: 8, startTime: "03:15 PM", endTime: "04:05 PM" },
];

export const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface CustomPeriod {
  id: string;
  subject: string;
  teacher?: string;
  classroom?: string;
  startTime: string; // "HH:mm" 24h format for standard HTML time input
  endTime: string;   // "HH:mm" 24h format
}

export interface DateOverride {
  // Key is period number (as string) or custom period ID
  periods: {
    [key: string]: SubjectInfo | null; // null means canceled/removed on this date
  };
  customPeriods: CustomPeriod[];
}

export type TimetableOverrides = {
  [dateStr: string]: DateOverride;
};

export interface AppSettings {
  notificationsEnabled: boolean;
  notificationOffset: number; // minutes before start
}

