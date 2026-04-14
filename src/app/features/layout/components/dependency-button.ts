import { Component, Input } from '@angular/core';

export interface Dependency {
  title: string;
  subtitle: string;
  icon?: string;
  route?: string;
}

@Component({
  selector: 'app-dependency-button',
  standalone: true,
  template: `
    <a [href]="dependency.route || '#'" class="dependency-button">
      @if (dependency.icon) {
        <span class="dependency-icon" [innerHTML]="dependency.icon"></span>
      }
      <div class="dependency-content">
        <span class="dependency-title">{{ dependency.title }}</span>
        <span class="dependency-subtitle">{{ dependency.subtitle }}</span>
      </div>
    </a>
  `,
  styles: [
    `
      /* ========================================
       Botón de Secretaría
       Manual de Marca Gubernamental
       ======================================== */

      .dependency-button {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.25rem;
        background-color: transparent;
        border: 1px solid #e5e5e5;
        border-radius: 0.5rem;
        text-decoration: none;
        transition: all 0.2s ease;
        width: 100%;
        max-width: 400px;
      }

      .dependency-button:hover {
        background-color: #f5f5f5;
        border-color: #ff6600;
      }

      .dependency-icon {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ff6600;
      }

      .dependency-icon :global(svg) {
        width: 100%;
        height: 100%;
      }

      .dependency-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        text-align: left;
      }

      .dependency-title {
        font-size: 1rem;
        font-weight: 700;
        color: #666666;
        letter-spacing: -0.025em;
      }

      .dependency-subtitle {
        font-size: 0.875rem;
        font-weight: 400;
        color: #666666;
        letter-spacing: -0.025em;
      }

      /* ----------------------------------------
       Responsive
       ---------------------------------------- */
      @media (max-width: 640px) {
        .dependency-button {
          padding: 0.875rem 1rem;
        }

        .dependency-icon {
          width: 24px;
          height: 24px;
        }

        .dependency-title {
          font-size: 0.875rem;
        }

        .dependency-subtitle {
          font-size: 0.75rem;
        }
      }
    `,
  ],
})
export class DependencyButtonComponent {
  @Input({ required: true }) dependency!: Dependency;
}
