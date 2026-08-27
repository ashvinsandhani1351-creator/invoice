# ⚡ invoicepdfgenerator — Free Online Bill & Invoice PDF Generator

> **Create a professional invoice in 60 seconds. No signup. No watermark. Free Single-Page A4 PDF.**

A lightweight, privacy-first, client-side web application for freelancers, independent contractors, consultants, and small businesses.

---

## 🌟 Key Highlights

- **100% Free & Zero Watermark**: Clean, publication-ready A4 PDF documents.
- **No Signup or Login Required**: Open the browser, fill details, and download.
- **Strict Single-Page A4 PDF Engine**: Vector rendering fitted to standard A4 (210mm × 297mm).
- **Single-Page Direct Browser Print**: `Ctrl+P` / `Cmd+P` with zero overflow onto page 2.
- **India GST Compliance**: Automatic CGST, SGST, IGST tax split, HSN/SAC codes, Place of Supply, Indian Lakhs/Crores Amount in Words.
- **Instant UPI QR Code**: Dynamic NPCI deep links embedded for instant mobile payments.
- **Global Multi-Currency Support**: USD, EUR, GBP, INR, CAD, AUD, AED, SGD, JPY, and more.
- **3 Responsive Templates**: Minimal Clean, Professional Business, and Modern Creative with custom brand color palette.
- **Digital Signature Pad**: HTML5 canvas signature drawing or PNG image upload.
- **100% Client-Side & Private**: All data stored locally in browser `localStorage`. No data sent to external servers.

---

## 🚀 Getting Started

Simply serve the directory with any static HTTP server:

```bash
cd /Users/ashvin/.gemini/antigravity/scratch/invoice-generator
python3 -m http.server 3000
```

Open **[http://localhost:3000](http://localhost:3000)** in your web browser.

---

## 📁 Project Architecture

```text
invoice-generator/
├── index.html                           # Main web app & SEO guide
├── freelancer-invoice-generator.html   # Freelancer SEO landing page
├── gst-invoice-generator.html          # India GST SEO landing page
├── invoice-generator-pdf.html          # PDF engine SEO landing page
├── free-invoice-generator-no-signup.html# No-signup SEO landing page
├── sitemap.xml                         # XML sitemap
├── robots.txt                          # Crawler rules
├── css/
│   └── styles.css                      # A4 layout, typography & print engine
└── js/
    ├── app.js                          # Main application controller
    ├── models/
    │   └── invoice.js                  # Data model & sample presets
    ├── engine/
    │   ├── calculator.js               # Deterministic financial math engine
    │   ├── number-to-words.js          # Indian & Western number to words
    │   └── validator.js                # Input & GSTIN/PAN regex validator
    ├── components/
    │   ├── editor.js                   # Progressive disclosure form editor
    │   ├── preview.js                  # Live synchronized preview
    │   └── signature-pad.js            # HTML5 digital signature canvas
    ├── templates/
    │   ├── index.js                    # Template coordinator
    │   ├── minimal.js                  # Minimal clean A4 template
    │   ├── professional.js             # Professional corporate A4 template
    │   └── modern.js                   # Modern creative A4 template
    ├── pdf/
    │   ├── pdf-generator.js            # High-DPI single A4 PDF exporter
    │   └── upi-qr.js                   # Dynamic UPI QR generator
    └── storage/
        ├── draft-store.js              # LocalStorage draft autosave
        └── history-store.js            # Offline invoice history & JSON backups
```
