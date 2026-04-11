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
