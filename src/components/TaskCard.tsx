import React from 'react';
import { Clock, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import type { PersonalTask } from '../types';

interface TaskCardProps {
  task: PersonalTask;
  onDelete: () => void;
  onToggle: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onDelete,
  onToggle
}) => {
  return (
    <div className={cn(
      "p-5 rounded-[2.5rem] border-2 flex items-center justify-between group transition-all duration-500 relative overflow-hidden",
      task.completed 
        ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 opacity-60 scale-[0.98]" 
        : "bg-amber-50/50 dark:bg-amber-900/10 border-amber-500 dark:border-amber-400 shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)] animate-pulse-subtle"
    )}>
      {!task.completed && (
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-500 animate-pulse" />
      )}
      
      <div className="flex items-center gap-5 relative z-10">
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg",
              task.completed 
                ? "bg-emerald-500 text-white" 
                : "bg-amber-500 text-white animate-bounce-subtle"
            )}
          >
            {task.completed ? <CheckCircle2 size={24} strokeWidth={3} /> : <AlertTriangle size={24} strokeWidth={3} />}
          </button>
          {!task.completed && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "text-lg font-black leading-tight italic tracking-tighter uppercase",
              task.completed ? "line-through text-slate-400" : "text-amber-900 dark:text-amber-100"
            )}>
              {task.title}
            </h4>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700/60 dark:text-amber-400/60">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock size={10} strokeWidth={3} />
              <span>{task.startTime} - {task.endTime}</span>
            </div>
          </div>
        </div>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 border border-red-100 dark:border-red-900/20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white active:scale-90"
      >
        <Trash2 size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
};
