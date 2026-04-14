import { Component, signal, output } from '@angular/core';
import { PdfFile, MAX_FILE_SIZE } from '../models/pdf-compression.types';

@Component({
  selector: 'app-drop-zone',
  template: `
    <div
      class="drop-zone"
      [class.dragover]="isDragover()"
      [class.has-file]="!!getFile()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <input #fileInput type="file" accept=".pdf" (change)="onFileSelect($event)" hidden />

      @if (getFile()) {
        <div class="file-info">
          <svg
            class="file-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <div class="file-details">
            <span class="file-name">{{ getFile()!.name }}</span>
            <span class="file-size">{{ formatSize(getFile()!.size) }}</span>
          </div>
          <button type="button" class="remove-btn" (click)="removeFile($event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      } @else {
        <div class="drop-content">
          <svg
            class="upload-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p class="drop-text">Arrastrá tu PDF aquí</p>
          <p class="drop-subtext">o hacé click para seleccionar</p>
          <p class="drop-hint">Máximo 100MB</p>
        </div>
      }

      @if (error()) {
        <p class="error-message">{{ error() }}</p>
      }
    </div>
  `,
  styles: [
    `
      .drop-zone {
        border: 2px dashed #d4d4d4;
        border-radius: 0.75rem;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition:
          border-color 0.15s,
          background 0.15s;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .drop-zone:hover,
      .drop-zone.dragover {
        border-color: #ff6600;
        background: #fafafa;
      }

      .drop-zone.has-file {
        border-style: solid;
        border-color: #a3a3a3;
        background: #f5f5f5;
      }

      .drop-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .upload-icon {
        width: 3rem;
        height: 3rem;
        color: #a3a3a3;
        margin-bottom: 0.5rem;
      }

      .drop-text {
        font-size: 1.125rem;
        font-weight: 500;
        color: #666666;
        margin: 0;
      }

      .drop-subtext {
        font-size: 0.875rem;
        color: #737373;
        margin: 0;
      }

      .drop-hint {
        font-size: 0.75rem;
        color: #a3a3a3;
        margin: 0.5rem 0 0;
      }

      .file-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
        text-align: left;
      }

      .file-icon {
        width: 2.5rem;
        height: 2.5rem;
        color: #ff6600;
        flex-shrink: 0;
      }

      .file-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0;
      }

      .file-name {
        font-weight: 500;
        color: #666666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-size {
        font-size: 0.875rem;
        color: #737373;
      }

      .remove-btn {
        width: 2rem;
        height: 2rem;
        padding: 0.25rem;
        background: transparent;
        border: none;
        border-radius: 0.25rem;
        color: #737373;
        cursor: pointer;
        transition:
          background 0.15s,
          color 0.15s;
      }

      .remove-btn:hover {
        background: #e5e5e5;
        color: #666666;
      }

      .error-message {
        color: #ff6600;
        font-size: 0.875rem;
        margin: 1rem 0 0;
      }
    `,
  ],
})
export class DropZoneComponent {
  readonly fileChange = output<PdfFile>();

  protected readonly fileState = signal<PdfFile | null>(null);
  protected readonly isDragover = signal(false);
  protected readonly error = signal<string | null>(null);

  protected getFile(): PdfFile | null {
    return this.fileState();
  }

  private setFile(file: PdfFile): void {
    this.fileState.set(file);
    this.fileChange.emit(file);
    this.error.set(null);
  }

  private setError(message: string): void {
    this.error.set(message);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  protected onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  protected removeFile(event: Event): void {
    event.stopPropagation();
    this.fileState.set(null);
  }

  private processFile(file: File): void {
    this.error.set(null);

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.setError('Solo se aceptan archivos PDF');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.setError(`El archivo supera el límite de 100MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        this.setFile({
          name: file.name,
          size: file.size,
          buffer: reader.result,
        });
      }
    };
    reader.onerror = () => {
      this.setError('Error al leer el archivo');
    };
    reader.readAsArrayBuffer(file);
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
