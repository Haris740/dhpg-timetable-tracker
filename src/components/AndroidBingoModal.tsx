import React from 'react';
import { Download, Layout, Zap, Box } from 'lucide-react';
import { cn } from '../utils/cn';

export const AndroidBingoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
    {
      icon: Layout,
      title: "Live Timetable Widget",
      description: "See your current and next class directly on your home screen with real-time updates.",
      color: "bg-blue-500"
    },
    {
      icon: Box,
      title: "Full Schedule Widget",
      description: "Browse your entire day's schedule with premium Dark Glass aesthetics.",
      color: "bg-purple-500"
    },
    {
      icon: Zap,
      title: "Tasks & CCE Widgets",
      description: "Track your personal tasks and pending CCE works without ever opening the app.",
      color: "bg-amber-500"
    }
  ];

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh]">
        
        {/* Hero Section */}
        <div className="relative h-56 bg-gradient-to-br from-green-500 to-emerald-700 overflow-hidden flex flex-col items-center justify-center text-center p-8">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-black rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="relative z-10 space-y-3">
            <h2 className="text-3xl font-black text-white leading-tight uppercase italic tracking-tighter">
              BINGO! ANDROID
            </h2>
            <p className="text-sm font-bold text-white/80 max-w-xs mx-auto">
              You've unlocked the full potential of Timetable Pro v3.0.
            </p>
          </div>
        </div>

        {/* Feature List */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-8">
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your New Superpowers</h3>
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
          </div>

          <div className="p-6 rounded-3xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
              <Download size={12} />
              How to update
            </h5>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
              Download the latest APK below and install it to enable the new Widgets. Long-press your home screen to find them!
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-8 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-3">
          <a 
            href="/timetable-pro-v3.apk" 
            download
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Download Latest APK
            <Download size={18} strokeWidth={3} />
          </a>
          <button 
            onClick={onClose}
            className="w-full py-3 text-slate-400 dark:text-slate-600 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
          >
            I'll do it later
          </button>
        </div>
      </div>
    </div>
  );
};
