import React, { useState, useMemo } from 'react';
import { Plus, X, AlertTriangle } from 'lucide-react';
import type { PersonalTask, TimetableData } from '../types';
import { getScheduleConflicts, getDayName } from '../utils/time';

interface TaskManagerProps {
  date: string;
  tasks: PersonalTask[];
  timetable: TimetableData;
  onAddTask: (task: Omit<PersonalTask, 'id' | 'createdAt' | 'completed'>) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onViewAll: () => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  date,
  timetable,
  onAddTask,
  onViewAll
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [taskDate, setTaskDate] = useState(date);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');

  const conflicts = useMemo(() => {
    if (!startTime || !endTime || startTime >= endTime) return [];
    const dayName = getDayName(taskDate);
    const dayTimetable = timetable[dayName] || {};
    return getScheduleConflicts(startTime, endTime, dayTimetable);
  }, [startTime, endTime, taskDate, timetable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime || !taskDate) return;
    
    onAddTask({
      title,
      date: taskDate,
      startTime,
      endTime
    });
    
    setTitle('');
    setTaskDate(date);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Personal Tasks</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={onViewAll}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            View All
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-widest hover:bg-primary-500/20 transition-colors"
          >
            <Plus size={14} strokeWidth={3} />
            Add Task
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Add New Task</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Task Title</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Study Chemistry"
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 ring-primary-500 transition-all font-black text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Task Date</label>
                  <input 
                    type="date" 
                    value={taskDate}
                    onChange={e => setTaskDate(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 ring-primary-500 transition-all font-black text-slate-900 dark:text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Start Time</label>
                    <input 
                      type="time" 
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 ring-primary-500 transition-all font-black text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">End Time</label>
                    <input 
                      type="time" 
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 ring-primary-500 transition-all font-black text-slate-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                {conflicts.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 space-y-2 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle size={16} strokeWidth={3} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Schedule Conflict</span>
                    </div>
                    <p className="text-xs font-bold text-amber-700/80 dark:text-amber-400/80 leading-tight">
                      This task overlaps with Period {conflicts.map(p => p.number).join(', ')}. You can still create it.
                    </p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={!title}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  Create Task
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
