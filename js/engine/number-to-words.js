/**
 * Number to Words Converter
 * Supports Indian Numbering (Crore, Lakh, Thousand, Hundred) for INR
 * and Western Numbering (Billion, Million, Thousand) for USD, EUR, GBP, etc.
 */

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

/**
 * Converts a number less than 1000 into words.
 */
function convertThreeDigits(n) {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ONES[n] + ' ';
  }
  return str.trim();
}

/**
 * Indian Numbering System: Thousands, Lakhs, Crores
 */
function convertIndianNumber(num) {
  if (num === 0) return 'Zero';
  
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  
  const remainder = num;
  
  const parts = [];
  if (crore > 0) parts.push(convertThreeDigits(crore) + ' Crore');
  if (lakh > 0) parts.push(convertThreeDigits(lakh) + ' Lakh');
  if (thousand > 0) parts.push(convertThreeDigits(thousand) + ' Thousand');
  if (remainder > 0) parts.push(convertThreeDigits(remainder));
  
  return parts.join(' ').trim();
}

/**
 * Western Numbering System: Thousands, Millions, Billions
 */
function convertWesternNumber(num) {
  if (num === 0) return 'Zero';
  
  const billion = Math.floor(num / 1000000000);
  num %= 1000000000;
  
  const million = Math.floor(num / 1000000);
  num %= 1000000;
  
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  
  const remainder = num;
  
  const parts = [];
  if (billion > 0) parts.push(convertThreeDigits(billion) + ' Billion');
  if (million > 0) parts.push(convertThreeDigits(million) + ' Million');
  if (thousand > 0) parts.push(convertThreeDigits(thousand) + ' Thousand');
  if (remainder > 0) parts.push(convertThreeDigits(remainder));
  
  return parts.join(' ').trim();
}

/**
 * Main function to convert amount to words based on currency
 * @param {number} amount
 * @param {string} currencyCode - e.g. 'INR', 'USD', 'EUR', 'GBP', etc.
 * @returns {string} Words representation
 */
export function amountToWords(amount, currencyCode = 'INR') {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '';
  }
  
  // Clean amount
  const isNegative = amount < 0;
  amount = Math.abs(amount);
  
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  
  const isIndian = currencyCode.toUpperCase() === 'INR';
  const mainWords = isIndian ? convertIndianNumber(integerPart) : convertWesternNumber(integerPart);
  
  let currencyMajor = 'Rupees';
  let currencyMinor = 'Paise';
  
  switch (currencyCode.toUpperCase()) {
    case 'USD':
      currencyMajor = 'Dollars';
      currencyMinor = 'Cents';
      break;
    case 'EUR':
      currencyMajor = 'Euros';
      currencyMinor = 'Cents';
      break;
    case 'GBP':
      currencyMajor = 'Pounds';
      currencyMinor = 'Pence';
      break;
    case 'AED':
      currencyMajor = 'Dirhams';
      currencyMinor = 'Fils';
      break;
    case 'CAD':
      currencyMajor = 'Canadian Dollars';
      currencyMinor = 'Cents';
      break;
    case 'AUD':
      currencyMajor = 'Australian Dollars';
      currencyMinor = 'Cents';
      break;
    case 'SGD':
      currencyMajor = 'Singapore Dollars';
      currencyMinor = 'Cents';
      break;
    case 'JPY':
      currencyMajor = 'Yen';
      currencyMinor = '';
      break;
    case 'INR':
    default:
      currencyMajor = 'Rupees';
      currencyMinor = 'Paise';
      break;
  }
  
  let result = (isNegative ? 'Minus ' : '') + mainWords + ' ' + currencyMajor;
  
  if (decimalPart > 0 && currencyMinor) {
    const decimalWords = isIndian ? convertIndianNumber(decimalPart) : convertWesternNumber(decimalPart);
    result += ' and ' + decimalWords + ' ' + currencyMinor;
  }
  
  return result.trim() + ' Only';
}
