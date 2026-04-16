export type PeriodNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface SubjectInfo {
  subject: string;
  teacher?: string;
  classroom?: string;
}

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

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
