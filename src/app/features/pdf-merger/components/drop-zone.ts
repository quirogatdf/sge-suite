import { Component, signal, output } from '@angular/core';
import { MergeFileInput, MAX_MERGE_FILES, MAX_FILE_SIZE_MB } from '../models/pdf-merger.types';
import { formatSize } from '../../../shared/utils/format-size';

@Component({
  selector: 'app-merge-drop-zone',
  template: `
    <div
      class="drop-zone"
      [class.dragover]="isDragover()"
      [class.has-files]="files().length > 0"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <input #fileInput type="file" accept=".pdf" multiple (change)="onFileSelect($event)" hidden />

      @if (files().length === 0) {
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
          <p class="drop-text">Arrastrá tus PDFs aquí</p>
          <p class="drop-subtext">o hacé click para seleccionar</p>
          <p class="drop-hint">Máximo {{ maxFiles }} archivos, {{ maxSizeMB }}MB cada uno</p>
        </div>
      } @else {
        <div class="file-list">
          @for (file of files(); track file.id) {
            <div class="file-item">
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
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatSize(file.size) }}</span>
              </div>
              <button type="button" class="remove-btn" (click)="removeFile($event, file.id)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          }
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
        border: 2px dashed var(--color-gray-300);
        border-radius: 0.75rem;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition:
          border-color 0.15s,
          background 0.15s;
        min-height: 200px;
      }

      .drop-zone:hover,
      .drop-zone.dragover {
        border-color: var(--color-primary);
        background: var(--color-gray-50);
      }

      .drop-zone.has-files {
        border-style: solid;
        border-color: var(--color-gray-400);
        background: var(--color-gray-100);
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
        color: var(--color-gray-400);
        margin-bottom: 0.5rem;
      }

      .drop-text {
        font-size: 1.125rem;
        font-weight: 500;
        color: var(--color-text-secondary);
        margin: 0;
      }

      .drop-subtext {
        font-size: 0.875rem;
        color: var(--color-gray-500);
        margin: 0;
      }

      .drop-hint {
        font-size: 0.75rem;
        color: var(--color-gray-400);
        margin: 0.5rem 0 0;
      }

      .file-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        text-align: left;
        max-height: 300px;
        overflow-y: auto;
      }

      .file-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        background: var(--color-white);
        border: 1px solid var(--color-gray-300);
        border-radius: 0.5rem;
      }

      .file-icon {
        width: 2rem;
        height: 2rem;
        color: var(--color-primary);
        flex-shrink: 0;
      }

      .file-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-width: 0;
      }

      .file-name {
        font-weight: 500;
        color: var(--color-text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-size {
        font-size: 0.75rem;
        color: var(--color-gray-500);
      }

      .remove-btn {
        width: 1.75rem;
        height: 1.75rem;
        padding: 0.25rem;
        background: transparent;
        border: none;
        border-radius: 0.25rem;
        color: var(--color-gray-500);
        cursor: pointer;
        transition:
          background 0.15s,
          color 0.15s;
        flex-shrink: 0;
      }

      .remove-btn:hover {
        background: var(--color-gray-200);
        color: var(--color-text-secondary);
      }

      .error-message {
        color: var(--color-primary);
        font-size: 0.875rem;
        margin: 1rem 0 0;
      }
    `,
  ],
})
export class MergeDropZoneComponent {
  readonly filesChange = output<MergeFileInput[]>();

  protected readonly files = signal<MergeFileInput[]>([]);
  protected readonly isDragover = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly maxFiles = MAX_MERGE_FILES;
  protected readonly maxSizeMB = MAX_FILE_SIZE_MB;

  protected formatSize = formatSize;

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
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

    const dataTransfer = event.dataTransfer;
    if (dataTransfer?.files) {
      this.processFiles(Array.from(dataTransfer.files));
    }
  }

  protected onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
      input.value = '';
    }
  }

  protected removeFile(event: Event, id: string): void {
    event.stopPropagation();
    const currentFiles = this.files();
    const newFiles = currentFiles.filter((f) => f.id !== id);
    this.files.set(newFiles);
    this.filesChange.emit(newFiles);
  }

  private processFiles(fileList: File[]): void {
    this.error.set(null);

    const currentFiles = this.files();
    const remainingSlots = MAX_MERGE_FILES - currentFiles.length;

    if (remainingSlots <= 0) {
      this.error.set(`Máximo ${MAX_MERGE_FILES} archivos permitidos`);
      return;
    }

    const filesToAdd = fileList.slice(0, remainingSlots);
    const newFiles: MergeFileInput[] = [];

    for (const file of filesToAdd) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        this.error.set(`"${file.name}" no es un archivo PDF válido`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        this.error.set(`"${file.name}" supera el límite de ${MAX_FILE_SIZE_MB}MB`);
        continue;
      }

      const order = currentFiles.length + newFiles.length;
      newFiles.push({
        id: this.generateId(),
        name: file.name,
        size: file.size,
        buffer: file,
        order,
      });
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...currentFiles, ...newFiles];
      this.files.set(updatedFiles);
      this.filesChange.emit(updatedFiles);
    }
  }
}
