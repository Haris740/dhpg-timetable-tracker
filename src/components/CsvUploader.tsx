import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { parseCSV } from '../utils/parser';
import type { TimetableData } from '../types';
import { cn } from '../utils/cn';

interface CsvUploaderProps {
  onDataLoaded: (data: TimetableData) => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const data = parseCSV(text);
        if (Object.keys(data).length === 0) {
          setError('Could not find any valid day entries in the CSV. Please check the format.');
          return;
        }
        onDataLoaded(data);
      } catch (err) {
        setError('Error parsing CSV file');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden",
          isDragging 
            ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/20" 
            : "border-slate-300 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 bg-white dark:bg-slate-900/40 shadow-xl shadow-slate-200/50 dark:shadow-none"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv, text/csv, application/vnd.ms-excel"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <div className="p-4 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-500 mb-4 transition-transform group-hover:scale-110">
          <Upload size={32} />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 text-center">
          Upload Timetable
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          Select or drag and drop your schedule CSV file here
        </p>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <FileText size={14} />
            <span>Format: Subject (Teacher) @ Room</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="text-red-500 shrink-0" size={20} />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};
