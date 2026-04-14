import { Component, input } from '@angular/core';
import { CompressionProgress } from '../models/pdf-compression.types';

@Component({
  selector: 'app-progress-indicator',
  template: `
    <div class="progress">
      <div class="progress-header">
        <span class="progress-label">{{ getStageLabel(progress().stage) }}</span>
        <span class="progress-percent">{{ progress().percent }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" [style.width.%]="progress().percent"></div>
      </div>
    </div>
  `,
  styles: [
    `
      .progress {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .progress-label {
        font-size: 0.875rem;
        color: #666666;
      }

      .progress-percent {
        font-size: 0.875rem;
        font-weight: 600;
        color: #666666;
      }

      .progress-bar {
        height: 0.5rem;
        background: #e5e5e5;
        border-radius: 0.25rem;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #ff6600, #e55c00);
        border-radius: 0.25rem;
        transition: width 0.3s ease-out;
      }
    `,
  ],
})
export class ProgressIndicatorComponent {
  readonly progress = input.required<CompressionProgress>();

  protected getStageLabel(stage: CompressionProgress['stage']): string {
    switch (stage) {
      case 'reading':
        return 'Leyendo archivo...';
      case 'compressing':
        return 'Comprimiendo...';
      case 'writing':
        return 'Guardando...';
    }
  }
}
