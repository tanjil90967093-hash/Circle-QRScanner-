/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';
import { ScannedPage } from './imageProcessing';

export interface PDFExportOptions {
  title: string;
  pageSize: 'a4' | 'letter' | 'fit';
  orientation: 'portrait' | 'landscape' | 'auto';
  quality: number; // 0.7 to 1.0
  addPageNumbers: boolean;
}

export async function exportToPDF(
  pages: ScannedPage[],
  options: PDFExportOptions
): Promise<void> {
  if (pages.length === 0) return;

  const orientation = options.orientation === 'landscape' ? 'l' : 'p';
  const format = options.pageSize === 'fit' ? 'a4' : options.pageSize;

  const pdf = new jsPDF({
    orientation: orientation as any,
    unit: 'mm',
    format: format,
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const dataUrl = page.processedDataUrl || page.originalDataUrl;

    if (i > 0) {
      pdf.addPage(format, orientation as any);
    }

    // Load image to determine native dimensions
    const img = await loadImage(dataUrl);
    const imgAspect = img.width / img.height;

    const margin = 10; // mm
    const maxW = pageWidth - margin * 2;
    const maxH = pageHeight - margin * 2 - (options.addPageNumbers ? 8 : 0);

    let renderW = maxW;
    let renderH = maxW / imgAspect;

    if (renderH > maxH) {
      renderH = maxH;
      renderW = maxH * imgAspect;
    }

    const posX = margin + (maxW - renderW) / 2;
    const posY = margin + (maxH - renderH) / 2;

    pdf.addImage(dataUrl, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');

    if (options.addPageNumbers) {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        `${i + 1} / ${pages.length}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }
  }

  // Sanitize title for download
  const cleanTitle = (options.title || 'Scanned_Document')
    .replace(/[^\w\s\u0980-\u09FF-]/g, '')
    .trim()
    .replace(/\s+/g, '_');

  pdf.save(`${cleanTitle}.pdf`);

  // Trigger celebration confetti
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  } catch {
    // Ignore confetti issues
  }
}

export function downloadImage(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
