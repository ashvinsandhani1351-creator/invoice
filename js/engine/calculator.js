import { amountToWords } from './number-to-words.js';

/**
 * Utility to round safely to 2 decimal places to avoid IEEE-754 floating point issues.
 * e.g. 0.1 + 0.2 -> 0.3
 */
export function round2(num) {
  if (isNaN(num) || num === null || num === undefined) return 0;
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

/**
 * Currency database with formatting options
 */
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'en-AE' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimals: 0 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', locale: 'en-MY' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', locale: 'en-PH' }
];

/**
 * Format a number as currency string
 * @param {number} amount
 * @param {string} currencyCode
 * @param {boolean} includeSymbol
 */
export function formatCurrency(amount, currencyCode = 'INR', includeSymbol = true) {
  const curr = CURRENCIES.find(c => c.code === currencyCode) || {
    code: currencyCode,
    symbol: currencyCode,
    locale: 'en-US'
  };
  
  const safeAmount = round2(amount || 0);
  const decimals = curr.decimals !== undefined ? curr.decimals : 2;
  
  try {
    const formattedNum = new Intl.NumberFormat(curr.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(safeAmount);
    
    if (!includeSymbol) return formattedNum;
    return `${curr.symbol} ${formattedNum}`;
  } catch (e) {
    const fallbackFormatted = safeAmount.toFixed(decimals);
    return includeSymbol ? `${curr.symbol} ${fallbackFormatted}` : fallbackFormatted;
  }
}

/**
 * Computes all totals and tax breakdowns for an invoice object
 * @param {Object} invoice
 * @returns {Object} Complete calculated summary
 */
export function calculateInvoice(invoice) {
  if (!invoice) return getEmptyCalculations();
  
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  
  // 1. Calculate each item's line total
  let subtotal = 0;
  const processedItems = items.map(item => {
    const qty = Math.max(0, parseFloat(item.quantity) || 0);
    const rate = Math.max(0, parseFloat(item.rate) || 0);
    const rawTotal = round2(qty * rate);
    
    // Item level discount
    let itemDiscountAmount = 0;
    if (item.discount && item.discount > 0) {
      if (item.discountType === 'percentage') {
        itemDiscountAmount = round2(rawTotal * (item.discount / 100));
      } else {
        itemDiscountAmount = round2(Math.min(rawTotal, item.discount));
      }
    }
    
    const lineAmount = round2(Math.max(0, rawTotal - itemDiscountAmount));
    subtotal = round2(subtotal + lineAmount);
    
    return {
      ...item,
      quantity: qty,
      rate: rate,
      rawTotal,
      itemDiscountAmount,
      lineAmount
    };
  });
  
  // 2. Invoice level discount
  let invoiceDiscountAmount = 0;
  const discountVal = parseFloat(invoice.discount?.value) || 0;
  if (discountVal > 0) {
    if (invoice.discount?.type === 'percentage') {
      invoiceDiscountAmount = round2(subtotal * (discountVal / 100));
    } else {
      invoiceDiscountAmount = round2(Math.min(subtotal, discountVal));
    }
  }
  
  // 3. Taxable Subtotal
  const taxableSubtotal = round2(Math.max(0, subtotal - invoiceDiscountAmount));
  
  // 4. Tax Calculation
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let singleTaxAmount = 0;
  let totalTax = 0;
  
  const taxMode = invoice.taxMode || 'none';
  
  if (taxMode === 'single') {
    const singleRate = parseFloat(invoice.singleTaxRate) || 0;
    if (singleRate > 0) {
      singleTaxAmount = round2(taxableSubtotal * (singleRate / 100));
      totalTax = singleTaxAmount;
    }
  } else if (taxMode === 'gst-intra') {
    // Intra-state: Split equally into CGST + SGST
    const gstRate = parseFloat(invoice.gstDetails?.gstRate) || 18;
    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;
    
    cgstAmount = round2(taxableSubtotal * (cgstRate / 100));
    sgstAmount = round2(taxableSubtotal * (sgstRate / 100));
    totalTax = round2(cgstAmount + sgstAmount);
  } else if (taxMode === 'gst-inter') {
    // Inter-state: Full IGST
    const igstRate = parseFloat(invoice.gstDetails?.gstRate) || 18;
    igstAmount = round2(taxableSubtotal * (igstRate / 100));
    totalTax = igstAmount;
  }
  
  // 5. Additional charges (Shipping / Handling / Convenience fee)
  const shippingFee = round2(Math.max(0, parseFloat(invoice.shippingFee) || 0));
  
  // 6. Rounding adjustment
  const rawTotal = round2(taxableSubtotal + totalTax + shippingFee);
  let roundOffAmount = 0;
  let grandTotal = rawTotal;
  
  if (invoice.autoRoundOff) {
    grandTotal = Math.round(rawTotal);
    roundOffAmount = round2(grandTotal - rawTotal);
  }
  
  // 7. Amount Paid & Balance Due
  const amountPaid = round2(Math.max(0, parseFloat(invoice.amountPaid) || 0));
  const balanceDue = round2(Math.max(0, grandTotal - amountPaid));
  
  // 8. Amount in words
  const currencyCode = invoice.currency || 'INR';
  const amountInWords = amountToWords(grandTotal, currencyCode);
  
  return {
    items: processedItems,
    subtotal,
    invoiceDiscountAmount,
    taxableSubtotal,
    taxMode,
    cgstAmount,
    sgstAmount,
    igstAmount,
    singleTaxAmount,
    totalTax,
    shippingFee,
    roundOffAmount,
    grandTotal,
    amountPaid,
    balanceDue,
    amountInWords,
    currencyCode
  };
}

function getEmptyCalculations() {
  return {
    items: [],
    subtotal: 0,
    invoiceDiscountAmount: 0,
    taxableSubtotal: 0,
    taxMode: 'none',
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    singleTaxAmount: 0,
    totalTax: 0,
    shippingFee: 0,
    roundOffAmount: 0,
    grandTotal: 0,
    amountPaid: 0,
    balanceDue: 0,
    amountInWords: '',
    currencyCode: 'INR'
  };
}
