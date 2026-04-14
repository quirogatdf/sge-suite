import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  PdfFile,
  CompressionResult,
  CompressionProgress,
  CompressionError,
  CompressionLevel,
  CompressionState,
} from '../models/pdf-compression.types';

// PDF.js types - simplified
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

    try {
      // Get PDF.js from window (loaded from CDN)
      const pdfjs = window.pdfjsLib;
      if (!pdfjs) {
        throw new Error('PDF.js no está cargado');
      }

      // Load PDF
      const pdfDoc = await pdfjs.getDocument({
        data: new Uint8Array(file.buffer),
      });

      this.state.set({
        status: 'compressing',
        progress: { percent: 10, stage: 'reading' },
      });

      // Get compression settings
      const scale = this.getScale(level);

      // Recompress by rendering pages to images
      const compressedData = await this.recompressPdf(pdfDoc, scale, level);

      this.state.set({
        status: 'compressing',
        progress: { percent: 100, stage: 'writing' },
      });

      const result: CompressionResult = {
        originalSize: file.size,
        compressedSize: compressedData.length,
        outputBuffer: compressedData,
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

  private async recompressPdf(
    pdfDoc: any,
    scale: number,
    level: CompressionLevel,
  ): Promise<Uint8Array> {
    const numPages = pdfDoc.numPages;
    const pageImages: ImageData[] = [];

    // Render each page to canvas
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: scale * 1.5 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      });

      pageImages.push(context.getImageData(0, 0, canvas.width, canvas.height));

      this.state.set({
        status: 'compressing',
        progress: { percent: 10 + Math.floor((i / numPages) * 60), stage: 'compressing' },
      });
    }

    // Return data from first page as placeholder
    // Full implementation would create new PDF from images using pdf-lib
    const firstPage = pageImages[0];
    if (!firstPage) {
      throw new Error('No pages to compress');
    }

    return new Uint8Array(firstPage.data.buffer);
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
