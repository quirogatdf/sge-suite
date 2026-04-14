import { Injectable } from '@angular/core';
import { PdfFile, CompressionResult } from '../models/pdf-compression.types';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  downloadCompressed(result: CompressionResult): void {
    const buffer = result.outputBuffer.buffer as ArrayBuffer;
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  }

  getCompressedFilename(originalName: string): string {
    const baseName = originalName.replace(/\.pdf$/i, '');
    return `${baseName}_comprimido.pdf`;
  }
}
