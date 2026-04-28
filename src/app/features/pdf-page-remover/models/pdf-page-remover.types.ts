/**
 * PDF Page Remover Feature Types
 */

export interface PageRemoverFile {
  id: string;
  name: string;
  size: number;
  buffer: ArrayBuffer;
}

export interface PageRemoverDoc {
  pdfjsDoc: unknown; // pdfjs-document PDFDocument
  numPages: number;
}

export interface PageThumbnail {
  pageIndex: number;
  pageNumber: number; // 1-based para mostrar
  dataUrl: string;
}

export interface RemoveResult {
  buffer: Uint8Array;
  filename: string;
  originalPages: number;
  removedPages: number;
  finalPages: number;
  finalSize: number;
}

export interface PageRemoverProgress {
  status: 'idle' | 'loading-thumbs' | 'ready' | 'processing' | 'completed' | 'error';
  percent: number;
  currentThumb?: string;
  error?: string;
}

export const MAX_FILE_SIZE_MB = 100;