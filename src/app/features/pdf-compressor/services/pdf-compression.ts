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

    const startTime = Date.now();

    try {
      const pdfjs = window.pdfjsLib;
      if (!pdfjs) {
        throw new Error('PDF.js no está cargado');
      }

      this.state.set({
        status: 'compressing',
        progress: { percent: 5, stage: 'reading' },
      });

      // Load PDF with PDF.js - use promise wrapper
      const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(file.buffer) });

      const numPages = pdfDoc.numPages;
      console.log(`PDF loaded: ${numPages} páginas`);

      // Get scale based on compression level
      const scale = this.getScale(level);
      console.log(`Scale: ${scale}`);

      // Create new PDF
      const newPdfDoc = await PDFDocument.create();

      // Process each page
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewportOriginal = page.getViewport({ scale: 1 });

        // Render at compressed scale
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
        await page.render({
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        console.log(`Page ${i}: rendered ${canvas.width}x${canvas.height}`);

        // Convert to JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
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

      // Save
      const compressedPdfBytes = await newPdfDoc.save({
        useObjectStreams: true,
      });

      console.log(`Compresión completada: ${file.size} -> ${compressedPdfBytes.length} bytes`);

      const result: CompressionResult = {
        originalSize: file.size,
        compressedSize: compressedPdfBytes.length,
        outputBuffer: compressedPdfBytes,
        filename: '',
      };

      this.state.set({ status: 'completed', result });
    } catch (error) {
      console.error('Error:', error);
      this.state.set({
        status: 'error',
        error: {
          type: 'ProcessingError',
          message: error instanceof Error ? error.message : 'Error al comprimir',
        },
      });
    }
  }

  private getScale(level: CompressionLevel): number {
    switch (level) {
      case 'maximum':
        return 0.5;
      case 'recommended':
        return 1.0;
      case 'low':
        return 1.5;
      default:
        return 1.0;
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
