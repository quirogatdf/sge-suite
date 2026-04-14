import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PDFDocument } from 'pdf-lib';
import {
  PdfFile,
  CompressionResult,
  CompressionProgress,
  CompressionError,
  CompressionLevel,
  CompressionState,
} from '../models/pdf-compression.types';

// PDF.js types
interface WindowPdfjsLib {
  getDocument: (options: { data: Uint8Array }) => any;
  GlobalWorkerOptions: { workerSrc: string };
  version: string;
}

declare const window: Window & { pdfjsLib?: WindowPdfjsLib };

@Injectable({
  providedIn: 'root',
})
export class PdfCompressionService {
  private platformId = inject(PLATFORM_ID);
  private state = signal<CompressionState>({ status: 'idle' });

  readonly compressionState = this.state.asReadonly();

  async compress(file: PdfFile, level: CompressionLevel): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.state.set({
        status: 'error',
        error: {
          type: 'ProcessingError',
          message: 'Compression solo funciona en navegador',
        },
      });
      return;
    }

    this.state.set({
      status: 'compressing',
      progress: { percent: 0, stage: 'reading' },
    });

    const startTime = Date.now();

    try {
      // Get PDF.js from window (loaded from CDN)
      const pdfjs = window.pdfjsLib;
      if (!pdfjs) {
        throw new Error('PDF.js no está cargado');
      }

      // Get compression settings
      const { scale } = this.getCompressionSettings(level);

      // Load PDF with PDF.js
      const pdfDoc = await pdfjs.getDocument({
        data: new Uint8Array(file.buffer),
      });

      const numPages = pdfDoc.numPages;

      this.state.set({
        status: 'compressing',
        progress: { percent: 5, stage: 'reading' },
      });

      // Create new PDF with pdf-lib
      const newPdfDoc = await PDFDocument.create();

      // Process each page
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: scale });

        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d')!;

        // Fill with white background (important!)
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Render page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        });

        // Convert canvas to PNG (more reliable than JPEG)
        const imageData = canvas.toDataURL('image/png');
        const base64Data = imageData.split(',')[1];
        const pngBytes = this.base64ToUint8Array(base64Data);

        // Embed PNG in new PDF
        const pngImage = await newPdfDoc.embedPng(pngBytes);

        // Add page with same dimensions (pdf-lib uses points, 72 dpi)
        // Convert pixels to points (1 pixel = 1 point)
        const pageWidth = viewport.width;
        const pageHeight = viewport.height;

        const newPage = newPdfDoc.addPage([pageWidth, pageHeight]);

        // Draw image (pdf-lib origin is bottom-left, need to flip)
        newPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });

        // Update progress
        const progress = 10 + Math.floor((i / numPages) * 80);
        this.state.set({
          status: 'compressing',
          progress: { percent: progress, stage: 'compressing' },
        });
      }

      // Save compressed PDF
      this.state.set({
        status: 'compressing',
        progress: { percent: 95, stage: 'writing' },
      });

      const compressedPdfBytes = await newPdfDoc.save();

      const result: CompressionResult = {
        originalSize: file.size,
        compressedSize: compressedPdfBytes.length,
        outputBuffer: compressedPdfBytes,
        filename: '',
      };

      const elapsed = Date.now() - startTime;
      console.log(`PDF compressión completada en ${elapsed}ms`);

      this.state.set({ status: 'completed', result });
    } catch (error) {
      this.state.set({
        status: 'error',
        error: {
          type: 'ProcessingError',
          message: error instanceof Error ? error.message : 'Error al comprimir',
        },
      });
    }
  }

  private getCompressionSettings(level: CompressionLevel): { scale: number } {
    switch (level) {
      case 'maximum':
        return { scale: 0.75 };
      case 'recommended':
        return { scale: 1.0 };
      case 'low':
        return { scale: 1.5 };
      default:
        return { scale: 1.0 };
    }
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  reset(): void {
    this.state.set({ status: 'idle' });
  }

  setCompressionResult(originalSize: number, filename: string): void {
    const current = this.state();
    if (current.status === 'completed') {
      this.state.set({
        status: 'completed',
        result: {
          ...current.result,
          originalSize,
          filename,
        },
      });
    }
  }
}
