/**
 * Local Draft Storage Manager
 */

const DRAFT_KEY = 'quick_invoice_draft_v1';
const PREFS_KEY = 'quick_invoice_user_prefs_v1';

/**
 * Saves current invoice as draft in localStorage
 * @param {Object} invoice
 */
export function saveDraft(invoice) {
  try {
    if (!invoice) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(invoice));
    
    // Also save reusable seller info and user preferences
    if (invoice.seller) {
      const prefs = {
        seller: invoice.seller,
        bankDetails: invoice.bankDetails,
        currency: invoice.currency,
        template: invoice.template,
        brandColor: invoice.brandColor,
        taxMode: invoice.taxMode,
        singleTaxRate: invoice.singleTaxRate,
        gstDetails: invoice.gstDetails,
        notes: invoice.notes,
        terms: invoice.terms,
        signature: invoice.signature,
        signatureName: invoice.signatureName
      };
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    }
  } catch (e) {
    console.warn('Unable to save draft to localStorage:', e);
  }
}

/**
 * Retrieves the saved draft
 * @returns {Object|null}
 */
export function getDraft() {
  try {
    const data = localStorage.getItem(DRAFT_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Unable to read draft from localStorage:', e);
    return null;
  }
}

/**
 * Checks if a draft is available and differs from blank
 * @returns {boolean}
 */
export function hasDraft() {
  const draft = getDraft();
  return !!(draft && (draft.seller?.name || draft.customer?.name || (draft.items && draft.items.length > 0)));
}

/**
 * Clears current draft from localStorage
 */
export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    console.warn('Unable to clear draft from localStorage:', e);
  }
}

/**
 * Retrieves saved business preferences
 * @returns {Object|null}
 */
export function getUserPreferences() {
  try {
    const data = localStorage.getItem(PREFS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}
