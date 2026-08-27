/**
 * Invoice Data Model and Sample Data Presets
 */

export const INDIAN_STATES = [
  '01-Jammu & Kashmir', '02-Himachal Pradesh', '03-Punjab', '04-Chandigarh', '05-Uttarakhand',
  '06-Haryana', '07-Delhi', '08-Rajasthan', '09-Uttar Pradesh', '10-Bihar',
  '11-Sikkim', '12-Arunachal Pradesh', '13-Nagaland', '14-Manipur', '15-Mizoram',
  '16-Tripura', '17-Meghalaya', '18-Assam', '19-West Bengal', '20-Jharkhand',
  '21-Odisha', '22-Chhattisgarh', '23-Madhya Pradesh', '24-Gujarat', '26-Dadra & Nagar Haveli and Daman & Diu',
  '27-Maharashtra', '28-Andhra Pradesh (Old)', '29-Karnataka', '30-Goa', '31-Lakshadweep',
  '32-Kerala', '33-Tamil Nadu', '34-Puducherry', '35-Andaman & Nicobar Islands', '36-Telangana',
  '37-Andhra Pradesh (New)', '38-Ladakh', '97-Other Territory'
];

export const BRAND_COLORS = [
  { name: 'Indigo', hex: '#4F46E5', text: '#ffffff' },
  { name: 'Blue', hex: '#2563EB', text: '#ffffff' },
  { name: 'Emerald', hex: '#059669', text: '#ffffff' },
  { name: 'Violet', hex: '#7C3AED', text: '#ffffff' },
  { name: 'Rose', hex: '#E11D48', text: '#ffffff' },
  { name: 'Amber', hex: '#D97706', text: '#ffffff' },
  { name: 'Cyan', hex: '#0891B2', text: '#ffffff' },
  { name: 'Slate', hex: '#334155', text: '#ffffff' }
];

/**
 * Generates an empty default invoice
 */
export function createDefaultInvoice() {
  const today = new Date().toISOString().split('T')[0];
  const dueDateObj = new Date();
  dueDateObj.setDate(dueDateObj.getDate() + 15);
  const dueDate = dueDateObj.toISOString().split('T')[0];

  return {
    id: 'inv_' + Date.now(),
    invoiceNumber: 'INV-001',
    date: today,
    dueDate: dueDate,
    poNumber: '',
    currency: 'INR',
    template: 'professional', // 'minimal' | 'professional' | 'modern'
    brandColor: '#4F46E5',
    
    // Business / Seller
    seller: {
      name: '',
      logo: '',
      email: '',
      phone: '',
      address: '',
      gstin: '',
      pan: '',
      website: ''
    },
    
    // Customer
    customer: {
      name: '',
      email: '',
      phone: '',
      address: '',
      shippingAddress: '',
      sameAsBilling: true,
      gstin: '',
      pan: ''
    },
    
    // Items
    items: [
      {
        id: 'item_1',
        description: 'Web Design & UI Consulting',
        hsn: '998314',
        quantity: 1,
        unit: 'hrs',
        rate: 5000,
        discount: 0,
        discountType: 'percentage'
      }
    ],
    
    // Discounts & Taxes
    discount: {
      type: 'percentage',
      value: 0
    },
    taxMode: 'gst-intra', // 'none' | 'single' | 'gst-intra' | 'gst-inter'
    singleTaxRate: 18,
    gstDetails: {
      placeOfSupply: '29-Karnataka',
      reverseCharge: false,
      gstRate: 18
    },
    shippingFee: 0,
    autoRoundOff: false,
    amountPaid: 0,
    
    // Bank & UPI
    bankDetails: {
      bankName: '',
      accountName: '',
      accountNumber: '',
      ifsc: '',
      swift: '',
      upiId: '',
      showQr: true,
      customQrImage: ''
    },
    
    // Notes & Signature
    notes: 'Thank you for your business! Please make payments before the due date.',
    terms: '1. Goods/Services once billed will not be refunded.\n2. Overdue interest @ 1.5% per month will apply if payment exceeds due date.',
    signature: '',
    signatureName: ''
  };
}

/**
 * Pre-filled sample invoices for quick testing and onboarding
 */
export const SAMPLE_INVOICES = {
  gst_consulting: {
    id: 'sample_gst_1',
    invoiceNumber: 'INV-2026-089',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    poNumber: 'PO-99234',
    currency: 'INR',
    template: 'professional',
    brandColor: '#4F46E5',
    seller: {
      name: 'Apex Digital Solutions Pvt Ltd',
      logo: '',
      email: 'billing@apexsolutions.in',
      phone: '+91 98765 43210',
      address: 'Suite 402, Tech Park, Indiranagar\nBengaluru, Karnataka 560038, India',
      gstin: '29AABCA1234F1Z5',
      pan: 'AABCA1234F',
      website: 'https://apexsolutions.in'
    },
    customer: {
      name: 'Nova Innovations LLP',
      email: 'finance@novainnovations.com',
      phone: '+91 80 4123 9988',
      address: 'Level 3, Global Gateway Towers\nKoramangala, Bengaluru 560034',
      shippingAddress: '',
      sameAsBilling: true,
      gstin: '29BBBCB5678G1Z2',
      pan: 'BBBCB5678G'
    },
    items: [
      {
        id: 'sample_item_1',
        description: 'Full-Stack Web Application Development (Phase 2)',
        hsn: '998314',
        quantity: 1,
        unit: 'Milestone',
        rate: 85000,
        discount: 5000,
        discountType: 'fixed'
      },
      {
        id: 'sample_item_2',
        description: 'Cloud Infrastructure & High-Availability Server Setup',
        hsn: '998315',
        quantity: 20,
        unit: 'Hours',
        rate: 2500,
        discount: 0,
        discountType: 'percentage'
      },
      {
        id: 'sample_item_3',
        description: 'API Integration & Security Audit',
        hsn: '998313',
        quantity: 1,
        unit: 'Package',
        rate: 35000,
        discount: 0,
        discountType: 'percentage'
      }
    ],
    discount: {
      type: 'percentage',
      value: 5
    },
    taxMode: 'gst-intra',
    singleTaxRate: 18,
    gstDetails: {
      placeOfSupply: '29-Karnataka',
      reverseCharge: false,
      gstRate: 18
    },
    shippingFee: 0,
    autoRoundOff: true,
    amountPaid: 0,
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountName: 'Apex Digital Solutions Pvt Ltd',
      accountNumber: '50200049283719',
      ifsc: 'HDFC0000240',
      swift: 'HDFCINBB',
      upiId: 'apexsolutions@hdfcbank',
      showQr: true
    },
    notes: 'Payment is due within 14 days of invoice issue. We accept NEFT/RTGS, IMPS, or direct UPI scan.',
    terms: '1. Standard warranty period on software deliverables is 90 days.\n2. All intellectual property transfers upon receipt of full payment.',
    signature: '',
    signatureName: 'Authorized Signatory'
  },
  
  freelancer_modern: {
    id: 'sample_freelance_1',
    invoiceNumber: 'INV-042',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    poNumber: 'CLIENT-781',
    currency: 'USD',
    template: 'modern',
    brandColor: '#059669',
    seller: {
      name: 'Sarah Jenkins Design',
      logo: '',
      email: 'sarah@jenkinsdesign.studio',
      phone: '+1 (415) 890-2341',
      address: '742 Evergreen Terrace\nSan Francisco, CA 94107, USA',
      gstin: '',
      pan: '',
      website: 'jenkinsdesign.studio'
    },
    customer: {
      name: 'VentureCraft Studios Inc.',
      email: 'accounting@venturecraft.io',
      phone: '+1 (650) 441-2090',
      address: '500 Howard Street, Suite 900\nSan Francisco, CA 94105',
      shippingAddress: '',
      sameAsBilling: true,
      gstin: '',
      pan: ''
    },
    items: [
      {
        id: 'sample_item_f1',
        description: 'Brand Identity & Design System Kit (Figma)',
        hsn: '',
        quantity: 1,
        unit: 'Project',
        rate: 3200,
        discount: 0,
        discountType: 'percentage'
      },
      {
        id: 'sample_item_f2',
        description: 'Interactive Web Prototype & Animations',
        hsn: '',
        quantity: 18,
        unit: 'Hours',
        rate: 120,
        discount: 0,
        discountType: 'percentage'
      }
    ],
    discount: {
      type: 'fixed',
      value: 200
    },
    taxMode: 'single',
    singleTaxRate: 8.5,
    gstDetails: {
      placeOfSupply: '',
      reverseCharge: false,
      gstRate: 0
    },
    shippingFee: 0,
    autoRoundOff: false,
    amountPaid: 1500,
    bankDetails: {
      bankName: 'Silicon Valley Bank / First Citizens',
      accountName: 'Sarah Jenkins',
      accountNumber: '9928374821',
      ifsc: '',
      swift: 'SVBKUS6S',
      upiId: '',
      showQr: false
    },
    notes: 'Deposit of $1,500 has been credited. Remaining balance is due upon final asset delivery.',
    terms: 'Payment via ACH transfer or Stripe wire transfer.',
    signature: '',
    signatureName: 'Sarah Jenkins'
  },
  
  minimal_eur: {
    id: 'sample_minimal_1',
    invoiceNumber: 'EUR-2026-104',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    poNumber: 'DE-44120',
    currency: 'EUR',
    template: 'minimal',
    brandColor: '#2563EB',
    seller: {
      name: 'Nordic Cloud Consulting Oy',
      logo: '',
      email: 'invoicing@nordiccloud.fi',
      phone: '+358 40 1234567',
      address: 'Mannerheimintie 14 B\n00100 Helsinki, Finland',
      gstin: 'FI28472910',
      pan: '',
      website: 'nordiccloud.fi'
    },
    customer: {
      name: 'Berlin Mobility Solutions GmbH',
      email: 'rechnungen@berlinmobility.de',
      phone: '+49 30 9876543',
      address: 'Friedrichstraße 176\n10117 Berlin, Germany',
      shippingAddress: '',
      sameAsBilling: true,
      gstin: 'DE391827461',
      pan: ''
    },
    items: [
      {
        id: 'sample_m1',
        description: 'Kubernetes Cluster Migration & Architecture Review',
        hsn: '',
        quantity: 40,
        unit: 'Hours',
        rate: 135,
        discount: 0,
        discountType: 'percentage'
      },
      {
        id: 'sample_m2',
        description: 'Continuous Integration & GitOps Automation',
        hsn: '',
        quantity: 1,
        unit: 'Sprint',
        rate: 2200,
        discount: 0,
        discountType: 'percentage'
      }
    ],
    discount: {
      type: 'percentage',
      value: 0
    },
    taxMode: 'none',
    singleTaxRate: 0,
    gstDetails: {
      placeOfSupply: '',
      reverseCharge: false,
      gstRate: 0
    },
    shippingFee: 0,
    autoRoundOff: false,
    amountPaid: 0,
    bankDetails: {
      bankName: 'Nordea Bank Abp',
      accountName: 'Nordic Cloud Consulting Oy',
      accountNumber: 'FI42 1234 5678 9012 34',
      ifsc: '',
      swift: 'NDEAFIHH',
      upiId: '',
      showQr: false
    },
    notes: 'Reverse charge mechanism applies according to Article 196 of Council Directive 2006/112/EC.',
    terms: 'Payment terms: 30 days net from invoice date.',
    signature: '',
    signatureName: 'Kari Lindqvist'
  }
};
