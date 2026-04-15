import { Component, signal, inject } from '@angular/core';
import { MergeDropZoneComponent } from './components/drop-zone';
import { PdfMergerService } from './services/pdf-merger';
import { MergeFileInput, MergeResult, MAX_MERGE_FILES } from './models/pdf-merger.types';
import { formatSize } from '../../shared/utils/format-size';

@Component({
  selector: 'app-pdf-merger',
  imports: [MergeDropZoneComponent],
  template: `
    <div class="page">
      <div class="header">
        <h1>Combinar PDFs</h1>
        <p class="subtitle">
          Unite múltiples archivos PDF en uno solo.
          <strong>Tu archivo nunca sale de tu computadora.</strong>
        </p>
      </div>

      <div class="content">
        @if (isIdle()) {
          <app-merge-drop-zone (filesChange)="onFilesChange($event)" />

          @if (files().length >= 2) {
            <div class="files-section">
              <div class="files-header">
                <h2>Archivos seleccionados ({{ files().length }})</h2>
                <span class="hint">Arrastrá para reordenar</span>
              </div>

              <div class="file-list">
                @for (file of files(); track file.id; let i = $index) {
                  <div class="file-row">
                    <span class="file-order">{{ i + 1 }}</span>
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
                    <div class="file-actions">
                      <button
                        class="move-btn"
                        [disabled]="i === 0"
                        (click)="moveFileUp(i)"
                        title="Subir"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </button>
                      <button
                        class="move-btn"
                        [disabled]="i === files().length - 1"
                        (click)="moveFileDown(i)"
                        title="Bajar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>

            <button class="merge-btn" [disabled]="merging()" (click)="startMerge()">
              @if (merging()) {
                <span class="spinner"></span>
                Combinando...
              } @else {
                Combinar {{ files().length }} PDFs
              }
            </button>
          }

          @if (files().length > 0 && files().length < 2) {
            <p class="info-message">Necesitás al menos 2 archivos para combinar</p>
          }
        }

        @if (isMerging()) {
          <div class="progress-card">
            <div class="progress-header">
              <span class="progress-label">Combinando archivos...</span>
              <span class="progress-percent">{{ progress().percent }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progress().percent"></div>
            </div>
            @if (progress().currentFile) {
              <p class="progress-file">Procesando: {{ progress().currentFile }}</p>
            }
          </div>
        }

        @if (isCompleted()) {
          <div class="result-card">
            <svg
              class="success-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span class="result-title">¡PDFs combinados!</span>

            <div class="result-stats">
              <div class="stat">
                <span class="stat-label">Archivos</span>
                <span class="stat-value">{{ result()!.originalCount }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Tamaño final</span>
                <span class="stat-value">{{ formatSize(result()!.finalSize) }}</span>
              </div>
            </div>

            <button class="download-btn" (click)="downloadResult()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar PDF
            </button>

            <button class="reset-btn" (click)="reset()">Combinar más archivos</button>
          </div>
        }

        @if (isError()) {
          <div class="error-card">
            <svg
              class="error-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p class="error-title">Error al combinar</p>
            <p class="error-message">{{ errorMessage() }}</p>
            <button class="retry-btn" (click)="reset()">Intentar de nuevo</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        max-width: 640px;
        margin: 0 auto;
        padding: 3rem 1.5rem;
      }

      .header {
        text-align: center;
        margin-bottom: 2rem;
      }

      h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
        color: var(--color-text-secondary);
      }

      .subtitle {
        font-size: 1rem;
        color: var(--color-gray-500);
        margin: 0;
      }

      .subtitle strong {
        color: var(--color-primary);
      }

      .content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .files-section {
        background: var(--color-gray-100);
        border: 1px solid var(--color-gray-300);
        border-radius: 0.75rem;
        padding: 1.5rem;
      }

      .files-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .files-header h2 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-secondary);
        margin: 0;
      }

      .hint {
        font-size: 0.75rem;
        color: var(--color-gray-500);
      }

      .file-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .file-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: var(--color-white);
        border: 1px solid var(--color-gray-300);
        border-radius: 0.5rem;
      }

      .file-order {
        width: 1.5rem;
        height: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-primary);
        color: var(--color-white);
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 0.25rem;
        flex-shrink: 0;
      }

      .file-icon {
        width: 1.5rem;
        height: 1.5rem;
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

      .file-actions {
        display: flex;
        gap: 0.25rem;
      }

      .move-btn {
        width: 1.75rem;
        height: 1.75rem;
        padding: 0.25rem;
        background: transparent;
        border: 1px solid var(--color-gray-300);
        border-radius: 0.25rem;
        color: var(--color-gray-500);
        cursor: pointer;
        transition: all 0.15s;
      }

      .move-btn:hover:not(:disabled) {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      .move-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .merge-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem 1.5rem;
        background: var(--color-primary);
        border: none;
        border-radius: 0.5rem;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--color-white);
        cursor: pointer;
        transition: background 0.15s;
      }

      .merge-btn:hover:not(:disabled) {
        background: var(--color-primary-hover);
      }

      .merge-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .spinner {
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .info-message {
        text-align: center;
        color: var(--color-gray-500);
        font-size: 0.875rem;
        margin: 0;
      }

      .progress-card {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 2rem;
        background: var(--color-gray-100);
        border: 1px solid var(--color-gray-300);
        border-radius: 0.75rem;
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .progress-label {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }

      .progress-percent {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--color-text-secondary);
      }

      .progress-bar {
        height: 0.5rem;
        background: var(--color-gray-200);
        border-radius: 0.25rem;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
        border-radius: 0.25rem;
        transition: width 0.3s ease-out;
      }

      .progress-file {
        font-size: 0.75rem;
        color: var(--color-gray-500);
        margin: 0;
        text-align: center;
      }

      .result-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        padding: 2rem;
        background: var(--color-gray-100);
        border: 1px solid var(--color-gray-300);
        border-radius: 0.75rem;
      }

      .success-icon {
        width: 2.5rem;
        height: 2.5rem;
        color: var(--color-primary);
      }

      .result-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--color-text-secondary);
      }

      .result-stats {
        display: flex;
        gap: 2rem;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--color-gray-500);
      }

      .stat-value {
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-secondary);
      }

      .download-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: var(--color-primary);
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        color: var(--color-white);
        cursor: pointer;
        transition: background 0.15s;
      }

      .download-btn:hover {
        background: var(--color-primary-hover);
      }

      .download-btn svg {
        width: 1.25rem;
        height: 1.25rem;
      }

      .reset-btn {
        background: transparent;
        border: none;
        font-size: 0.875rem;
        color: var(--color-gray-500);
        cursor: pointer;
        text-decoration: underline;
      }

      .reset-btn:hover {
        color: var(--color-text-secondary);
      }

      .error-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
        background: var(--color-gray-100);
        border: 1px solid var(--color-gray-300);
        border-radius: 0.75rem;
        text-align: center;
      }

      .error-icon {
        width: 3rem;
        height: 3rem;
        color: var(--color-primary);
      }

      .error-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--color-text-secondary);
        margin: 0;
      }

      .error-message {
        font-size: 0.875rem;
        color: var(--color-gray-500);
        margin: 0;
      }

      .retry-btn {
        margin-top: 0.5rem;
        padding: 0.5rem 1rem;
        background: var(--color-white);
        border: 1px solid var(--color-gray-300);
        border-radius: 0.375rem;
        color: var(--color-text-secondary);
        cursor: pointer;
        transition: background 0.15s;
      }

      .retry-btn:hover {
        background: var(--color-gray-100);
      }
    `,
  ],
})
export class PdfMergerPage {
  private readonly mergerService = inject(PdfMergerService);

  protected readonly files = signal<MergeFileInput[]>([]);
  protected readonly merging = signal(false);
  protected readonly result = signal<MergeResult | null>(null);
  protected readonly errorMessage = signal<string>('');

  protected readonly progress = this.mergerService.mergeProgress;

  protected formatSize = formatSize;

  // Type guards
  protected isIdle = () => this.progress().status === 'idle' && !this.result();
  protected isMerging = () => this.progress().status === 'merging';
  protected isCompleted = () => this.progress().status === 'completed' || this.result() !== null;
  protected isError = () => this.progress().status === 'error';

  onFilesChange(files: MergeFileInput[]): void {
    this.files.set(files);
  }

  moveFileUp(index: number): void {
    if (index === 0) return;
    const currentFiles = [...this.files()];
    [currentFiles[index - 1], currentFiles[index]] = [currentFiles[index], currentFiles[index - 1]];
    this.updateFileOrders(currentFiles);
  }

  moveFileDown(index: number): void {
    const currentFiles = this.files();
    if (index === currentFiles.length - 1) return;
    const updatedFiles = [...currentFiles];
    [updatedFiles[index], updatedFiles[index + 1]] = [updatedFiles[index + 1], updatedFiles[index]];
    this.updateFileOrders(updatedFiles);
  }

  private updateFileOrders(files: MergeFileInput[]): void {
    const orderedFiles = files.map((f, i) => ({ ...f, order: i }));
    this.files.set(orderedFiles);
  }

  async startMerge(): Promise<void> {
    const fileList = this.files();
    if (fileList.length < 2) return;

    this.merging.set(true);

    try {
      // Convert File objects to ArrayBuffers
      const filesWithBuffers = await Promise.all(
        fileList.map(async (f) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          buffer: await f.buffer.arrayBuffer(),
          order: f.order,
        })),
      );

      const mergeResult = await this.mergerService.merge(filesWithBuffers);
      this.result.set(mergeResult);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Error al combinar');
    } finally {
      this.merging.set(false);
    }
  }

  downloadResult(): void {
    const r = this.result();
    if (r) {
      this.mergerService.downloadResult(r);
    }
  }

  reset(): void {
    this.files.set([]);
    this.result.set(null);
    this.errorMessage.set('');
    this.mergerService.reset();
  }
}
