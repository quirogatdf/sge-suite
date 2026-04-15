import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropZoneComponent } from './components/drop-zone';
import { CompressionSelectorComponent } from './components/compression-selector';
import { ProgressIndicatorComponent } from './components/progress-indicator';
import { ResultCardComponent } from './components/result-card';
import { PdfCompressionService } from './services/pdf-compression';
import { FileService } from './services/file';
import {
  PdfFile,
  CompressionLevel,
  CompressionProgress,
  CompressionResult,
  CompressionError,
} from './models/pdf-compression.types';

@Component({
  selector: 'app-pdf-compressor',
  imports: [
    CommonModule,
    DropZoneComponent,
    CompressionSelectorComponent,
    ProgressIndicatorComponent,
    ResultCardComponent,
  ],
  template: `
    <div class="page">
      <div class="header">
        <h1>Comprimir PDF</h1>
        <p class="subtitle">
          Reducí el tamaño de tus archivos PDF de forma segura.
          <strong>Tu archivo nunca sale de tu computadora.</strong>
        </p>
      </div>

      <div class="content">
        @if (isIdle()) {
          <div class="upload-section">
            <app-drop-zone (fileChange)="onFileSelected($event)" />

            @if (file()) {
              <div class="compress-action">
                <app-compression-selector
                  [level]="selectedLevel()"
                  (levelChange)="onLevelSelected($event)"
                />
                <button
                  class="compress-btn"
                  [disabled]="compressing()"
                  (click)="startCompression()"
                >
                  @if (compressing()) {
                    <span class="spinner"></span>
                    Comprimiendo...
                  } @else {
                    Comprimir archivo
                  }
                </button>
              </div>
            }
          </div>
        }

        @if (isCompressing()) {
          <app-progress-indicator [progress]="compressionProgress()!" />
        }

        @if (isCompleted()) {
          <app-result-card
            [result]="compressionResult()!"
            (downloadClick)="downloadResult()"
            (reset)="reset()"
          />
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
            <p class="error-title">Error al comprimir</p>
            <p class="error-message">{{ compressionError()!.message }}</p>
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

      .upload-section {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .compress-action {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .compress-btn {
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
        transition:
          background 0.15s,
          opacity 0.15s;
      }

      .compress-btn:hover:not(:disabled) {
        background: var(--color-primary-hover);
      }

      .compress-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .spinner {
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid var(--color-gray-100);
        border-top-color: var(--color-gray-200);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
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
        color: var(--color-text-secondary);
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
export class PdfCompressorPage {
  private readonly pdfService = inject(PdfCompressionService);
  private readonly fileService = inject(FileService);

  protected readonly file = signal<PdfFile | null>(null);
  protected readonly selectedLevel = signal<CompressionLevel>('recommended');
  protected readonly compressing = signal(false);

  // Type guards for template
  protected readonly isIdle = computed(() => this.pdfService.compressionState().status === 'idle');
  protected readonly isCompressing = computed(
    () => this.pdfService.compressionState().status === 'compressing',
  );
  protected readonly isCompleted = computed(
    () => this.pdfService.compressionState().status === 'completed',
  );
  protected readonly isError = computed(
    () => this.pdfService.compressionState().status === 'error',
  );

  // Narrowed values
  protected readonly compressionProgress = computed(() => {
    const s = this.pdfService.compressionState();
    return s.status === 'compressing' ? s.progress : null;
  });

  protected readonly compressionResult = computed(() => {
    const s = this.pdfService.compressionState();
    return s.status === 'completed' ? s.result : null;
  });

  protected readonly compressionError = computed(() => {
    const s = this.pdfService.compressionState();
    return s.status === 'error' ? s.error : null;
  });

  onFileSelected(file: PdfFile): void {
    this.file.set(file);
  }

  onLevelSelected(level: CompressionLevel): void {
    this.selectedLevel.set(level);
  }

  async startCompression(): Promise<void> {
    const f = this.file();
    if (!f) return;

    this.compressing.set(true);

    try {
      await this.pdfService.compress(f, this.selectedLevel());
      const state = this.pdfService.compressionState();
      if (state.status === 'completed') {
        const filename = this.fileService.getCompressedFilename(f.name);
        this.pdfService.setCompressionResult(f.size, filename);
      }
    } catch (e) {
      console.error('Compression failed:', e);
    } finally {
      this.compressing.set(false);
    }
  }

  downloadResult(): void {
    const result = this.compressionResult();
    if (result) {
      this.fileService.downloadCompressed(result);
    }
  }

  reset(): void {
    this.file.set(null);
    this.pdfService.reset();
  }
}
