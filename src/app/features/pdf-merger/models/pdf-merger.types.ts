/**
 * PDF Merger Feature Types
 */

export interface MergeFile {
  id: string;
  name: string;
  size: number;
  buffer: ArrayBuffer;
  order: number;
}

export interface MergeFileInput {
  id: string;
  name: string;
  size: number;
  buffer: File;
  order: number;
}

export interface MergeResult {
  buffer: Uint8Array;
  filename: string;
  originalCount: number;
  finalSize: number;
}

export interface MergeProgress {
  status: 'idle' | 'merging' | 'completed' | 'error';
  percent: number;
  currentFile?: string;
  error?: string;
}

export interface MergeError {
  type: 'ValidationError' | 'ProcessingError' | 'ResourceError';
  message: string;
}

export const MAX_MERGE_FILES = 20;
export const MAX_FILE_SIZE_MB = 100;
