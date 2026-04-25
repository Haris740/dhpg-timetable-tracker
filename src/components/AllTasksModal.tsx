import React, { useMemo } from 'react';
import { X, Calendar, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '../utils/cn';
import type { TaskData } from '../types';

interface AllTasksModalProps {
  tasks: TaskData;
  onClose: () => void;
  onDeleteTask: (date: string, id: string) => void;
  onToggleTask: (date: string, id: string) => void;
}

export const AllTasksModal: React.FC<AllTasksModalProps> = ({
  tasks,
  onClose,
  onDeleteTask,
  onToggleTask
}) => {
  const sortedDates = useMemo(() => {
    return Object.keys(tasks).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [tasks]);

  const hasTasks = useMemo(() => {
    return sortedDates.some(date => tasks[date].length > 0);
  }, [sortedDates, tasks]);

  return (
    <div className="fixed inset-0 z-[150] bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom-5 duration-500">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center text-white">
            <Calendar size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">All Tasks</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage your full schedule</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white active:scale-95 transition-transform border border-slate-100 dark:border-slate-800"
        >
          <X size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {hasTasks ? (
          sortedDates.map(date => {
            const dateTasks = tasks[date];
            if (dateTasks.length === 0) return null;

            return (
              <div key={date} className="space-y-4">
                <div className="sticky top-0 z-10 py-2 bg-white dark:bg-slate-950 flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-900" />
                </div>
                
                <div className="space-y-3">
                  {dateTasks.map(task => (
                    <div 
                      key={task.id}
                      className={cn(
                        "p-5 rounded-[2rem] border bg-white dark:bg-slate-900 flex items-center justify-between group transition-all",
                        task.completed ? "border-slate-100 dark:border-slate-800 opacity-60" : "border-slate-200 dark:border-slate-800 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <button 
                          onClick={() => onToggleTask(date, task.id)}
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90",
                            task.completed ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          )}
                        >
                          {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>
                        <div>
                          <h4 className={cn("text-base font-black leading-tight", task.completed ? "line-through text-slate-400" : "text-slate-900 dark:text-white")}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1.5 text-xs font-bold text-slate-400">
                            <Clock size={12} />
                            <span>{task.startTime} - {task.endTime}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => onDeleteTask(date, task.id)}
                        className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 border border-red-100 dark:border-red-900/20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all active:scale-90"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-200 dark:text-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-800">
              <Calendar size={48} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">No tasks yet</h3>
              <p className="text-sm font-bold text-slate-500 max-w-[200px] mt-2">Start adding tasks to stay organized!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
