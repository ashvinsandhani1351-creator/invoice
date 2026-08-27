/**
 * Invoice Form & Field Validator
 */

// India GSTIN regular expression pattern (15 characters)
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// India PAN regular expression pattern (10 characters)
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// Basic email check
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates GSTIN format
 * @param {string} gstin
 * @returns {{isValid: boolean, message: string}}
 */
export function validateGSTIN(gstin) {
  if (!gstin || !gstin.trim()) {
    return { isValid: true, message: '' }; // Optional
  }
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) {
    return { isValid: false, message: 'GSTIN must be exactly 15 alphanumeric characters' };
  }
  if (!GSTIN_REGEX.test(clean)) {
    return { isValid: false, message: 'Invalid GSTIN format (e.g. 29AAAAA0000A1Z5)' };
  }
  return { isValid: true, message: '' };
}

/**
 * Validates PAN format
 * @param {string} pan
 * @returns {{isValid: boolean, message: string}}
 */
export function validatePAN(pan) {
  if (!pan || !pan.trim()) {
    return { isValid: true, message: '' };
  }
  const clean = pan.trim().toUpperCase();
  if (clean.length !== 10) {
    return { isValid: false, message: 'PAN must be exactly 10 characters' };
  }
  if (!PAN_REGEX.test(clean)) {
    return { isValid: false, message: 'Invalid PAN format (e.g. ABCDE1234F)' };
  }
  return { isValid: true, message: '' };
}

/**
 * Validates the entire invoice prior to export
 * @param {Object} invoice
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateInvoice(invoice) {
  const errors = [];
  
  if (!invoice.seller?.name || !invoice.seller.name.trim()) {
    errors.push('Your Business/Seller name is required.');
  }
  
  if (!invoice.customer?.name || !invoice.customer.name.trim()) {
    errors.push('Customer/Client name is required.');
  }
  
  if (!invoice.invoiceNumber || !invoice.invoiceNumber.trim()) {
    errors.push('Invoice number is required.');
  }
  
  if (!invoice.date) {
    errors.push('Invoice date is required.');
  }
  
  const items = invoice.items || [];
  if (items.length === 0) {
    errors.push('At least one line item is required.');
  } else {
    items.forEach((item, index) => {
      if (!item.description || !item.description.trim()) {
        errors.push(`Item #${index + 1} requires a description.`);
      }
      if (item.quantity === undefined || item.quantity === null || parseFloat(item.quantity) <= 0) {
        errors.push(`Item #${index + 1} must have a quantity greater than 0.`);
      }
      if (item.rate === undefined || item.rate === null || parseFloat(item.rate) < 0) {
        errors.push(`Item #${index + 1} must have a non-negative rate.`);
      }
    });
  }
  
  if (invoice.seller?.gstin) {
    const res = validateGSTIN(invoice.seller.gstin);
    if (!res.isValid) errors.push(`Seller GSTIN: ${res.message}`);
  }
  
  if (invoice.customer?.gstin) {
    const res = validateGSTIN(invoice.customer.gstin);
    if (!res.isValid) errors.push(`Customer GSTIN: ${res.message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
