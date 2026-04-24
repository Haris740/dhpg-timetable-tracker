import React, { useState, useMemo } from 'react';
import { X, Plus, Calendar, CheckCircle2, Circle, Trash2, Clock, AlertCircle, BookOpen, Presentation, Video, PenTool, Search, Layout, FileText, Pencil } from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import type { CCEWork, CCEWorkType } from '../types';
import { cn } from '../utils/cn';

interface CCEManagerProps {
  subject: string;
  works: CCEWork[];
  onClose: () => void;
  onAddWork: (subject: string, work: Omit<CCEWork, 'id' | 'createdAt' | 'completed'>) => void;
  onUpdateWork: (subject: string, workId: string, updates: Partial<CCEWork>) => void;
  onToggleWork: (subject: string, workId: string) => void;
  onDeleteWork: (subject: string, workId: string) => void;
}

const WORK_TYPES: { value: CCEWorkType; label: string; icon: any; color: string }[] = [
  { value: 'assignment', label: 'Assignment', icon: FileText, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  { value: 'ppt', label: 'PPT', icon: Layout, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
  { value: 'presentation', label: 'Presentation', icon: Presentation, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
  { value: 'reading', label: 'Reading', icon: BookOpen, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
  { value: 'research', label: 'Research', icon: Search, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
  { value: 'watching', label: 'Watching', icon: Video, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' },
  { value: 'note writing', label: 'Note Writing', icon: PenTool, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
];

export const CCEManager: React.FC<CCEManagerProps> = ({
  subject,
  works,
  onClose,
  onAddWork,
  onUpdateWork,
  onToggleWork,
  onDeleteWork,
}) => {
  const [newType, setNewType] = useState<CCEWorkType>('assignment');
  const [newTopic, setNewTopic] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null);

  const sortedWorks = useMemo(() => {
    return [...works].sort((a, b) => b.createdAt - a.createdAt);
  }, [works]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    if (editingWorkId) {
      onUpdateWork(subject, editingWorkId, {
        type: newType,
        topic: newTopic.trim(),
        deadline: newDeadline || undefined,
      });
    } else {
      onAddWork(subject, {
        type: newType,
        topic: newTopic.trim(),
        deadline: newDeadline || undefined,
      } as any);
    }

    resetForm();
  };

  const resetForm = () => {
    setNewType('assignment');
    setNewTopic('');
    setNewDeadline('');
    setShowAddForm(false);
    setEditingWorkId(null);
  };

  const handleEdit = (work: CCEWork) => {
    setNewType(work.type);
    setNewTopic(work.topic);
    setNewDeadline(work.deadline || '');
    setEditingWorkId(work.id);
    setShowAddForm(true);
  };

  const getDeadlineStatus = (deadline?: string) => {
    if (!deadline) return null;
    const date = parseISO(deadline);
    const past = isPast(date);
    return {
      text: formatDistanceToNow(date, { addSuffix: true }),
      isPast: past,
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">CCE Works</h2>
            <p className="text-sm font-bold text-primary-500 uppercase tracking-widest mt-1">{subject}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
          {sortedWorks.length === 0 && !showAddForm ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 border border-slate-100 dark:border-slate-800">
                <Clock size={40} strokeWidth={2.5} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-black text-lg">No works recorded</p>
              <p className="text-slate-400 dark:text-slate-600 text-sm font-bold mb-8">Start tracking your academic progress</p>
              <button 
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
              >
                <Plus size={18} strokeWidth={3} />
                Add First Work
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {showAddForm ? (
                <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 mb-8 animate-in slide-in-from-top-4 duration-300">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2 px-1">Topic / Subject Matter</label>
                        <input
                          autoFocus
                          type="text"
                          required
                          placeholder="What is this work about?"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-primary-200 dark:border-primary-800 outline-none focus:ring-2 ring-primary-500 transition-all font-bold text-slate-900 dark:text-white"
                          value={newTopic}
                          onChange={(e) => setNewTopic(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2 px-1">Type of Work</label>
                        <select
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-primary-200 dark:border-primary-800 outline-none focus:ring-2 ring-primary-500 transition-all font-bold text-slate-900 dark:text-white appearance-none"
                          value={newType}
                          onChange={(e) => setNewType(e.target.value as CCEWorkType)}
                        >
                          {WORK_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2 px-1">Deadline</label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-primary-200 dark:border-primary-800 outline-none focus:ring-2 ring-primary-500 transition-all font-bold text-slate-900 dark:text-white"
                          value={newDeadline}
                          onChange={(e) => setNewDeadline(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-500/30 active:scale-95 transition-transform"
                      >
                        {editingWorkId ? 'Update Work' : 'Save Work'}
                      </button>
                      <button 
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-400 hover:text-primary-500 hover:border-primary-500/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all font-black text-xs uppercase tracking-widest mb-6"
                >
                  <Plus size={16} strokeWidth={3} />
                  Add New Work
                </button>
              )}

              <div className="grid gap-4">
                {sortedWorks.map((work) => {
                  const status = getDeadlineStatus(work.deadline);
                  const typeInfo = WORK_TYPES.find(t => t.value === work.type) || WORK_TYPES[0];
                  const Icon = typeInfo.icon;

                  return (
                    <div 
                      key={work.id}
                      className={cn(
                        "group p-5 rounded-3xl border transition-all duration-300 flex items-start gap-4",
                        work.completed 
                          ? "bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/60 opacity-75" 
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 shadow-sm"
                      )}
                    >
                      <button 
                        onClick={() => onToggleWork(subject, work.id)}
                        className={cn(
                          "mt-1 p-1 rounded-full transition-colors",
                          work.completed ? "text-green-500" : "text-slate-300 dark:text-slate-700 hover:text-primary-500"
                        )}
                      >
                        {work.completed ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <Circle size={24} strokeWidth={2.5} />}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn("px-2 py-0.5 rounded-lg flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider", typeInfo.color)}>
                            <Icon size={10} strokeWidth={3} />
                            {typeInfo.label}
                          </div>
                        </div>
                        <h4 className={cn(
                          "text-lg font-black leading-tight mb-1",
                          work.completed ? "text-slate-400 line-through decoration-2" : "text-slate-900 dark:text-white"
                        )}>
                          {work.topic}
                        </h4>
                        {work.deadline && (
                          <div className={cn(
                            "flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider",
                            work.completed ? "text-slate-400" : status?.isPast ? "text-red-500" : "text-slate-400 dark:text-slate-500"
                          )}>
                            {status?.isPast ? <AlertCircle size={12} /> : <Calendar size={12} />}
                            <span>{status?.text}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(work)}
                          className="p-2.5 rounded-xl text-slate-300 dark:text-slate-700 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                        >
                          <Pencil size={18} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => onDeleteWork(subject, work.id)}
                          className="p-2.5 rounded-xl text-slate-300 dark:text-slate-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <Trash2 size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>


        {/* Footer Info */}
        <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900/50 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
            Keep track of your academic progress
          </p>
        </div>
      </div>
    </div>
  );
};
