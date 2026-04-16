import React from 'react';
import { Clock } from 'lucide-react';
import type { PeriodTiming, SubjectInfo } from '../types';
import { cn } from '../utils/cn';
import { getSubjectColor, getColorClasses } from '../utils/colors';

interface NowNextBannerProps {
  current?: { timing: PeriodTiming; info?: SubjectInfo };
  next?: { timing: PeriodTiming; info?: SubjectInfo };
}

export const NowNextBanner: React.FC<NowNextBannerProps> = ({ current, next }) => {
  const currentSubjectColor = current?.info ? getSubjectColor(current.info.subject) : 'blue';
  const currentColors = getColorClasses(currentSubjectColor);

  return (
    <div className="flex flex-col gap-3 px-4 py-3 max-w-2xl mx-auto w-full">
      {/* Now Banner */}
      <div className={cn(
        "rounded-[2rem] p-6 shadow-xl border flex flex-col gap-3 transition-all duration-500 relative overflow-hidden",
        currentColors.bg,
        currentColors.border
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/5 pointer-events-none" />
        
        <div className="flex items-center gap-2 relative z-10">
          <div className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter animate-pulse shadow-sm",
            currentColors.accent === 'bg-white' ? "bg-white text-slate-900" : "bg-slate-900 text-white"
          )}>
            Live
          </div>
          <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-80", currentColors.textPrimary)}>Current State</span>
        </div>
        
        {current?.info ? (
          <div className="flex items-center justify-between gap-4 relative z-10">
            <h2 className={cn(
              "text-2xl font-black tracking-tight leading-tight transition-colors",
              currentColors.textPrimary
            )}>
              {current.info.subject}
            </h2>
            <div className="flex flex-col items-end shrink-0">
              <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-70", currentColors.textPrimary)}>Room</span>
              <span className={cn(
                "text-sm font-black leading-none",
                currentColors.textPrimary
              )}>
                {current.info.classroom || 'N/A'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 relative z-10">
             <div className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
             <p className="text-white/60 font-black text-sm uppercase tracking-widest">
               Quiet Period
             </p>
          </div>
        )}
      </div>

      {/* Next Banner */}
      {next && next.timing && (
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 dark:bg-slate-800 rounded-3xl shadow-lg border border-slate-800 dark:border-slate-700 transition-all duration-300">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Next Up</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-tight">
                {next.info?.subject || 'Free Period'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={14} strokeWidth={3} />
            <span className="text-[11px] font-black uppercase tracking-tighter">{next.timing.startTime}</span>
          </div>
        </div>
      )}
    </div>
  );
};
