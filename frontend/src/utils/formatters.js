/**
 * Format a date to a localized string
 * @param {Date|string} date - The date to format
 * @param {string} locale - The locale to use for formatting (default: 'vi-VN')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, locale = 'vi-VN') => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

/**
 * Format a number as Vietnamese currency (VND)
 * @param {number} amount - The amount to format
 * @param {string} locale - The locale to use for formatting (default: 'vi-VN')
 * @param {string} currency - The currency code (default: 'VND')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, locale = 'vi-VN', currency = 'VND') => {
    if (amount === null || amount === undefined) return '';
    
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(amount);
};
