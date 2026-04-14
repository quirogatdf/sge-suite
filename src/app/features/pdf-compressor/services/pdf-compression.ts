import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PDFDocument } from 'pdf-lib';
import {
  PdfFile,
  CompressionResult,
  CompressionLevel,
  CompressionState,
} from '../models/pdf-compression.types';

// PDF.js types
interface WindowPdfjsLib {
  getDocument: (options: { data: Uint8Array }) => any;
  GlobalWorkerOptions: { workerSrc: string };
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

    try {
      const pdfjs = window.pdfjsLib;
      if (!pdfjs) {
        throw new Error('PDF.js no está cargado');
      }

      this.state.set({
        status: 'compressing',
        progress: { percent: 5, stage: 'reading' },
      });

      // Get compression settings
      const { scale, quality } = this.getCompressionSettings(level);

      // Load PDF with PDF.js
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(file.buffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      this.state.set({
        status: 'compressing',
        progress: { percent: 10, stage: 'reading' },
      });

      // Create new PDF
      const newPdfDoc = await PDFDocument.create();

      // Process each page
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);

        // Render at compression scale
        const viewport = page.getViewport({ scale: scale });

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          throw new Error('No se pudo crear contexto de canvas');
        }

        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render page
        const renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        });
        await renderTask.promise;

        // Convert to JPEG with compression quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        const jpgBytes = this.base64ToUint8Array(base64);

        // Embed in new PDF
        const jpg = await newPdfDoc.embedJpg(jpgBytes);
        const pageWidth = viewport.width;
        const pageHeight = viewport.height;
        const newPage = newPdfDoc.addPage([pageWidth, pageHeight]);
        newPage.drawImage(jpg, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });

        const progress = 10 + Math.floor((i / numPages) * 80);
        this.state.set({
          status: 'compressing',
          progress: { percent: progress, stage: 'compressing' },
        });
      }

      // Save with object streams
      const compressedPdfBytes = await newPdfDoc.save({
        useObjectStreams: true,
      });

      const result: CompressionResult = {
        originalSize: file.size,
        compressedSize: compressedPdfBytes.length,
        outputBuffer: compressedPdfBytes,
        filename: '',
      };

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

  private getCompressionSettings(level: CompressionLevel): { scale: number; quality: number } {
    switch (level) {
      case 'maximum':
        return { scale: 0.5, quality: 0.5 };
      case 'recommended':
        return { scale: 0.75, quality: 0.6 };
      case 'low':
        return { scale: 1.5, quality: 0.85 };
      default:
        return { scale: 0.75, quality: 0.6 };
    }
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
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
