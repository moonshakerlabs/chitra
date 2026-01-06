import { format, differenceInDays, addDays, parseISO, isValid } from 'date-fns';

/**
 * Format a date string for display
 */
export const formatDate = (date: string | Date, formatStr: string = 'MMM d, yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, formatStr) : 'Invalid date';
};

/**
 * Get the difference in days between two dates
 */
export const daysBetween = (startDate: string | Date, endDate: string | Date): number => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return differenceInDays(end, start);
};

/**
 * Add days to a date
 */
export const addDaysToDate = (date: string | Date, days: number): Date => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return addDays(dateObj, days);
};

/**
 * Get today's date as ISO string (date only)
 */
export const getTodayISO = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Check if a date is today
 */
export const isToday = (date: string | Date): boolean => {
  const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
  return dateStr === getTodayISO();
};

/**
 * Get relative day description
 */
export const getRelativeDay = (date: string | Date): string => {
  const days = daysBetween(getTodayISO(), date);
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0 && days <= 7) return `In ${days} days`;
  if (days < 0 && days >= -7) return `${Math.abs(days)} days ago`;
  
  return formatDate(date);
};

/**
 * Format duration in days to readable string
 */
export const formatDuration = (days: number): string => {
  if (days === 1) return '1 day';
  return `${days} days`;
};
