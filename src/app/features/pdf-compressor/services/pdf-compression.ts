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

// Límites de seguridad
const MAX_PAGES_LIMIT = 100;
const MAX_FILE_SIZE_MB = 100;

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

    // 📌 GUARDAR tamaño en variable simple ANTES de operaciones async
    // Esto evita el error "Buffer is already detached"
    const originalSize = file.size;
    const originalName = file.name;

    this.state.set({
      status: 'compressing',
      progress: { percent: 0, stage: 'reading' },
    });

    try {
      const pdfjs = window.pdfjsLib;
      if (!pdfjs) {
        throw new Error('PDF.js no está cargado');
      }

      // 📌 LIMITE DE TAMAÑO DE ARCHIVO
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`El archivo supera el límite de ${MAX_FILE_SIZE_MB}MB`);
      }

      // 📌 COPIA INDEPENDIENTE para cada operación
      // IMPORTANTE: PDF.js "desconecta" el buffer al transferirlo al worker
      // Por eso usamos .slice() para crear una copia independiente
      const bufferSimple = new Uint8Array(file.buffer).slice();
      const bufferRaster = new Uint8Array(file.buffer).slice();

      // First try simple compression (pdf-lib)
      this.state.set({
        status: 'compressing',
        progress: { percent: 5, stage: 'reading' },
      });

      const simpleCompressed = await this.compressSimple(bufferSimple);

      // 📌 Usar variable simple, no acceder a file.size después de async
      const reduction = (1 - simpleCompressed.length / originalSize) * 100;

      // If simple compression reduced enough (more than 5%), use it
      if (reduction > 5) {
        const result: CompressionResult = {
          originalSize,
          compressedSize: simpleCompressed.length,
          outputBuffer: simpleCompressed,
          filename: this.getCompressedFilename(originalName),
        };
        this.state.set({ status: 'completed', result });
        return;
      }

      this.state.set({
        status: 'compressing',
        progress: { percent: 10, stage: 'reading' },
      });

      const { scale, quality } = this.getCompressionSettings(level);

      // 📌 COPIA INDEPENDIENTE para PDF.js (evita detached buffer)
      const loadingTask = pdfjs.getDocument({ data: bufferRaster });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      // 📌 LIMITE DE PÁGINAS
      if (numPages > MAX_PAGES_LIMIT) {
        throw new Error(
          `El PDF tiene ${numPages} páginas. Máximo ${MAX_PAGES_LIMIT} para comprimir.`,
        );
      }

      this.state.set({
        status: 'compressing',
        progress: { percent: 10, stage: 'reading' },
      });

      const newPdfDoc = await PDFDocument.create();

      // 📌 PROCESAR PÁGINA POR PÁGINA con cleanup
      for (let i = 1; i <= numPages; i++) {
        try {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: scale });

          // 📌 Canvas temporal - se limpia después de usar
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            throw new Error('No se pudo crear contexto de canvas');
          }

          // Fondo blanco para PDFs que tienen fondo transparente
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

          // 📌 Cleanup de memoria - liberar recursos de esta página
          canvas.width = 0;
          canvas.height = 0;

          const progress = 10 + Math.floor((i / numPages) * 80);
          this.state.set({
            status: 'compressing',
            progress: { percent: progress, stage: 'compressing' },
          });
        } catch (pageError) {
          // Si una página falla, continuar con las demás
          console.warn(`Error en página ${i}:`, pageError);
          continue;
        }
      }

      // 📌 Cerrar el documento PDF.js para liberar memoria
      await pdfDoc.destroy();

      const rasterCompressed = await newPdfDoc.save({
        useObjectStreams: true,
      });

      // Choose smallest result
      let finalBuffer: Uint8Array;
      if (
        rasterCompressed.length < simpleCompressed.length &&
        rasterCompressed.length < originalSize
      ) {
        finalBuffer = rasterCompressed;
      } else if (simpleCompressed.length < originalSize) {
        finalBuffer = simpleCompressed;
      } else {
        finalBuffer = new Uint8Array(file.buffer);
      }

      const result: CompressionResult = {
        originalSize,
        compressedSize: finalBuffer.length,
        outputBuffer: finalBuffer,
        filename: this.getCompressedFilename(originalName),
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
    // 📌 IMPORTANTE: hacer copia para no afectar el buffer original
    const bufferCopy = new Uint8Array(buffer).slice();
    const pdfDoc = await PDFDocument.load(bufferCopy);
    return await pdfDoc.save({ useObjectStreams: true });
  }

  private getCompressionSettings(level: CompressionLevel): {
    scale: number;
    quality: number;
  } {
    switch (level) {
      case 'maximum':
        return { scale: 0.75, quality: 0.6 };
      case 'recommended':
        return { scale: 1.0, quality: 0.7 };
      case 'low':
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

  private getCompressedFilename(originalName: string): string {
    const baseName = originalName.replace(/\.pdf$/i, '');
    return `${baseName}_comprimido.pdf`;
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
