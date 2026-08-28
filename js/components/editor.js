/**
 * Invoice Editor Component
 * Multi-section responsive form with progressive disclosure, live event bindings, and validation hints
 */

import { CURRENCIES } from '../engine/calculator.js';
import { INDIAN_STATES, BRAND_COLORS } from '../models/invoice.js';
import { validateGSTIN, validatePAN } from '../engine/validator.js';

export class InvoiceEditor {
  constructor(containerId, onInvoiceChangeCallback, onOpenSignatureCallback) {
    this.container = document.getElementById(containerId);
    this.onChange = onInvoiceChangeCallback;
    this.onOpenSignature = onOpenSignatureCallback;
    this.invoice = null;
    this.showShipping = false;
  }

  init(invoice) {
    this.invoice = invoice;
    this.showShipping = !!(invoice.customer?.shippingAddress && !invoice.customer?.sameAsBilling);
    this.render();
    this.bindEvents();
  }

  update(invoice) {
    this.invoice = invoice;
    this.render();
    this.bindEvents();
  }

  render() {
    if (!this.container || !this.invoice) return;

    const inv = this.invoice;
    const isGst = inv.taxMode === 'gst-intra' || inv.taxMode === 'gst-inter';

    this.container.innerHTML = `
      <div class="space-y-6 pb-24 lg:pb-12 text-gray-800">
        
        <!-- SECTION 1: YOUR BUSINESS -->
        <div class="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/80 shadow-xs transition-all hover:border-gray-300">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">1</span>
              <div>
                <h3 class="font-bold text-gray-900 text-base">Your Business Details</h3>
                <p class="text-xs text-gray-500">Seller information displayed at the top of the invoice</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Business Name -->
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-gray-700 mb-1">
                Business / Freelancer Name <span class="text-rose-500">*</span>
              </label>
              <input type="text" id="sellerName" value="${escapeHtml(inv.seller?.name || '')}" placeholder="e.g. Acme Creative Studio or John Doe" class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
            </div>

            <!-- Logo Upload & Preview -->
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-gray-700 mb-1">Company Logo (Optional)</label>
              <div class="flex items-center gap-4">
                <div id="logoPreviewContainer" class="w-16 h-16 rounded-xl border border-gray-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  ${inv.seller?.logo ? `
                    <img src="${inv.seller.logo}" alt="Logo" class="w-full h-full object-contain p-1" />
                  ` : `
                    <i data-lucide="image" class="w-6 h-6 text-gray-400"></i>
                  `}
                </div>
                <div class="flex-1 space-y-1">
                  <div class="flex items-center gap-2">
                    <button type="button" id="logoUploadBtn" class="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-700 transition-colors shadow-sm inline-flex items-center gap-1.5">
                      <i data-lucide="upload" class="w-3.5 h-3.5"></i> Upload Logo
                    </button>
                    ${inv.seller?.logo ? `
                      <button type="button" id="logoRemoveBtn" class="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium">
                        Remove
                      </button>
                    ` : ''}
                  </div>
                  <p class="text-[11px] text-gray-400">PNG, JPG, or SVG. Auto-sized for invoice header.</p>
                  <input type="file" id="logoFileInput" accept="image/*" class="hidden" />
                </div>
              </div>
            </div>

            <!-- Email & Phone -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input type="email" id="sellerEmail" value="${escapeHtml(inv.seller?.email || '')}" placeholder="billing@yourbusiness.com" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input type="tel" id="sellerPhone" value="${escapeHtml(inv.seller?.phone || '')}" placeholder="+1 (555) 000-0000 / +91 98765 43210" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>

            <!-- Address -->
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-gray-700 mb-1">Business Address</label>
              <textarea id="sellerAddress" rows="2" placeholder="Street Address, City, State, ZIP/Postal Code, Country" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none">${escapeHtml(inv.seller?.address || '')}</textarea>
            </div>

            <!-- GSTIN & PAN (Optional) -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">
                GSTIN / Tax ID <span class="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input type="text" id="sellerGstin" value="${escapeHtml(inv.seller?.gstin || '')}" placeholder="e.g. 29AAAAA0000A1Z5" class="w-full px-3.5 py-2 text-sm font-mono uppercase bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              <div id="sellerGstinFeedback" class="text-[11px] mt-1 text-rose-500 hidden"></div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">
                PAN / Business Reg <span class="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input type="text" id="sellerPan" value="${escapeHtml(inv.seller?.pan || '')}" placeholder="e.g. ABCDE1234F" class="w-full px-3.5 py-2 text-sm font-mono uppercase bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        <!-- SECTION 2: CUSTOMER DETAILS -->
        <div class="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/80 shadow-xs transition-all hover:border-gray-300">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">2</span>
              <div>
                <h3 class="font-bold text-gray-900 text-base">Customer / Client Details</h3>
                <p class="text-xs text-gray-500">Who is this invoice being billed to?</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Client Name -->
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-gray-700 mb-1">
                Client / Company Name <span class="text-rose-500">*</span>
              </label>
              <input type="text" id="customerName" value="${escapeHtml(inv.customer?.name || '')}" placeholder="e.g. Wayne Enterprises / Jane Smith" class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
            </div>

            <!-- Email & Phone -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Client Email</label>
              <input type="email" id="customerEmail" value="${escapeHtml(inv.customer?.email || '')}" placeholder="accounts@clientcompany.com" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Client Phone</label>
              <input type="tel" id="customerPhone" value="${escapeHtml(inv.customer?.phone || '')}" placeholder="+1 (555) 123-4567" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>

            <!-- Billing Address -->
            <div class="md:col-span-2">
              <label class="block text-xs font-semibold text-gray-700 mb-1">Billing Address</label>
              <textarea id="customerAddress" rows="2" placeholder="Client street address, city, state, zip" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none">${escapeHtml(inv.customer?.address || '')}</textarea>
            </div>

            <!-- Progressive Shipping Address Toggle -->
            <div class="md:col-span-2">
              <button type="button" id="toggleShippingBtn" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5 touch-target">
                <i data-lucide="${this.showShipping ? 'minus-circle' : 'plus-circle'}" class="w-4 h-4"></i>
                ${this.showShipping ? 'Remove separate shipping address' : '+ Add separate shipping address'}
              </button>

              ${this.showShipping ? `
                <div class="mt-3 animate-in fade-in duration-150">
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Shipping / Delivery Address</label>
                  <textarea id="customerShippingAddress" rows="2" placeholder="Delivery warehouse, facility, or branch address" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none">${escapeHtml(inv.customer?.shippingAddress || '')}</textarea>
                </div>
              ` : ''}
            </div>

            <!-- Customer GSTIN (Optional) -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">
                Client GSTIN <span class="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input type="text" id="customerGstin" value="${escapeHtml(inv.customer?.gstin || '')}" placeholder="e.g. 29BBBBB0000B1Z6" class="w-full px-3.5 py-2 text-sm font-mono uppercase bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              <div id="customerGstinFeedback" class="text-[11px] mt-1 text-rose-500 hidden"></div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">
                Client PAN <span class="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input type="text" id="customerPan" value="${escapeHtml(inv.customer?.pan || '')}" placeholder="e.g. BBBBB0000B" class="w-full px-3.5 py-2 text-sm font-mono uppercase bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        <!-- SECTION 3: INVOICE DETAILS & CURRENCY -->
        <div class="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/80 shadow-xs transition-all hover:border-gray-300">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">3</span>
              <div>
                <h3 class="font-bold text-gray-900 text-base">Invoice Details</h3>
                <p class="text-xs text-gray-500">Dates, numbering, and transaction currency</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <!-- Invoice Number -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-semibold text-gray-700">Invoice Number</label>
                <button type="button" id="nextNumberBtn" title="Auto-increment invoice number" class="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-0.5">
                  <i data-lucide="plus" class="w-3 h-3"></i> Next #
                </button>
              </div>
              <input type="text" id="invoiceNumber" value="${escapeHtml(inv.invoiceNumber || 'INV-001')}" class="w-full px-3.5 py-2 text-sm font-mono font-semibold text-gray-900 bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>

            <!-- Currency Selector -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Currency</label>
              <select id="invoiceCurrency" class="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium cursor-pointer">
                ${CURRENCIES.map(c => `
                  <option value="${c.code}" ${inv.currency === c.code ? 'selected' : ''}>
                    ${c.code} (${c.symbol}) - ${c.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Invoice Date -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Invoice Date</label>
              <input type="date" id="invoiceDate" value="${inv.date || ''}" class="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>

            <!-- Due Date -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Payment Due Date</label>
              <input type="date" id="invoiceDueDate" value="${inv.dueDate || ''}" class="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>

            <!-- Purchase Order Number -->
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-gray-700 mb-1">
                Purchase Order (PO) # <span class="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input type="text" id="poNumber" value="${escapeHtml(inv.poNumber || '')}" placeholder="e.g. PO-2026-904" class="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        <!-- SECTION 4: LINE ITEMS -->
        <div class="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/80 shadow-xs transition-all hover:border-gray-300">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-sm">4</span>
              <div>
                <h3 class="font-bold text-gray-900 text-base">Items & Services</h3>
                <p class="text-xs text-gray-500">Add products, consulting fees, or deliverables</p>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="space-y-3" id="itemsListContainer">
            ${this.renderItemsList(inv.items || [], isGst)}
          </div>

          <!-- Add Item Button -->
          <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <button type="button" id="addItemBtn" class="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 rounded-xl font-bold text-xs transition-colors inline-flex items-center gap-2 touch-target">
              <i data-lucide="plus-circle" class="w-4 h-4"></i> Add Line Item
            </button>
            <span class="text-xs text-gray-400 font-medium">${(inv.items || []).length} item${(inv.items || []).length === 1 ? '' : 's'}</span>
          </div>
        </div>

        <!-- SECTION 5: DISCOUNTS, TAXES & CHARGES -->
        <div class="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/80 shadow-xs transition-all hover:border-gray-300">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">5</span>
              <div>
                <h3 class="font-bold text-gray-900 text-base">Taxes, Discounts & Charges</h3>
                <p class="text-xs text-gray-500">Configure India GST, Single Tax/VAT, or discounts</p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <!-- Tax Mode Radio Pills -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-2">Tax Calculation Mode</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label class="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${inv.taxMode === 'none' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold' : 'border-gray-200 bg-slate-50 text-gray-700'}">
                  <input type="radio" name="taxMode" value="none" ${inv.taxMode === 'none' ? 'checked' : ''} class="text-indigo-600 focus:ring-indigo-500" />
                  <span class="text-xs">No Tax</span>
                </label>

                <label class="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${inv.taxMode === 'single' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold' : 'border-gray-200 bg-slate-50 text-gray-700'}">
                  <input type="radio" name="taxMode" value="single" ${inv.taxMode === 'single' ? 'checked' : ''} class="text-indigo-600 focus:ring-indigo-500" />
                  <span class="text-xs">Single Tax / VAT</span>
                </label>

                <label class="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${inv.taxMode === 'gst-intra' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold' : 'border-gray-200 bg-slate-50 text-gray-700'}">
                  <input type="radio" name="taxMode" value="gst-intra" ${inv.taxMode === 'gst-intra' ? 'checked' : ''} class="text-indigo-600 focus:ring-indigo-500" />
                  <span class="text-xs">GST (CGST+SGST)</span>
                </label>

                <label class="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${inv.taxMode === 'gst-inter' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold' : 'border-gray-200 bg-slate-50 text-gray-700'}">
                  <input type="radio" name="taxMode" value="gst-inter" ${inv.taxMode === 'gst-inter' ? 'checked' : ''} class="text-indigo-600 focus:ring-indigo-500" />
                  <span class="text-xs">GST (IGST)</span>
                </label>
              </div>
            </div>

            <!-- Tax Rate Inputs depending on mode -->
            ${inv.taxMode === 'single' ? `
              <div class="p-4 bg-slate-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-700 mb-1">Tax Percentage (%)</label>
                  <input type="number" id="singleTaxRate" min="0" max="100" step="0.1" value="${inv.singleTaxRate || 0}" class="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            ` : ''}

            ${isGst ? `
              <div class="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <!-- GST Rate -->
                  <div>
                    <label class="block text-xs font-semibold text-gray-700 mb-1">GST Rate (%)</label>
                    <select id="gstRateSelect" class="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
                      <option value="0" ${inv.gstDetails?.gstRate === 0 ? 'selected' : ''}>0% (Exempt)</option>
                      <option value="5" ${inv.gstDetails?.gstRate === 5 ? 'selected' : ''}>5% (2.5% + 2.5%)</option>
                      <option value="12" ${inv.gstDetails?.gstRate === 12 ? 'selected' : ''}>12% (6% + 6%)</option>
                      <option value="18" ${inv.gstDetails?.gstRate === 18 ? 'selected' : ''}>18% (9% + 9%) - Standard</option>
                      <option value="28" ${inv.gstDetails?.gstRate === 28 ? 'selected' : ''}>28% (14% + 14%)</option>
                    </select>
                  </div>

                  <!-- Place of Supply -->
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-semibold text-gray-700 mb-1">Place of Supply (State)</label>
                    <select id="placeOfSupplySelect" class="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer">
                      ${INDIAN_STATES.map(st => `
                        <option value="${st}" ${inv.gstDetails?.placeOfSupply === st ? 'selected' : ''}>${st}</option>
                      `).join('')}
                    </select>
                  </div>
                </div>

                <!-- Reverse Charge Checkbox -->
                <div class="pt-1">
                  <label class="flex items-center gap-2 cursor-pointer text-xs text-gray-700 select-none">
                    <input type="checkbox" id="reverseChargeCheck" ${inv.gstDetails?.reverseCharge ? 'checked' : ''} class="rounded text-indigo-600 focus:ring-indigo-500" />
                    <span>Reverse Charge Mechanism (RCM) is applicable for this invoice</span>
                  </label>
                </div>
              </div>
            ` : ''}

            <!-- Global Discount & Shipping Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <!-- Discount -->
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-gray-700 mb-1">Invoice Discount</label>
                <div class="flex gap-2">
                  <input type="number" id="discountValue" min="0" step="any" value="${inv.discount?.value || 0}" placeholder="0" class="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <select id="discountType" class="px-3 py-2 text-xs font-semibold bg-slate-100 border border-gray-200 rounded-xl cursor-pointer">
                    <option value="percentage" ${inv.discount?.type === 'percentage' ? 'selected' : ''}>% Percent</option>
                    <option value="fixed" ${inv.discount?.type === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
                  </select>
                </div>
              </div>

              <!-- Shipping Fee -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Shipping / Extra Fee</label>
                <input type="number" id="shippingFee" min="0" step="any" value="${inv.shippingFee || 0}" placeholder="0" class="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            <!-- Amount Paid & Auto Round Off -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1">Amount Already Paid (Deposit)</label>
                <input type="number" id="amountPaid" min="0" step="any" value="${inv.amountPaid || 0}" placeholder="0" class="w-full px-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div class="flex items-center pt-2 sm:pt-5">
                <label class="flex items-center gap-2 cursor-pointer text-xs text-gray-700 select-none">
                  <input type="checkbox" id="autoRoundOffCheck" ${inv.autoRoundOff ? 'checked' : ''} class="rounded text-indigo-600 focus:ring-indigo-500" />
                  <span>Auto round-off total to nearest integer</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 6: PAYMENT & BANK DETAILS -->
        <div class="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/80 shadow-xs transition-all hover:border-gray-300">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm">6</span>
              <div>
                <h3 class="font-bold text-gray-900 text-base">Payment & Bank Details</h3>
                <p class="text-xs text-gray-500">Provide bank wire or UPI QR for instant client settlement</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Bank Name</label>
              <input type="text" id="bankName" value="${escapeHtml(inv.bankDetails?.bankName || '')}" placeholder="e.g. Chase Bank / HDFC Bank" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Account Holder Name</label>
              <input type="text" id="accountName" value="${escapeHtml(inv.bankDetails?.accountName || '')}" placeholder="e.g. Acme Studio LLC" class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Account Number / IBAN</label>
              <input type="text" id="accountNumber" value="${escapeHtml(inv.bankDetails?.accountNumber || '')}" placeholder="e.g. 50200012345678" class="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">IFSC Code / Routing / SWIFT</label>
              <input type="text" id="ifscCode" value="${escapeHtml(inv.bankDetails?.ifsc || '')}" placeholder="e.g. HDFC0000240 / CHASUS33" class="w-full px-3.5 py-2 text-sm font-mono uppercase bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <!-- UPI ID & QR Code Option -->
            <div class="md:col-span-2 pt-2 border-t border-gray-100 space-y-3">
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer text-xs text-gray-800 select-none">
                  <input type="checkbox" id="showQrCheck" ${inv.bankDetails?.showQr ? 'checked' : ''} class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                  <span class="font-bold">Show UPI / Payment QR on Invoice</span>
                </label>
                <span class="text-[11px] text-gray-500">Auto-generated or custom uploaded QR</span>
              </div>

              ${inv.bankDetails?.showQr ? `
                <div class="p-3.5 bg-slate-50 border border-indigo-100 rounded-xl space-y-3">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    
                    <!-- Option 1: UPI ID for auto QR -->
                    <div>
                      <label class="block text-xs font-semibold text-gray-700 mb-1">
                        Auto-Generate QR with UPI ID
                      </label>
                      <input type="text" id="upiId" value="${escapeHtml(inv.bankDetails?.upiId || '')}" placeholder="e.g. yourname@oksbi or business@hdfcbank" class="w-full px-3.5 py-2 text-sm font-mono bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                      <p class="text-[10px] text-gray-400 mt-1">Generates dynamic QR with amount & invoice number</p>
                    </div>

                    <!-- Option 2: Upload Custom QR image -->
                    <div>
                      <label class="block text-xs font-semibold text-gray-700 mb-1">
                        Or Upload Custom QR Image
                      </label>
                      <div class="flex items-center gap-3">
                        ${inv.bankDetails?.customQrImage ? `
                          <div class="relative group shrink-0">
                            <img src="${inv.bankDetails.customQrImage}" alt="Custom QR" class="w-12 h-12 rounded-lg border border-gray-200 object-contain bg-white p-0.5 shadow-2xs" />
                            <button type="button" id="removeCustomQrBtn" class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-rose-600 transition-colors" title="Remove custom QR">
                              &times;
                            </button>
                          </div>
                        ` : ''}

                        <label class="flex-1 px-3 py-2 bg-white hover:bg-slate-100 border border-gray-200 border-dashed rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 transition-colors">
                          <i data-lucide="qr-code" class="w-4 h-4"></i>
                          <span>${inv.bankDetails?.customQrImage ? 'Change QR Image' : 'Upload QR Image (PNG/JPG)'}</span>
                          <input type="file" id="customQrInput" accept="image/*" class="hidden" />
                        </label>
                      </div>
                      <p class="text-[10px] text-gray-400 mt-1">Upload merchant scanner from PhonePe, GPay, Paytm, BHIM</p>
                    </div>

                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- SECTION 7: NOTES, TERMS & SIGNATURE -->
        <div class="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/80 shadow-xs transition-all hover:border-gray-300">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">7</span>
              <div>
                <h3 class="font-bold text-gray-900 text-base">Notes, Terms & Signature</h3>
                <p class="text-xs text-gray-500">Add payment instructions, legal terms, or digital signature</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Notes -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Client Notes & Thank You Message</label>
              <textarea id="invoiceNotes" rows="3" placeholder="Thank you for your business! Payment instructions..." class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none">${escapeHtml(inv.notes || '')}</textarea>
            </div>

            <!-- Terms -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1">Terms & Conditions</label>
              <textarea id="invoiceTerms" rows="3" placeholder="1. Payment due within 15 days..." class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none">${escapeHtml(inv.terms || '')}</textarea>
            </div>

            <!-- Digital Signature Block -->
            <div class="md:col-span-2 pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div class="text-xs font-semibold text-gray-800">Authorized Digital Signature</div>
                <div class="text-xs text-gray-400">Draw with touch/mouse or upload signature image</div>
              </div>

              <div class="flex items-center gap-3">
                ${inv.signature ? `
                  <div class="h-10 px-3 bg-slate-50 border border-gray-200 rounded-lg flex items-center">
                    <img src="${inv.signature}" alt="Signature" class="max-h-8 max-w-[120px] object-contain" />
                  </div>
                  <button type="button" id="removeSigBtn" class="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1">
                    Remove
                  </button>
                ` : ''}
                <button type="button" id="openSigBtn" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-sm">
                  <i data-lucide="pen-tool" class="w-3.5 h-3.5"></i>
                  ${inv.signature ? 'Change Signature' : 'Add Signature'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  renderItemsList(items, isGst) {
    if (items.length === 0) {
      return `
        <div class="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-slate-50">
          <i data-lucide="shopping-cart" class="w-8 h-8 text-gray-400 mx-auto mb-2"></i>
          <div class="text-sm font-medium text-gray-700">No items added yet</div>
          <div class="text-xs text-gray-400 mt-1">Click the button below to add your first item</div>
        </div>
      `;
    }

    return items.map((item, index) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const lineRaw = qty * rate;

      return `
        <div class="p-4 bg-slate-50 hover:bg-slate-100/70 border border-gray-200 rounded-2xl transition-all space-y-3 item-row" data-id="${item.id}">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2 flex-1">
              <span class="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-500 font-mono text-xs flex items-center justify-center font-bold shrink-0">
                ${index + 1}
              </span>
              <input type="text" data-field="description" value="${escapeHtml(item.description || '')}" placeholder="Item description or service details..." class="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
            </div>

            <!-- Duplicate & Delete Actions -->
            <div class="flex items-center gap-1 shrink-0">
              <button type="button" data-action="duplicate" data-id="${item.id}" title="Duplicate Item" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors">
                <i data-lucide="copy" class="w-4 h-4"></i>
              </button>
              <button type="button" data-action="delete" data-id="${item.id}" title="Delete Item" class="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Quantity, Rate, Unit & HSN Row -->
          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
            ${isGst ? `
              <div>
                <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">HSN/SAC</label>
                <input type="text" data-field="hsn" value="${escapeHtml(item.hsn || '')}" placeholder="998314" class="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            ` : ''}

            <div>
              <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Quantity</label>
              <input type="number" data-field="quantity" min="0.01" step="any" value="${item.quantity || 1}" class="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Unit</label>
              <input type="text" data-field="unit" value="${escapeHtml(item.unit || '')}" placeholder="hrs / pcs / days" class="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label class="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Rate / Price</label>
              <input type="number" data-field="rate" min="0" step="any" value="${item.rate || 0}" class="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div class="col-span-2 sm:col-span-1 text-right flex flex-col justify-end">
              <span class="text-[10px] text-gray-400 block uppercase">Line Total</span>
              <span class="text-xs font-mono font-bold text-gray-900">${lineRaw.toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    if (!this.container) return;

    // Helper to fire changes
    const emitChange = () => {
      if (this.onChange) this.onChange(this.invoice);
    };

    // Auto-save form inputs
    const bindInput = (id, setter) => {
      const el = document.getElementById(id);
      if (el) {
        el.oninput = (e) => {
          setter(e.target.value);
          emitChange();
        };
      }
    };

    // Business details
    bindInput('sellerName', val => this.invoice.seller.name = val);
    bindInput('sellerEmail', val => this.invoice.seller.email = val);
    bindInput('sellerPhone', val => this.invoice.seller.phone = val);
    bindInput('sellerAddress', val => this.invoice.seller.address = val);
    bindInput('sellerGstin', val => {
      this.invoice.seller.gstin = val.toUpperCase();
      const feedback = document.getElementById('sellerGstinFeedback');
      if (feedback) {
        const res = validateGSTIN(val);
        if (!res.isValid && val.trim()) {
          feedback.textContent = res.message;
          feedback.classList.remove('hidden');
        } else {
          feedback.classList.add('hidden');
        }
      }
    });
    bindInput('sellerPan', val => this.invoice.seller.pan = val.toUpperCase());

    // Logo upload
    const logoUploadBtn = document.getElementById('logoUploadBtn');
    const logoFileInput = document.getElementById('logoFileInput');
    const logoRemoveBtn = document.getElementById('logoRemoveBtn');

    if (logoUploadBtn && logoFileInput) {
      logoUploadBtn.onclick = () => logoFileInput.click();
      logoFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            this.invoice.seller.logo = re.target.result;
            this.render();
            this.bindEvents();
            emitChange();
          };
          reader.readAsDataURL(file);
        }
      };
    }

    if (logoRemoveBtn) {
      logoRemoveBtn.onclick = () => {
        this.invoice.seller.logo = '';
        this.render();
        this.bindEvents();
        emitChange();
      };
    }

    // Customer details
    bindInput('customerName', val => this.invoice.customer.name = val);
    bindInput('customerEmail', val => this.invoice.customer.email = val);
    bindInput('customerPhone', val => this.invoice.customer.phone = val);
    bindInput('customerAddress', val => this.invoice.customer.address = val);
    bindInput('customerShippingAddress', val => this.invoice.customer.shippingAddress = val);
    bindInput('customerGstin', val => {
      this.invoice.customer.gstin = val.toUpperCase();
      const feedback = document.getElementById('customerGstinFeedback');
      if (feedback) {
        const res = validateGSTIN(val);
        if (!res.isValid && val.trim()) {
          feedback.textContent = res.message;
          feedback.classList.remove('hidden');
        } else {
          feedback.classList.add('hidden');
        }
      }
    });
    bindInput('customerPan', val => this.invoice.customer.pan = val.toUpperCase());

    // Toggle shipping address
    const toggleShippingBtn = document.getElementById('toggleShippingBtn');
    if (toggleShippingBtn) {
      toggleShippingBtn.onclick = () => {
        this.showShipping = !this.showShipping;
        this.invoice.customer.sameAsBilling = !this.showShipping;
        if (!this.showShipping) this.invoice.customer.shippingAddress = '';
        this.render();
        this.bindEvents();
        emitChange();
      };
    }

    // Invoice details
    bindInput('invoiceNumber', val => this.invoice.invoiceNumber = val);
    bindInput('invoiceDate', val => this.invoice.date = val);
    bindInput('invoiceDueDate', val => this.invoice.dueDate = val);
    bindInput('poNumber', val => this.invoice.poNumber = val);

    // Auto-increment number button
    const nextNumberBtn = document.getElementById('nextNumberBtn');
    if (nextNumberBtn) {
      nextNumberBtn.onclick = () => {
        const current = this.invoice.invoiceNumber || 'INV-001';
        const match = current.match(/^(.*?)(\d+)$/);
        if (match) {
          const prefix = match[1];
          const num = parseInt(match[2], 10) + 1;
          const padded = String(num).padStart(match[2].length, '0');
          this.invoice.invoiceNumber = prefix + padded;
        } else {
          this.invoice.invoiceNumber = current + '-1';
        }
        const input = document.getElementById('invoiceNumber');
        if (input) input.value = this.invoice.invoiceNumber;
        emitChange();
      };
    }

    // Currency selector
    const invoiceCurrency = document.getElementById('invoiceCurrency');
    if (invoiceCurrency) {
      invoiceCurrency.onchange = (e) => {
        this.invoice.currency = e.target.value;
        emitChange();
      };
    }

    // Tax modes radio buttons
    const taxRadios = this.container.querySelectorAll('input[name="taxMode"]');
    taxRadios.forEach(radio => {
      radio.onchange = (e) => {
        this.invoice.taxMode = e.target.value;
        this.render();
        this.bindEvents();
        emitChange();
      };
    });

    bindInput('singleTaxRate', val => this.invoice.singleTaxRate = parseFloat(val) || 0);

    const gstRateSelect = document.getElementById('gstRateSelect');
    if (gstRateSelect) {
      gstRateSelect.onchange = (e) => {
        if (!this.invoice.gstDetails) this.invoice.gstDetails = {};
        this.invoice.gstDetails.gstRate = parseFloat(e.target.value) || 0;
        emitChange();
      };
    }

    const placeOfSupplySelect = document.getElementById('placeOfSupplySelect');
    if (placeOfSupplySelect) {
      placeOfSupplySelect.onchange = (e) => {
        if (!this.invoice.gstDetails) this.invoice.gstDetails = {};
        this.invoice.gstDetails.placeOfSupply = e.target.value;
        emitChange();
      };
    }

    const reverseChargeCheck = document.getElementById('reverseChargeCheck');
    if (reverseChargeCheck) {
      reverseChargeCheck.onchange = (e) => {
        if (!this.invoice.gstDetails) this.invoice.gstDetails = {};
        this.invoice.gstDetails.reverseCharge = e.target.checked;
        emitChange();
      };
    }

    // Discount & Shipping
    bindInput('discountValue', val => {
      if (!this.invoice.discount) this.invoice.discount = {};
      this.invoice.discount.value = parseFloat(val) || 0;
    });

    const discountType = document.getElementById('discountType');
    if (discountType) {
      discountType.onchange = (e) => {
        if (!this.invoice.discount) this.invoice.discount = {};
        this.invoice.discount.type = e.target.value;
        emitChange();
      };
    }

    bindInput('shippingFee', val => this.invoice.shippingFee = parseFloat(val) || 0);
    bindInput('amountPaid', val => this.invoice.amountPaid = parseFloat(val) || 0);

    const autoRoundOffCheck = document.getElementById('autoRoundOffCheck');
    if (autoRoundOffCheck) {
      autoRoundOffCheck.onchange = (e) => {
        this.invoice.autoRoundOff = e.target.checked;
        emitChange();
      };
    }

    // Bank Details
    bindInput('bankName', val => this.invoice.bankDetails.bankName = val);
    bindInput('accountName', val => this.invoice.bankDetails.accountName = val);
    bindInput('accountNumber', val => this.invoice.bankDetails.accountNumber = val);
    bindInput('ifscCode', val => this.invoice.bankDetails.ifsc = val.toUpperCase());
    bindInput('upiId', val => this.invoice.bankDetails.upiId = val);
    const showQrCheck = document.getElementById('showQrCheck');
    if (showQrCheck) {
      showQrCheck.onchange = (e) => {
        if (!this.invoice.bankDetails) this.invoice.bankDetails = {};
        this.invoice.bankDetails.showQr = e.target.checked;
        this.render();
        this.bindEvents();
        emitChange();
      };
    }

    const customQrInput = document.getElementById('customQrInput');
    if (customQrInput) {
      customQrInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            if (!this.invoice.bankDetails) this.invoice.bankDetails = {};
            this.invoice.bankDetails.customQrImage = re.target.result;
            this.render();
            this.bindEvents();
            emitChange();
          };
          reader.readAsDataURL(file);
        }
      };
    }

    const removeCustomQrBtn = document.getElementById('removeCustomQrBtn');
    if (removeCustomQrBtn) {
      removeCustomQrBtn.onclick = () => {
        if (!this.invoice.bankDetails) this.invoice.bankDetails = {};
        this.invoice.bankDetails.customQrImage = '';
        this.render();
        this.bindEvents();
        emitChange();
      };
    }

    // Notes & Terms
    bindInput('invoiceNotes', val => this.invoice.notes = val);
    bindInput('invoiceTerms', val => this.invoice.terms = val);

    // Signature Pad
    const openSigBtn = document.getElementById('openSigBtn');
    if (openSigBtn) {
      openSigBtn.onclick = () => {
        if (this.onOpenSignature) {
          this.onOpenSignature(this.invoice.signature, this.invoice.signatureName);
        }
      };
    }

    const removeSigBtn = document.getElementById('removeSigBtn');
    if (removeSigBtn) {
      removeSigBtn.onclick = () => {
        this.invoice.signature = '';
        this.render();
        this.bindEvents();
        emitChange();
      };
    }

    // Item Actions: Add Item
    const addItemBtn = document.getElementById('addItemBtn');
    if (addItemBtn) {
      addItemBtn.onclick = () => {
        if (!Array.isArray(this.invoice.items)) this.invoice.items = [];
        this.invoice.items.push({
          id: 'item_' + Date.now(),
          description: '',
          hsn: '',
          quantity: 1,
          unit: '',
          rate: 0,
          discount: 0,
          discountType: 'percentage'
        });
        this.render();
        this.bindEvents();
        emitChange();
      };
    }

    // Item Row Inputs and Actions
    const itemRows = this.container.querySelectorAll('.item-row');
    itemRows.forEach(row => {
      const itemId = row.getAttribute('data-id');
      const item = this.invoice.items.find(i => i.id === itemId);
      if (!item) return;

      // Inputs
      const inputs = row.querySelectorAll('input[data-field]');
      inputs.forEach(input => {
        input.oninput = (e) => {
          const field = e.target.getAttribute('data-field');
          if (field === 'quantity' || field === 'rate') {
            item[field] = parseFloat(e.target.value) || 0;
          } else {
            item[field] = e.target.value;
          }
          emitChange();
        };
      });

      // Actions
      const dupBtn = row.querySelector('button[data-action="duplicate"]');
      if (dupBtn) {
        dupBtn.onclick = () => {
          const index = this.invoice.items.findIndex(i => i.id === itemId);
          if (index >= 0) {
            const copy = JSON.parse(JSON.stringify(this.invoice.items[index]));
            copy.id = 'item_' + Date.now();
            this.invoice.items.splice(index + 1, 0, copy);
            this.render();
            this.bindEvents();
            emitChange();
          }
        };
      }

      const delBtn = row.querySelector('button[data-action="delete"]');
      if (delBtn) {
        delBtn.onclick = () => {
          this.invoice.items = this.invoice.items.filter(i => i.id !== itemId);
          this.render();
          this.bindEvents();
          emitChange();
        };
      }
    });
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
