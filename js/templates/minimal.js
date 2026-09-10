/**
 * Minimal Invoice Template Renderer
 * Clean, modern typography with balanced A4 single-page proportions
 */

import { formatCurrency } from '../engine/calculator.js';

export function renderMinimalTemplate(invoice, calculations, qrCodeUrl) {
  const brandColor = invoice.brandColor || '#4F46E5';
  const currencyCode = invoice.currency || 'INR';
  const isGst = invoice.taxMode === 'gst-intra' || invoice.taxMode === 'gst-inter';
  
  // Format items rows
  const itemsHtml = calculations.items.map((item, idx) => {
    return `
      <tr class="border-b border-gray-100 last:border-b-0">
        <td class="py-2.5 px-2 text-left font-mono text-xs text-gray-400 w-8">${idx + 1}</td>
        <td class="py-2.5 px-2 text-left">
          <div class="font-medium text-gray-800 text-xs">${escapeHtml(item.description || 'Item description')}</div>
          ${isGst && item.hsn ? `<div class="text-[10px] text-gray-400 font-mono mt-0.5">HSN/SAC: ${escapeHtml(item.hsn)}</div>` : ''}
        </td>
        <td class="py-2.5 px-2 text-right text-xs text-gray-600 font-mono">${item.quantity} ${escapeHtml(item.unit || '')}</td>
        <td class="py-2.5 px-2 text-right text-xs text-gray-600 font-mono">${formatCurrency(item.rate, currencyCode, false)}</td>
        ${item.itemDiscountAmount > 0 ? `
          <td class="py-2.5 px-2 text-right text-xs text-amber-600 font-mono">-${formatCurrency(item.itemDiscountAmount, currencyCode, false)}</td>
        ` : ''}
        <td class="py-2.5 px-2 text-right font-medium text-xs text-gray-900 font-mono">${formatCurrency(item.lineAmount, currencyCode)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="invoice-sheet minimal-template bg-white text-gray-800 p-6 sm:p-8 text-xs leading-relaxed max-w-full flex flex-col justify-between" style="--theme-color: ${brandColor};">
      <div>
        <!-- Header -->
        <div class="flex flex-row justify-between items-start pb-4 border-b border-gray-200 gap-4">
          <div>
            ${invoice.seller?.logo ? `
              <img src="${invoice.seller.logo}" alt="Logo" class="h-10 max-w-[150px] object-contain mb-2 rounded" />
            ` : ''}
            <h1 class="text-xl font-bold text-gray-900 tracking-tight">${escapeHtml(invoice.seller?.name || 'Your Business Name')}</h1>
            <div class="text-[11px] text-gray-500 mt-1 space-y-0.5 whitespace-pre-line leading-tight">
              ${invoice.seller?.address ? `<div>${escapeHtml(invoice.seller.address)}</div>` : ''}
              ${invoice.seller?.email ? `<div>Email: ${escapeHtml(invoice.seller.email)}</div>` : ''}
              ${invoice.seller?.phone ? `<div>Phone: ${escapeHtml(invoice.seller.phone)}</div>` : ''}
              ${invoice.seller?.gstin ? `<div class="font-mono text-gray-700 font-medium">GSTIN: ${escapeHtml(invoice.seller.gstin)}</div>` : ''}
              ${invoice.seller?.pan ? `<div class="font-mono text-gray-700">PAN: ${escapeHtml(invoice.seller.pan)}</div>` : ''}
            </div>
          </div>

          <div class="text-right">
            <div class="text-2xl font-light tracking-wider uppercase text-gray-400 mb-1">INVOICE</div>
            <div class="text-xs font-semibold font-mono text-gray-800">${escapeHtml(invoice.invoiceNumber || 'INV-001')}</div>
            <div class="text-[11px] text-gray-500 mt-1.5 space-y-0.5">
              <div><span class="text-gray-400">Date:</span> <span class="font-medium text-gray-700">${formatDate(invoice.date)}</span></div>
              <div><span class="text-gray-400">Due Date:</span> <span class="font-medium text-gray-700">${formatDate(invoice.dueDate)}</span></div>
              ${invoice.poNumber ? `<div><span class="text-gray-400">PO #:</span> <span class="font-mono font-medium text-gray-700">${escapeHtml(invoice.poNumber)}</span></div>` : ''}
              ${isGst && invoice.gstDetails?.placeOfSupply ? `<div><span class="text-gray-400">Place of Supply:</span> <span class="font-medium text-gray-700">${escapeHtml(invoice.gstDetails.placeOfSupply)}</span></div>` : ''}
              ${isGst && invoice.gstDetails?.reverseCharge ? `<div class="text-amber-600 font-medium text-[10px]">Reverse Charge: YES</div>` : ''}
            </div>
          </div>
        </div>

        <!-- Bill To & Ship To -->
        <div class="grid grid-cols-2 gap-6 py-4 border-b border-gray-100">
          <div>
            <div class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Billed To</div>
            <div class="font-semibold text-gray-900 text-xs">${escapeHtml(invoice.customer?.name || 'Customer / Client Name')}</div>
            <div class="text-[11px] text-gray-500 mt-0.5 space-y-0.5 whitespace-pre-line leading-tight">
              ${invoice.customer?.address ? `<div>${escapeHtml(invoice.customer.address)}</div>` : ''}
              ${invoice.customer?.email ? `<div>Email: ${escapeHtml(invoice.customer.email)}</div>` : ''}
              ${invoice.customer?.phone ? `<div>Phone: ${escapeHtml(invoice.customer.phone)}</div>` : ''}
              ${invoice.customer?.gstin ? `<div class="font-mono text-gray-700 font-medium">GSTIN: ${escapeHtml(invoice.customer.gstin)}</div>` : ''}
            </div>
          </div>

          ${invoice.customer?.shippingAddress && !invoice.customer?.sameAsBilling ? `
            <div>
              <div class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Shipped To</div>
              <div class="text-[11px] text-gray-500 whitespace-pre-line leading-tight">${escapeHtml(invoice.customer.shippingAddress)}</div>
            </div>
          ` : '<div></div>'}
        </div>

        <!-- Line Items Table -->
        <div class="py-2.5">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                <th class="py-2 px-2 text-left w-8">#</th>
                <th class="py-2 px-2 text-left">Description</th>
                <th class="py-2 px-2 text-right">Qty</th>
                <th class="py-2 px-2 text-right">Rate</th>
                ${calculations.items.some(i => i.itemDiscountAmount > 0) ? `<th class="py-2 px-2 text-right">Disc</th>` : ''}
                <th class="py-2 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Calculations Summary -->
        <div class="pt-2 pb-4 border-t border-gray-200">
          <div class="flex justify-end">
            <div class="w-full sm:w-64 space-y-1.5 text-[11px]">
              <div class="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span class="font-mono">${formatCurrency(calculations.subtotal, currencyCode)}</span>
              </div>

              ${calculations.invoiceDiscountAmount > 0 ? `
                <div class="flex justify-between text-amber-600">
                  <span>Discount ${invoice.discount?.type === 'percentage' ? `(${invoice.discount.value}%)` : ''}</span>
                  <span class="font-mono">-${formatCurrency(calculations.invoiceDiscountAmount, currencyCode)}</span>
                </div>
              ` : ''}

              ${invoice.taxMode === 'single' && calculations.singleTaxAmount > 0 ? `
                <div class="flex justify-between text-gray-600">
                  <span>Tax (${invoice.singleTaxRate || 0}%)</span>
                  <span class="font-mono">${formatCurrency(calculations.singleTaxAmount, currencyCode)}</span>
                </div>
              ` : ''}

              ${invoice.taxMode === 'gst-intra' ? `
                <div class="flex justify-between text-gray-600">
                  <span>CGST (${(invoice.gstDetails?.gstRate || 18) / 2}%)</span>
                  <span class="font-mono">${formatCurrency(calculations.cgstAmount, currencyCode)}</span>
                </div>
                <div class="flex justify-between text-gray-600">
                  <span>SGST (${(invoice.gstDetails?.gstRate || 18) / 2}%)</span>
                  <span class="font-mono">${formatCurrency(calculations.sgstAmount, currencyCode)}</span>
                </div>
              ` : ''}

              ${invoice.taxMode === 'gst-inter' ? `
                <div class="flex justify-between text-gray-600">
                  <span>IGST (${invoice.gstDetails?.gstRate || 18}%)</span>
                  <span class="font-mono">${formatCurrency(calculations.igstAmount, currencyCode)}</span>
                </div>
              ` : ''}

              ${calculations.shippingFee > 0 ? `
                <div class="flex justify-between text-gray-600">
                  <span>Shipping & Handling</span>
                  <span class="font-mono">${formatCurrency(calculations.shippingFee, currencyCode)}</span>
                </div>
              ` : ''}

              ${calculations.roundOffAmount !== 0 ? `
                <div class="flex justify-between text-gray-500">
                  <span>Round-off</span>
                  <span class="font-mono">${formatCurrency(calculations.roundOffAmount, currencyCode)}</span>
                </div>
              ` : ''}

              <div class="flex justify-between pt-2 border-t border-gray-300 text-sm font-bold text-gray-900">
                <span>Total</span>
                <span class="font-mono">${formatCurrency(calculations.grandTotal, currencyCode)}</span>
              </div>

              ${calculations.amountPaid > 0 ? `
                <div class="flex justify-between text-emerald-600 pt-0.5">
                  <span>Amount Paid</span>
                  <span class="font-mono">-${formatCurrency(calculations.amountPaid, currencyCode)}</span>
                </div>
                <div class="flex justify-between pt-0.5 border-t border-gray-200 text-xs font-semibold text-gray-900">
                  <span>Balance Due</span>
                  <span class="font-mono">${formatCurrency(calculations.balanceDue, currencyCode)}</span>
                </div>
              ` : ''}
            </div>
          </div>

          ${calculations.amountInWords ? `
            <div class="mt-2.5 pt-2 border-t border-gray-100 text-[11px] text-gray-600 italic">
              <span class="font-semibold text-gray-700 not-italic">Amount in Words:</span> ${escapeHtml(calculations.amountInWords)}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Payment Info, QR Code & Notes / Signature -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-200 mt-2">
        <!-- Bank / UPI info -->
        <div>
          ${hasPaymentDetails(invoice.bankDetails) ? `
            <div class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Payment Details</div>
            <div class="bg-gray-50 rounded-lg p-2.5 border border-gray-100 flex items-start gap-3">
              <div class="text-[11px] space-y-0.5 text-gray-600 flex-1 leading-tight">
                ${invoice.bankDetails?.bankName ? `<div><span class="text-gray-400">Bank:</span> <strong class="text-gray-800">${escapeHtml(invoice.bankDetails.bankName)}</strong></div>` : ''}
                ${invoice.bankDetails?.accountName ? `<div><span class="text-gray-400">A/C Name:</span> <span class="text-gray-800 font-medium">${escapeHtml(invoice.bankDetails.accountName)}</span></div>` : ''}
                ${invoice.bankDetails?.accountNumber ? `<div><span class="text-gray-400">A/C No:</span> <span class="font-mono font-bold text-gray-900">${escapeHtml(invoice.bankDetails.accountNumber)}</span></div>` : ''}
                ${invoice.bankDetails?.ifsc ? `<div><span class="text-gray-400">IFSC:</span> <span class="font-mono font-medium text-gray-800">${escapeHtml(invoice.bankDetails.ifsc)}</span></div>` : ''}
                ${invoice.bankDetails?.swift ? `<div><span class="text-gray-400">SWIFT:</span> <span class="font-mono text-gray-800">${escapeHtml(invoice.bankDetails.swift)}</span></div>` : ''}
                ${invoice.bankDetails?.upiId ? `<div><span class="text-gray-400">UPI ID:</span> <span class="font-mono font-bold text-indigo-700">${escapeHtml(invoice.bankDetails.upiId)}</span></div>` : ''}
              </div>

              ${invoice.bankDetails?.upiId && invoice.bankDetails?.showQr && qrCodeUrl ? `
                <div class="text-center shrink-0">
                  <img src="${qrCodeUrl}" alt="UPI QR Code" class="w-16 h-16 border border-gray-200 rounded p-0.5 bg-white" />
                  <div class="text-[8px] text-gray-500 font-medium mt-0.5">Scan & Pay</div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${invoice.notes ? `
            <div class="mt-2">
              <div class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Notes</div>
              <div class="text-[11px] text-gray-600 whitespace-pre-line leading-tight">${escapeHtml(invoice.notes)}</div>
            </div>
          ` : ''}
        </div>

        <!-- Terms & Signature -->
        <div class="flex flex-col justify-between items-end text-right">
          ${invoice.terms ? `
            <div class="w-full text-left md:text-right mb-2">
              <div class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Terms & Conditions</div>
              <div class="text-[10px] text-gray-500 whitespace-pre-line leading-tight">${escapeHtml(invoice.terms)}</div>
            </div>
          ` : '<div></div>'}

          <div class="mt-auto text-center md:text-right pt-2">
            ${invoice.signature ? `
              <img src="${invoice.signature}" alt="Signature" class="h-10 max-w-[120px] object-contain ml-auto mb-1" />
            ` : `<div class="h-6"></div>`}
            <div class="border-t border-gray-300 w-36 ml-auto pt-1">
              <div class="text-[11px] font-semibold text-gray-800">${escapeHtml(invoice.signatureName || invoice.seller?.name || 'Authorized Signatory')}</div>
              <div class="text-[9px] text-gray-400">Authorized Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function hasPaymentDetails(bank) {
  return bank && (bank.bankName || bank.accountNumber || bank.upiId || bank.ifsc || bank.swift);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
