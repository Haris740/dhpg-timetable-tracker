import React from 'react';
import { Clock, User, Landmark, ClipboardList, AlertTriangle, AlertCircle, CalendarRange } from 'lucide-react';
import type { SubjectInfo, PeriodTiming } from '../types';
import { cn } from '../utils/cn';
import { getSubjectColor, getColorClasses } from '../utils/colors';

interface PeriodCardProps {
  timing: PeriodTiming;
  info?: SubjectInfo;
  isActive: boolean;
  isPast: boolean;
  onOpenCCE: (subject: string) => void;
  pendingWorksCount?: number;
  hasTaskConflict?: boolean;
  isCustom?: boolean;
  isCanceled?: boolean;
  googleCalendarUrl?: string;
  onClick?: () => void;
}

export const PeriodCard: React.FC<PeriodCardProps> = ({ 
  timing, 
  info, 
  isActive, 
  isPast,
  onOpenCCE,
  pendingWorksCount = 0,
  hasTaskConflict = false,
  isCustom = false,
  isCanceled = false,
  googleCalendarUrl,
  onClick
}) => {
  const subjectColor = info && !isCanceled ? getSubjectColor(info.subject) : 'blue';
  const colors = getColorClasses(subjectColor);

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is on the CCE button, don't trigger edit modal
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.();
  };

  if (!info || isCanceled) {
    return (
      <div 
        onClick={onClick}
        className={cn(
          "relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer",
          isCanceled 
            ? "bg-red-50/10 dark:bg-red-950/5 border-red-200/40 dark:border-red-900/20" 
            : "bg-slate-100/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
          isActive && "ring-2 ring-primary-500/10 border-primary-500/30",
          isPast && "opacity-40"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {isCustom ? 'Custom Class' : `Period ${timing.number}`}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400">
            <Clock size={12} />
            <span>{timing.startTime}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h3 className={cn(
            "text-sm font-black uppercase tracking-tighter",
            isCanceled ? "text-red-400 dark:text-red-900/70" : "text-slate-400 dark:text-slate-600"
          )}>
            {isCanceled ? 'Class Canceled (Free Slot)' : 'Free Slot'}
          </h3>
          {isCanceled && (
            <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <AlertCircle size={10} />
              Canceled
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      className={cn(
        "relative p-6 rounded-[2rem] group overflow-hidden transition-all duration-500 border shadow-md flex flex-col cursor-pointer",
        colors.bg,
        colors.border,
        isActive && cn("animate-pulse-glow scale-[1.03] shadow-2xl z-10", colors.ring),
        isPast && "opacity-40 grayscale-[0.6]",
        hasTaskConflict && "border-amber-500/50 dark:border-amber-500/30 ring-4 ring-amber-500/10"
      )}
    >
      {/* Subtle Inner Glow/Shadow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/5 pointer-events-none" />
 
      {hasTaskConflict && !isPast && (
        <div className="absolute top-20 right-6 animate-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
            <AlertTriangle size={10} strokeWidth={3} />
            Task Conflict
          </div>
        </div>
      )}
 
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
            {isCustom ? <Clock size={16} /> : timing.number}
          </div>
          <div className="flex flex-col">
            <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1", colors.textSecondary)}>
              {isCustom ? 'Custom Slot' : 'Time Slot'}
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
 
      <div className="flex-1" />
 
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-4 pt-5 border-t transition-colors",
        colors.accent === 'bg-white' ? "border-white/20" : "border-slate-900/10"
      )}>
        <div className="flex flex-wrap gap-2.5">
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
 
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onOpenCCE(info.subject);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm relative group/btn",
              colors.accent === 'bg-white' ? "bg-white text-slate-900 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-800"
            )}
          >
            <ClipboardList size={16} strokeWidth={2.5} />
            <span>CCE Works</span>
            {pendingWorksCount > 0 && (
              <span className={cn(
                "absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg border-2 animate-in zoom-in duration-300",
                colors.accent === 'bg-white' ? "bg-red-500 text-white border-white" : "bg-red-500 text-white border-slate-900"
              )}>
                {pendingWorksCount}
              </span>
            )}
          </button>

          {googleCalendarUrl && (
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm",
                colors.accent === 'bg-white' ? "bg-white/20 text-white hover:bg-white/30" : "bg-black/10 text-slate-900 hover:bg-black/15"
              )}
              title="Add to Google Calendar"
            >
              <CalendarRange size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Add Cal</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
