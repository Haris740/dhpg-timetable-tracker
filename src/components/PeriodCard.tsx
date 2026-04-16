import React from 'react';
import { Clock, User, Landmark } from 'lucide-react';
import type { SubjectInfo, PeriodTiming } from '../types';
import { cn } from '../utils/cn';

interface PeriodCardProps {
  timing: PeriodTiming;
  info?: SubjectInfo;
  isActive: boolean;
  isPast: boolean;
}

import { getSubjectColor, getColorClasses } from '../utils/colors';

export const PeriodCard: React.FC<PeriodCardProps> = ({ timing, info, isActive, isPast }) => {
  const subjectColor = info ? getSubjectColor(info.subject) : 'blue';
  const colors = getColorClasses(subjectColor);

  if (!info) {
    return (
      <div className={cn(
        "relative p-5 rounded-3xl border transition-all duration-300 bg-slate-100/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
        isActive && "ring-2 ring-primary-500/10 border-primary-500/30",
        isPast && "opacity-40"
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Period {timing.number}</span>
          <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400">
            <Clock size={12} />
            <span>{timing.startTime}</span>
          </div>
        </div>
        <h3 className="text-sm font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">Free Slot</h3>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative p-6 rounded-[2rem] group overflow-hidden transition-all duration-500 border shadow-md",
      colors.bg,
      colors.border,
      isActive && cn("animate-pulse-glow scale-[1.03] shadow-2xl z-10", colors.ring),
      isPast && "opacity-40 grayscale-[0.6]"
    )}>
      {/* Subtle Inner Glow/Shadow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/5 pointer-events-none" />

      {isActive && (
        <div className="absolute top-6 right-6">
          <div className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-bounce",
            colors.accent === 'bg-white' ? "bg-white text-slate-900" : "bg-slate-900 text-white"
          )}>
            Now
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black shadow-inner transition-transform group-hover:scale-110 duration-500",
            colors.accent,
            colors.accent === 'bg-white' ? "text-slate-900" : "text-white"
          )}>
            {timing.number}
          </div>
          <div className="flex flex-col">
            <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1", colors.textSecondary)}>
              Time Slot
            </span>
            <span className={cn("text-xs font-black leading-none", colors.textPrimary)}>
              {timing.startTime} - {timing.endTime}
            </span>
          </div>
        </div>
      </div>

      <h3 className={cn(
        "text-2xl font-black mb-5 leading-[1.15] tracking-tight transition-all group-hover:translate-x-1 duration-500",
        colors.textPrimary
      )}>
        {info.subject}
      </h3>

      <div className={cn(
        "flex flex-wrap gap-2.5 pt-5 border-t transition-colors",
        colors.accent === 'bg-white' ? "border-white/20" : "border-slate-900/10"
      )}>
        {info.teacher && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold shadow-sm backdrop-blur-sm",
            colors.accent === 'bg-white' ? "bg-white/10 text-white" : "bg-black/5 text-slate-900"
          )}>
            <User size={14} className="opacity-70" />
            <span>{info.teacher}</span>
          </div>
        )}
        {info.classroom && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-black shadow-sm backdrop-blur-sm",
            colors.accent === 'bg-white' ? "bg-white/20 text-white" : "bg-black/10 text-slate-900"
          )}>
            <Landmark size={14} className="opacity-70" />
            <span>{info.classroom}</span>
          </div>
        )}
      </div>
    </div>
  );
};
