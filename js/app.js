/**
 * Main Application Controller
 * Connects state, editor, preview, signature pad, history store, and PDF engine
 */

import { createDefaultInvoice, SAMPLE_INVOICES } from './models/invoice.js';
import { InvoiceEditor } from './components/editor.js';
import { InvoicePreview } from './components/preview.js';
import { SignaturePad } from './components/signature-pad.js';
import { saveDraft, getDraft, hasDraft, clearDraft } from './storage/draft-store.js';
import { getInvoiceHistory, saveToHistory, deleteFromHistory, exportBackupJSON, importBackupJSON } from './storage/history-store.js';
import { downloadInvoicePDF, printInvoice } from './pdf/pdf-generator.js';
import { validateInvoice } from './engine/validator.js';
import { formatCurrency } from './engine/calculator.js';

class InvoicePdfGeneratorApp {
  constructor() {
    this.currentInvoice = null;
    this.editor = null;
    this.preview = null;
    this.sigPad = null;
    this.debounceTimer = null;
    this.currentMobileTab = 'edit'; // 'edit' | 'preview'
  }

  init() {
    // 1. Check for draft or load default
    const savedDraft = getDraft();
    if (savedDraft) {
      this.currentInvoice = savedDraft;
    } else {
      // Start with GST Consulting sample or default
      this.currentInvoice = createDefaultInvoice();
    }

    // Check URL parameters for preset templates, countries, and currencies
    this.checkUrlParams();

    // 2. Initialize Components
    this.editor = new InvoiceEditor(
      'editorContainer',
      (updatedInvoice) => this.handleInvoiceUpdate(updatedInvoice),
      (currentSig, currentName) => this.sigPad.open(currentSig, currentName)
    );

    this.preview = new InvoicePreview(
      'previewContainer',
      (templateId) => this.handleTemplateChange(templateId),
      (colorHex) => this.handleColorChange(colorHex)
    );

    this.sigPad = new SignaturePad(
      'sigModalContainer',
      (signatureDataUrl, signatureName) => this.handleSignatureSave(signatureDataUrl, signatureName)
    );

    this.editor.init(this.currentInvoice);
    this.preview.init(this.currentInvoice);
    this.sigPad.init();

    // 3. Bind Global Actions & Navigation
    this.bindGlobalEvents();
    this.renderHistoryList();

    // 4. Show draft restore prompt if draft was auto-loaded
    if (savedDraft && (savedDraft.seller?.name || savedDraft.customer?.name)) {
      this.showToast('Restored your draft from previous session', 'info');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  checkUrlParams() {
    try {
      if (typeof window === 'undefined' || !window.location.search) return;
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      const country = params.get('country');
      const lang = params.get('lang');

      if (!type && !country && !lang) return;

      const updated = JSON.parse(JSON.stringify(this.currentInvoice));

      // Country / Currency / Tax Presets
      if (country === 'au-gst') {
        updated.currency = 'AUD';
        updated.taxMode = 'single';
        updated.singleTaxRate = 10;
        updated.notes = 'Australian GST Tax Invoice. Payment due within 14 days.';
      } else if (country === 'au-nogst') {
        updated.currency = 'AUD';
        updated.taxMode = 'none';
      } else if (country === 'uk-vat') {
        updated.currency = 'GBP';
        updated.taxMode = 'single';
        updated.singleTaxRate = 20;
        updated.notes = 'UK VAT Invoice. Payment due within 30 days.';
      } else if (country === 'uk-novat') {
        updated.currency = 'GBP';
        updated.taxMode = 'none';
      } else if (country === 'ca-hst' || country === 'ca-gst') {
        updated.currency = 'CAD';
        updated.taxMode = 'single';
        updated.singleTaxRate = 13;
      } else if (country === 'nz-gst') {
        updated.currency = 'NZD';
        updated.taxMode = 'single';
        updated.singleTaxRate = 15;
      } else if (country === 'eu' || country === 'de') {
        updated.currency = 'EUR';
        updated.taxMode = 'single';
        updated.singleTaxRate = 19;
      } else if (country === 'ae-vat') {
        updated.currency = 'AED';
        updated.taxMode = 'single';
        updated.singleTaxRate = 5;
      } else if (country === 'sg-gst') {
        updated.currency = 'SGD';
        updated.taxMode = 'single';
        updated.singleTaxRate = 9;
      } else if (country === 'sa-vat') {
        updated.currency = 'ZAR';
        updated.taxMode = 'single';
        updated.singleTaxRate = 15;
      } else if (country === 'my') {
        updated.currency = 'MYR';
      } else if (country === 'ph') {
        updated.currency = 'PHP';
      } else if (country === 'id') {
        updated.currency = 'IDR';
      } else if (country === 'hk') {
        updated.currency = 'HKD';
      } else if (country === 'mx') {
        updated.currency = 'MXN';
      } else if (country === 'ke') {
        updated.currency = 'KES';
      }

      // Industry Type Presets
      if (type === 'blank') {
        updated.items = [{ id: 'item_1', description: '', quantity: 1, unit: 'pcs', rate: 0 }];
      } else if (type === 'sales') {
        updated.items = [
          { id: 'item_1', description: 'Product Units / Merchandise Deliverables', quantity: 10, unit: 'pcs', rate: 250 }
        ];
      } else if (type === 'billable-hours') {
        updated.items = [
          { id: 'item_1', description: 'Professional Services (Billable Hours)', quantity: 20, unit: 'hrs', rate: 75 }
        ];
      } else if (type === 'gym-fitness') {
        updated.items = [
          { id: 'item_1', description: 'Personal Training & Fitness Coaching Program', quantity: 1, unit: 'mo', rate: 200 }
        ];
      } else if (type === 'auto-repair' || type === 'car-maintenance') {
        updated.items = [
          { id: 'item_1', description: 'Vehicle Diagnostic & Engine Maintenance', quantity: 1, unit: 'job', rate: 350 },
          { id: 'item_2', description: 'Replacement Parts & Synthetic Fluid', quantity: 1, unit: 'set', rate: 120 }
        ];
      } else if (type === 'photography' || type === 'photographer') {
        updated.items = [
          { id: 'item_1', description: 'Commercial Event Photography & Studio Lighting', quantity: 4, unit: 'hrs', rate: 150 },
          { id: 'item_2', description: 'High-Resolution Digital Retouching & Delivery', quantity: 25, unit: 'photos', rate: 10 }
        ];
      } else if (type === 'restaurant') {
        updated.items = [
          { id: 'item_1', description: 'Corporate Catering & Banquet Food Service', quantity: 50, unit: 'plates', rate: 30 }
        ];
      } else if (type === 'consultant') {
        updated.items = [
          { id: 'item_1', description: 'Strategic Business & Technology Advisory Consulting', quantity: 10, unit: 'hrs', rate: 150 }
        ];
      } else if (type === 'medical') {
        updated.items = [
          { id: 'item_1', description: 'Medical Consultation & Comprehensive Health Examination', quantity: 1, unit: 'session', rate: 180 }
        ];
      } else if (type === 'translation') {
        updated.items = [
          { id: 'item_1', description: 'Certified Document Translation & Proofreading', quantity: 2500, unit: 'words', rate: 0.12 }
        ];
      } else if (type === 'teaching') {
        updated.items = [
          { id: 'item_1', description: 'Private Academic Tutoring & Course Instruction', quantity: 8, unit: 'hrs', rate: 45 }
        ];
      } else if (type === 'cleaner') {
        updated.items = [
          { id: 'item_1', description: 'Residential Deep Cleaning & Sanitization Service', quantity: 1, unit: 'service', rate: 160 }
        ];
      } else if (type === 'rent') {
        updated.items = [
          { id: 'item_1', description: 'Monthly Commercial Office / Property Rental Payment', quantity: 1, unit: 'month', rate: 1200 }
        ];
      } else if (type === 'plumber') {
        updated.items = [
          { id: 'item_1', description: 'Emergency Plumbing Repair & Pipe Drainage Clearing', quantity: 2, unit: 'hrs', rate: 95 }
        ];
      } else if (type === 'car-rental') {
        updated.items = [
          { id: 'item_1', description: 'Executive Car Rental & Chauffeur Vehicle Service', quantity: 3, unit: 'days', rate: 85 }
        ];
      } else if (type === 'travel-tourism' || type === 'travel-agency') {
        updated.items = [
          { id: 'item_1', description: 'Guided Tour Package & Travel Booking Services', quantity: 2, unit: 'guests', rate: 450 }
        ];
      } else if (type === 'contractor' || type === 'subcontractor') {
        updated.items = [
          { id: 'item_1', description: 'Independent Contracting & Construction Services', quantity: 40, unit: 'hrs', rate: 65 }
        ];
      }

      this.currentInvoice = updated;
    } catch (e) {
      console.warn('Error parsing URL params:', e);
    }
  }

  handleInvoiceUpdate(updatedInvoice) {
    this.currentInvoice = updatedInvoice;
    this.preview.update(this.currentInvoice);

    // Auto-save draft with debounce
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      saveDraft(this.currentInvoice);
      this.showAutoSaveIndicator();
    }, 400);
  }

  handleTemplateChange(templateId) {
    this.currentInvoice.template = templateId;
    this.editor.update(this.currentInvoice);
    this.preview.update(this.currentInvoice);
    saveDraft(this.currentInvoice);
  }

  handleColorChange(colorHex) {
    this.currentInvoice.brandColor = colorHex;
    this.editor.update(this.currentInvoice);
    this.preview.update(this.currentInvoice);
    saveDraft(this.currentInvoice);
  }

  handleSignatureSave(signatureDataUrl, signatureName) {
    this.currentInvoice.signature = signatureDataUrl;
    if (signatureName) this.currentInvoice.signatureName = signatureName;
    this.editor.update(this.currentInvoice);
    this.preview.update(this.currentInvoice);
    saveDraft(this.currentInvoice);
    this.showToast('Signature updated', 'success');
  }

  showAutoSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    if (indicator) {
      indicator.textContent = 'Saved to device';
      indicator.className = 'text-[11px] text-emerald-600 font-medium inline-flex items-center gap-1';
      setTimeout(() => {
        indicator.textContent = '100% Private & Local';
        indicator.className = 'text-[11px] text-gray-500 font-medium inline-flex items-center gap-1';
      }, 2000);
    }
  }

  bindGlobalEvents() {
    // Primary CTA: Download PDF
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const mobileDownloadPdfBtn = document.getElementById('mobileDownloadPdfBtn');

    let isGeneratingPdf = false;

    const handleDownload = async () => {
      if (isGeneratingPdf) return;

      const validation = validateInvoice(this.currentInvoice);
      if (!validation.isValid) {
        this.showToast(validation.errors[0], 'warning');
      }

      isGeneratingPdf = true;

      // Save original HTML
      const origDesktopHtml = downloadPdfBtn ? downloadPdfBtn.innerHTML : '';
      const origMobileHtml = mobileDownloadPdfBtn ? mobileDownloadPdfBtn.innerHTML : '';

      // Set loading state on both buttons
      if (downloadPdfBtn) {
        downloadPdfBtn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin"></i> <span>Creating PDF...</span>`;
        downloadPdfBtn.disabled = true;
      }
      if (mobileDownloadPdfBtn) {
        mobileDownloadPdfBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> <span>Creating PDF...</span>`;
        mobileDownloadPdfBtn.disabled = true;
      }
      if (window.lucide) window.lucide.createIcons();

      this.showToast('Generating high-resolution A4 PDF...', 'info');

      try {
        await downloadInvoicePDF(null, this.currentInvoice, this.preview?.qrCodeUrl);
        // Automatically save to local history
        saveToHistory(this.currentInvoice);
        this.renderHistoryList();
        this.showToast('Invoice PDF downloaded successfully!', 'success');
      } catch (err) {
        console.error('PDF generation error:', err);
        this.showToast('Could not generate PDF. Opening print dialog...', 'warning');
        printInvoice(this.currentInvoice, this.preview?.qrCodeUrl);
      } finally {
        isGeneratingPdf = false;
        if (downloadPdfBtn) {
          downloadPdfBtn.innerHTML = origDesktopHtml;
          downloadPdfBtn.disabled = false;
        }
        if (mobileDownloadPdfBtn) {
          mobileDownloadPdfBtn.innerHTML = origMobileHtml;
          mobileDownloadPdfBtn.disabled = false;
        }
        if (window.lucide) window.lucide.createIcons();
      }
    };

    if (downloadPdfBtn) downloadPdfBtn.onclick = handleDownload;
    if (mobileDownloadPdfBtn) mobileDownloadPdfBtn.onclick = handleDownload;

    // Print Button
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
      printBtn.onclick = () => printInvoice(this.currentInvoice, this.preview?.qrCodeUrl);
    }

    // New Invoice Button
    const newInvoiceBtn = document.getElementById('newInvoiceBtn');
    if (newInvoiceBtn) {
      newInvoiceBtn.onclick = () => {
        if (confirm('Create a new blank invoice? Any unsaved changes will be cleared.')) {
          this.currentInvoice = createDefaultInvoice();
          clearDraft();
          this.editor.update(this.currentInvoice);
          this.preview.update(this.currentInvoice);
          this.showToast('Created new blank invoice', 'info');
        }
      };
    }

    // Sample Invoices Dropdown
    const sampleSelect = document.getElementById('sampleInvoiceSelect');
    if (sampleSelect) {
      sampleSelect.onchange = (e) => {
        const key = e.target.value;
        if (key && SAMPLE_INVOICES[key]) {
          this.currentInvoice = JSON.parse(JSON.stringify(SAMPLE_INVOICES[key]));
          this.currentInvoice.id = 'inv_' + Date.now();
          this.editor.update(this.currentInvoice);
          this.preview.update(this.currentInvoice);
          saveDraft(this.currentInvoice);
          this.showToast('Sample invoice template loaded', 'success');
          sampleSelect.value = '';
        }
      };
    }

    // History Drawer Toggle
    const historyBtn = document.getElementById('historyBtn');
    const historyDrawer = document.getElementById('historyDrawer');
    const historyCloseBtn = document.getElementById('historyCloseBtn');
    const historyBackdrop = document.getElementById('historyBackdrop');

    const toggleHistory = (open) => {
      if (open) {
        this.renderHistoryList();
        historyDrawer.classList.remove('translate-x-full');
        historyBackdrop.classList.remove('hidden');
      } else {
        historyDrawer.classList.add('translate-x-full');
        historyBackdrop.classList.add('hidden');
      }
    };

    if (historyBtn) {
      historyBtn.onclick = () => {
        if (this.currentInvoice && (this.currentInvoice.seller?.name || this.currentInvoice.customer?.name || this.currentInvoice.items?.length > 0)) {
          saveToHistory(this.currentInvoice);
          this.showToast(`Invoice ${this.currentInvoice.invoiceNumber || ''} saved to history!`, 'success');
        }
        toggleHistory(true);
      };
    }
    if (historyCloseBtn) historyCloseBtn.onclick = () => toggleHistory(false);
    if (historyBackdrop) historyBackdrop.onclick = () => toggleHistory(false);

    // Export / Import Backup JSON
    const exportBackupBtn = document.getElementById('exportBackupBtn');
    if (exportBackupBtn) {
      exportBackupBtn.onclick = () => {
        exportBackupJSON();
        this.showToast('Backup exported successfully', 'success');
      };
    }

    const importBackupBtn = document.getElementById('importBackupBtn');
    const backupFileInput = document.getElementById('backupFileInput');
    if (importBackupBtn && backupFileInput) {
      importBackupBtn.onclick = () => backupFileInput.click();
      backupFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            const res = importBackupJSON(re.target.result);
            if (res.success) {
              this.renderHistoryList();
              this.showToast(`Imported ${res.count} invoices from backup`, 'success');
            } else {
              this.showToast(`Import failed: ${res.error}`, 'warning');
            }
          };
          reader.readAsText(file);
        }
      };
    }

    // Mobile Navigation Switcher (Edit Form vs Live Preview)
    const mobileTabEdit = document.getElementById('mobileTabEdit');
    const mobileTabPreview = document.getElementById('mobileTabPreview');
    const mobileTogglePreviewBtn = document.getElementById('mobileTogglePreviewBtn');
    const mobileToggleText = document.getElementById('mobileToggleText');
    const editorCol = document.getElementById('editorColumn');
    const previewCol = document.getElementById('previewColumn');

    const setMobileTab = (tab) => {
      this.currentMobileTab = tab;
      if (tab === 'edit') {
        editorCol.classList.remove('hidden');
        previewCol.classList.add('hidden', 'lg:block');
        if (mobileTabEdit) {
          mobileTabEdit.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-white text-indigo-700 shadow-xs border border-slate-200/60 flex items-center justify-center gap-1.5 transition-all';
        }
        if (mobileTabPreview) {
          mobileTabPreview.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition-all';
        }
        if (mobileToggleText) mobileToggleText.textContent = 'View A4';
      } else {
        editorCol.classList.add('hidden');
        previewCol.classList.remove('hidden');
        if (mobileTabPreview) {
          mobileTabPreview.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-bold bg-white text-indigo-700 shadow-xs border border-slate-200/60 flex items-center justify-center gap-1.5 transition-all';
        }
        if (mobileTabEdit) {
          mobileTabEdit.className = 'flex-1 py-2 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition-all';
        }
        if (mobileToggleText) mobileToggleText.textContent = 'Edit Form';

        // Auto-fit preview to mobile viewport
        if (this.preview) {
          this.preview.update(this.currentInvoice);
          setTimeout(() => {
            this.preview.autoFitToScreen();
          }, 50);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (mobileTabEdit) mobileTabEdit.onclick = () => setMobileTab('edit');
    if (mobileTabPreview) mobileTabPreview.onclick = () => setMobileTab('preview');
    if (mobileTogglePreviewBtn) {
      mobileTogglePreviewBtn.onclick = () => {
        setMobileTab(this.currentMobileTab === 'preview' ? 'edit' : 'preview');
      };
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        printInvoice(this.currentInvoice, this.preview?.qrCodeUrl);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleDownload();
      }
    });
  }

  renderHistoryList() {
    const listContainer = document.getElementById('historyListContainer');
    if (!listContainer) return;

    const history = getInvoiceHistory();

    if (history.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-16 px-4">
          <i data-lucide="folder-archive" class="w-10 h-10 text-gray-300 mx-auto mb-3"></i>
          <div class="text-sm font-semibold text-gray-700">No Saved Invoices Yet</div>
          <p class="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Invoices are automatically saved locally on your device whenever you download a PDF.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    listContainer.innerHTML = history.map(item => {
      return `
        <div class="p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 transition-all shadow-sm space-y-2.5">
          <div class="flex items-start justify-between">
            <div>
              <div class="font-bold text-gray-900 text-sm font-mono">${escapeHtml(item.invoiceNumber)}</div>
              <div class="text-xs font-medium text-gray-700 mt-0.5">${escapeHtml(item.customerName)}</div>
            </div>
            <div class="text-right font-mono font-bold text-sm text-indigo-700">
              ${formatCurrency(item.grandTotal, item.currency)}
            </div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
            <span>Issued: ${item.date || 'N/A'}</span>
            <div class="flex items-center gap-2">
              <button type="button" data-history-load="${item.id}" class="text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors">
                Load & Edit
              </button>
              <button type="button" data-history-delete="${item.id}" class="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors" title="Delete">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Bind item actions
    listContainer.querySelectorAll('button[data-history-load]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-history-load');
        const entry = history.find(h => h.id === id);
        if (entry && entry.invoiceData) {
          this.currentInvoice = JSON.parse(JSON.stringify(entry.invoiceData));
          this.editor.update(this.currentInvoice);
          this.preview.update(this.currentInvoice);
          saveDraft(this.currentInvoice);
          
          // Close drawer
          const historyDrawer = document.getElementById('historyDrawer');
          const historyBackdrop = document.getElementById('historyBackdrop');
          if (historyDrawer) historyDrawer.classList.add('translate-x-full');
          if (historyBackdrop) historyBackdrop.classList.add('hidden');

          this.showToast(`Loaded invoice ${entry.invoiceNumber}`, 'info');
        }
      };
    });

    listContainer.querySelectorAll('button[data-history-delete]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-history-delete');
        if (confirm('Delete this invoice from your local history?')) {
          deleteFromHistory(id);
          this.renderHistoryList();
          this.showToast('Deleted invoice from history', 'info');
        }
      };
    });
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-800 text-white' : (type === 'warning' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white');
    const iconName = type === 'success' ? 'check-circle' : (type === 'warning' ? 'alert-triangle' : 'info');

    toast.className = `fixed bottom-20 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium ${bgClass} animate-in fade-in slide-in-from-bottom-5 duration-200`;
    toast.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4"></i> <span>${escapeHtml(message)}</span>`;

    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
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

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new InvoicePdfGeneratorApp();
  app.init();
});
