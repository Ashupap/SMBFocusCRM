// Currency formatting utilities for Indian SMB market

export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_CODE = 'INR';
export const LOCALE = 'en-IN';

/**
 * Format a number as Indian Rupees (₹)
 * Uses Indian numbering system (lakhs and crores)
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return `${CURRENCY_SYMBOL}0`;
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return `${CURRENCY_SYMBOL}0`;
  }
  
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

/**
 * Format a number as Indian Rupees with decimals
 */
export function formatCurrencyWithDecimals(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return `${CURRENCY_SYMBOL}0.00`;
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return `${CURRENCY_SYMBOL}0.00`;
  }
  
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Format a number in Indian numbering system (lakhs and crores)
 * without currency symbol
 */
export function formatIndianNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }
  
  return new Intl.NumberFormat(LOCALE).format(numValue);
}

/**
 * Format large numbers in compact Indian form (e.g., ₹10L, ₹1Cr)
 * Uses Indian numbering system: Lakh (L) and Crore (Cr) only
 * Values below 1 Lakh are shown in full Indian format
 */
export function formatCompactCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return `${CURRENCY_SYMBOL}0`;
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return `${CURRENCY_SYMBOL}0`;
  }
  
  const absValue = Math.abs(numValue);
  const sign = numValue < 0 ? '-' : '';
  
  if (absValue >= 10000000) {
    // Crores (1 Cr = 10 million / 1,00,00,000)
    const croreValue = absValue / 10000000;
    const formatted = croreValue % 1 === 0 ? croreValue.toFixed(0) : croreValue.toFixed(1);
    return `${sign}${CURRENCY_SYMBOL}${formatted}Cr`;
  } else if (absValue >= 100000) {
    // Lakhs (1 L = 100,000 / 1,00,000)
    const lakhValue = absValue / 100000;
    const formatted = lakhValue % 1 === 0 ? lakhValue.toFixed(0) : lakhValue.toFixed(1);
    return `${sign}${CURRENCY_SYMBOL}${formatted}L`;
  } else {
    // Below 1 Lakh - show in full Indian format
    return formatCurrency(numValue);
  }
}

/**
 * Parse a currency string back to number
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  
  // Remove currency symbol, commas, and spaces
  const cleaned = value.replace(/[₹$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format phone number for Indian format
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with 91 or +91, format as +91 XXXXX XXXXX
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  
  // If it's 10 digits, format as +91 XXXXX XXXXX
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  
  // Return original if format is unknown
  return phone;
}
