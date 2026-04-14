import { Component, input, output, model } from '@angular/core';
import {
  CompressionLevel,
  COMPRESSION_LABELS,
  COMPRESSION_DESCRIPTIONS,
} from '../models/pdf-compression.types';

@Component({
  selector: 'app-compression-selector',
  template: `
    <div class="selector">
      <label class="label">Nivel de compresión</label>
      <div class="options">
        @for (l of levels; track l) {
          <button
            type="button"
            class="option"
            [class.selected]="level() === l"
            (click)="selectLevel(l)"
          >
            <span class="option-label">{{ labels[l] }}</span>
            <span class="option-desc">{{ descriptions[l] }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .selector {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #666666;
      }

      .options {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .option {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 1rem 1.25rem;
        background: #f5f5f5;
        border: 2px solid #d4d4d4;
        border-radius: 0.5rem;
        cursor: pointer;
        text-align: left;
        transition:
          border-color 0.15s,
          background 0.15s;
      }

      .option:hover {
        border-color: #a3a3a3;
      }

      .option.selected {
        border-color: #ff6600;
        background: #ffffff;
      }

      .option-label {
        font-weight: 500;
        color: #666666;
      }

      .option-desc {
        font-size: 0.8125rem;
        color: #737373;
      }
    `,
  ],
})
export class CompressionSelectorComponent {
  readonly level = model<CompressionLevel>('recommended');

  readonly levels: CompressionLevel[] = ['maximum', 'recommended', 'low'];
  readonly labels = COMPRESSION_LABELS;
  readonly descriptions = COMPRESSION_DESCRIPTIONS;

  protected selectLevel(level: CompressionLevel): void {
    this.level.set(level);
  }
}
