import { Component, input, output } from '@angular/core';
import { CompressionResult } from '../models/pdf-compression.types';

@Component({
  selector: 'app-result-card',
  template: `
    <div class="result">
      <div class="result-header">
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
        <span class="result-title">¡Archivo comprimido!</span>
      </div>

      <div class="result-stats">
        <div class="stat">
          <span class="stat-label">Original</span>
          <span class="stat-value">{{ formatSize(result().originalSize) }}</span>
        </div>
        <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
        <div class="stat">
          <span class="stat-label">Comprimido</span>
          <span class="stat-value compressed">{{ formatSize(result().compressedSize) }}</span>
        </div>
      </div>

      <div class="result-reduction">
        <span class="reduction-badge"> -{{ getReductionPercent() }}% </span>
        <span class="reduction-label">reducción</span>
      </div>

      <button class="download-btn" (click)="doDownload()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Descargar PDF
      </button>

      <button class="reset-btn" (click)="reset.emit()">Comprimir otro archivo</button>
    </div>
  `,
  styles: [
    `
      .result {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        padding: 2rem;
        background: #f5f5f5;
        border: 1px solid #d4d4d4;
        border-radius: 0.75rem;
      }

      .result-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .success-icon {
        width: 2rem;
        height: 2rem;
        color: #ff6600;
      }

      .result-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #666666;
      }

      .result-stats {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .stat-label {
        font-size: 0.75rem;
        color: #737373;
      }

      .stat-value {
        font-size: 1.125rem;
        font-weight: 600;
        color: #666666;
      }

      .stat-value.compressed {
        color: #ff6600;
      }

      .arrow {
        width: 1.5rem;
        height: 1.5rem;
        color: #a3a3a3;
      }

      .result-reduction {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .reduction-badge {
        font-size: 1.5rem;
        font-weight: 700;
        color: #ff6600;
      }

      .reduction-label {
        font-size: 0.875rem;
        color: #737373;
      }

      .download-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: #ff6600;
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        color: #ffffff;
        cursor: pointer;
        transition: background 0.15s;
        margin-top: 0.5rem;
      }

      .download-btn:hover {
        background: #e55c00;
      }

      .download-btn svg {
        width: 1.25rem;
        height: 1.25rem;
      }

      .reset-btn {
        background: transparent;
        border: none;
        font-size: 0.875rem;
        color: #737373;
        cursor: pointer;
        text-decoration: underline;
      }

      .reset-btn:hover {
        color: #666666;
      }
    `,
  ],
})
export class ResultCardComponent {
  readonly result = input.required<CompressionResult>();
  readonly downloadClick = output<void>();
  readonly reset = output<void>();

  protected getReductionPercent(): number {
    const orig = this.result().originalSize;
    const comp = this.result().compressedSize;
    if (orig === 0) return 0;
    return Math.round(((orig - comp) / orig) * 100);
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  protected doDownload(): void {
    this.downloadClick.emit();
  }
}
