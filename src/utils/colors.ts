export type SubjectColor = 'blue' | 'emerald' | 'rose' | 'amber' | 'violet' | 'indigo' | 'teal' | 'orange' | 'cyan' | 'pink';

const COLORS: SubjectColor[] = [
  'blue',
  'rose',
  'emerald',
  'amber',
  'violet',
  'indigo',
  'teal',
  'orange',
  'cyan',
  'pink'
];

export const getSubjectColor = (subject: string): SubjectColor => {
  if (!subject) return 'blue';
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

export interface ColorClasses {
  bg: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  ring: string;
}

export const getColorClasses = (color: SubjectColor): ColorClasses => {
  const mapping: Record<SubjectColor, ColorClasses> = {
    blue: {
      bg: 'bg-blue-600 dark:bg-blue-600/80',
      border: 'border-blue-700/50 dark:border-blue-500/30',
      textPrimary: 'text-white',
      textSecondary: 'text-blue-100/80',
      accent: 'bg-white',
      ring: 'ring-blue-500/40',
    },
    emerald: {
      bg: 'bg-emerald-600 dark:bg-emerald-600/80',
      border: 'border-emerald-700/50 dark:border-emerald-500/30',
      textPrimary: 'text-white',
      textSecondary: 'text-emerald-100/80',
      accent: 'bg-white',
      ring: 'ring-emerald-500/40',
    },
    rose: {
      bg: 'bg-rose-600 dark:bg-rose-600/80',
      border: 'border-rose-700/50 dark:border-rose-500/30',
      textPrimary: 'text-white',
      textSecondary: 'text-rose-100/80',
      accent: 'bg-white',
      ring: 'ring-rose-500/40',
    },
    amber: {
      bg: 'bg-amber-500 dark:bg-amber-600/80',
      border: 'border-amber-600/50 dark:border-amber-500/30',
      textPrimary: 'text-white',
      textSecondary: 'text-amber-50/80',
      accent: 'bg-white',
      ring: 'ring-amber-500/40',
    },
    violet: {
      bg: 'bg-violet-600 dark:bg-violet-600/80',
      border: 'border-violet-700/50 dark:border-violet-500/30',
      textPrimary: 'text-white',
      textSecondary: 'text-violet-100/80',
      accent: 'bg-white',
      ring: 'ring-violet-500/40',
    },
    indigo: {
      bg: 'bg-indigo-600 dark:bg-indigo-600/80',
      border: 'border-indigo-700/50 dark:border-indigo-500/30',
      textPrimary: 'text-white',
      textSecondary: 'text-indigo-100/80',
      accent: 'bg-white',
      ring: 'ring-indigo-500/40',
    },
    teal: {
      bg: 'bg-teal-600 dark:bg-teal-600/80',
      border: 'border-teal-700/50 dark:border-teal-500/30',
      textPrimary: 'text-white',
      textSecondary: 'text-teal-100/80',
      accent: 'bg-white',
      ring: 'ring-teal-500/40',
    },
    orange: {
      bg: 'bg-orange-600 dark:bg-orange-600/80',
      border: 'border-orange-700/50 dark:border-orange-500/30',
      textPrimary: 'text-white',
      textSecondary: 'text-orange-100/80',
      accent: 'bg-white',
      ring: 'ring-orange-500/40',
    },
    cyan: {
      bg: 'bg-cyan-500 dark:bg-cyan-600/80',
      border: 'border-cyan-600/50 dark:border-cyan-400/30',
      textPrimary: 'text-white',
      textSecondary: 'text-cyan-50/80',
      accent: 'bg-white',
      ring: 'ring-cyan-500/40',
    },
    pink: {
      bg: 'bg-pink-500 dark:bg-pink-600/80',
      border: 'border-pink-600/50 dark:border-pink-400/30',
      textPrimary: 'text-white',
      textSecondary: 'text-pink-100/80',
      accent: 'bg-white',
      ring: 'ring-pink-500/40',
    },
  };

  return mapping[color];
};
