import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";
import { COURIER_STICKER_DIMENSIONS } from "@/schemas/courier-sticker";

export interface GenerateCourierStickersPdfOptions {
  containerElement: HTMLElement;
  filename?: string;
}

/**
 * Generates a multi-page thermal courier sticker PDF where each sticker is exactly 1 page of 2" width x 3" height.
 * Rendered at 300 DPI high-definition quality.
 */
export async function generateAndDownloadCourierStickersPdf({
  containerElement,
  filename = "Courier-Barcode-Stickers.pdf",
}: GenerateCourierStickersPdfOptions): Promise<boolean> {
  try {
    if (document.fonts) {
      await document.fonts.ready;
    }

    const { widthMm, heightMm } = COURIER_STICKER_DIMENSIONS;
    const stickerElements = Array.from(
      containerElement.querySelectorAll("[data-courier-sticker]"),
    ) as HTMLElement[];

    if (stickerElements.length === 0) {
      return false;
    }

    // Initialize jsPDF with portrait 2in x 3in dimensions (50.8mm x 76.2mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [widthMm, heightMm],
      compress: true,
    });

    for (let idx = 0; idx < stickerElements.length; idx++) {
      const el = stickerElements[idx];

      const imgData = await toJpeg(el, {
        quality: 0.98,
        pixelRatio: 3.0, // 300 DPI high definition
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      if (idx > 0) {
        pdf.addPage([widthMm, heightMm]);
      }

      pdf.addImage(imgData, "JPEG", 0, 0, widthMm, heightMm, undefined, "FAST");
    }

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error("[CourierStickers.PdfGeneration.Error]:", error);
    return false;
  }
}

/**
 * Sends courier stickers to the thermal printer via an isolated iframe with exact 2" x 3" roll dimensions.
 */
export async function printThermalCourierStickers({
  containerElement,
}: {
  containerElement: HTMLElement;
}) {
  try {
    const stickerElements = Array.from(
      containerElement.querySelectorAll("[data-courier-sticker]"),
    ) as HTMLElement[];

    if (stickerElements.length === 0) {
      window.print();
      return;
    }

    if (document.fonts) {
      await document.fonts.ready;
    }

    // Capture all stickers as 300 DPI high-definition JPEG images
    const images: string[] = [];
    for (const el of stickerElements) {
      const img = await toJpeg(el, {
        quality: 0.98,
        pixelRatio: 3.0,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });
      images.push(img);
    }

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

    const imgTags = images
      .map(
        (src) =>
          `<div class="sticker-page"><img src="${src}" alt="Courier Barcode Sticker" /></div>`,
      )
      .join("\n");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Courier Barcode Stickers (2" x 3")</title>
          <style>
            @page {
              size: 2in 3in;
              margin: 0in;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .sticker-page {
                width: 2in !important;
                height: 3in !important;
                page-break-after: always !important;
                page-break-inside: avoid !important;
                break-after: page !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
              }
              img {
                width: 2in !important;
                height: 3in !important;
                object-fit: contain !important;
                display: block !important;
                image-rendering: -webkit-optimize-contrast !important;
                image-rendering: crisp-edges !important;
              }
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
            }
            .sticker-page {
              width: 2in;
              height: 3in;
              margin-bottom: 2mm;
            }
            img {
              width: 100%;
              height: 100%;
              display: block;
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
            }
          </style>
        </head>
        <body>
          ${imgTags}
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
      }, 3000);
    };

    setTimeout(triggerPrint, 300);
  } catch (err) {
    console.error("[CourierStickers.Print.Error]:", err);
    window.print();
  }
}
