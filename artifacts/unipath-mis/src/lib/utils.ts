import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | undefined | null) {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string | undefined | null) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function getStatusColor(status: string | undefined | null) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'project closure': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/40';
    case 'in progress':
    case 'active': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
    case 'qc fail': return 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive-foreground dark:border-destructive/30';
    case 'cancelled':
    case 'cancel project ()': return 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive-foreground dark:border-destructive/30';
    default: return 'bg-muted text-muted-foreground border-border/40';
  }
}

export function getPaymentStatusColor(status: string | undefined | null) {
  switch (status?.toLowerCase()) {
    case 'paid': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/40';
    case 'partial': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
    case 'pending': return 'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive-foreground dark:border-destructive/30';
    default: return 'bg-muted text-muted-foreground border-border/40';
  }
}
