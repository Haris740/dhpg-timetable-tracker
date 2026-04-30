import { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, Trash2, X, Sun, Moon, Bell, CheckCircle2 } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useCurrentTime } from './hooks/useCurrentTime';
import { useTheme } from './hooks/useTheme';
import type { TimetableData } from './types';
import { PERIOD_TIMINGS, DAYS_OF_WEEK } from './types';
import { parseCell } from './utils/parser';
import { CsvUploader } from './components/CsvUploader';
import { PeriodCard } from './components/PeriodCard';
import { CCEManager } from './components/CCEManager';
import { NowNextBanner } from './components/NowNextBanner';
import { NotificationManager } from './components/NotificationManager';
import { WhatsNewModal } from './components/WhatsNewModal';

import { useNotificationHub } from './hooks/useNotificationHub';
import { cn } from './utils/cn';
import { getSubjectColor, getColorClasses } from './utils/colors';
import type { CCEData, CCEWork, TaskData, PersonalTask } from './types';
import { TaskManager } from './components/TaskManager';
import { AllTasksModal } from './components/AllTasksModal';
import { TaskCard } from './components/TaskCard';
import { AndroidBingoModal } from './components/AndroidBingoModal';
import { Capacitor } from '@capacitor/core';
import { 
  getCurrentPeriod, 
  getNextPeriod, 
  isPastPeriod, 
  isActivePeriod, 
  formatISODate, 
  getDateOfNextDay, 
  areTimesOverlapping, 
  getMinutesSinceMidnight 
} from './utils/time';
import { Download } from 'lucide-react';
import { useUpdateChecker } from './hooks/useUpdateChecker';

function App() {
  const [timetable, setTimetable] = useLocalStorage<TimetableData | null>('timetable', null);
  const [cceData, setCceData] = useLocalStorage<CCEData>('cce_works', {});
  const [taskData, setTaskData] = useLocalStorage<TaskData>('personal_tasks', {});
  const { theme, toggleTheme } = useTheme();
  const now = useCurrentTime();
  const currentDay = formatDay(now);
  const [selectedDay, setSelectedDay] = useState<string>(currentDay);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAllTasksOpen, setIsAllTasksOpen] = useState(false);
  const [selectedSubjectForCCE, setSelectedSubjectForCCE] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAndroidBingoOpen, setIsAndroidBingoOpen] = useState(false);
  const isAndroid = Capacitor.getPlatform() === 'android';
  const { updateInfo } = useUpdateChecker();

  const { isActive: isNotificationHubActive, permission, requestPermission } = useNotificationHub(timetable, taskData);

  // CCE Handlers
  const handleAddCCEWork = (subject: string, work: Omit<CCEWork, 'id' | 'createdAt' | 'completed'>) => {
    const newWork: CCEWork = {
      ...work,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: Date.now(),
      completed: false
    };
    
    setCceData(prev => ({
      ...prev,
      [subject]: [newWork, ...(prev[subject] || [])]
    }));
  };

  const handleToggleCCEWork = (subject: string, workId: string) => {
    setCceData(prev => ({
      ...prev,
      [subject]: (prev[subject] || []).map(w => 
        w.id === workId ? { ...w, completed: !w.completed } : w
      )
    }));
  };

  const handleDeleteCCEWork = (subject: string, workId: string) => {
    setCceData(prev => ({
      ...prev,
      [subject]: (prev[subject] || []).filter(w => w.id !== workId)
    }));
  };

  const handleUpdateCCEWork = (subject: string, workId: string, updates: Partial<CCEWork>) => {
    setCceData(prev => ({
      ...prev,
      [subject]: (prev[subject] || []).map(w => 
        w.id === workId ? { ...w, ...updates } : w
      )
    }));
  };

  // Task Handlers
  const handleAddTask = (task: Omit<PersonalTask, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: PersonalTask = {
      ...task,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: Date.now(),
      completed: false
    };
    
    setTaskData(prev => ({
      ...prev,
      [task.date]: [newTask, ...(prev[task.date] || [])]
    }));
  };

  const handleDeleteTask = (date: string, taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setTaskData(prev => ({
      ...prev,
      [date]: (prev[date] || []).filter(t => t.id !== taskId)
    }));
  };

  const handleToggleTask = (date: string, taskId: string) => {
    setTaskData(prev => ({
      ...prev,
      [date]: (prev[date] || []).map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    }));
  };



  // Sync selected day with current day on initial load
  useEffect(() => {
    if (DAYS_OF_WEEK.includes(currentDay)) {
      setSelectedDay(currentDay);
    }
  }, [currentDay]);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };


  // Migration: Re-parse existing data with new logic if needed
  useEffect(() => {
    try {
      if (!timetable) return;
      
      let needsUpdate = false;
      const updatedTimetable = JSON.parse(JSON.stringify(timetable)) as TimetableData;
      
      Object.entries(updatedTimetable).forEach(([day, periods]) => {
        if (!periods || typeof periods !== 'object') return;
        Object.entries(periods).forEach(([pNum, info]) => {
          if (!info) return;
          // If the subject field contains ( or @, it was likely not parsed correctly before
          if (!info.teacher && !info.classroom && (info.subject.includes('(') || info.subject.includes('@'))) {
            const reParsed = parseCell(info.subject);
            if (reParsed && (reParsed.teacher || reParsed.classroom)) {
              updatedTimetable[day][parseInt(pNum) as any] = {
                ...info,
                ...reParsed
              };
              needsUpdate = true;
            }
          }
        });
      });
      
      if (needsUpdate) {
        setTimetable(updatedTimetable);
      }

      // Migration for CCE works: Add default type if missing
      if (cceData) {
        let cceNeedsUpdate = false;
        const updatedCceData = JSON.parse(JSON.stringify(cceData)) as CCEData;
        
        Object.entries(updatedCceData).forEach(([_subject, works]) => {
          if (!Array.isArray(works)) return;
          works.forEach((work: any) => {
            if (!work.type) {
              work.type = 'assignment';
              cceNeedsUpdate = true;
            }
            if (work.title && !work.topic) {
              work.topic = work.title;
              delete work.title;
              cceNeedsUpdate = true;
            }
          });
        });
        
        if (cceNeedsUpdate) {
          setCceData(updatedCceData);
        }
      }
    } catch (err) {
      console.error("Migration failed:", err);
    }
  }, []); // Run only once on mount



  function formatDay(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  }

  // Derived data for hooks and rendering
  const selectedDayData = timetable ? (timetable[selectedDay] || {}) : {};
  const selectedDate = formatISODate(getDateOfNextDay(selectedDay, now));
  const selectedDayTasks = taskData[selectedDate] || [];

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

  const combinedSchedule = useMemo(() => {
    if (!timetable) return [];
    
    const items: any[] = [];
    
    // Add periods
    PERIOD_TIMINGS.forEach(timing => {
      items.push({
        type: 'period',
        time: timing.startTime,
        timing,
        info: selectedDayData[timing.number],
        isActive: selectedDay === currentDay && isActivePeriod(timing, now),
        isPast: selectedDay === currentDay && isPastPeriod(timing, now),
        pendingWorksCount: selectedDayData[timing.number] 
          ? (cceData[selectedDayData[timing.number]!.subject] || []).filter(w => !w.completed).length 
          : 0,
        hasTaskConflict: selectedDayTasks.some(t => !t.completed && areTimesOverlapping(t.startTime, t.endTime, timing.startTime, timing.endTime, now))
      });
    });

    // Add tasks
    selectedDayTasks.forEach(task => {
      items.push({
        type: 'task',
        time: task.startTime,
        task
      });
    });

    return items.sort((a, b) => getMinutesSinceMidnight(a.time) - getMinutesSinceMidnight(b.time));
  }, [timetable, selectedDayData, selectedDayTasks, currentDay, selectedDay, now, cceData]);

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
    const installSection = (
      <div className="p-8 rounded-[2.5rem] bg-slate-900 dark:bg-slate-800 text-white space-y-4">
        <h2 className="text-xl font-black flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-slate-900 text-xs">
            {deferredPrompt ? '1' : '2'}
          </span>
          Install App
        </h2>
        <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-wide">
          Install Timetable Pro for offline access and the best scheduling experience.
        </p>
        <button 
          onClick={handleInstallClick}
          disabled={!deferredPrompt}
          className={cn(
            "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95",
            deferredPrompt 
              ? "bg-white text-slate-900 shadow-xl" 
              : "bg-slate-800 text-slate-600 cursor-not-allowed"
          )}
        >
          {deferredPrompt ? 'Install Timetable Pro' : 'Already Installed'}
        </button>
      </div>
    );

    const setupSection = (
      <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white text-xs">
            {deferredPrompt ? '2' : '1'}
          </span>
          Get Started
        </h2>
        <CsvUploader onDataLoaded={(data) => setTimetable(data)} />
        
        <div className="pt-4 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Features</h3>
          <ul className="space-y-3">
            {[
              { icon: Search, text: "Search subjects & rooms" },
              { icon: Bell, text: "Smart class notifications" },
              { icon: CheckCircle2, text: "Track assignments (CCE)" }
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                <item.icon size={16} className="text-primary-500" />
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-12 max-w-lg mx-auto py-16">
        <div className="text-center space-y-4">
          <div className="inline-block p-5 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl mb-2">
            <Calendar size={56} strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-none">
            Timetable Pro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">
            Precision Schedule Management
          </p>
        </div>
        
        <div className="w-full space-y-6">
          {deferredPrompt ? (
            <>
              {installSection}
              {setupSection}
            </>
          ) : (
            <>
              {setupSection}
              {installSection}
            </>
          )}
        </div>

        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Developed by mmchessman
          </p>
        </div>
      </div>
    );
  }



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
              onClick={() => isAndroid ? setIsAndroidBingoOpen(true) : setIsNotificationsOpen(!isNotificationsOpen)}
              className={cn(
                "p-3 rounded-2xl border transition-all active:scale-95 relative",
                (isAndroid ? isAndroidBingoOpen : isNotificationsOpen)
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white" 
                  : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
              )}
            >
              {isAndroid ? <Download size={20} strokeWidth={2.5} /> : <Bell size={20} strokeWidth={2.5} />}
              {((isNotificationHubActive && !isAndroid) || (updateInfo?.isAvailable)) && (
                <span className={cn(
                  "absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-950 animate-pulse",
                  updateInfo?.isAvailable ? "bg-red-500" : "bg-green-500"
                )} />
              )}
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
        
        {isNotificationsOpen && (
          <div className="max-w-2xl mx-auto px-4 py-4 animate-in slide-in-from-top-2 duration-300">
            <NotificationManager 
              permission={permission}
              onRequestPermission={requestPermission}
            />
          </div>
        )}
        
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
      <main className="max-w-2xl mx-auto px-4 py-8 flex-1 space-y-10">
        <TaskManager 
          date={selectedDate}
          tasks={selectedDayTasks}
          timetable={timetable || {}}
          onAddTask={handleAddTask}
          onDeleteTask={(id) => handleDeleteTask(selectedDate, id)}
          onToggleTask={(id) => handleToggleTask(selectedDate, id)}
          onViewAll={() => setIsAllTasksOpen(true)}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Daily Schedule</h3>
          </div>
          {combinedSchedule.map((item) => (
            item.type === 'period' ? (
              <PeriodCard
                key={`period-${item.timing.number}`}
                timing={item.timing}
                info={item.info}
                isActive={item.isActive}
                isPast={item.isPast}
                onOpenCCE={setSelectedSubjectForCCE}
                pendingWorksCount={item.pendingWorksCount}
                hasTaskConflict={item.hasTaskConflict}
              />
            ) : (
              <TaskCard 
                key={`task-${item.task.id}`}
                task={item.task}
                onDelete={() => handleDeleteTask(selectedDate, item.task.id)}
                onToggle={() => handleToggleTask(selectedDate, item.task.id)}
              />
            )
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
      {/* All Tasks Modal */}
      {isAllTasksOpen && (
        <AllTasksModal 
          tasks={taskData}
          onClose={() => setIsAllTasksOpen(false)}
          onDeleteTask={handleDeleteTask}
          onToggleTask={handleToggleTask}
        />
      )}

      {/* CCE Modal */}
      {selectedSubjectForCCE && (
        <CCEManager
          subject={selectedSubjectForCCE}
          works={cceData[selectedSubjectForCCE] || []}
          onClose={() => setSelectedSubjectForCCE(null)}
          onAddWork={handleAddCCEWork}
          onToggleWork={handleToggleCCEWork}
          onDeleteWork={handleDeleteCCEWork}
          onUpdateWork={handleUpdateCCEWork}
        />
      )}

      <WhatsNewModal />
      <AndroidBingoModal 
        isOpen={isAndroidBingoOpen} 
        onClose={() => setIsAndroidBingoOpen(false)} 
      />
    </div>
  );
}

export default App;
