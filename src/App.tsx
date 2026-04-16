import { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, Trash2, X, Sun, Moon } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useCurrentTime } from './hooks/useCurrentTime';
import { useTheme } from './hooks/useTheme';
import type { TimetableData } from './types';
import { PERIOD_TIMINGS, DAYS_OF_WEEK } from './types';
import { CsvUploader } from './components/CsvUploader';
import { PeriodCard } from './components/PeriodCard';
import { NowNextBanner } from './components/NowNextBanner';
import { getCurrentPeriod, getNextPeriod, isPastPeriod, isActivePeriod } from './utils/time';
import { cn } from './utils/cn';
import { getSubjectColor, getColorClasses } from './utils/colors';

function App() {
  const [timetable, setTimetable] = useLocalStorage<TimetableData | null>('timetable', null);
  const { theme, toggleTheme } = useTheme();
  const now = useCurrentTime();
  const currentDay = formatDay(now);
  const [selectedDay, setSelectedDay] = useState<string>(currentDay);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync selected day with current day on initial load
  useEffect(() => {
    if (DAYS_OF_WEEK.includes(currentDay)) {
      setSelectedDay(currentDay);
    }
  }, [currentDay]);

  function formatDay(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  }

  const currentPeriodInfo = useMemo(() => {
    const period = getCurrentPeriod(now);
    if (!period) return undefined;
    const info = timetable?.[currentDay]?.[period.number];
    return { timing: period, info };
  }, [now, timetable, currentDay]);

  const nextPeriodInfo = useMemo(() => {
    const period = getNextPeriod(now);
    if (!period) return undefined;
    const info = timetable?.[currentDay]?.[period.number];
    return { timing: period, info };
  }, [now, timetable, currentDay]);

  // Notifications logic
  useEffect(() => {
    if (!timetable || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Schedule next notification
    if (nextPeriodInfo?.info) {
      const nextTime = new Date();
      const [h, m] = nextPeriodInfo.timing.startTime.split(':');
      const isPM = nextPeriodInfo.timing.startTime.endsWith('PM');
      let hours = parseInt(h);
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      nextTime.setHours(hours, parseInt(m), 0, 0);

      const diff = nextTime.getTime() - new Date().getTime();
      if (diff > 0) {
        const timer = setTimeout(() => {
          new Notification(`Class Starting: ${nextPeriodInfo.info?.subject}`, {
            body: `Room ${nextPeriodInfo.info?.classroom || 'N/A'} with ${nextPeriodInfo.info?.teacher || 'N/A'}`,
            icon: '/pwa-192x192.png'
          });
        }, diff);
        return () => clearTimeout(timer);
      }
    }
  }, [nextPeriodInfo, timetable]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !timetable) return [];
    const query = searchQuery.toLowerCase();
    const results: any[] = [];

    Object.entries(timetable).forEach(([day, periods]) => {
      Object.entries(periods).forEach(([pNum, info]) => {
        if (
          info.subject.toLowerCase().includes(query) ||
          info.teacher?.toLowerCase().includes(query) ||
          info.classroom?.toLowerCase().includes(query)
        ) {
          const timing = PERIOD_TIMINGS.find(t => t.number === parseInt(pNum));
          results.push({ day, period: pNum, timing, info });
        }
      });
    });
    return results;
  }, [searchQuery, timetable]);

  if (!timetable) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8 max-w-lg mx-auto">
        <div className="text-center space-y-2">
          <div className="inline-block p-4 rounded-3xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl mb-4">
            <Calendar size={48} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
            Timetable Pro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold">
            Built for precision. Created by mmchessman.
          </p>
        </div>
        
        <CsvUploader onDataLoaded={(data) => setTimetable(data)} />
        
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
          <p className="font-black text-slate-900 dark:text-white mb-2 uppercase tracking-widest">CSV Format:</p>
          <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
            Day, Period 1, ... Period 8<br/>
            Cell: Subject (Teacher) @ Room
          </p>
        </div>
      </div>
    );
  }

  const selectedDayData = timetable[selectedDay] || {};

  return (
    <div className="min-h-screen bg-inherit pb-24 animate-in fade-in duration-700 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shadow-xl transform active:scale-95 transition-transform">
              <Calendar size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter">
                Timetable Pro
              </h1>
              <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] leading-none block mt-0.5">
                {currentDay}, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition-all active:scale-95"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} strokeWidth={2.5} /> : <Sun size={20} strokeWidth={2.5} />}
            </button>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition-all active:scale-95"
            >
              <Search size={20} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => {
                if (confirm('Erase all timetable data?')) setTimetable(null);
              }}
              className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900/40 transition-all active:scale-95"
            >
              <Trash2 size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        
        <NowNextBanner current={currentPeriodInfo} next={nextPeriodInfo} />
        
        {/* Day Selector */}
        <div className="max-w-2xl mx-auto px-4 py-4 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {DAYS_OF_WEEK.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all flex-shrink-0 active:scale-95 border uppercase tracking-widest",
                selectedDay === day 
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xl" 
                  : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </header>

      {/* Timetable List */}
      <main className="max-w-2xl mx-auto px-4 py-8 flex-1">
        <div className="space-y-4">
          {PERIOD_TIMINGS.map(timing => (
            <PeriodCard
              key={timing.number}
              timing={timing}
              info={selectedDayData[timing.number]}
              isActive={selectedDay === currentDay && isActivePeriod(timing, now)}
              isPast={selectedDay === currentDay && isPastPeriod(timing, now)}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">
          Created with ❤️ by <span className="text-blue-500 dark:text-blue-400 font-bold">mmchessman</span>
        </p>
      </footer>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 p-6 flex flex-col animate-in slide-in-from-bottom-5 duration-500">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" size={20} strokeWidth={3} />
              <input
                autoFocus
                type="text"
                placeholder="Search schedule..."
                className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 ring-primary-500 transition-all font-black text-slate-900 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
              className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white active:scale-95 transition-transform border border-slate-100 dark:border-slate-800"
            >
              <X size={24} strokeWidth={3} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
            {searchResults.length > 0 ? (
              searchResults.map((res, i) => {
                const colors = getColorClasses(getSubjectColor(res.info.subject));
                return (
                  <div key={i} className={cn(
                    "p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden transition-all",
                    colors.border
                  )}>
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", colors.accent)} />
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", colors.textPrimary)}>
                        {res.day} • Period {res.period}
                      </span>
                      <span className="text-[11px] font-black text-slate-400 uppercase">{res.timing.startTime}</span>
                    </div>
                    <h4 className={cn("text-xl font-black mb-2 leading-tight", colors.textPrimary)}>
                      {res.info.subject}
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <span>{res.info.teacher}</span>
                      <span className="text-slate-200 dark:text-slate-800">|</span>
                      <span className={colors.textPrimary}>{res.info.classroom}</span>
                    </div>
                  </div>
                );
              })
            ) : searchQuery.trim() ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 font-black italic">No records found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 border border-slate-100 dark:border-slate-800">
                  <Search size={40} strokeWidth={3} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-black tracking-tight text-lg">Search your schedule</p>
                <p className="text-slate-400 dark:text-slate-600 text-sm font-bold">Find subjects, teachers, or rooms</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
