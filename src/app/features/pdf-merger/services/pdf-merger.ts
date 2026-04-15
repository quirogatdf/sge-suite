import { Injectable, signal } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { MergeFile, MergeResult, MergeProgress } from '../models/pdf-merger.types';

@Injectable({
  providedIn: 'root',
})
export class PdfMergerService {
  private progress = signal<MergeProgress>({ status: 'idle', percent: 0 });

  readonly mergeProgress = this.progress.asReadonly();

  async merge(files: MergeFile[]): Promise<MergeResult> {
    if (files.length < 2) {
      this.progress.set({
        status: 'error',
        percent: 0,
        error: 'Se necesitan al menos 2 archivos para combinar',
      });
      throw new Error('Se necesitan al menos 2 archivos para combinar');
    }

    this.progress.set({ status: 'merging', percent: 0, currentFile: files[0].name });

    try {
      // Create new PDF document
      const mergedPdf = await PDFDocument.create();

      // Sort files by order
      const sortedFiles = [...files].sort((a, b) => a.order - b.order);

      for (let i = 0; i < sortedFiles.length; i++) {
        const file = sortedFiles[i];

        this.progress.set({
          status: 'merging',
          percent: Math.floor((i / sortedFiles.length) * 80),
          currentFile: file.name,
        });

        // Load the source PDF
        const sourcePdf = await PDFDocument.load(file.buffer);

        // Copy all pages
        const pageIndices = sourcePdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);

        // Add pages to the merged document
        for (const page of copiedPages) {
          mergedPdf.addPage(page);
        }
      }

      this.progress.set({ status: 'merging', percent: 90, currentFile: 'Guardando...' });

      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save({ useObjectStreams: true });

      // Generate filename
      const filename = this.generateFilename(files[0].name);

      this.progress.set({ status: 'completed', percent: 100 });

      return {
        buffer: mergedPdfBytes,
        filename,
        originalCount: files.length,
        finalSize: mergedPdfBytes.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al combinar PDFs';
      this.progress.set({
        status: 'error',
        percent: 0,
        error: message,
      });
      throw error;
    }
  }

  private generateFilename(firstFileName: string): string {
    const baseName = firstFileName.replace(/\.pdf$/i, '');
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${baseName}_combinado_${timestamp}.pdf`;
  }

  reset(): void {
    this.progress.set({ status: 'idle', percent: 0 });
  }

  downloadResult(result: MergeResult): void {
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
}
