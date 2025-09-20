import { SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'PLANNING', label: '规划中' },
  { value: 'IN_PROGRESS', label: '拍摄进行中' },
  { value: 'DELIVERED', label: '已交付' },
  { value: 'ARCHIVED', label: '已归档' }
];

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, ...props }: Props) {
  return (
    <select
      className={cn(
        'h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      {...props}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
