/**
 * Saved Invoices History Manager (100% Local in localStorage)
 */

import { calculateInvoice } from '../engine/calculator.js';

const HISTORY_KEY = 'quick_invoice_history_v1';

/**
 * Get all saved invoices from history
 * @returns {Array} List of invoice records
 */
export function getInvoiceHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Unable to load history from localStorage:', e);
    return [];
  }
}

/**
 * Save or update an invoice in the local history
 * @param {Object} invoice
 * @returns {Object} Saved history entry
 */
export function saveToHistory(invoice) {
  try {
    const history = getInvoiceHistory();
    const calculations = calculateInvoice(invoice);
    
    const entry = {
      id: invoice.id || 'inv_' + Date.now(),
      invoiceNumber: invoice.invoiceNumber || 'INV-000',
      date: invoice.date,
      dueDate: invoice.dueDate,
      customerName: invoice.customer?.name || 'Unnamed Client',
      sellerName: invoice.seller?.name || 'Unnamed Seller',
      currency: invoice.currency || 'INR',
      grandTotal: calculations.grandTotal,
      itemCount: (invoice.items || []).length,
      savedAt: new Date().toISOString(),
      invoiceData: JSON.parse(JSON.stringify(invoice)) // deep copy
    };
    
    // Check if entry with same id or invoiceNumber exists
    const existingIndex = history.findIndex(h => h.id === entry.id || (h.invoiceNumber === entry.invoiceNumber && h.invoiceNumber !== 'INV-001'));
    if (existingIndex >= 0) {
      history[existingIndex] = entry;
    } else {
      history.unshift(entry);
    }
    
    // Limit history to 100 items
    if (history.length > 100) {
      history.length = 100;
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return entry;
  } catch (e) {
    console.error('Failed to save invoice to history:', e);
    return null;
  }
}

/**
 * Delete an invoice from history
 * @param {string} id
 * @returns {boolean}
 */
export function deleteFromHistory(id) {
  try {
    const history = getInvoiceHistory().filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch (e) {
    console.error('Failed to delete invoice from history:', e);
    return false;
  }
}

/**
 * Clears all invoice history
 */
export function clearAllHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear history:', e);
  }
}

/**
 * Exports all history and drafts to a downloadable JSON backup
 */
export function exportBackupJSON() {
  const history = getInvoiceHistory();
  const draft = localStorage.getItem('quick_invoice_draft_v1');
  const prefs = localStorage.getItem('quick_invoice_user_prefs_v1');
  
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    invoices: history,
    currentDraft: draft ? JSON.parse(draft) : null,
    preferences: prefs ? JSON.parse(prefs) : null
  };
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_Backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports backup JSON data into history
 * @param {string} jsonString
 * @returns {{success: boolean, count: number, error: string}}
 */
export function importBackupJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || (!Array.isArray(parsed.invoices) && !parsed.invoices)) {
      return { success: false, count: 0, error: 'Invalid backup file format' };
    }
    
    const incoming = Array.isArray(parsed.invoices) ? parsed.invoices : [];
    const current = getInvoiceHistory();
    
    // Merge without duplicates by ID
    const map = new Map();
    current.forEach(item => map.set(item.id, item));
    incoming.forEach(item => map.set(item.id, item));
    
    const merged = Array.from(map.values());
    localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
    
    return { success: true, count: incoming.length, error: '' };
  } catch (e) {
    return { success: false, count: 0, error: e.message };
  }
}
