/**
 * Modern Creative Template Renderer
 * Bold color-accented modern layout designed for single A4 page
 */

import { formatCurrency } from '../engine/calculator.js';

export function renderModernTemplate(invoice, calculations, qrCodeUrl) {
  const brandColor = invoice.brandColor || '#059669';
  const currencyCode = invoice.currency || 'USD';
  const isGst = invoice.taxMode === 'gst-intra' || invoice.taxMode === 'gst-inter';

  const itemsHtml = calculations.items.map((item, idx) => {
    return `
      <tr class="border-b border-gray-100 last:border-b-0">
        <td class="py-2.5 px-3 text-left">
          <div class="font-semibold text-gray-900 text-xs">${escapeHtml(item.description || 'Item description')}</div>
          ${isGst && item.hsn ? `<div class="text-[10px] text-gray-400 font-mono mt-0.5">HSN/SAC: ${escapeHtml(item.hsn)}</div>` : ''}
        </td>
        <td class="py-2.5 px-3 text-center text-xs text-gray-600 font-mono">${item.quantity} ${escapeHtml(item.unit || '')}</td>
        <td class="py-2.5 px-3 text-right text-xs text-gray-600 font-mono">${formatCurrency(item.rate, currencyCode, false)}</td>
        ${item.itemDiscountAmount > 0 ? `
          <td class="py-2.5 px-3 text-right text-xs text-emerald-600 font-mono">-${formatCurrency(item.itemDiscountAmount, currencyCode, false)}</td>
        ` : ''}
        <td class="py-2.5 px-3 text-right font-bold text-xs text-gray-900 font-mono">${formatCurrency(item.lineAmount, currencyCode)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="invoice-sheet modern-template bg-white text-gray-800 p-6 sm:p-8 text-xs leading-relaxed max-w-full flex flex-col justify-between" style="--theme-color: ${brandColor};">
      <div>
        <!-- Modern Accent Header Box -->
        <div class="rounded-xl p-5 text-white relative overflow-hidden shadow-2xs" style="background-color: ${brandColor};">
          <div class="flex flex-row justify-between items-start relative z-10 gap-4">
            <div>
              ${invoice.seller?.logo ? `
                <img src="${invoice.seller.logo}" alt="Logo" class="h-10 max-w-[150px] object-contain mb-2 bg-white/90 p-1 rounded shadow-2xs" />
              ` : ''}
              <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight">${escapeHtml(invoice.seller?.name || 'Your Studio / Name')}</h1>
              <div class="text-[11px] text-white/80 mt-1 space-y-0.5 whitespace-pre-line leading-tight">
                ${invoice.seller?.address ? `<div>${escapeHtml(invoice.seller.address)}</div>` : ''}
                ${invoice.seller?.email ? `<div>${escapeHtml(invoice.seller.email)} ${invoice.seller?.phone ? `• ${escapeHtml(invoice.seller.phone)}` : ''}</div>` : ''}
                ${invoice.seller?.gstin ? `<div class="font-mono bg-white/10 px-1.5 py-0.5 rounded inline-block mt-0.5">GSTIN: ${escapeHtml(invoice.seller.gstin)}</div>` : ''}
              </div>
            </div>

            <div class="text-right shrink-0">
              <div class="text-[10px] font-semibold uppercase tracking-widest text-white/70">INVOICE</div>
              <div class="text-lg font-black font-mono mt-0.5">${escapeHtml(invoice.invoiceNumber || 'INV-001')}</div>
              <div class="mt-2 inline-block bg-white/15 backdrop-blur-xs rounded-lg px-2.5 py-1 text-[11px] text-right">
                <div><span class="text-white/70">Issued:</span> <strong class="text-white">${formatDate(invoice.date)}</strong></div>
                <div><span class="text-white/70">Due:</span> <strong class="text-white">${formatDate(invoice.dueDate)}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bill To & Meta Details Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Invoice For</div>
            <div class="font-bold text-gray-900 text-xs">${escapeHtml(invoice.customer?.name || 'Client Name')}</div>
            <div class="text-[11px] text-gray-600 mt-0.5 space-y-0.5 whitespace-pre-line leading-tight">
              ${invoice.customer?.address ? `<div>${escapeHtml(invoice.customer.address)}</div>` : ''}
              ${invoice.customer?.email ? `<div>Email: ${escapeHtml(invoice.customer.email)}</div>` : ''}
              ${invoice.customer?.phone ? `<div>Phone: ${escapeHtml(invoice.customer.phone)}</div>` : ''}
              ${invoice.customer?.gstin ? `<div class="font-mono text-gray-700 font-semibold mt-0.5">GSTIN: ${escapeHtml(invoice.customer.gstin)}</div>` : ''}
            </div>
          </div>

          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Reference & Details</div>
            <div class="text-[11px] space-y-1 text-gray-600">
              ${invoice.poNumber ? `<div><span class="text-gray-400">PO Number:</span> <strong class="font-mono text-gray-800">${escapeHtml(invoice.poNumber)}</strong></div>` : ''}
              ${isGst && invoice.gstDetails?.placeOfSupply ? `<div><span class="text-gray-400">Place of Supply:</span> <strong class="text-gray-800">${escapeHtml(invoice.gstDetails.placeOfSupply)}</strong></div>` : ''}
              ${isGst && invoice.gstDetails?.reverseCharge ? `<div class="text-amber-600 font-bold text-[10px]">Reverse Charge Applicable</div>` : ''}
              <div><span class="text-gray-400">Currency:</span> <strong class="text-gray-800 font-mono">${currencyCode}</strong></div>
            </div>
            <div class="pt-1.5 text-right">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style="background-color: ${brandColor}15; color: ${brandColor};">
                Due on ${formatDate(invoice.dueDate)}
              </span>
            </div>
          </div>
        </div>

        <!-- Line Items -->
        <div class="my-3">
          <table class="w-full">
            <thead>
              <tr class="border-b-2 text-[10px] font-bold uppercase tracking-wider text-gray-400" style="border-color: ${brandColor}30;">
                <th class="py-2 px-3 text-left">Service / Item</th>
                <th class="py-2 px-3 text-center">Qty</th>
                <th class="py-2 px-3 text-right">Rate</th>
                ${calculations.items.some(i => i.itemDiscountAmount > 0) ? `<th class="py-2 px-3 text-right">Disc</th>` : ''}
                <th class="py-2 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Calculations Card & Notes -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
          <!-- Notes & Payment -->
          <div class="space-y-3">
            ${hasPaymentDetails(invoice.bankDetails) ? `
              <div class="p-3 rounded-xl border border-gray-100 bg-slate-50 flex items-start gap-3">
                <div class="text-[11px] space-y-0.5 text-gray-600 flex-1 leading-tight">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Payment Method</div>
                  ${invoice.bankDetails?.bankName ? `<div><span class="text-gray-400">Bank:</span> <strong>${escapeHtml(invoice.bankDetails.bankName)}</strong></div>` : ''}
                  ${invoice.bankDetails?.accountName ? `<div><span class="text-gray-400">A/C Name:</span> ${escapeHtml(invoice.bankDetails.accountName)}</div>` : ''}
                  ${invoice.bankDetails?.accountNumber ? `<div><span class="text-gray-400">Account:</span> <span class="font-mono font-bold text-gray-900">${escapeHtml(invoice.bankDetails.accountNumber)}</span></div>` : ''}
                  ${invoice.bankDetails?.ifsc ? `<div><span class="text-gray-400">IFSC:</span> <span class="font-mono text-gray-800 font-semibold">${escapeHtml(invoice.bankDetails.ifsc)}</span></div>` : ''}
                  ${invoice.bankDetails?.swift ? `<div><span class="text-gray-400">SWIFT:</span> <span class="font-mono text-gray-800">${escapeHtml(invoice.bankDetails.swift)}</span></div>` : ''}
                  ${invoice.bankDetails?.upiId ? `<div><span class="text-gray-400">UPI:</span> <span class="font-mono font-bold text-indigo-700">${escapeHtml(invoice.bankDetails.upiId)}</span></div>` : ''}
                </div>

                ${invoice.bankDetails?.showQr && qrCodeUrl ? `
                  <div class="text-center shrink-0">
                    <img src="${qrCodeUrl}" alt="Payment QR" class="w-16 h-16 border border-gray-200 rounded-lg p-0.5 bg-white shadow-2xs" />
                    <div class="text-[8px] text-gray-500 font-bold mt-0.5">Scan & Pay</div>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${invoice.notes ? `
              <div>
                <div class="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Notes</div>
                <div class="text-[11px] text-gray-600 whitespace-pre-line leading-tight">${escapeHtml(invoice.notes)}</div>
              </div>
            ` : ''}
          </div>

          <!-- Calculations Summary Card -->
          <div>
            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px]">
              <div class="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span class="font-mono font-semibold text-gray-900">${formatCurrency(calculations.subtotal, currencyCode)}</span>
              </div>

              ${calculations.invoiceDiscountAmount > 0 ? `
                <div class="flex justify-between text-emerald-600">
                  <span>Discount ${invoice.discount?.type === 'percentage' ? `(${invoice.discount.value}%)` : ''}</span>
                  <span class="font-mono">- ${formatCurrency(calculations.invoiceDiscountAmount, currencyCode)}</span>
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
                  <span>Shipping</span>
                  <span class="font-mono">${formatCurrency(calculations.shippingFee, currencyCode)}</span>
                </div>
              ` : ''}

              ${calculations.roundOffAmount !== 0 ? `
                <div class="flex justify-between text-gray-500">
                  <span>Round-off</span>
                  <span class="font-mono">${formatCurrency(calculations.roundOffAmount, currencyCode)}</span>
                </div>
              ` : ''}

              <!-- Grand Total Highlight Pill -->
              <div class="p-2.5 rounded-lg text-white flex justify-between items-center text-sm font-bold shadow-2xs mt-2" style="background-color: ${brandColor};">
                <span>Total Amount</span>
                <span class="font-mono text-base">${formatCurrency(calculations.grandTotal, currencyCode)}</span>
              </div>

              ${calculations.amountPaid > 0 ? `
                <div class="flex justify-between text-emerald-700 pt-0.5">
                  <span>Paid</span>
                  <span class="font-mono">-${formatCurrency(calculations.amountPaid, currencyCode)}</span>
                </div>
                <div class="flex justify-between pt-0.5 border-t border-gray-200 text-xs font-bold text-gray-900">
                  <span>Balance Due</span>
                  <span class="font-mono">${formatCurrency(calculations.balanceDue, currencyCode)}</span>
                </div>
              ` : ''}
            </div>

            ${calculations.amountInWords ? `
              <div class="mt-1.5 text-right text-[10px] text-gray-500 italic">
                ${escapeHtml(calculations.amountInWords)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Footer & Signature -->
      <div class="pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs mt-2">
        <div class="text-gray-500 max-w-sm">
          ${invoice.terms ? `
            <div class="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Terms</div>
            <div class="text-[10px] whitespace-pre-line leading-tight">${escapeHtml(invoice.terms)}</div>
          ` : ''}
        </div>

        <div class="text-right">
          ${invoice.signature ? `
            <img src="${invoice.signature}" alt="Signature" class="h-10 max-w-[130px] object-contain ml-auto mb-0.5" />
          ` : `<div class="h-6"></div>`}
          <div class="border-t border-gray-300 w-36 ml-auto pt-1">
            <div class="font-bold text-gray-900 text-[11px]">${escapeHtml(invoice.signatureName || invoice.seller?.name || 'Authorized Signatory')}</div>
            <div class="text-[9px] text-gray-400">Authorized Signature</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function hasPaymentDetails(bank) {
  return bank && (bank.bankName || bank.accountNumber || bank.upiId || bank.ifsc || bank.swift || (bank.showQr && (bank.customQrImage || bank.upiId)));
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
