/**
 * Client-side High-Fidelity PDF Generator
 * Renders invoices cleanly in an isolated offscreen A4 container with full mobile browser support (iOS Safari & Android Chrome)
 * Uses on-demand dynamic loading for heavy dependencies (html2canvas & jsPDF) to maximize PageSpeed scores
 */

import { renderInvoiceTemplate } from '../templates/index.js';
import { calculateInvoice } from '../engine/calculator.js';
import { generateQRCodeDataUrl, buildUPIUri } from './upi-qr.js';

/**
 * Lazy loads html2canvas and jsPDF on-demand to avoid render-blocking the initial page load
 */
export async function loadPdfLibraries() {
  if (typeof window.html2canvas !== 'undefined' && typeof window.jspdf !== 'undefined') {
    return true;
  }

  const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') return resolve();
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => {
      s.dataset.loaded = 'true';
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });

  await Promise.all([
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  ]);
  return true;
}

// Prefetch during idle time in background without impacting initial FCP / LCP
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      loadPdfLibraries().catch(() => {});
    });
  } else {
    setTimeout(() => {
      loadPdfLibraries().catch(() => {});
    }, 2000);
  }
}

/**
 * Sanitizes a filename for download
 */
function sanitizeFilename(name) {
  return (name || 'invoice')
    .replace(/[^a-zA-Z0-9-_\.]/g, '_')
    .replace(/_{2,}/g, '_');
}

/**
 * Robustly saves a PDF blob on all mobile and desktop browsers
 * @param {Object} doc - jsPDF instance
 * @param {string} filename - target PDF filename
 */
function savePdfFile(doc, filename) {
  try {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    if (isIOS) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 10000);
    return true;
  } catch (err) {
    console.warn('Custom blob download failed, falling back to doc.save:', err);
    doc.save(filename);
    return true;
  }
}

/**
 * Generates and downloads an exact Single A4 PDF file (210mm x 297mm)
 * @param {HTMLElement|null} _ignoredElement
 * @param {Object} invoice - The invoice data object
 * @param {string} [qrCodeUrl] - Optional pre-computed QR code URL
 * @returns {Promise<boolean>}
 */
export async function downloadInvoicePDF(_ignoredElement, invoice, qrCodeUrl = '') {
  if (!invoice) {
    throw new Error('Invoice data is required');
  }

  // Ensure html2canvas and jspdf are ready
  await loadPdfLibraries();

  // Fallback to browser print if external libraries are missing
  if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    window.print();
    return true;
  }

  let tempContainer = null;

  try {
    // 1. Ensure QR Code is generated if enabled
    let finalQrCodeUrl = qrCodeUrl;
    if (!finalQrCodeUrl && invoice.bankDetails?.showQr) {
      if (invoice.bankDetails?.customQrImage) {
        finalQrCodeUrl = invoice.bankDetails.customQrImage;
      } else if (invoice.bankDetails?.upiId) {
        const calcs = calculateInvoice(invoice);
        const uri = buildUPIUri(invoice.bankDetails.upiId, invoice.seller?.name, calcs.grandTotal, invoice.invoiceNumber);
        finalQrCodeUrl = await generateQRCodeDataUrl(uri, 180);
      }
    }

    // 2. Compute financial calculations & render clean HTML template
    const calculations = calculateInvoice(invoice);
    const templateHtml = renderInvoiceTemplate(invoice, calculations, finalQrCodeUrl);

    // 3. Create isolated offscreen container with exact standard A4 width (794px at 96 DPI)
    // Using position:fixed, top:0, left:0, opacity:0.01 so mobile WebKit renders it in the DOM tree
    tempContainer = document.createElement('div');
    tempContainer.id = 'pdf-render-temp-container';
    tempContainer.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 794px !important;
      min-height: 1123px !important;
      max-width: 794px !important;
      background-color: #ffffff !important;
      z-index: -9999 !important;
      pointer-events: none !important;
      opacity: 0.01 !important;
      display: block !important;
      visibility: visible !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
      transform: none !important;
    `;
    tempContainer.innerHTML = templateHtml;
    document.body.appendChild(tempContainer);

    // 4. Resolve icons and wait for fonts and images to load
    if (window.lucide) {
      window.lucide.createIcons({ root: tempContainer });
    }

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Wait for any embedded images (logo, QR, signature) to load
    const images = tempContainer.querySelectorAll('img');
    if (images.length > 0) {
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));
    }

    // 5. Render canvas via html2canvas with mobile-optimized settings
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const canvas = await window.html2canvas(tempContainer, {
      scale: isMobile ? 1.5 : 2, // 1.5x on mobile prevents iOS WebKit memory crash while keeping crisp 300 DPI clarity
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      x: 0,
      y: 0,
      width: 794,
      height: tempContainer.offsetHeight || 1123,
      windowWidth: 794,
      windowHeight: 1123,
      scrollX: 0,
      scrollY: 0
    });

    // 6. Generate PDF in jsPDF strictly fitted to 1 A4 page
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    let finalWidth = pdfWidth;
    let finalHeight = (canvasHeight * pdfWidth) / canvasWidth;

    if (finalHeight > pdfHeight) {
      finalHeight = pdfHeight;
      finalWidth = (canvasWidth * pdfHeight) / canvasHeight;
    }

    const posX = (pdfWidth - finalWidth) / 2;
    const posY = (pdfHeight - finalHeight) / 2;

    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', posX, posY, finalWidth, finalHeight, undefined, 'FAST');

    // 7. Save PDF file cleanly across all devices
    const invNumber = sanitizeFilename(invoice.invoiceNumber || 'INV-001');
    const customer = sanitizeFilename(invoice.customer?.name || 'Customer');
    const filename = `Invoice_${invNumber}_${customer}.pdf`;

    savePdfFile(doc, filename);
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
}

/**
 * Triggers native browser print dialog strictly formatted on 1 A4 page
 * @param {Object} invoice
 * @param {string} [qrCodeUrl]
 */
export async function printInvoice(invoice, qrCodeUrl = '') {
  let printContainer = document.getElementById('printContainer');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'printContainer';
    document.body.appendChild(printContainer);
  }

  if (invoice) {
    let finalQrCodeUrl = qrCodeUrl;
    if (!finalQrCodeUrl && invoice.bankDetails?.showQr) {
      if (invoice.bankDetails?.customQrImage) {
        finalQrCodeUrl = invoice.bankDetails.customQrImage;
      } else if (invoice.bankDetails?.upiId) {
        const calcs = calculateInvoice(invoice);
        const uri = buildUPIUri(invoice.bankDetails.upiId, invoice.seller?.name, calcs.grandTotal, invoice.invoiceNumber);
        finalQrCodeUrl = await generateQRCodeDataUrl(uri, 180);
      }
    }

    const calculations = calculateInvoice(invoice);
    const templateHtml = renderInvoiceTemplate(invoice, calculations, finalQrCodeUrl);
    printContainer.innerHTML = templateHtml;

    if (window.lucide) {
      window.lucide.createIcons({ root: printContainer });
    }
  }

  window.print();
}
