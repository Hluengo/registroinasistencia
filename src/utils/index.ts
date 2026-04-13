import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDateOnlyLocale } from './date';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return formatDateOnlyLocale(date, 'es-CL');
}

export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Re-export filter options for convenience
export { MONTHS, getYearOptions, getCourseOptions, getStatusOptions } from './filterOptions';

// Re-export modal patterns
export { createMutationGuard, getErrorMessage, createModalReducer } from './modalPatterns';

// Re-export date utilities
export { isValidDate, parseDateOnly, toDateOnlyString, isSameDateOnly, formatDateOnlyLocale, getDaysUntilTest } from './date';
