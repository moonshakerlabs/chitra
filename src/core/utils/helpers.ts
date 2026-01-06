/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convert kg to lb
 */
export const kgToLb = (kg: number): number => {
  return Math.round(kg * 2.20462 * 10) / 10;
};

/**
 * Convert lb to kg
 */
export const lbToKg = (lb: number): number => {
  return Math.round(lb / 2.20462 * 10) / 10;
};

/**
 * Format weight with unit
 */
export const formatWeight = (weight: number, unit: 'kg' | 'lb'): string => {
  return `${weight} ${unit}`;
};

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100 * 10) / 10;
};

/**
 * Get greeting based on time of day
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Clamp a number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};
