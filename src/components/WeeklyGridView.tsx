import React from 'react';
import { Plus } from 'lucide-react';
import type { TimetableData } from '../types';
import { PERIOD_TIMINGS, DAYS_OF_WEEK } from '../types';
import { getSubjectColor, getColorClasses } from '../utils/colors';
import { getDayName, getDateOfNextDay, formatISODate } from '../utils/time';
import { cn } from '../utils/cn';

interface WeeklyGridViewProps {
  timetable: TimetableData | null;
  onCellClick: (dayName: string, periodNumber: number, dateStr: string) => void;
}

export const WeeklyGridView: React.FC<WeeklyGridViewProps> = ({ timetable, onCellClick }) => {
  const todayName = getDayName(new Date());

  // Filter out Sunday since it usually doesn't have regular schedules, but let's keep Monday-Saturday
  const weekDays = DAYS_OF_WEEK.filter(d => d !== 'Sunday');

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      
      {/* Intro info */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Weekly Overview</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-1">
            Swipe horizontally or scroll to see the whole week. Click any cell to modify.
          </p>
        </div>
      </div>

      {/* Grid Container */}
      <div className="w-full rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/20 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar scroll-smooth">
          <table className="w-full border-collapse text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                {/* Timing Column Header */}
                <th className="sticky left-0 z-20 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-24">
                  Slot
                </th>
                {/* Day Columns Headers */}
                {weekDays.map(day => (
                  <th 
                    key={day} 
                    className={cn(
                      "px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center min-w-[120px]",
                      todayName === day 
                        ? "text-primary-600 dark:text-primary-400 bg-primary-50/30 dark:bg-primary-950/10" 
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    {day}
                    {todayName === day && (
                      <span className="block text-[8px] font-black text-primary-500 tracking-normal mt-0.5">
                        (Today)
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIOD_TIMINGS.map((timing) => (
                <tr 
                  key={timing.number} 
                  className="border-b last:border-0 border-slate-200 dark:border-slate-800/50 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 transition-colors"
                >
                  {/* Timing Cell (Sticky Column) */}
                  <td className="sticky left-0 z-20 px-4 py-4 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-left">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-900 dark:text-white">
                        P{timing.number}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 mt-0.5 leading-none">
                        {timing.startTime.replace(':00', '').replace(' ', '')}
                      </span>
                    </div>
                  </td>

                  {/* Day Schedule Cells */}
                  {weekDays.map((day) => {
                    const dayData = timetable?.[day] || {};
                    const periodInfo = dayData[timing.number];
                    const subjectColor = periodInfo ? getSubjectColor(periodInfo.subject) : null;
                    const colors = subjectColor ? getColorClasses(subjectColor) : null;
                    
                    // Next occurrence date of this weekday
                    const cellDate = formatISODate(getDateOfNextDay(day, new Date()));

                    return (
                      <td 
                        key={day} 
                        onClick={() => onCellClick(day, timing.number, cellDate)}
                        className={cn(
                          "p-2 text-center cursor-pointer transition-all active:scale-[0.98]",
                          todayName === day && "bg-primary-50/5 dark:bg-primary-950/2"
                        )}
                      >
                        {periodInfo ? (
                          <div className={cn(
                            "py-3 px-3 rounded-2xl border text-center transition-all duration-300 relative overflow-hidden group/cell h-[72px] flex flex-col justify-center items-center select-none shadow-sm",
                            colors?.bg,
                            colors?.border
                          )}>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/5 pointer-events-none" />
                            <h4 className={cn("text-xs font-black line-clamp-2 leading-tight tracking-tight mb-1 break-all uppercase text-center w-full", colors?.textPrimary)}>
                              {periodInfo.subject}
                            </h4>
                            {periodInfo.classroom && (
                              <span className={cn("text-[9px] font-bold leading-none opacity-80", colors?.textSecondary)}>
                                {periodInfo.classroom}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="h-[72px] rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-900/60 flex items-center justify-center text-slate-300 dark:text-slate-800 hover:text-primary-500 hover:border-primary-500/40 hover:bg-primary-50/5 dark:hover:bg-primary-950/5 transition-all group/empty">
                            <Plus size={16} strokeWidth={3} className="opacity-0 group-hover/empty:opacity-100 transition-opacity" />
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-60 group-hover/empty:hidden">Free</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
