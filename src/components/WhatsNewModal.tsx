import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Layout, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';

const APP_VERSION = '2.1.0';

export const WhatsNewModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('has_seen_whats_new_version');
    if (lastSeenVersion !== APP_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('has_seen_whats_new_version', APP_VERSION);
    setIsOpen(false);
  };


  if (!isOpen) return null;

  const features = [
    {
      icon: Zap,
      title: "Personal Task Alerts",
      description: "Add custom tasks with an alerting amber design that stand out in your schedule.",
      color: "bg-amber-500"
    },
    {
      icon: Bell,
      title: "Task Notifications",
      description: "Get instantly notified when your personal tasks are about to start.",
      color: "bg-blue-500"
    },
    {
      icon: Layout,
      title: "Unified Schedule",
      description: "Tasks are now perfectly sorted between your class periods chronologically.",
      color: "bg-purple-500"
    },
    {
      icon: CheckCircle2,
      title: "Conflict Detection",
      description: "Automatic warnings if your personal tasks overlap with existing class periods.",
      color: "bg-red-500"
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        
        {/* Hero Section */}
        <div className="relative h-48 bg-slate-900 dark:bg-white overflow-hidden flex flex-col items-center justify-center text-center p-8">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 text-[10px] font-black uppercase tracking-widest mb-2 border border-primary-500/30">
              <Sparkles size={12} />
              Version 2.1 is here
            </div>
            <h2 className="text-3xl font-black text-white dark:text-slate-900 leading-tight uppercase italic tracking-tighter">
              What's New in <br/> Timetable Pro
            </h2>
          </div>
        </div>

        {/* Feature List */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="grid gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-5 group">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg transform group-hover:scale-110 transition-transform",
                  feature.color
                )}>
                  <feature.icon size={24} strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {feature.title}
                  </h4>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Zap size={12} className="text-yellow-500" />
              Pro Tip
            </h5>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
              Use the <span className="text-primary-500">View All</span> button in the Personal Tasks section to manage your full schedule in one place!
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20">
          <button 
            onClick={handleClose}
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Got it, Let's Go!
            <ArrowRight size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};
