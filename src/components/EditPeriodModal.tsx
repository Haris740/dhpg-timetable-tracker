import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, Clock, BookOpen, User, Landmark, Save } from 'lucide-react';
import type { PeriodNumber } from '../types';
import { getDayName } from '../utils/time';
import { cn } from '../utils/cn';

interface EditPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string; // "YYYY-MM-DD"
  initialPeriodId?: string; // e.g., "period-3" or custom period ID
  initialSubject?: string;
  initialTeacher?: string;
  initialClassroom?: string;
  initialStartTime?: string; // "HH:mm"
  initialEndTime?: string;   // "HH:mm"
  initialIsCustom?: boolean;
  onSave: (
    saveMode: 'temporary' | 'permanent',
    periodInfo: {
      id?: string;
      subject: string;
      teacher?: string;
      classroom?: string;
      isCustom: boolean;
      periodNumber?: PeriodNumber;
      startTime?: string; // "HH:mm"
      endTime?: string;   // "HH:mm"
    }
  ) => void;
  onDelete?: (saveMode: 'temporary' | 'permanent', periodId: string) => void;
}

export const EditPeriodModal: React.FC<EditPeriodModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  initialPeriodId,
  initialSubject = '',
  initialTeacher = '',
  initialClassroom = '',
  initialStartTime = '09:00',
  initialEndTime = '10:00',
  initialIsCustom = false,
  onSave,
  onDelete
}) => {
  const [subject, setSubject] = useState(initialSubject);
  const [teacher, setTeacher] = useState(initialTeacher);
  const [classroom, setClassroom] = useState(initialClassroom);
  const [isCustom, setIsCustom] = useState(initialIsCustom);
  const [periodNumber, setPeriodNumber] = useState<PeriodNumber>(1);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [saveMode, setSaveMode] = useState<'temporary' | 'permanent'>('temporary');

  const dayName = getDayName(dateStr);

  useEffect(() => {
    if (isOpen) {
      setSubject(initialSubject);
      setTeacher(initialTeacher);
      setClassroom(initialClassroom);
      setIsCustom(initialIsCustom);
      setSaveMode('temporary');

      if (initialPeriodId && initialPeriodId.startsWith('period-')) {
        const num = parseInt(initialPeriodId.replace('period-', '')) as PeriodNumber;
        setPeriodNumber(num);
        setIsCustom(false);
      } else {
        setIsCustom(initialIsCustom);
        setStartTime(initialStartTime);
        setEndTime(initialEndTime);
      }
    }
  }, [isOpen, initialPeriodId, initialSubject, initialTeacher, initialClassroom, initialStartTime, initialEndTime, initialIsCustom]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    onSave(saveMode, {
      id: initialPeriodId,
      subject: subject.trim(),
      teacher: teacher.trim() || undefined,
      classroom: classroom.trim() || undefined,
      isCustom,
      periodNumber: isCustom ? undefined : periodNumber,
      startTime: isCustom ? startTime : undefined,
      endTime: isCustom ? endTime : undefined
    });
    onClose();
  };

  const handleDeleteClick = () => {
    if (initialPeriodId && onDelete) {
      const confirmMsg = saveMode === 'permanent' 
        ? `Are you sure you want to permanently delete this period from all ${dayName}s?`
        : `Are you sure you want to cancel this class on ${dateStr} only?`;
        
      if (window.confirm(confirmMsg)) {
        onDelete(saveMode, initialPeriodId);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase italic tracking-tighter">
              {initialPeriodId ? 'Edit Class' : 'Add Class'}
            </h2>
            <p className="text-xs font-black text-primary-500 uppercase tracking-widest mt-1 flex items-center gap-1">
              <Calendar size={12} />
              {dayName}, {dateStr}
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
        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
          
          {/* Edit Mode Tabs (Temporary vs Permanent) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Change Scope</label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              <button
                type="button"
                onClick={() => setSaveMode('temporary')}
                className={cn(
                  "py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  saveMode === 'temporary'
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                )}
              >
                Temporary
              </button>
              <button
                type="button"
                onClick={() => setSaveMode('permanent')}
                className={cn(
                  "py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  saveMode === 'permanent'
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
                )}
              >
                Permanent
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 italic px-1">
              {saveMode === 'temporary' 
                ? `Only affects ${dateStr}. Weekly schedule remains untouched.`
                : `Affects every ${dayName} on your schedule.`}
            </p>
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
              <BookOpen size={12} className="text-primary-500" />
              Subject Name
            </label>
            <input 
              autoFocus
              type="text" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Mathematics"
              required
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 ring-primary-500 transition-all font-black text-slate-900 dark:text-white text-sm"
            />
          </div>

          {/* Teacher and Room Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                <User size={12} className="text-primary-500" />
                Teacher
              </label>
              <input 
                type="text" 
                value={teacher}
                onChange={e => setTeacher(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 ring-primary-500 transition-all font-bold text-slate-900 dark:text-white text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                <Landmark size={12} className="text-primary-500" />
                Classroom
              </label>
              <input 
                type="text" 
                value={classroom}
                onChange={e => setClassroom(e.target.value)}
                placeholder="e.g. Room A101"
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 ring-primary-500 transition-all font-bold text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          {/* Timing Section Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Slot Timing Type</label>
            <div className="flex gap-4 px-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="radio"
                  checked={!isCustom}
                  onChange={() => setIsCustom(false)}
                  className="w-4 h-4 text-primary-500 border-slate-300 focus:ring-primary-500 accent-primary-500"
                />
                Standard Period (1-8)
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="radio"
                  checked={isCustom}
                  onChange={() => setIsCustom(true)}
                  className="w-4 h-4 text-primary-500 border-slate-300 focus:ring-primary-500 accent-primary-500"
                />
                Custom Time Slot
              </label>
            </div>
          </div>

          {/* Timing Inputs */}
          {!isCustom ? (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Period Number</label>
              <select
                value={periodNumber}
                onChange={e => setPeriodNumber(parseInt(e.target.value) as PeriodNumber)}
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 ring-primary-500 transition-all font-bold text-slate-900 dark:text-white text-xs appearance-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>Period {n} (Standard Timings)</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-900 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                  <Clock size={12} className="text-primary-500" />
                  Start Time
                </label>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 ring-primary-500 transition-all font-bold text-slate-900 dark:text-white text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-1.5">
                  <Clock size={12} className="text-primary-500" />
                  End Time
                </label>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 ring-primary-500 transition-all font-bold text-slate-900 dark:text-white text-xs"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-900">
            {initialPeriodId && onDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-500 rounded-2xl font-black transition-colors border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                title="Remove Class"
              >
                <Trash2 size={18} strokeWidth={2.5} />
              </button>
            )}
            
            <button
              type="submit"
              disabled={!subject.trim()}
              className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} strokeWidth={2.5} />
              {initialPeriodId ? 'Update Class' : 'Save Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
