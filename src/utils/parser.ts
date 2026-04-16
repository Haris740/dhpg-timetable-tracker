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
  
  // Regex to extract different components
  // Group 1: Subject (everything until ( or @)
  // Group 2: Teacher (inside parentheses)
  // Group 3: Classroom (after @)
  const regex = /^([^(@]+)(?:\(([^)]+)\))?\s*(?:@\s*(.*))?$/;
  const match = trimmedCell.match(regex);

  if (!match) {
    return { subject: trimmedCell };
  }

  return {
    subject: match[1]?.trim() || trimmedCell,
    teacher: match[2]?.trim(),
    classroom: match[3]?.trim(),
  };
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
