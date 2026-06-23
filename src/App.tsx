import { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, X, Sun, Moon, Bell, CheckCircle2, Settings, Plus } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useCurrentTime } from './hooks/useCurrentTime';
import { useTheme } from './hooks/useTheme';
import type { TimetableData, CCEData, CCEWork, TaskData, PersonalTask, AppSettings, CustomPeriod, TimetableOverrides, PeriodTiming, PeriodNumber } from './types';
import { PERIOD_TIMINGS, DAYS_OF_WEEK } from './types';
import { parseCell } from './utils/parser';
import { CsvUploader } from './components/CsvUploader';
import { PeriodCard } from './components/PeriodCard';
import { CCEManager } from './components/CCEManager';
import { NowNextBanner } from './components/NowNextBanner';
import { NotificationManager } from './components/NotificationManager';
import { WhatsNewModal } from './components/WhatsNewModal';
import { EditPeriodModal } from './components/EditPeriodModal';
import { WeeklyGridView } from './components/WeeklyGridView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsModal } from './components/SettingsModal';

import { useNotificationHub } from './hooks/useNotificationHub';
import { cn } from './utils/cn';
import { getSubjectColor, getColorClasses } from './utils/colors';
import { TaskManager } from './components/TaskManager';
import { AllTasksModal } from './components/AllTasksModal';
import { TaskCard } from './components/TaskCard';
import { AndroidBingoModal } from './components/AndroidBingoModal';
import { Capacitor } from '@capacitor/core';
import { 
  formatISODate, 
  getDateOfNextDay, 
  areTimesOverlapping, 
  getMinutesSinceMidnight,
  getScheduleForDate,
  getCurrentClass,
  getNextClass
} from './utils/time';
import { generateGoogleCalendarUrl } from './utils/calendar';
import { parse, isWithinInterval, isAfter } from 'date-fns';
import { Download } from 'lucide-react';
import { useUpdateChecker } from './hooks/useUpdateChecker';

function App() {
  const [timetable, setTimetable] = useLocalStorage<TimetableData | null>('timetable', null);
  const [cceData, setCceData] = useLocalStorage<CCEData>('cce_works', {});
  const [taskData, setTaskData] = useLocalStorage<TaskData>('personal_tasks', {});
  const [weeklyCustomPeriods, setWeeklyCustomPeriods] = useLocalStorage<{ [day: string]: CustomPeriod[] }>('weekly_custom_periods', {});
  const [timetableOverrides, setTimetableOverrides] = useLocalStorage<TimetableOverrides>('timetable_overrides', {});
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('app_settings', {
    notificationsEnabled: true,
    notificationOffset: 0
  });

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
  const isAndroid = Capacitor.getPlatform() === 'android' || /Android/i.test(navigator.userAgent);
  const { updateInfo } = useUpdateChecker();

  // Tab Selection
  const [activeTab, setActiveTab] = useState<'daily' | 'grid' | 'stats'>('daily');

  // Edit class state
  const [isEditPeriodOpen, setIsEditPeriodOpen] = useState(false);
  const [editingCellInfo, setEditingCellInfo] = useState<{
    dateStr: string;
    periodId?: string;
    subject?: string;
    teacher?: string;
    classroom?: string;
    startTime?: string;
    endTime?: string;
    isCustom?: boolean;
  } | null>(null);

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { isActive: isNotificationHubActive, permission, requestPermission } = useNotificationHub(
    timetable,
    weeklyCustomPeriods,
    timetableOverrides,
    taskData,
    appSettings
  );

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

  // Period / Schedule Editing Handlers
  const handleSavePeriod = (
    mode: 'temporary' | 'permanent',
    periodInfo: {
      id?: string;
      subject: string;
      teacher?: string;
      classroom?: string;
      isCustom: boolean;
      periodNumber?: PeriodNumber;
      startTime?: string;
      endTime?: string;
    }
  ) => {
    const newInfo = {
      subject: periodInfo.subject,
      teacher: periodInfo.teacher,
      classroom: periodInfo.classroom
    };

    if (mode === 'permanent') {
      if (periodInfo.isCustom) {
        const cp: CustomPeriod = {
          id: periodInfo.id || Math.random().toString(36).substring(2, 11),
          subject: periodInfo.subject,
          teacher: periodInfo.teacher,
          classroom: periodInfo.classroom,
          startTime: periodInfo.startTime || '09:00',
          endTime: periodInfo.endTime || '10:00'
        };
        setWeeklyCustomPeriods(prev => {
          const list = prev[selectedDay] || [];
          if (periodInfo.id) {
            return { ...prev, [selectedDay]: list.map(item => item.id === periodInfo.id ? cp : item) };
          } else {
            return { ...prev, [selectedDay]: [...list, cp] };
          }
        });
      } else {
        const pNum = periodInfo.periodNumber!;
        setTimetable(prev => {
          const updated = prev ? { ...prev } : {};
          if (!updated[selectedDay]) updated[selectedDay] = {};
          updated[selectedDay][pNum] = newInfo;
          return updated;
        });
      }
    } else {
      // Temporary override for selectedDate
      setTimetableOverrides(prev => {
        const dateOverride = prev[selectedDate] || { periods: {}, customPeriods: [] };
        const updatedPeriods = { ...dateOverride.periods };
        let updatedCustom = [...(dateOverride.customPeriods || [])];

        if (periodInfo.isCustom) {
          const cp: CustomPeriod = {
            id: periodInfo.id || Math.random().toString(36).substring(2, 11),
            subject: periodInfo.subject,
            teacher: periodInfo.teacher,
            classroom: periodInfo.classroom,
            startTime: periodInfo.startTime || '09:00',
            endTime: periodInfo.endTime || '10:00'
          };
          if (periodInfo.id) {
            const isTempCp = updatedCustom.some(item => item.id === periodInfo.id);
            if (isTempCp) {
               updatedCustom = updatedCustom.map(item => item.id === periodInfo.id ? cp : item);
            } else {
               updatedPeriods[periodInfo.id] = null; // override weekly custom
               updatedCustom.push(cp);
            }
          } else {
            updatedCustom.push(cp);
          }
        } else {
          const pNumStr = periodInfo.periodNumber!.toString();
          updatedPeriods[pNumStr] = newInfo;
        }

        return {
          ...prev,
          [selectedDate]: {
            periods: updatedPeriods,
            customPeriods: updatedCustom
          }
        };
      });
    }
  };

  const handleDeletePeriod = (mode: 'temporary' | 'permanent', periodId: string) => {
    if (mode === 'permanent') {
      if (periodId.startsWith('period-')) {
        const pNum = parseInt(periodId.replace('period-', '')) as PeriodNumber;
        setTimetable(prev => {
          if (!prev) return prev;
          const updated = { ...prev };
          if (updated[selectedDay]) {
            delete updated[selectedDay][pNum];
          }
          return updated;
        });
      } else {
        setWeeklyCustomPeriods(prev => {
          const list = prev[selectedDay] || [];
          return {
            ...prev,
            [selectedDay]: list.filter(item => item.id !== periodId)
          };
        });
      }
    } else {
      // Temporary override (mark as deleted)
      setTimetableOverrides(prev => {
        const dateOverride = prev[selectedDate] || { periods: {}, customPeriods: [] };
        const updatedPeriods = { ...dateOverride.periods };
        let updatedCustom = [...(dateOverride.customPeriods || [])];

        if (periodId.startsWith('period-')) {
          const pNumStr = periodId.replace('period-', '');
          updatedPeriods[pNumStr] = null;
        } else {
          const isTempCp = updatedCustom.some(item => item.id === periodId);
          if (isTempCp) {
            updatedCustom = updatedCustom.filter(item => item.id !== periodId);
          } else {
            updatedPeriods[periodId] = null;
          }
        }

        return {
          ...prev,
          [selectedDate]: {
            periods: updatedPeriods,
            customPeriods: updatedCustom
          }
        };
      });
    }
  };

  // Full backup data import
  const handleImportAllData = (imported: {
    timetable: TimetableData | null;
    weeklyCustomPeriods: { [day: string]: CustomPeriod[] };
    overrides: TimetableOverrides;
    cceData: CCEData;
    taskData: TaskData;
    settings: AppSettings;
  }) => {
    setTimetable(imported.timetable);
    setWeeklyCustomPeriods(imported.weeklyCustomPeriods);
    setTimetableOverrides(imported.overrides);
    setCceData(imported.cceData);
    setTaskData(imported.taskData);
    setAppSettings(imported.settings);
  };

  // Nuke sections
  const handleClearSection = (section: 'timetable' | 'cce' | 'tasks' | 'all') => {
    if (section === 'timetable') {
      setTimetable(null);
      setWeeklyCustomPeriods({});
      setTimetableOverrides({});
    } else if (section === 'cce') {
      setCceData({});
    } else if (section === 'tasks') {
      setTaskData({});
    } else if (section === 'all') {
      setTimetable(null);
      setWeeklyCustomPeriods({});
      setTimetableOverrides({});
      setCceData({});
      setTaskData({});
      setAppSettings({ notificationsEnabled: true, notificationOffset: 0 });
    }
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
  const selectedDate = formatISODate(getDateOfNextDay(selectedDay, now));
  const selectedDayTasks = taskData[selectedDate] || [];

  const todayDateStr = useMemo(() => formatISODate(now), [now]);

  const todayResolvedSchedule = useMemo(() => {
    return getScheduleForDate(todayDateStr, timetable, weeklyCustomPeriods, timetableOverrides);
  }, [todayDateStr, timetable, weeklyCustomPeriods, timetableOverrides]);

  const currentPeriodInfo = useMemo(() => {
    const item = getCurrentClass(now, todayResolvedSchedule);
    if (!item) return undefined;
    const timing: PeriodTiming = {
      number: (item.periodNumber || 0) as PeriodNumber,
      startTime: item.startTime,
      endTime: item.endTime
    };
    return { timing, info: item };
  }, [now, todayResolvedSchedule]);

  const nextPeriodInfo = useMemo(() => {
    const item = getNextClass(now, todayResolvedSchedule);
    if (!item) return undefined;
    const timing: PeriodTiming = {
      number: (item.periodNumber || 0) as PeriodNumber,
      startTime: item.startTime,
      endTime: item.endTime
    };
    return { timing, info: item };
  }, [now, todayResolvedSchedule]);

  const resolvedSchedule = useMemo(() => {
    return getScheduleForDate(selectedDate, timetable, weeklyCustomPeriods, timetableOverrides);
  }, [selectedDate, timetable, weeklyCustomPeriods, timetableOverrides]);

  const combinedSchedule = useMemo(() => {
    const items: any[] = [];
    
    // Add periods
    resolvedSchedule.forEach(item => {
      const startDateTime = parse(`${selectedDate} ${item.startTime24}`, 'yyyy-MM-dd HH:mm', now);
      const endDateTime = parse(`${selectedDate} ${item.endTime24}`, 'yyyy-MM-dd HH:mm', now);

      const isActive = selectedDay === currentDay && isWithinInterval(now, { start: startDateTime, end: endDateTime });
      const isPast = selectedDay === currentDay && isAfter(now, endDateTime);

      const timing: PeriodTiming = {
        number: (item.periodNumber || 0) as PeriodNumber,
        startTime: item.startTime,
        endTime: item.endTime
      };

      items.push({
        type: 'period',
        id: item.id,
        time: item.startTime,
        timing,
        info: item.subject ? { subject: item.subject, teacher: item.teacher, classroom: item.classroom } : undefined,
        isActive,
        isPast,
        isCustom: item.isCustom,
        isCanceled: item.isCanceled,
        pendingWorksCount: item.subject 
          ? (cceData[item.subject] || []).filter(w => !w.completed).length 
          : 0,
        hasTaskConflict: selectedDayTasks.some(t => 
          !t.completed && 
          areTimesOverlapping(t.startTime, t.endTime, item.startTime24, item.endTime24, now)
        )
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
  }, [resolvedSchedule, selectedDayTasks, currentDay, selectedDay, now, cceData, selectedDate]);

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
              title="Search Schedule"
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
              title="Updates & Info"
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
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition-all active:scale-95"
              title="Open Settings"
            >
              <Settings size={20} strokeWidth={2.5} />
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

        {/* View Switcher Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex border-t border-slate-100 dark:border-slate-900">
          <button
            onClick={() => setActiveTab('daily')}
            className={cn(
              "flex-1 py-3 text-[11px] font-black uppercase tracking-widest text-center border-b-2 transition-all",
              activeTab === 'daily'
                ? "border-primary-500 text-slate-900 dark:text-white"
                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600"
            )}
          >
            Daily
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            className={cn(
              "flex-1 py-3 text-[11px] font-black uppercase tracking-widest text-center border-b-2 transition-all",
              activeTab === 'grid'
                ? "border-primary-500 text-slate-900 dark:text-white"
                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600"
            )}
          >
            Weekly Grid
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={cn(
              "flex-1 py-3 text-[11px] font-black uppercase tracking-widest text-center border-b-2 transition-all",
              activeTab === 'stats'
                ? "border-primary-500 text-slate-900 dark:text-white"
                : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600"
            )}
          >
            Analytics
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-8 flex-1 space-y-10 w-full">
        {activeTab === 'daily' && (
          <>
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
                <button
                  onClick={() => {
                    setEditingCellInfo({ dateStr: selectedDate, isCustom: true });
                    setIsEditPeriodOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest transition-colors border border-slate-200/50 dark:border-slate-800/50"
                >
                  <Plus size={12} strokeWidth={3} />
                  Add Class
                </button>
              </div>

              {combinedSchedule.length > 0 ? (
                combinedSchedule.map((item) => (
                  item.type === 'period' ? (
                    <PeriodCard
                      key={`period-${item.id}`}
                      timing={item.timing}
                      info={item.info}
                      isActive={item.isActive}
                      isPast={item.isPast}
                      onOpenCCE={setSelectedSubjectForCCE}
                      pendingWorksCount={item.pendingWorksCount}
                      hasTaskConflict={item.hasTaskConflict}
                      isCustom={item.isCustom}
                      isCanceled={item.isCanceled}
                      googleCalendarUrl={item.info?.subject ? generateGoogleCalendarUrl(
                        item.info.subject,
                        item.timing.startTime,
                        item.timing.endTime,
                        selectedDate,
                        item.info.classroom,
                        item.info.teacher ? `Teacher: ${item.info.teacher}` : '',
                        true
                      ) : undefined}
                      onClick={() => {
                        setEditingCellInfo({
                          dateStr: selectedDate,
                          periodId: item.id,
                          subject: item.info?.subject,
                          teacher: item.info?.teacher,
                          classroom: item.info?.classroom,
                          startTime: item.isCustom ? item.timing.startTime : undefined,
                          endTime: item.isCustom ? item.timing.endTime : undefined,
                          isCustom: item.isCustom
                        });
                        setIsEditPeriodOpen(true);
                      }}
                    />
                  ) : (
                    <TaskCard 
                      key={`task-${item.task.id}`}
                      task={item.task}
                      googleCalendarUrl={generateGoogleCalendarUrl(
                        item.task.title,
                        item.task.startTime,
                        item.task.endTime,
                        selectedDate,
                        undefined,
                        'Personal Task'
                      )}
                      onDelete={() => handleDeleteTask(selectedDate, item.task.id)}
                      onToggle={() => handleToggleTask(selectedDate, item.task.id)}
                    />
                  )
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-400 font-black italic">No classes or tasks scheduled for today</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'grid' && (
          <WeeklyGridView 
            timetable={timetable} 
            onCellClick={(dayName, periodNumber, cellDate) => {
              setSelectedDay(dayName);
              const resolved = getScheduleForDate(cellDate, timetable, weeklyCustomPeriods, timetableOverrides);
              const matched = resolved.find(it => it.periodNumber === periodNumber);

              setEditingCellInfo({
                dateStr: cellDate,
                periodId: matched ? matched.id : `period-${periodNumber}`,
                subject: matched?.subject,
                teacher: matched?.teacher,
                classroom: matched?.classroom,
                isCustom: false
              });
              setIsEditPeriodOpen(true);
            }}
          />
        )}

        {activeTab === 'stats' && (
          <AnalyticsView 
            timetable={timetable}
            weeklyCustomPeriods={weeklyCustomPeriods}
            cceData={cceData}
            taskData={taskData}
          />
        )}
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

      {/* Edit Period Modal */}
      {isEditPeriodOpen && editingCellInfo && (
        <EditPeriodModal
          isOpen={isEditPeriodOpen}
          onClose={() => {
            setIsEditPeriodOpen(false);
            setEditingCellInfo(null);
          }}
          dateStr={editingCellInfo.dateStr}
          initialPeriodId={editingCellInfo.periodId}
          initialSubject={editingCellInfo.subject}
          initialTeacher={editingCellInfo.teacher}
          initialClassroom={editingCellInfo.classroom}
          initialStartTime={editingCellInfo.startTime}
          initialEndTime={editingCellInfo.endTime}
          initialIsCustom={editingCellInfo.isCustom}
          onSave={handleSavePeriod}
          onDelete={handleDeletePeriod}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={appSettings}
          onUpdateSettings={(updates) => setAppSettings(prev => ({ ...prev, ...updates }))}
          timetable={timetable}
          weeklyCustomPeriods={weeklyCustomPeriods}
          overrides={timetableOverrides}
          cceData={cceData}
          taskData={taskData}
          onImportAllData={handleImportAllData}
          onClearSection={handleClearSection}
        />
      )}

      <WhatsNewModal onClose={() => {
        if (isAndroid) setIsAndroidBingoOpen(true);
      }} />
      
      <AndroidBingoModal 
        isOpen={isAndroidBingoOpen} 
        onClose={() => setIsAndroidBingoOpen(false)} 
        apkUrl={updateInfo?.apkUrl}
      />
    </div>
  );
}

export default App;
