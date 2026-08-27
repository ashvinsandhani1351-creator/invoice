/**
 * Live Invoice Preview Component
 * Real-time synchronized A4 paper preview with zoom controls, template selector, and brand color palette
 */

import { renderInvoiceTemplate, TEMPLATES } from '../templates/index.js';
import { calculateInvoice } from '../engine/calculator.js';
import { generateQRCodeDataUrl, buildUPIUri } from '../pdf/upi-qr.js';
import { BRAND_COLORS } from '../models/invoice.js';

export class InvoicePreview {
  constructor(containerId, onTemplateChangeCallback, onColorChangeCallback) {
    this.container = document.getElementById(containerId);
    this.onTemplateChange = onTemplateChangeCallback;
    this.onColorChange = onColorChangeCallback;
    this.invoice = null;
    this.zoomLevel = 1.0;
    this.qrCodeUrl = '';
  }

  init(invoice) {
    this.invoice = invoice;
    this.render();
  }

  async update(invoice) {
    this.invoice = invoice;
    
    // Generate UPI QR code if enabled or use custom uploaded QR image
    if (invoice.bankDetails?.showQr) {
      if (invoice.bankDetails?.customQrImage) {
        this.qrCodeUrl = invoice.bankDetails.customQrImage;
      } else if (invoice.bankDetails?.upiId) {
        const calcs = calculateInvoice(invoice);
        const uri = buildUPIUri(invoice.bankDetails.upiId, invoice.seller?.name, calcs.grandTotal, invoice.invoiceNumber);
        this.qrCodeUrl = await generateQRCodeDataUrl(uri, 180);
      } else {
        this.qrCodeUrl = '';
      }
    } else {
      this.qrCodeUrl = '';
    }

    this.render();
  }

  render() {
    if (!this.container || !this.invoice) return;

    const inv = this.invoice;
    const calcs = calculateInvoice(inv);
    const templateHtml = renderInvoiceTemplate(inv, calcs, this.qrCodeUrl);

    this.container.innerHTML = `
      <div class="flex flex-col h-full">
        <!-- Top Toolbar: Templates, Colors & Zoom -->
        <div class="bg-white rounded-2xl p-3 border border-gray-200 shadow-sm mb-4 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          
          <!-- Template Selector Pills -->
          <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            ${TEMPLATES.map(t => `
              <button type="button" data-template="${t.id}" class="px-3 py-1.5 rounded-lg font-medium transition-all ${inv.template === t.id ? 'bg-white text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:text-gray-900'}">
                ${t.name}
              </button>
            `).join('')}
          </div>

          <!-- Color Palette Picker -->
          <div class="flex items-center gap-1.5">
            <span class="text-gray-400 font-medium hidden sm:inline">Theme:</span>
            <div class="flex items-center gap-1">
              ${BRAND_COLORS.map(c => `
                <button type="button" data-color="${c.hex}" title="${c.name}" class="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${inv.brandColor === c.hex ? 'border-gray-900 scale-110 shadow-sm' : 'border-white'}" style="background-color: ${c.hex};"></button>
              `).join('')}
              <label class="w-5 h-5 rounded-full border border-gray-300 relative cursor-pointer overflow-hidden flex items-center justify-center bg-gradient-to-tr from-rose-400 via-purple-400 to-indigo-400" title="Custom Color">
                <input type="color" id="customColorPicker" value="${inv.brandColor || '#4F46E5'}" class="opacity-0 absolute inset-0 cursor-pointer w-full h-full" />
              </label>
            </div>
          </div>

          <!-- Zoom Controls -->
          <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-gray-600">
            <button type="button" id="zoomOutBtn" class="p-1 hover:text-gray-900 rounded hover:bg-white transition-colors" title="Zoom Out">
              <i data-lucide="minus" class="w-3.5 h-3.5"></i>
            </button>
            <span class="px-1.5 font-mono font-medium text-[11px]" id="zoomText">${Math.round(this.zoomLevel * 100)}%</span>
            <button type="button" id="zoomInBtn" class="p-1 hover:text-gray-900 rounded hover:bg-white transition-colors" title="Zoom In">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" id="zoomFitBtn" class="px-2 py-0.5 hover:text-gray-900 rounded hover:bg-white text-[10px] font-semibold transition-colors">
              Fit
            </button>
          </div>

        </div>

        <!-- A4 Paper Viewport Container -->
        <div class="flex-1 overflow-auto bg-slate-200/60 rounded-2xl p-4 sm:p-8 flex items-start justify-center preview-viewport min-h-[500px] border border-gray-200/60" id="previewViewport">
          <div id="invoiceRenderRoot" class="invoice-a4-sheet bg-white shadow-xl rounded-sm transition-transform origin-top duration-150" style="transform: scale(${this.zoomLevel});">
            ${templateHtml}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.bindEvents();
  }

  bindEvents() {
    if (!this.container) return;

    // Template buttons
    const templateBtns = this.container.querySelectorAll('button[data-template]');
    templateBtns.forEach(btn => {
      btn.onclick = () => {
        const tId = btn.getAttribute('data-template');
        if (this.onTemplateChange) this.onTemplateChange(tId);
      };
    });

    // Color buttons
    const colorBtns = this.container.querySelectorAll('button[data-color]');
    colorBtns.forEach(btn => {
      btn.onclick = () => {
        const hex = btn.getAttribute('data-color');
        if (this.onColorChange) this.onColorChange(hex);
      };
    });

    const customColorPicker = document.getElementById('customColorPicker');
    if (customColorPicker) {
      customColorPicker.oninput = (e) => {
        if (this.onColorChange) this.onColorChange(e.target.value);
      };
    }

    // Zoom controls
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomFitBtn = document.getElementById('zoomFitBtn');

    if (zoomInBtn) {
      zoomInBtn.onclick = () => {
        this.zoomLevel = Math.min(1.5, Math.round((this.zoomLevel + 0.1) * 10) / 10);
        this.applyZoom();
      };
    }

    if (zoomOutBtn) {
      zoomOutBtn.onclick = () => {
        this.zoomLevel = Math.max(0.4, Math.round((this.zoomLevel - 0.1) * 10) / 10);
        this.applyZoom();
      };
    }

    if (zoomFitBtn) {
      zoomFitBtn.onclick = () => {
        const viewport = document.getElementById('previewViewport');
        if (viewport) {
          const availWidth = viewport.clientWidth - 48;
          // Standard A4 width is approx 794px at 96 DPI
          const fitRatio = Math.min(1.0, availWidth / 794);
          this.zoomLevel = Math.max(0.4, Math.round(fitRatio * 100) / 100);
          this.applyZoom();
        }
      };
    }
  }

  applyZoom() {
    const sheet = document.getElementById('invoiceRenderRoot');
    const zoomText = document.getElementById('zoomText');
    if (sheet) sheet.style.transform = `scale(${this.zoomLevel})`;
    if (zoomText) zoomText.textContent = `${Math.round(this.zoomLevel * 100)}%`;
  }
}
