import Papa from 'papaparse';
import type { TimetableData, SubjectInfo, PeriodNumber } from '../types';
import { DAYS_OF_WEEK } from '../types';

/**
 * Parses a cell string into a SubjectInfo object.
 * format: "Subject (Teacher) @ Classroom"
 */
export const parseCell = (cell: string): SubjectInfo | undefined => {
  if (!cell || cell.trim() === '') return undefined;

  const trimmedCell = cell.trim();
  
  // Split by @ to get classroom
  let mainPart = trimmedCell;
  let classroom = undefined;
  
  const atIndex = trimmedCell.lastIndexOf('@');
  if (atIndex !== -1) {
    mainPart = trimmedCell.substring(0, atIndex).trim();
    classroom = trimmedCell.substring(atIndex + 1).trim();
  }

  // Find all parenthesized groups in mainPart
  // We want to find the LAST (Group) as the teacher
  const matches = [...mainPart.matchAll(/\(([^)]+)\)/g)];
  
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const teacher = lastMatch[1].trim();
    const subject = mainPart.substring(0, lastMatch.index).trim();
    
    return { 
      subject: subject || mainPart, // fallback if subject is empty
      teacher, 
      classroom 
    };
  }

  return { subject: mainPart, classroom };
};

/**
 * Parses CSV data into structured TimetableData.
 * Expects first column to be days, and subsequent columns to be periods 1-8.
 */
export const parseCSV = (csvString: string): TimetableData => {
  const parsed = Papa.parse(csvString, {
    skipEmptyLines: true,
  });

  const data: TimetableData = {};
  const rows = parsed.data as string[][];

  // Header row might be present, or not. We look for rows that start with a Day name.
  rows.forEach((row) => {
    const dayCandidate = row[0]?.trim();
    if (dayCandidate && DAYS_OF_WEEK.some(d => d.toLowerCase() === dayCandidate.toLowerCase())) {
      const dayName = DAYS_OF_WEEK.find(d => d.toLowerCase() === dayCandidate.toLowerCase())!;
      data[dayName] = {};

      for (let i = 1; i <= 8; i++) {
        const cell = row[i];
        if (cell) {
          const info = parseCell(cell);
          if (info) {
            data[dayName][i as PeriodNumber] = info;
          }
        }
      }
    }
  });

  return data;
};
