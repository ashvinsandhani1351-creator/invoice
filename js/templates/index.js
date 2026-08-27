/**
 * Template Coordinator & Registry
 */

import { renderMinimalTemplate } from './minimal.js';
import { renderProfessionalTemplate } from './professional.js';
import { renderModernTemplate } from './modern.js';

export const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Ultra-clean, modern typography and maximum readability',
    icon: 'layout-grid'
  },
  {
    id: 'professional',
    name: 'Professional Business',
    description: 'Structured corporate layout with grid lines and formal summary',
    icon: 'file-text'
  },
  {
    id: 'modern',
    name: 'Modern Creative',
    description: 'Bold color header banner and pill badges for freelancers & agencies',
    icon: 'sparkles'
  }
];

/**
 * Renders the chosen template to an HTML string
 * @param {Object} invoice
 * @param {Object} calculations
 * @param {string} qrCodeUrl
 * @returns {string} HTML string
 */
export function renderInvoiceTemplate(invoice, calculations, qrCodeUrl) {
  const templateId = invoice.template || 'professional';
  
  switch (templateId) {
    case 'minimal':
      return renderMinimalTemplate(invoice, calculations, qrCodeUrl);
    case 'modern':
      return renderModernTemplate(invoice, calculations, qrCodeUrl);
    case 'professional':
    default:
      return renderProfessionalTemplate(invoice, calculations, qrCodeUrl);
  }
}
