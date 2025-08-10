import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'CDF'): string {
  if (currency === 'CDF') {
    return new Intl.NumberFormat('fr-CD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' CDF';
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }
}
