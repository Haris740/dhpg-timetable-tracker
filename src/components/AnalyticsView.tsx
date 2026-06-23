import React, { useMemo } from 'react';
import { BarChart2, BookOpen, CheckSquare, ClipboardList, Clock } from 'lucide-react';
import type { TimetableData, CCEData, TaskData, CustomPeriod } from '../types';
import { getSubjectColor, getColorClasses } from '../utils/colors';
import { cn } from '../utils/cn';

interface AnalyticsViewProps {
  timetable: TimetableData | null;
  weeklyCustomPeriods?: { [day: string]: CustomPeriod[] };
  cceData: CCEData;
  taskData: TaskData;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  timetable,
  weeklyCustomPeriods = {},
  cceData,
  taskData
}) => {
  
  // 1. Calculate Weekly Class Hours Distribution
  const subjectHours = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!timetable) return [];

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday', 'Sunday'];
    weekDays.forEach(day => {
      const dayData = timetable[day] || {};
      Object.values(dayData).forEach(info => {
        if (info && info.subject) {
          counts[info.subject] = (counts[info.subject] || 0) + 50;
        }
      });

      // Count custom weekly periods (based on their actual duration)
      const customList = weeklyCustomPeriods[day] || [];
      customList.forEach(cp => {
        try {
          const [sh, sm] = cp.startTime.split(':').map(Number);
          const [eh, em] = cp.endTime.split(':').map(Number);
          const duration = (eh * 60 + em) - (sh * 60 + sm);
          if (duration > 0) {
            counts[cp.subject] = (counts[cp.subject] || 0) + duration;
          }
        } catch (e) {
          counts[cp.subject] = (counts[cp.subject] || 0) + 60; // fallback 1 hour
        }
      });
    });

    // Convert minutes to hours and sort
    return Object.entries(counts)
      .map(([name, mins]) => ({
        subject: name,
        hours: parseFloat((mins / 60).toFixed(1)),
        mins
      }))
      .sort((a, b) => b.mins - a.mins);
  }, [timetable, weeklyCustomPeriods]);

  // 2. Calculate CCE progress stats
  const cceStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    const itemsByType: Record<string, { total: number; completed: number }> = {};

    Object.values(cceData).forEach(works => {
      if (!works) return;
      works.forEach(work => {
        total++;
        if (work.completed) completed++;

        if (!itemsByType[work.type]) {
          itemsByType[work.type] = { total: 0, completed: 0 };
        }
        itemsByType[work.type].total++;
        if (work.completed) itemsByType[work.type].completed++;
      });
    });

    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      byType: Object.entries(itemsByType).map(([type, counts]) => ({
        type,
        ...counts,
        percentage: counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0
      }))
    };
  }, [cceData]);

  // 3. Calculate Task completion rate
  const taskStats = useMemo(() => {
    let total = 0;
    let completed = 0;

    Object.values(taskData).forEach(tasks => {
      if (!tasks) return;
      tasks.forEach(task => {
        total++;
        if (task.completed) completed++;
      });
    });

    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [taskData]);

  const totalWeeklyStudyMins = useMemo(() => {
    return subjectHours.reduce((sum, item) => sum + item.mins, 0);
  }, [subjectHours]);

  const totalWeeklyStudyHours = (totalWeeklyStudyMins / 60).toFixed(1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* High-level Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden">
          <Clock className="absolute top-4 right-4 text-blue-500 opacity-20" size={32} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Class Hours</span>
          <div className="mt-auto">
            <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{totalWeeklyStudyHours}h</span>
            <span className="block text-[8px] font-bold text-slate-400 mt-1 uppercase">Per Week</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden">
          <ClipboardList className="absolute top-4 right-4 text-purple-500 opacity-20" size={32} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">CCE Done</span>
          <div className="mt-auto">
            <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{cceStats.percentage}%</span>
            <span className="block text-[8px] font-bold text-slate-400 mt-1 uppercase">
              {cceStats.completed}/{cceStats.total} Works
            </span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden">
          <CheckSquare className="absolute top-4 right-4 text-emerald-500 opacity-20" size={32} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Task Rate</span>
          <div className="mt-auto">
            <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{taskStats.percentage}%</span>
            <span className="block text-[8px] font-bold text-slate-400 mt-1 uppercase">
              {taskStats.completed}/{taskStats.total} Tasks
            </span>
          </div>
        </div>
      </div>

      {/* Class Hour breakdown */}
      <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <BookOpen size={14} className="text-blue-500" />
          Weekly Subject Distribution
        </h4>
        
        {subjectHours.length === 0 ? (
          <p className="text-xs font-bold text-slate-400 italic text-center py-4">
            Upload your schedule to view subject hours breakdown
          </p>
        ) : (
          <div className="space-y-4">
            {subjectHours.map((item, idx) => {
              const color = getSubjectColor(item.subject);
              const colors = getColorClasses(color);
              
              // Max scale percentage for progress relative to the highest slot
              const maxHours = subjectHours[0]?.hours || 1;
              const barWidth = Math.max(10, Math.min(100, (item.hours / maxHours) * 100));

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {item.subject}
                    </span>
                    <span className="font-bold text-slate-500 dark:text-slate-400">
                      {item.hours}h ({Math.round((item.mins / totalWeeklyStudyMins) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-1000", colors.bg)} 
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CCE Work Type breakdown */}
      <div className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <BarChart2 size={14} className="text-purple-500" />
          CCE Progress by Activity
        </h4>

        {cceStats.total === 0 ? (
          <p className="text-xs font-bold text-slate-400 italic text-center py-4">
            No assignment records found. Tap on a period to add CCE works.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cceStats.byType.map((typeStat, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {typeStat.type}
                  </span>
                  <span className="text-xs font-black text-slate-950 dark:text-white">
                    {typeStat.percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full" 
                    style={{ width: `${typeStat.percentage}%` }}
                  />
                </div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase">
                  {typeStat.completed} of {typeStat.total} completed
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
