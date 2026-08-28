/**
 * Live Invoice Preview Component
 * Real-time synchronized A4 paper preview with responsive auto-fit scaling for mobile,
 * zoom controls, template selector, and brand color palette
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
    this.zoomLevel = this.getOptimalInitialZoom();
    this.qrCodeUrl = '';
    
    // Auto-fit on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth < 1024) {
        this.autoFitToScreen();
      }
    });
  }

  getOptimalInitialZoom() {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    if (screenWidth < 640) {
      // Mobile screen: auto-scale so 794px A4 fits cleanly with 24px total padding
      return Math.max(0.35, Math.min(1.0, Math.round(((screenWidth - 32) / 794) * 100) / 100));
    } else if (screenWidth < 1024) {
      // Tablet screen
      return Math.max(0.5, Math.min(1.0, Math.round(((screenWidth - 64) / 794) * 100) / 100));
    }
    return 1.0;
  }

  autoFitToScreen() {
    const viewport = document.getElementById('previewViewport');
    const availWidth = viewport ? (viewport.clientWidth - 32) : (window.innerWidth - 32);
    const fitRatio = Math.min(1.0, Math.max(0.35, availWidth / 794));
    this.zoomLevel = Math.round(fitRatio * 100) / 100;
    this.applyZoom();
  }

  init(invoice) {
    this.invoice = invoice;
    this.zoomLevel = this.getOptimalInitialZoom();
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
    const scaledHeight = Math.round(1123 * this.zoomLevel) + 24;

    this.container.innerHTML = `
      <div class="flex flex-col h-full">
        <!-- Top Toolbar: Templates, Colors & Zoom -->
        <div class="bg-white rounded-2xl p-3 border border-gray-200 shadow-sm mb-3 flex flex-wrap items-center justify-between gap-2.5 text-xs no-print">
          
          <!-- Template Selector Pills (Horizontal scroll on mobile) -->
          <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
            ${TEMPLATES.map(t => `
              <button type="button" data-template="${t.id}" class="px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all touch-target ${inv.template === t.id ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-gray-600 hover:text-gray-900'}">
                ${t.name}
              </button>
            `).join('')}
          </div>

          <!-- Color Palette Picker -->
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-gray-400 font-medium hidden sm:inline">Theme:</span>
            <div class="flex items-center gap-1">
              ${BRAND_COLORS.map(c => `
                <button type="button" data-color="${c.hex}" title="${c.name}" class="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 touch-target ${inv.brandColor === c.hex ? 'border-gray-900 scale-110 shadow-xs' : 'border-white'}" style="background-color: ${c.hex};"></button>
              `).join('')}
              <label class="w-6 h-6 rounded-full border border-gray-300 relative cursor-pointer overflow-hidden flex items-center justify-center bg-gradient-to-tr from-rose-400 via-purple-400 to-indigo-400 shrink-0" title="Custom Color">
                <input type="color" id="customColorPicker" value="${inv.brandColor || '#4F46E5'}" class="opacity-0 absolute inset-0 cursor-pointer w-full h-full" />
              </label>
            </div>
          </div>

          <!-- Zoom Controls -->
          <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-gray-600 ml-auto shrink-0">
            <button type="button" id="zoomOutBtn" class="p-1 hover:text-gray-900 rounded hover:bg-white transition-colors" title="Zoom Out">
              <i data-lucide="minus" class="w-3.5 h-3.5"></i>
            </button>
            <span class="px-1.5 font-mono font-medium text-[11px] min-w-[36px] text-center" id="zoomText">${Math.round(this.zoomLevel * 100)}%</span>
            <button type="button" id="zoomInBtn" class="p-1 hover:text-gray-900 rounded hover:bg-white transition-colors" title="Zoom In">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" id="zoomFitBtn" class="px-2 py-0.5 hover:text-gray-900 rounded hover:bg-white text-[10px] font-bold bg-white text-indigo-700 shadow-2xs transition-colors">
              Fit Screen
            </button>
          </div>

        </div>

        <!-- A4 Paper Viewport Container with Adaptive Scaling -->
        <div class="flex-1 overflow-auto bg-slate-200/60 rounded-2xl p-2 sm:p-6 preview-viewport min-h-[480px] border border-gray-200/60" id="previewViewport">
          <div id="scaledWrapper" style="width: ${Math.round(794 * this.zoomLevel)}px; height: ${scaledHeight}px; position: relative; overflow: visible; margin: 0 auto;">
            <div id="invoiceRenderRoot" class="invoice-a4-sheet bg-white shadow-xl rounded-sm origin-top-left transition-transform duration-150" style="transform: scale(${this.zoomLevel}); width: 794px; min-height: 1123px; position: absolute; top: 0; left: 0;">
              ${templateHtml}
            </div>
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
        this.zoomLevel = Math.max(0.35, Math.round((this.zoomLevel - 0.1) * 10) / 10);
        this.applyZoom();
      };
    }

    if (zoomFitBtn) {
      zoomFitBtn.onclick = () => {
        this.autoFitToScreen();
      };
    }
  }

  applyZoom() {
    const sheet = document.getElementById('invoiceRenderRoot');
    const wrapper = document.getElementById('scaledWrapper');
    const zoomText = document.getElementById('zoomText');
    if (sheet) {
      sheet.style.transform = `scale(${this.zoomLevel})`;
    }
    if (wrapper) {
      wrapper.style.width = `${Math.round(794 * this.zoomLevel)}px`;
      wrapper.style.height = `${Math.round(1123 * this.zoomLevel) + 24}px`;
    }
    if (zoomText) {
      zoomText.textContent = `${Math.round(this.zoomLevel * 100)}%`;
    }
  }
}
