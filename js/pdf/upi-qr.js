/**
 * UPI QR Code Generator for Instant Payments
 * Generates standard Indian Unified Payments Interface (UPI) deep link and QR code
 */

/**
 * Builds standard UPI payment URI
 * @param {string} upiId
 * @param {string} payeeName
 * @param {number} amount
 * @param {string} invoiceNumber
 * @returns {string}
 */
export function buildUPIUri(upiId, payeeName, amount, invoiceNumber) {
  if (!upiId) return '';
  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent((payeeName || 'Business').trim());
  const cleanAmount = (parseFloat(amount) || 0).toFixed(2);
  const cleanNote = encodeURIComponent(`Invoice ${invoiceNumber || ''}`.trim());
  
  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;
}

/**
 * Generates QR code Data URL using an HTML5 canvas and QRCode library or SVG
 * If QRCode global library is available from CDN, uses it; otherwise falls back to a clean placeholder.
 * @param {string} text
 * @param {number} size
 * @returns {Promise<string>}
 */
export async function generateQRCodeDataUrl(text, size = 160) {
  if (!text) return '';

  // 1. Check if window.QRCode is available (from cdnjs / script tag)
  if (window.QRCode && typeof window.QRCode.toDataURL === 'function') {
    try {
      return await window.QRCode.toDataURL(text, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (e) {
      console.warn('QRCode.toDataURL error:', e);
    }
  }

  // 2. Check if legacy QRCode constructor exists (e.g. davidshimjs/qrcodejs)
  if (typeof window.QRCode === 'function') {
    try {
      const container = document.createElement('div');
      new window.QRCode(container, {
        text: text,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: 2 // Level H/Q
      });
      const canvas = container.querySelector('canvas');
      if (canvas) return canvas.toDataURL('image/png');
      const img = container.querySelector('img');
      if (img && img.src) return img.src;
    } catch (e) {
      console.warn('Legacy QRCode error:', e);
    }
  }

  // 3. Fallback: Quick QR API or SVG Data URI
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}`;
}
