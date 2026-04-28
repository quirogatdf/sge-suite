import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PDFDocument } from 'pdf-lib';
import {
  PageRemoverFile,
  PageThumbnail,
  RemoveResult,
  PageRemoverProgress,
} from '../models/pdf-page-remover.types';

// PDF.js types
interface WindowPdfjsLib {
  getDocument: (options: { data: Uint8Array }) => {
    promise: Promise<{
      numPages: number;
      getPage: (pageNumber: number) => Promise<{
        getViewport: (options: { scale: number }) => { width: number; height: number };
        render: (options: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
        }) => { promise: Promise<void> };
      }>;
      destroy: () => void;
    }>;
  };
  GlobalWorkerOptions: { workerSrc: string };
}

declare const window: Window & { pdfjsLib?: WindowPdfjsLib };

const THUMBNAIL_SCALE = 0.5;
const MAX_PAGES_LIMIT = 100;

@Injectable({
  providedIn: 'root',
})
export class PdfPageRemoverService {
  private platformId = inject(PLATFORM_ID);
  private progress = signal<PageRemoverProgress>({ status: 'idle', percent: 0 });
  private pdfjsDoc: ReturnType<WindowPdfjsLib['getDocument']> | null = null;
  private thumbnailCache = new Map<number, string>();

  readonly state = this.progress.asReadonly();

  async loadAndRenderThumbnails(file: PageRemoverFile): Promise<PageThumbnail[]> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Solo funciona en navegador');
    }

    const pdfjs = window.pdfjsLib;
    if (!pdfjs) {
      throw new Error('PDF.js no está cargado');
    }

    this.progress.set({
      status: 'loading-thumbs',
      percent: 0,
      currentThumb: 'Iniciando...',
    });

    try {
      // Crear copia independiente del buffer
      const bufferCopy = new Uint8Array(file.buffer).slice();
      const loadingTask = pdfjs.getDocument({ data: bufferCopy });
      const pdfDoc = await loadingTask.promise;
      this.pdfjsDoc = loadingTask;

      const numPages = pdfDoc.numPages;

      if (numPages > MAX_PAGES_LIMIT) {
        throw new Error(
          `El PDF tiene ${numPages} páginas. Máximo ${MAX_PAGES_LIMIT}.`,
        );
      }

      const thumbnails: PageThumbnail[] = [];

      // Renderizar miniaturas progresivamente
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });

        // Canvas temporal
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('No se pudo crear contexto de canvas');
        }

        // Fondo blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
        });

        await renderTask.promise;

        const dataUrl = canvas.toDataURL('image/png');
        this.thumbnailCache.set(i, dataUrl);

        thumbnails.push({
          pageIndex: i - 1, // 0-based para pdf-lib
          pageNumber: i, // 1-based para mostrar
          dataUrl,
        });

        canvas.width = 0;
        canvas.height = 0;

        const percent = Math.floor((i / numPages) * 50);
        this.progress.set({
          status: 'loading-thumbs',
          percent,
          currentThumb: `Página ${i} de ${numPages}`,
        });
      }

      this.progress.set({ status: 'ready', percent: 100 });

      return thumbnails;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar miniaturas';
      this.progress.set({
        status: 'error',
        percent: 0,
        error: message,
      });
      throw error;
    }
  }

  async removePages(
    file: PageRemoverFile,
    pagesToRemove: number[],
  ): Promise<RemoveResult> {
    if (pagesToRemove.length === 0) {
      throw new Error('Seleccioná al menos una página para eliminar');
    }

    this.progress.set({
      status: 'processing',
      percent: 0,
      currentThumb: 'Procesando...',
    });

    try {
      // Crear copia independiente
      const bufferCopy = new Uint8Array(file.buffer).slice();
      const pdfDoc = await PDFDocument.load(bufferCopy);
      const originalPages = pdfDoc.getPageCount();

      if (pagesToRemove.length >= originalPages) {
        throw new Error('No podés eliminar todas las páginas');
      }

      // Ordenar descendente para no alterar índices al eliminar
      const sortedPages = [...pagesToRemove].sort((a, b) => b - a);

      for (const pageIndex of sortedPages) {
        pdfDoc.removePage(pageIndex);
      }

      this.progress.set({
        status: 'processing',
        percent: 80,
        currentThumb: 'Guardando...',
      });

      const resultBuffer = await pdfDoc.save({ useObjectStreams: true });
      const finalPages = originalPages - pagesToRemove.length;

      const filename = this.getFilename(file.name, pagesToRemove);

      this.progress.set({ status: 'completed', percent: 100 });

      return {
        buffer: resultBuffer,
        filename,
        originalPages,
        removedPages: pagesToRemove.length,
        finalPages,
        finalSize: resultBuffer.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al eliminar páginas';
      this.progress.set({
        status: 'error',
        percent: 0,
        error: message,
      });
      throw error;
    }
  }

  downloadResult(result: RemoveResult): void {
    const arrayBuffer = result.buffer.buffer.slice(
      result.buffer.byteOffset,
      result.buffer.byteOffset + result.buffer.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  }

  reset(): void {
    this.progress.set({ status: 'idle', percent: 0 });
    this.thumbnailCache.clear();
  }

  private getFilename(originalName: string, removedPages: number[]): string {
    const baseName = originalName.replace(/\.pdf$/i, '');
    const timestamp = new Date().toISOString().slice(0, 10);
    const pagesStr = removedPages.join('-');
    return `${baseName}_sin-paginas-${pagesStr}_${timestamp}.pdf`;
  }
}