import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  if (currency === 'INR') {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date, formatStr = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim();
}

export function generateShareLink(propertyId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/properties/share/${propertyId}`;
}

export const TEMPERATURE_COLORS = {
  hot: 'text-red-500 bg-red-50 border-red-200',
  warm: 'text-orange-500 bg-orange-50 border-orange-200',
  cold: 'text-blue-500 bg-blue-50 border-blue-200',
} as const;

export const STATUS_COLORS: Record<string, string> = {
  new: 'text-indigo-600 bg-indigo-50',
  contacted: 'text-blue-600 bg-blue-50',
  qualified: 'text-cyan-600 bg-cyan-50',
  proposal: 'text-yellow-600 bg-yellow-50',
  negotiation: 'text-orange-600 bg-orange-50',
  won: 'text-green-600 bg-green-50',
  lost: 'text-red-600 bg-red-50',
  on_hold: 'text-gray-600 bg-gray-100',
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_agent: 'Sales Agent',
  field_executive: 'Field Executive',
  social_media_manager: 'Social Media Manager',
};
