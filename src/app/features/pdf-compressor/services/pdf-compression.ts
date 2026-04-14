import { Injectable, signal } from '@angular/core';
import {
  PdfFile,
  CompressionResult,
  CompressionProgress,
  CompressionError,
  CompressionLevel,
  COMPRESSION_PRESETS,
  CompressionState,
} from '../models/pdf-compression.types';

import loadGhostscript from '@okathira/ghostpdl-wasm';

@Injectable({
  providedIn: 'root',
})
export class PdfCompressionService {
  private gsModule: any = null;
  private gsLoading = false;
  private state = signal<CompressionState>({ status: 'idle' });

  readonly compressionState = this.state.asReadonly();

  async compress(file: PdfFile, level: CompressionLevel): Promise<void> {
    const preset = COMPRESSION_PRESETS[level];

    this.state.set({
      status: 'compressing',
      progress: { percent: 0, stage: 'reading' },
    });

    try {
      // Load Ghostscript if needed
      if (!this.gsModule) {
        this.state.set({
          status: 'compressing',
          progress: { percent: 5, stage: 'reading' },
        });
        await this.loadGhostscript();
      }

      this.state.set({
        status: 'compressing',
        progress: { percent: 20, stage: 'reading' },
      });

      // Write file to virtual filesystem
      this.gsModule.FS.writeFile('input.pdf', new Uint8Array(file.buffer));

      this.state.set({
        status: 'compressing',
        progress: { percent: 40, stage: 'compressing' },
      });

      // Run compression with setTimeout to not block UI
      await new Promise((resolve) => setTimeout(resolve, 50));

      const args = [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        '-dPDFSETTINGS=' + preset,
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        '-sOutputFile=output.pdf',
        'input.pdf',
      ];

      this.gsModule.callMain(args);

      this.state.set({
        status: 'compressing',
        progress: { percent: 80, stage: 'writing' },
      });

      // Read output
      await new Promise((resolve) => setTimeout(resolve, 50));
      const outputBuffer = this.gsModule.FS.readFile('output.pdf', { encoding: 'binary' });

      // Cleanup
      try {
        this.gsModule.FS.unlink('input.pdf');
        this.gsModule.FS.unlink('output.pdf');
      } catch (e) {
        // Ignore cleanup errors
      }

      this.state.set({
        status: 'compressing',
        progress: { percent: 100, stage: 'writing' },
      });

      const result: CompressionResult = {
        originalSize: file.size,
        compressedSize: outputBuffer.length,
        outputBuffer,
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

  private async loadGhostscript(): Promise<void> {
    if (this.gsModule) return;
    if (this.gsLoading) {
      while (this.gsLoading) {
        await new Promise((r) => setTimeout(r, 100));
        if (this.gsModule) return;
      }
      return;
    }

    this.gsLoading = true;

    try {
      // Load Ghostscript WASM module with explicit WASM path
      // The package's default loader expects wasm next to js, so we provide the locateFile option
      this.gsModule = await loadGhostscript({
        locateFile: (fileName: string) => {
          if (fileName.endsWith('.wasm')) {
            return '/gs-wasm/gs.wasm';
          }
          return fileName;
        },
      });

      this.gsLoading = false;
      console.log('Ghostscript loaded successfully');
    } catch (e) {
      this.gsLoading = false;
      console.error('Ghostscript load error:', e);
      throw new Error('No se pudo cargar Ghostscript');
    }
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
