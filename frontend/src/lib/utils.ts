import { Area } from 'react-easy-crop';
import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"
import { createTw } from "react-pdf-tailwind";
import { TimeAgoOptions } from "@/types/misc";


export const tw = createTw({})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function omit<T, K extends keyof T>(obj: T, ...args: K[]): T {
  const result = { ...obj };

  for (const k of args) {
    delete result[k];
  }

  return result;
}

export function toDecimal(value: number, fractionDigits: number = 2) {
  const n = Math.pow(10, fractionDigits)
  return Math.floor(value * n) / n
}

export function camelCaseToText(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/^./, (str) => str.toUpperCase())
}

/**
 * className to variable
 */
export function ctv(className: string, variable: string = '--primary') {
  if (typeof document === 'undefined') return
  let result: string | undefined;
  const stylesheets = Array.from(document.styleSheets);

  stylesheets.forEach((sheet) => {
    const rules = Array.from(sheet.cssRules || []);
    rules.forEach((rule) => {
      if (rule instanceof CSSStyleRule && rule.cssText.startsWith(className)) {
        const match = rule.cssText.match(/\.primary-(\w+)/);
        if (match) {
          const value = rule.style.getPropertyValue(variable).trim();
          if (value) {
            result = value;
          }
        }
      }
    });
  });

  return result;
}

/**
 * @example
 * // Without time (default)
 * timeAgo('2023-07-20'); // "20 Jul 2023" or "3 days ago"
 * 
 * // With time
 * timeAgo('2023-07-20T19:20:00', { showTime: true });
 * // → "20 Jul 2023 19:20" (if older than thresholds)
 * // → "3 hours ago" (if recent)
 * 
 * // Localized time formats
 * timeAgo('2023-07-20T19:20:00', {
 *  showTime: true,
 *  locale: 'en-US'
 * });
 * // → "Jul 20, 2023, 7:20 PM"
 * 
 * timeAgo('2023-07-20T19:20:00', {
 *  showTime: true,
 *  locale: 'de-DE'
 * });
 * // → "20. Juli 2023, 19:20"
 */
export function timeAgo(date: string | Date, {
  locale = 'en',
  style = 'long',
  numeric = 'auto',
  thresholds = {},
  format = 'auto',
  showTime = false,
  customLabels = {},
}: TimeAgoOptions): string {
  const {
    minute = 60,
    hour = 3600,
    day = 86400,
    week = 604800,
    month = 2629746,
    year = 31556952,
  } = thresholds;

  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  // Future dates always show absolute format
  if (diffInSeconds < 0) {
    return formatAbsoluteDate(targetDate, locale, format, showTime);
  }

  // "Just now" case
  if (diffInSeconds < minute) {
    return customLabels.now ?? 'just now';
  }

  // Relative time formatting
  if (format === 'relative' || (format === 'auto' && diffInSeconds < year)) {
    const rtf = new Intl.RelativeTimeFormat(locale, { style, numeric });

    if (diffInSeconds < hour) {
      const minutes = Math.floor(diffInSeconds / minute);
      return rtf.format(-minutes, (customLabels.minute ?? 'minute') as Intl.RelativeTimeFormatUnit);
    }

    if (diffInSeconds < day) {
      const hours = Math.floor(diffInSeconds / hour);
      return rtf.format(-hours, (customLabels.hour ?? 'hour') as Intl.RelativeTimeFormatUnit);
    }

    if (diffInSeconds < week) {
      const days = Math.floor(diffInSeconds / day);
      return rtf.format(-days, (customLabels.day ?? 'day') as Intl.RelativeTimeFormatUnit);
    }

    if (diffInSeconds < month) {
      const weeks = Math.floor(diffInSeconds / week);
      return rtf.format(-weeks, (customLabels.week ?? 'week') as Intl.RelativeTimeFormatUnit);
    }
  }

  // Fall back to absolute date formatting
  return formatAbsoluteDate(targetDate, locale, format, showTime);
}

export function formatAbsoluteDate(
  date: Date,
  locale: string,
  formatType: string,
  showTime: boolean
): string {
  const isCurrentYear = date.getFullYear() === new Date().getFullYear();
  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  };

  // Include year if needed
  if (formatType === 'absolute' || !isCurrentYear) {
    dateOptions.year = 'numeric';
  }

  // Include time if requested
  if (showTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
  }

  if (locale === 'ja') {
    dateOptions.era = formatType === 'absolute' ? 'long' : undefined;
    dateOptions.month = formatType === 'compact' ? 'numeric' : 'short';
  }

  if (locale === 'id') {
    dateOptions.month = 'long';
  }

  return new Intl.DateTimeFormat(locale, dateOptions).format(date);
}

export const sortByDate = <T extends Record<string, any>>(
  items: T[],
  field: keyof T,
  order: 'asc' | 'desc' = 'desc'
): T[] => {
  return [...items].sort((a, b) => {
    if (!a[field] && !b[field]) return 0;
    if (!a[field]) return 1;
    if (!b[field]) return -1;

    try {
      const dateA = new Date(a[field]).getTime();
      const dateB = new Date(b[field]).getTime();

      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;

      return order === 'desc' ? dateB - dateA : dateA - dateB;
    } catch {
      return 0;
    }
  });
};

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Canvas is empty');
      }
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

export function cloudinaryPublicId(url: string) {
  const pattern = /upload(?:\/[^/]+)*\/([^.]+)/;
  const match = url.match(pattern);
  if (!match) return
  return match[1];
}