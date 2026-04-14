/**
 * PDF Compression Feature Types
 * Based on SDD Design #43
 */

export type CompressionPreset = '/screen' | '/ebook' | '/printer';

export type CompressionLevel = 'maximum' | 'recommended' | 'low';

export const COMPRESSION_PRESETS: Record<CompressionLevel, CompressionPreset> = {
  maximum: '/screen',
  recommended: '/ebook',
  low: '/printer',
} as const;

export const COMPRESSION_LABELS: Record<CompressionLevel, string> = {
  maximum: 'Máxima compresión',
  recommended: 'Recomendado',
  low: 'Baja compresión',
} as const;

export const COMPRESSION_DESCRIPTIONS: Record<CompressionLevel, string> = {
  maximum: '72 DPI - Menor calidad, archivo muy pequeño',
  recommended: '150 DPI - Balance calidad/tamaño',
  low: '300 DPI - Mejor calidad, archivo más grande',
} as const;

export interface PdfFile {
  name: string;
  size: number;
  buffer: ArrayBuffer;
}

export interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  outputBuffer: Uint8Array;
  filename: string;
}

export interface CompressionProgress {
  percent: number;
  stage: 'reading' | 'compressing' | 'writing';
}

export type CompressionErrorType = 'UserError' | 'ProcessingError' | 'ResourceError';

export interface CompressionError {
  type: CompressionErrorType;
  message: string;
}

export type CompressionState =
  | { status: 'idle' }
  | { status: 'ready'; file: PdfFile }
  | { status: 'compressing'; progress: CompressionProgress }
  | { status: 'completed'; result: CompressionResult }
  | { status: 'error'; error: CompressionError };

export interface WorkerRequest {
  action: 'compress';
  buffer: ArrayBuffer;
  preset: CompressionPreset;
  filename: string;
}

export interface WorkerProgress {
  action: 'progress';
  percent: number;
  stage: 'reading' | 'compressing' | 'writing';
}

export interface WorkerComplete {
  action: 'complete';
  buffer: Uint8Array;
}

export interface WorkerError {
  action: 'error';
  error: CompressionError;
}

export type WorkerResponse = WorkerProgress | WorkerComplete | WorkerError;

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
