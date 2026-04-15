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

      // Create buffer copies to avoid detachment
      const bufferForSimple = new Uint8Array(file.buffer);
      const bufferForRaster = new Uint8Array(file.buffer);

      // First try simple compression
      const simpleCompressed = await this.compressSimple(bufferForSimple);

      const reduction = (1 - simpleCompressed.length / file.size) * 100;

      // If simple compression reduced enough (more than 5%), use it
      if (reduction > 5) {
        const result: CompressionResult = {
          originalSize: file.size,
          compressedSize: simpleCompressed.length,
          outputBuffer: simpleCompressed,
          filename: '',
        };
        this.state.set({ status: 'completed', result });
        return;
      }

      this.state.set({
        status: 'compressing',
        progress: { percent: 5, stage: 'reading' },
      });

      const { scale, quality } = this.getCompressionSettings(level);

      // Load PDF with PDF.js
      const loadingTask = pdfjs.getDocument({ data: bufferForRaster });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      this.state.set({
        status: 'compressing',
        progress: { percent: 10, stage: 'reading' },
      });

      const newPdfDoc = await PDFDocument.create();

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          throw new Error('No se pudo crear contexto de canvas');
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        });
        await renderTask.promise;

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        const jpgBytes = this.base64ToUint8Array(base64);

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

      const rasterCompressed = await newPdfDoc.save({
        useObjectStreams: true,
      });

      // Choose smallest result
      let finalBuffer: Uint8Array;
      if (
        rasterCompressed.length < simpleCompressed.length &&
        rasterCompressed.length < file.size
      ) {
        finalBuffer = rasterCompressed;
      } else if (simpleCompressed.length < file.size) {
        finalBuffer = simpleCompressed;
      } else {
        finalBuffer = new Uint8Array(file.buffer);
      }

      const result: CompressionResult = {
        originalSize: file.size,
        compressedSize: finalBuffer.length,
        outputBuffer: finalBuffer,
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

  private async compressSimple(buffer: Uint8Array): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(buffer);
    return await pdfDoc.save({ useObjectStreams: true });
  }

  private getCompressionSettings(level: CompressionLevel): { scale: number; quality: number } {
    switch (level) {
      case 'maximum':
        // Always aggressive for scanned PDFs
        return { scale: 1.0, quality: 0.7 };
      case 'recommended':
        // If simple didn't work, use aggressive to force reduction
        return { scale: 1.0, quality: 0.7 };
      case 'low':
        // If simple didn't work, use moderate
        return { scale: 1.5, quality: 0.85 };
      default:
        return { scale: 1.0, quality: 0.7 };
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
