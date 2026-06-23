import React, { useRef, useState } from 'react';
import { X, Bell, Download, Upload, Trash2, ShieldAlert, Sparkles, FileText, CalendarRange } from 'lucide-react';
import type { AppSettings, TimetableData, CustomPeriod, TimetableOverrides, CCEData, TaskData } from '../types';
import { exportToICS } from '../utils/calendar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  // Exporter data source
  timetable: TimetableData | null;
  weeklyCustomPeriods: { [day: string]: CustomPeriod[] };
  overrides: TimetableOverrides;
  cceData: CCEData;
  taskData: TaskData;
  onImportAllData: (imported: {
    timetable: TimetableData | null;
    weeklyCustomPeriods: { [day: string]: CustomPeriod[] };
    overrides: TimetableOverrides;
    cceData: CCEData;
    taskData: TaskData;
    settings: AppSettings;
  }) => void;
  onClearSection: (section: 'timetable' | 'cce' | 'tasks' | 'all') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  timetable,
  weeklyCustomPeriods,
  overrides,
  cceData,
  taskData,
  onImportAllData,
  onClearSection
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGoogleImportSteps, setShowGoogleImportSteps] = useState(false);

  if (!isOpen) return null;

  const handleSyncAllGoogleCalendar = () => {
    // 1. Download file first
    handleExportICS();
    // 2. Open instruction UI
    setShowGoogleImportSteps(true);
  };

  if (showGoogleImportSteps) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase italic tracking-tighter">
                Add All to Google
              </h2>
              <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">
                Follow these simple steps
              </p>
            </div>
            <button 
              onClick={() => setShowGoogleImportSteps(false)}
              className="p-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6 flex-1 overflow-y-auto no-scrollbar">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center font-black text-xs text-blue-500 shrink-0 mt-0.5">
                1
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Calendar File Downloaded</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Your schedule file <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[10px] font-mono">timetable_pro_calendar.ics</code> has been downloaded to your device automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center font-black text-xs text-blue-500 shrink-0 mt-0.5">
                2
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Open Import Settings</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Click the button below to open the Google Calendar Import section in a new tab.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center font-black text-xs text-blue-500 shrink-0 mt-0.5">
                3
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Import your File</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  Select "Select file from your computer", choose the downloaded <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[10px] font-mono">.ics</code> file, choose your target calendar, and click <strong>Import</strong>.
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button 
                onClick={() => window.open('https://calendar.google.com/calendar/r/settings/export', '_blank')}
                className="w-full p-4 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2.5 active:scale-95 transition-transform"
              >
                <CalendarRange size={16} strokeWidth={2.5} />
                Open Google Calendar Settings
              </button>
              
              <button 
                onClick={() => setShowGoogleImportSteps(false)}
                className="w-full p-4 rounded-3xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-300 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 active:scale-95 transition-transform"
              >
                Go Back to Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. Export Backup JSON
  const handleExportBackup = () => {
    const backupObj = {
      version: '3.0.0',
      timetable,
      weeklyCustomPeriods,
      overrides,
      cceData,
      taskData,
      settings
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `timetable_pro_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 2. Import Backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Basic validation of keys
        if ('timetable' in parsed || 'cceData' in parsed || 'taskData' in parsed) {
          if (window.confirm("Importing this backup will overwrite all current schedule, tasks, and settings. Proceed?")) {
            onImportAllData({
              timetable: parsed.timetable || null,
              weeklyCustomPeriods: parsed.weeklyCustomPeriods || {},
              overrides: parsed.overrides || {},
              cceData: parsed.cceData || {},
              taskData: parsed.taskData || {},
              settings: parsed.settings || { notificationsEnabled: true, notificationOffset: 0 }
            });
            alert("Backup imported successfully!");
            onClose();
          }
        } else {
          alert("Invalid backup file format. Missing core properties.");
        }
      } catch (err) {
        alert("Failed to parse JSON backup file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // 3. Export to iCalendar (ICS)
  const handleExportICS = () => {
    const icsContent = exportToICS(timetable, weeklyCustomPeriods, overrides, taskData);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'timetable_pro_calendar.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase italic tracking-tighter">
              Settings
            </h2>
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">
              Configure & Back up Schedule
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          
          {/* General & Alerts Settings */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Bell size={12} className="text-primary-500" />
              Notifications Preferences
            </h3>
            
            <div className="space-y-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              {/* Alert Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Class Notifications</span>
                  <p className="text-[10px] font-bold text-slate-400">Receive alerts before periods start</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.notificationsEnabled}
                    onChange={(e) => onUpdateSettings({ notificationsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
                </label>
              </div>

              {/* Offset Select */}
              {settings.notificationsEnabled && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alert Trigger Offset</label>
                  <select
                    value={settings.notificationOffset}
                    onChange={(e) => onUpdateSettings({ notificationOffset: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 ring-primary-500 transition-all font-bold text-slate-900 dark:text-white text-xs appearance-none"
                  >
                    <option value={0}>At class start (0 minutes)</option>
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Sync & Export */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <CalendarRange size={12} className="text-primary-500" />
              Calendar Sync & Export
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleSyncAllGoogleCalendar}
                className="w-full p-4 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2.5 active:scale-95 transition-transform"
              >
                <CalendarRange size={16} strokeWidth={2.5} />
                Add All to Google Calendar
              </button>

              <button 
                onClick={handleExportICS}
                className="w-full p-4 rounded-3xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-300 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 active:scale-95 transition-transform border border-slate-200 dark:border-slate-800"
              >
                <Download size={16} strokeWidth={2.5} />
                Export to iCalendar (.ics)
              </button>

              <div className="p-4 rounded-3xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20 text-blue-600 dark:text-blue-400">
                <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Sparkles size={12} />
                  Google Calendar Tip
                </span>
                <p className="text-[10px] font-bold leading-normal text-slate-500 dark:text-slate-400">
                  Import the `.ics` file directly into your Google Calendar settings or tap the **Google Calendar** button on individual periods inside the app.
                </p>
              </div>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <FileText size={12} className="text-primary-500" />
              Local Backups
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleExportBackup}
                className="p-4 rounded-3xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest shadow-sm flex flex-col items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform"
              >
                <Download size={18} strokeWidth={2.5} className="text-primary-500" />
                Export Backup
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-3xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest shadow-sm flex flex-col items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform"
              >
                <Upload size={18} strokeWidth={2.5} className="text-primary-500" />
                Import Backup
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json"
                onChange={handleImportBackup}
              />
            </div>
          </div>

          {/* Advanced / Purge options */}
          <div className="space-y-4 border-t border-slate-100 dark:border-slate-900/60 pt-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
              <ShieldAlert size={14} />
              Danger Zone
            </h3>

            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => {
                  if (confirm("Reset timetable and custom periods? This cannot be undone.")) {
                    onClearSection('timetable');
                  }
                }}
                className="w-full px-5 py-3 rounded-2xl border border-red-200/50 dark:border-red-900/30 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/10 text-left font-bold text-xs flex justify-between items-center transition-colors"
              >
                <span>Clear Timetable Schedule</span>
                <Trash2 size={14} />
              </button>

              <button 
                onClick={() => {
                  if (confirm("Erase all CCE homework records? This cannot be undone.")) {
                    onClearSection('cce');
                  }
                }}
                className="w-full px-5 py-3 rounded-2xl border border-red-200/50 dark:border-red-900/30 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/10 text-left font-bold text-xs flex justify-between items-center transition-colors"
              >
                <span>Clear CCE Assignments</span>
                <Trash2 size={14} />
              </button>

              <button 
                onClick={() => {
                  if (confirm("Erase all personal tasks? This cannot be undone.")) {
                    onClearSection('tasks');
                  }
                }}
                className="w-full px-5 py-3 rounded-2xl border border-red-200/50 dark:border-red-900/30 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/10 text-left font-bold text-xs flex justify-between items-center transition-colors"
              >
                <span>Clear Personal Tasks</span>
                <Trash2 size={14} />
              </button>

              <button 
                onClick={() => {
                  if (confirm("DANGER: This will wipe ALL app data (Timetable, Tasks, CCE, and settings). Continue?")) {
                    onClearSection('all');
                  }
                }}
                className="w-full px-5 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest flex justify-between items-center shadow-lg shadow-red-600/20 active:scale-95 transition-transform"
              >
                <span>Nuke Everything</span>
                <Trash2 size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
