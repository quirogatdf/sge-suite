import { Component, signal, inject } from '@angular/core';
import { MergeDropZoneComponent } from '../pdf-merger/components/drop-zone';
import { PdfPageRemoverService } from './services/pdf-page-remover';
import { PageThumbnail, RemoveResult, MAX_FILE_SIZE_MB } from './models/pdf-page-remover.types';
import { MergeFileInput } from '../pdf-merger/models/pdf-merger.types';
import { formatSize } from '../../shared/utils/format-size';

interface DropZoneFile {
  id: string;
  name: string;
  size: number;
  buffer: File;
}

@Component({
  selector: 'app-pdf-page-remover',
  imports: [MergeDropZoneComponent],
  template: `
    <div class="page">
      <div class="header">
        <h1>Eliminar Páginas</h1>
        <p class="subtitle">
          Selecciona y elimina las páginas que no necesites de tu PDF.
          <strong>Tu archivo nunca sale de tu computadora.</strong>
        </p>
      </div>

      <div class="content">
        @if (isIdle()) {
          <app-merge-drop-zone
            [maxFiles]="1"
            [maxSizeMB]="MAX_FILE_SIZE_MB"
            (filesChange)="onFilesChange($event)"
          />
        }

        @if (isLoadingThumbs()) {
          <div class="progress-card">
            <div class="progress-header">
              <span class="progress-label">Cargando miniaturas...</span>
              <span class="progress-percent">{{ progress().percent }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progress().percent"></div>
            </div>
            @if (progress().currentThumb) {
              <p class="progress-file">{{ progress().currentThumb }}</p>
            }
          </div>
        }

        @if (isReady()) {
          <div class="thumbnails-header">
            <div class="thumbnails-info">
              <span class="thumbnails-count">{{ thumbnails().length }} páginas</span>
              <span class="selected-count">
                {{ selectedPages().length }} seleccionada{{
                  selectedPages().length === 1 ? '' : 's'
                }}
              </span>
            </div>
            <button
              class="remove-btn"
              [disabled]="selectedPages().length === 0 || removing()"
              (click)="removePages()"
            >
              @if (removing()) {
                <span class="spinner"></span>
                Eliminando...
              } @else {
                Eliminar {{ selectedPages().length }} página{{
                  selectedPages().length === 1 ? '' : 's'
                }}
              }
            </button>
          </div>

          <div class="thumbnails-grid">
            @for (thumb of thumbnails(); track thumb.pageIndex) {
              <div
                class="thumbnail-item"
                [class.selected]="isSelected(thumb.pageIndex)"
                (click)="togglePage(thumb.pageIndex)"
              >
                <div class="thumbnail-image">
                  <img [src]="thumb.dataUrl" [alt]="'Página ' + thumb.pageNumber" />
                  <div class="thumbnail-checkbox">
                    <input
                      type="checkbox"
                      [checked]="isSelected(thumb.pageIndex)"
                      (click)="$event.stopPropagation()"
                      (change)="togglePage(thumb.pageIndex)"
                    />
                  </div>
                </div>
                <div class="thumbnail-number">{{ thumb.pageNumber }}</div>
              </div>
            }
          </div>

          <button class="reset-btn" (click)="reset()">Elegir otro archivo</button>
        }

        @if (isProcessing()) {
          <div class="progress-card">
            <div class="progress-header">
              <span class="progress-label">Eliminando páginas...</span>
              <span class="progress-percent">{{ progress().percent }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progress().percent"></div>
            </div>
            @if (progress().currentThumb) {
              <p class="progress-file">{{ progress().currentThumb }}</p>
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
            <span class="result-title">¡Páginas eliminadas!</span>

            <div class="result-stats">
              <div class="stat">
                <span class="stat-label">Páginas eliminadas</span>
                <span class="stat-value">{{ result()!.removedPages }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Páginas finales</span>
                <span class="stat-value">{{ result()!.finalPages }}</span>
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

            <button class="reset-btn" (click)="reset()">Procesar otro archivo</button>
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
            <p class="error-title">Error</p>
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
        max-width: 800px;
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

      /* Thumbnails Grid */
      .thumbnails-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .thumbnails-info {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .thumbnails-count {
        font-size: 0.875rem;
        color: var(--color-gray-500);
      }

      .selected-count {
        font-size: 0.875rem;
        color: var(--color-primary);
        font-weight: 600;
      }

      .remove-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: var(--color-primary);
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-white);
        cursor: pointer;
        transition: background 0.15s;
      }

      .remove-btn:hover:not(:disabled) {
        background: var(--color-primary-hover);
      }

      .remove-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .thumbnails-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 1rem;
      }

      .thumbnail-item {
        cursor: pointer;
        transition: transform 0.15s;
      }

      .thumbnail-item:hover {
        transform: scale(1.02);
      }

      .thumbnail-item.selected .thumbnail-image {
        outline: 3px solid var(--color-primary);
      }

      .thumbnail-image {
        position: relative;
        background: var(--color-white);
        border: 2px solid var(--color-gray-300);
        border-radius: 0.5rem;
        overflow: hidden;
        aspect-ratio: 8.5 / 11;
      }

      .thumbnail-image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .thumbnail-checkbox {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 1.5rem;
        height: 1.5rem;
        background: var(--color-white);
        border: 2px solid var(--color-gray-300);
        border-radius: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .thumbnail-checkbox input {
        width: 1rem;
        height: 1rem;
        cursor: pointer;
      }

      .thumbnail-number {
        text-align: center;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-secondary);
        margin-top: 0.5rem;
      }

      /* Progress Card */
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

      /* Result Card */
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
        flex-wrap: wrap;
        justify-content: center;
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

      /* Error Card */
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

      .reset-btn {
        background: transparent;
        border: none;
        font-size: 0.875rem;
        color: var(--color-gray-500);
        cursor: pointer;
        text-decoration: underline;
        align-self: center;
      }

      .reset-btn:hover {
        color: var(--color-text-secondary);
      }

      .spinner {
        width: 1rem;
        height: 1rem;
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
    `,
  ],
})
export class PdfPageRemoverPage {
  private readonly service = inject(PdfPageRemoverService);

  protected readonly MAX_FILE_SIZE_MB = MAX_FILE_SIZE_MB;
  protected readonly formatSize = formatSize;

  protected readonly thumbnails = signal<PageThumbnail[]>([]);
  protected readonly selectedPages = signal<number[]>([]);
  protected readonly removing = signal(false);
  protected readonly result = signal<RemoveResult | null>(null);
  protected readonly errorMessage = signal<string>('');
  protected readonly currentFile = signal<{
    id: string;
    name: string;
    size: number;
    buffer: File;
  } | null>(null);

  protected readonly progress = this.service.state;

  // Type guards
  protected isIdle = () => this.progress().status === 'idle' && this.thumbnails().length === 0;
  protected isLoadingThumbs = () => this.progress().status === 'loading-thumbs';
  protected isReady = () => this.progress().status === 'ready';
  protected isProcessing = () => this.progress().status === 'processing';
  protected isCompleted = () => this.progress().status === 'completed' || this.result() !== null;
  protected isError = () => this.progress().status === 'error';

  protected onFilesChange(files: MergeFileInput[]): void {
    if (files.length === 0) return;

    const file = files[0];
    this.currentFile.set({ id: file.id, name: file.name, size: file.size, buffer: file.buffer });

    // Load and render thumbnails
    this.loadThumbnails(file);
  }

  private async loadThumbnails(file: MergeFileInput): Promise<void> {
    try {
      const buffer = await file.buffer.arrayBuffer();
      const thumbnails = await this.service.loadAndRenderThumbnails({
        id: file.id,
        name: file.name,
        size: file.size,
        buffer,
      });
      this.thumbnails.set(thumbnails);
      this.selectedPages.set([]);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Error al cargar el archivo');
    }
  }

  protected togglePage(pageIndex: number): void {
    const current = this.selectedPages();
    const isSelected = current.includes(pageIndex);

    if (isSelected) {
      this.selectedPages.set(current.filter((p) => p !== pageIndex));
    } else {
      this.selectedPages.set([...current, pageIndex]);
    }
  }

  protected isSelected(pageIndex: number): boolean {
    return this.selectedPages().includes(pageIndex);
  }

  protected async removePages(): Promise<void> {
    const file = this.currentFile();
    const pagesToRemove = this.selectedPages();

    if (!file || pagesToRemove.length === 0) return;

    this.removing.set(true);

    try {
      const buffer = await file.buffer.arrayBuffer();
      const result = await this.service.removePages(
        {
          id: file.id,
          name: file.name,
          size: file.size,
          buffer,
        },
        pagesToRemove,
      );
      this.result.set(result);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : 'Error al eliminar páginas');
    } finally {
      this.removing.set(false);
    }
  }

  protected downloadResult(): void {
    const r = this.result();
    if (r) {
      this.service.downloadResult(r);
    }
  }

  protected reset(): void {
    this.thumbnails.set([]);
    this.selectedPages.set([]);
    this.result.set(null);
    this.errorMessage.set('');
    this.currentFile.set(null);
    this.service.reset();
  }
}

