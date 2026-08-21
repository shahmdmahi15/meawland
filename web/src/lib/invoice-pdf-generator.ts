import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";

export interface GenerateInvoicePdfOptions {
  element: HTMLElement;
  filename?: string;
  quality?: number;
}

/**
 * Captures high-DPI image snapshot of invoice DOM element.
 */
async function captureInvoiceImage(element: HTMLElement): Promise<string> {
  if (document.fonts) {
    await document.fonts.ready;
  }

  // 3.0 pixelRatio for ultra-high-resolution 300+ DPI print quality
  return await toJpeg(element, {
    quality: 1.0,
    pixelRatio: 3.0,
    backgroundColor: "#ffffff",
    cacheBust: true,
  });
}

/**
 * Converts a DOM element matching standard A4 dimensions into a high-resolution PDF and downloads it.
 * Uses native browser SVG foreignObject rendering via html-to-image to support modern CSS (oklch, lab, variables, SVG watermarks).
 */
export async function generateAndDownloadInvoicePdf({
  element,
  filename = "Invoice.pdf",
}: GenerateInvoicePdfOptions): Promise<boolean> {
  try {
    const imgData = await captureInvoiceImage(element);

    // Standard A4: 210mm x 297mm
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error("[Invoice.PdfGeneration.Error]:", error);
    return false;
  }
}

/**
 * Prints the invoice document cleanly using the exact same high-DPI rendering as the downloaded version.
 * Guarantees 100% visual parity with the downloaded PDF without modal artifacts, margin shifts, or browser font quirks.
 */
export async function printInvoiceDocument(element: HTMLElement) {
  try {
    const imgData = await captureInvoiceImage(element);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Sales Invoice</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                width: 100vw !important;
                height: 100vh !important;
                overflow: hidden !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              img {
                display: block !important;
                width: 210mm !important;
                height: 297mm !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                margin: 0 auto !important;
                object-fit: contain !important;
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
              }
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            img {
              width: 210mm;
              height: 297mm;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" alt="Sales Invoice" />
        </body>
      </html>
    `);
    doc.close();

    const triggerPrint = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2500);
    };

    const img = doc.querySelector("img");
    if (img && !img.complete) {
      img.onload = () => setTimeout(triggerPrint, 150);
    } else {
      setTimeout(triggerPrint, 200);
    }
  } catch (err) {
    console.error("[Invoice.Print.Error]:", err);
    window.print();
  }
}
