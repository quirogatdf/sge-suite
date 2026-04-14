import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PDFDocument } from 'pdf-lib';
import {
  PdfFile,
  CompressionResult,
  CompressionLevel,
  CompressionState,
} from '../models/pdf-compression.types';

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
      // Load existing PDF
      const pdfDoc = await PDFDocument.load(new Uint8Array(file.buffer));

      this.state.set({
        status: 'compressing',
        progress: { percent: 30, stage: 'compressing' },
      });

      // Save with compression options
      // - useObjectStreams: true - pack multiple objects into streams (30-50% smaller)
      // - addDefaultPage: false - don't duplicate pages
      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: level === 'maximum',
        addDefaultPage: false,
      });

      const elapsed = Date.now() - startTime;
      console.log(
        `PDF compressión completada en ${elapsed}ms (${file.size} -> ${compressedPdfBytes.length})`,
      );

      this.state.set({
        status: 'compressing',
        progress: { percent: 100, stage: 'writing' },
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
