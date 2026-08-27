/**
 * Client-side High-Fidelity PDF Generator
 * Renders invoices cleanly in a dedicated offscreen A4 container to prevent blank captures or clipping
 */

import { renderInvoiceTemplate } from '../templates/index.js';
import { calculateInvoice } from '../engine/calculator.js';
import { generateQRCodeDataUrl, buildUPIUri } from './upi-qr.js';

/**
 * Sanitizes a filename for download
 */
function sanitizeFilename(name) {
  return (name || 'invoice')
    .replace(/[^a-zA-Z0-9-_\.]/g, '_')
    .replace(/_{2,}/g, '_');
}

/**
 * Generates and downloads an exact Single A4 PDF file (210mm x 297mm)
 * @param {HTMLElement} _ignoredElement
 * @param {Object} invoice - The invoice data object
 * @param {string} [qrCodeUrl] - Optional pre-computed QR code URL
 * @returns {Promise<boolean>}
 */
export async function downloadInvoicePDF(_ignoredElement, invoice, qrCodeUrl = '') {
  if (!invoice) {
    throw new Error('Invoice data is required');
  }

  // Fallback to browser print if external libraries are missing
  if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    window.print();
    return true;
  }

  let tempContainer = null;

  try {
    // 1. Ensure QR Code is generated if enabled
    let finalQrCodeUrl = qrCodeUrl;
    if (!finalQrCodeUrl && invoice.bankDetails?.upiId && invoice.bankDetails?.showQr) {
      const calcs = calculateInvoice(invoice);
      const uri = buildUPIUri(invoice.bankDetails.upiId, invoice.seller?.name, calcs.grandTotal, invoice.invoiceNumber);
      finalQrCodeUrl = await generateQRCodeDataUrl(uri, 180);
    }

    // 2. Compute financial calculations & render clean HTML template
    const calculations = calculateInvoice(invoice);
    const templateHtml = renderInvoiceTemplate(invoice, calculations, finalQrCodeUrl);

    // 3. Create isolated offscreen container with exact standard A4 width (794px at 96 DPI)
    tempContainer = document.createElement('div');
    tempContainer.id = 'pdf-render-temp-container';
    tempContainer.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: -9999px !important;
      width: 794px !important;
      min-height: 1123px !important;
      max-width: 794px !important;
      background-color: #ffffff !important;
      z-index: -9999 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
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

    // 5. Render canvas via html2canvas
    const canvas = await window.html2canvas(tempContainer, {
      scale: 2, // 300 DPI sharpness
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1024
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

    // 7. Save PDF file
    const invNumber = sanitizeFilename(invoice.invoiceNumber || 'INV-001');
    const customer = sanitizeFilename(invoice.customer?.name || 'Customer');
    const filename = `Invoice_${invNumber}_${customer}.pdf`;

    doc.save(filename);
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    window.print();
    return false;
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
    if (!finalQrCodeUrl && invoice.bankDetails?.upiId && invoice.bankDetails?.showQr) {
      const calcs = calculateInvoice(invoice);
      const uri = buildUPIUri(invoice.bankDetails.upiId, invoice.seller?.name, calcs.grandTotal, invoice.invoiceNumber);
      finalQrCodeUrl = await generateQRCodeDataUrl(uri, 180);
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
