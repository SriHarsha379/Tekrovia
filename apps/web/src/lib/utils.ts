import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getUTMParams = () => {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
  };
};

export const formatPrice = (price: number, currency = '₹') => {
  return `${currency}${price.toLocaleString('en-IN')}`;
};

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

export const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const analyticsPageView = (path: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title,
    });
  }
};
