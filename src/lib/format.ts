/**
 * Format a number with comma as thousands separator and dot as decimal separator
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string (e.g., 1,234.56)
 */
export const formatNumber = (value: number | string, decimals: number = 0): string => {
  if (typeof value === 'string') {
    value = parseFloat(value);
  }

  if (isNaN(value)) {
    return '0';
  }

  // Round to specified decimal places
  const rounded = value.toFixed(decimals);
  const [integerPart, decimalPart] = rounded.split('.');

  // Add thousands separator (comma) to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Combine integer and decimal parts
  if (decimals > 0 && decimalPart) {
    return `${formattedInteger}.${decimalPart}`;
  }

  return formattedInteger;
};

/**
 * Format currency (suffix format: 1,234.56 VND)
 * @param value - Amount to format
 * @param suffix - Suffix for the amount (default: 'VND')
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted currency string
 */
export const formatPrice = (value: number | string, suffix: string = 'VND', decimals: number = 0): string => {
  const formatted = formatNumber(value, decimals);
  return `${formatted} ${suffix}`;
};

/**
 * Parse formatted number string to get the actual numeric value
 * Removes commas and returns the number
 * @param value - Formatted string (e.g., "1,234.56")
 * @returns Numeric value
 */
export const parseFormattedNumber = (value: string): number => {
  if (!value) return 0;
  // Remove commas but keep the decimal point
  const cleaned = value.replace(/,/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Format amount input for display while preserving the numeric value
 * @param value - Raw input value
 * @returns Formatted string for display (e.g., "1,234.56")
 */
export const formatAmountInput = (value: string): string => {
  if (!value) return '';
  
  // Remove any non-numeric characters except dot
  const cleaned = value.replace(/[^\d.]/g, '');
  
  if (!cleaned) return '';
  
  // Split by decimal point
  const parts = cleaned.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1].slice(0, 2)}` : ''; // Limit to 2 decimal places
  
  // Add commas to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return formattedInteger + decimalPart;
};

// Backward compatibility aliases
export const formatVietnamseNumber = formatNumber;
export const formatVietnamsePrice = formatPrice;

/**
 * Convert date from various formats to dd/MM/yyyy format
 * Supports: ISO (YYYY-MM-DD), ISO with time, and already formatted dd/MM/yyyy
 * @param dateString - Date in various formats
 * @returns Formatted date string in dd/MM/yyyy format
 */
export const formatDateToInput = (dateString: string | undefined): string => {
  if (!dateString || typeof dateString !== 'string') {
    return '';
  }

  const trimmed = dateString.trim();

  // If already in dd/MM/yyyy format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  try {
    // Extract just the date part if it has time
    const datePart = trimmed.split('T')[0];
    const [year, month, day] = datePart.split('-');
    
    if (year && month && day && year.length === 4 && month.length === 2 && day.length === 2) {
      // Validate the date
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return `${day}/${month}/${year}`;
      }
    }
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
  }

  // If unable to parse, return empty
  console.warn('Unable to format date:', dateString);
  return '';
};

export interface ParsedNotification {
  isBroadcast: boolean;
  severity: 'INFO' | 'WARNING' | 'URGENT';
  title: string;
  message: string;
}

/**
 * Parses broadcast notification payload formatted as "[SEVERITY] Title: Message"
 * or fallback content.
 */
export const parseNotificationPayload = (content: string): ParsedNotification => {
  if (!content) {
    return { isBroadcast: false, severity: 'INFO', title: '', message: '' };
  }

  // Match: "[INFO] Title: Message"
  const match = content.match(/^\[(INFO|WARNING|URGENT)\]\s*([^:\n]+):\s*([\s\S]*)$/);
  if (match) {
    return {
      isBroadcast: true,
      severity: match[1] as 'INFO' | 'WARNING' | 'URGENT',
      title: match[2].trim(),
      message: match[3].trim(),
    };
  }

  // Match: "[INFO] Title" (without colon)
  const matchNoColon = content.match(/^\[(INFO|WARNING|URGENT)\]\s*([\s\S]*)$/);
  if (matchNoColon) {
    return {
      isBroadcast: true,
      severity: matchNoColon[1] as 'INFO' | 'WARNING' | 'URGENT',
      title: matchNoColon[2].trim(),
      message: '',
    };
  }

  return {
    isBroadcast: false,
    severity: 'INFO',
    title: '',
    message: content,
  };
};
