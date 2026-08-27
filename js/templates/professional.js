/**
 * Professional Invoice Template Renderer
 * Structured corporate layout with clear grid lines, balanced for single A4 page
 */

import { formatCurrency } from '../engine/calculator.js';

export function renderProfessionalTemplate(invoice, calculations, qrCodeUrl) {
  const brandColor = invoice.brandColor || '#2563EB';
  const currencyCode = invoice.currency || 'INR';
  const isGst = invoice.taxMode === 'gst-intra' || invoice.taxMode === 'gst-inter';

  const itemsHtml = calculations.items.map((item, idx) => {
    return `
      <tr class="border-b border-gray-200 last:border-b-0">
        <td class="py-2 px-2.5 text-left text-xs font-mono text-gray-500 w-8 border-r border-gray-200">${idx + 1}</td>
        <td class="py-2 px-2.5 text-left border-r border-gray-200">
          <div class="font-semibold text-gray-900 text-xs">${escapeHtml(item.description || 'Item description')}</div>
          ${isGst && item.hsn ? `<div class="text-[10px] text-gray-500 font-mono mt-0.5">HSN/SAC: <span class="text-gray-700">${escapeHtml(item.hsn)}</span></div>` : ''}
        </td>
        <td class="py-2 px-2.5 text-right text-xs text-gray-700 font-mono border-r border-gray-200">${item.quantity} ${escapeHtml(item.unit || '')}</td>
        <td class="py-2 px-2.5 text-right text-xs text-gray-700 font-mono border-r border-gray-200">${formatCurrency(item.rate, currencyCode, false)}</td>
        ${item.itemDiscountAmount > 0 ? `
          <td class="py-2 px-2.5 text-right text-xs text-red-600 font-mono border-r border-gray-200">-${formatCurrency(item.itemDiscountAmount, currencyCode, false)}</td>
        ` : ''}
        <td class="py-2 px-2.5 text-right font-semibold text-xs text-gray-900 font-mono">${formatCurrency(item.lineAmount, currencyCode)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="invoice-sheet professional-template bg-white text-gray-800 p-6 sm:p-8 text-xs leading-relaxed max-w-full relative flex flex-col justify-between" style="--theme-color: ${brandColor};">
      <!-- Top Brand Color Stripe -->
      <div class="absolute top-0 left-0 right-0 h-2" style="background-color: ${brandColor};"></div>

      <div>
        <!-- Header Section -->
        <div class="flex flex-row justify-between items-start pb-4 border-b-2 border-gray-200 gap-4 mt-0.5">
          <div class="flex items-start gap-3">
            ${invoice.seller?.logo ? `
              <img src="${invoice.seller.logo}" alt="Logo" class="h-12 max-w-[140px] object-contain rounded border border-gray-100 p-1" />
            ` : ''}
            <div>
              <h1 class="text-xl font-bold text-gray-900 tracking-tight">${escapeHtml(invoice.seller?.name || 'Your Company Name')}</h1>
              ${invoice.seller?.website ? `<div class="text-[11px] font-medium" style="color: ${brandColor};">${escapeHtml(invoice.seller.website)}</div>` : ''}
              <div class="text-[11px] text-gray-600 mt-0.5 space-y-0.5 whitespace-pre-line leading-tight">
                ${invoice.seller?.address ? `<div>${escapeHtml(invoice.seller.address)}</div>` : ''}
                ${invoice.seller?.email ? `<div>Email: ${escapeHtml(invoice.seller.email)} | Phone: ${escapeHtml(invoice.seller.phone || '')}</div>` : ''}
                ${invoice.seller?.gstin ? `<div class="font-mono text-gray-900 font-semibold mt-0.5">GSTIN / Tax ID: ${escapeHtml(invoice.seller.gstin)}</div>` : ''}
                ${invoice.seller?.pan ? `<div class="font-mono text-gray-700">PAN: ${escapeHtml(invoice.seller.pan)}</div>` : ''}
              </div>
            </div>
          </div>

          <div class="text-right shrink-0">
            <div class="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white mb-1.5" style="background-color: ${brandColor};">
              TAX INVOICE
            </div>
            <div class="text-sm font-bold font-mono text-gray-900">${escapeHtml(invoice.invoiceNumber || 'INV-001')}</div>
            
            <table class="text-[11px] text-right mt-1 ml-auto">
              <tr>
                <td class="text-gray-500 pr-2 py-0.5">Invoice Date:</td>
                <td class="font-semibold text-gray-800">${formatDate(invoice.date)}</td>
              </tr>
              <tr>
                <td class="text-gray-500 pr-2 py-0.5">Payment Due:</td>
                <td class="font-semibold text-red-600">${formatDate(invoice.dueDate)}</td>
              </tr>
              ${invoice.poNumber ? `
                <tr>
                  <td class="text-gray-500 pr-2 py-0.5">PO Number:</td>
                  <td class="font-mono font-medium text-gray-800">${escapeHtml(invoice.poNumber)}</td>
                </tr>
              ` : ''}
              ${isGst && invoice.gstDetails?.placeOfSupply ? `
                <tr>
                  <td class="text-gray-500 pr-2 py-0.5">Place of Supply:</td>
                  <td class="font-semibold text-gray-800">${escapeHtml(invoice.gstDetails.placeOfSupply)}</td>
                </tr>
              ` : ''}
              ${isGst && invoice.gstDetails?.reverseCharge ? `
                <tr>
                  <td colspan="2" class="text-amber-700 font-medium text-[10px] pt-0.5">Reverse Charge: YES</td>
                </tr>
              ` : ''}
            </table>
          </div>
        </div>

        <!-- Bill To & Ship To Grid Cards -->
        <div class="grid grid-cols-2 gap-3 my-3.5">
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${brandColor};"></span>
              BILL TO / CUSTOMER
            </div>
            <div class="font-bold text-gray-900 text-xs">${escapeHtml(invoice.customer?.name || 'Customer Name')}</div>
            <div class="text-[11px] text-gray-600 mt-0.5 space-y-0.5 whitespace-pre-line leading-tight">
              ${invoice.customer?.address ? `<div>${escapeHtml(invoice.customer.address)}</div>` : ''}
              ${invoice.customer?.email ? `<div>Email: ${escapeHtml(invoice.customer.email)}</div>` : ''}
              ${invoice.customer?.phone ? `<div>Phone: ${escapeHtml(invoice.customer.phone)}</div>` : ''}
              ${invoice.customer?.gstin ? `<div class="font-mono text-gray-900 font-semibold mt-0.5">GSTIN: ${escapeHtml(invoice.customer.gstin)}</div>` : ''}
            </div>
          </div>

          <div class="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <div class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
              SHIP TO / DELIVERY
            </div>
            ${invoice.customer?.shippingAddress && !invoice.customer?.sameAsBilling ? `
              <div class="text-[11px] text-gray-600 whitespace-pre-line leading-tight">${escapeHtml(invoice.customer.shippingAddress)}</div>
            ` : `
              <div class="text-[11px] text-gray-500 italic mt-0.5">Same as billing address</div>
            `}
          </div>
        </div>

        <!-- Items Table -->
        <div class="border border-gray-200 rounded-lg overflow-hidden my-3 shadow-2xs">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-slate-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider border-b border-gray-200">
                <th class="py-2 px-2.5 text-left w-8 border-r border-gray-200">#</th>
                <th class="py-2 px-2.5 text-left border-r border-gray-200">Item & Description</th>
                <th class="py-2 px-2.5 text-right border-r border-gray-200">Qty</th>
                <th class="py-2 px-2.5 text-right border-r border-gray-200">Rate</th>
                ${calculations.items.some(i => i.itemDiscountAmount > 0) ? `<th class="py-2 px-2.5 text-right border-r border-gray-200">Discount</th>` : ''}
                <th class="py-2 px-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Calculations Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
          <!-- Amount in words & Bank info -->
          <div class="space-y-2.5">
            ${calculations.amountInWords ? `
              <div class="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-gray-700">
                <span class="font-bold text-gray-900 block text-[10px] uppercase tracking-wider mb-0.5">Amount in Words</span>
                <span class="italic font-medium">${escapeHtml(calculations.amountInWords)}</span>
              </div>
            ` : ''}

            ${hasPaymentDetails(invoice.bankDetails) ? `
              <div class="border border-gray-200 rounded-lg p-2.5 bg-white">
                <div class="text-[10px] font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-1 mb-1.5 flex items-center justify-between">
                  <span>Bank & Payment Details</span>
                  ${invoice.bankDetails?.upiId ? `<span class="text-[9px] text-emerald-600 font-bold">UPI ENABLED</span>` : ''}
                </div>
                <div class="flex items-start justify-between gap-3">
                  <div class="text-[11px] space-y-0.5 text-gray-600 flex-1 leading-tight">
                    ${invoice.bankDetails?.bankName ? `<div><span class="text-gray-400">Bank:</span> <strong>${escapeHtml(invoice.bankDetails.bankName)}</strong></div>` : ''}
                    ${invoice.bankDetails?.accountName ? `<div><span class="text-gray-400">A/C Name:</span> <span class="font-medium text-gray-800">${escapeHtml(invoice.bankDetails.accountName)}</span></div>` : ''}
                    ${invoice.bankDetails?.accountNumber ? `<div><span class="text-gray-400">A/C No:</span> <span class="font-mono font-bold text-gray-900">${escapeHtml(invoice.bankDetails.accountNumber)}</span></div>` : ''}
                    ${invoice.bankDetails?.ifsc ? `<div><span class="text-gray-400">IFSC:</span> <span class="font-mono font-semibold text-gray-800">${escapeHtml(invoice.bankDetails.ifsc)}</span></div>` : ''}
                    ${invoice.bankDetails?.swift ? `<div><span class="text-gray-400">SWIFT:</span> <span class="font-mono text-gray-800">${escapeHtml(invoice.bankDetails.swift)}</span></div>` : ''}
                    ${invoice.bankDetails?.upiId ? `<div><span class="text-gray-400">UPI ID:</span> <span class="font-mono font-bold text-indigo-700">${escapeHtml(invoice.bankDetails.upiId)}</span></div>` : ''}
                  </div>

                  ${invoice.bankDetails?.upiId && invoice.bankDetails?.showQr && qrCodeUrl ? `
                    <div class="text-center shrink-0">
                      <img src="${qrCodeUrl}" alt="UPI QR" class="w-16 h-16 border border-gray-200 rounded p-0.5 bg-white" />
                      <div class="text-[8px] text-gray-500 font-bold mt-0.5">Scan to Pay</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Summary Totals Table -->
          <div>
            <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-[11px]">
              <div class="flex justify-between text-gray-700">
                <span>Taxable Subtotal:</span>
                <span class="font-mono font-medium">${formatCurrency(calculations.subtotal, currencyCode)}</span>
              </div>

              ${calculations.invoiceDiscountAmount > 0 ? `
                <div class="flex justify-between text-red-600">
                  <span>Discount ${invoice.discount?.type === 'percentage' ? `(${invoice.discount.value}%)` : ''}:</span>
                  <span class="font-mono">- ${formatCurrency(calculations.invoiceDiscountAmount, currencyCode)}</span>
                </div>
              ` : ''}

              ${invoice.taxMode === 'single' && calculations.singleTaxAmount > 0 ? `
                <div class="flex justify-between text-gray-700">
                  <span>Tax (${invoice.singleTaxRate || 0}%):</span>
                  <span class="font-mono">${formatCurrency(calculations.singleTaxAmount, currencyCode)}</span>
                </div>
              ` : ''}

              ${invoice.taxMode === 'gst-intra' ? `
                <div class="flex justify-between text-gray-700">
                  <span>CGST (${(invoice.gstDetails?.gstRate || 18) / 2}%):</span>
                  <span class="font-mono">${formatCurrency(calculations.cgstAmount, currencyCode)}</span>
                </div>
                <div class="flex justify-between text-gray-700">
                  <span>SGST (${(invoice.gstDetails?.gstRate || 18) / 2}%):</span>
                  <span class="font-mono">${formatCurrency(calculations.sgstAmount, currencyCode)}</span>
                </div>
              ` : ''}

              ${invoice.taxMode === 'gst-inter' ? `
                <div class="flex justify-between text-gray-700">
                  <span>IGST (${invoice.gstDetails?.gstRate || 18}%):</span>
                  <span class="font-mono">${formatCurrency(calculations.igstAmount, currencyCode)}</span>
                </div>
              ` : ''}

              ${calculations.shippingFee > 0 ? `
                <div class="flex justify-between text-gray-700">
                  <span>Shipping Charges:</span>
                  <span class="font-mono">${formatCurrency(calculations.shippingFee, currencyCode)}</span>
                </div>
              ` : ''}

              ${calculations.roundOffAmount !== 0 ? `
                <div class="flex justify-between text-gray-500">
                  <span>Round Off:</span>
                  <span class="font-mono">${formatCurrency(calculations.roundOffAmount, currencyCode)}</span>
                </div>
              ` : ''}

              <div class="flex justify-between pt-2 border-t-2 border-gray-300 text-sm font-bold text-gray-900">
                <span>Grand Total:</span>
                <span class="font-mono" style="color: ${brandColor};">${formatCurrency(calculations.grandTotal, currencyCode)}</span>
              </div>

              ${calculations.amountPaid > 0 ? `
                <div class="flex justify-between text-emerald-700 pt-0.5">
                  <span>Amount Paid:</span>
                  <span class="font-mono">-${formatCurrency(calculations.amountPaid, currencyCode)}</span>
                </div>
                <div class="flex justify-between pt-1 border-t border-gray-200 text-xs font-bold text-red-600">
                  <span>Balance Due:</span>
                  <span class="font-mono">${formatCurrency(calculations.balanceDue, currencyCode)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Notes, Terms & Signatory Section -->
      <div class="pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-2">
        <div class="text-[11px] space-y-1.5">
          ${invoice.notes ? `
            <div>
              <div class="font-bold text-gray-700 uppercase tracking-wider text-[9px]">Notes:</div>
              <div class="text-gray-600 whitespace-pre-line leading-tight">${escapeHtml(invoice.notes)}</div>
            </div>
          ` : ''}

          ${invoice.terms ? `
            <div>
              <div class="font-bold text-gray-700 uppercase tracking-wider text-[9px]">Terms & Conditions:</div>
              <div class="text-gray-500 whitespace-pre-line leading-tight text-[10px]">${escapeHtml(invoice.terms)}</div>
            </div>
          ` : ''}
        </div>

        <div class="text-right">
          <div class="text-[10px] text-gray-500 mb-0.5">For <strong>${escapeHtml(invoice.seller?.name || 'Company')}</strong></div>
          <div class="h-10 flex items-end justify-end">
            ${invoice.signature ? `
              <img src="${invoice.signature}" alt="Signature" class="max-h-9 max-w-[130px] object-contain mb-0.5" />
            ` : ''}
          </div>
          <div class="border-t border-gray-300 w-40 ml-auto pt-1">
            <div class="text-[11px] font-bold text-gray-900">${escapeHtml(invoice.signatureName || 'Authorized Signatory')}</div>
            <div class="text-[9px] text-gray-500">Authorized Signatory</div>
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
