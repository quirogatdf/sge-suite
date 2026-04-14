import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tools',
  imports: [RouterLink],
  template: `
    <div class="tools-page">
      <h1>Herramientas</h1>
      <div class="tools-grid">
        <a routerLink="/comprimir-pdf" class="tool-item">
          <span class="tool-name">Comprimir PDF</span>
          <span class="tool-desc">Reduce el tamaño de archivos PDF</span>
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      .tools-page {
        max-width: 1024px;
        margin: 0 auto;
        padding: 3rem 1.5rem;
      }
      h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 2rem;
        color: #666666;
      }
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }
      .tool-item {
        background: #f5f5f5;
        border: 1px solid #d4d4d4;
        border-radius: 0.5rem;
        padding: 1.5rem;
        text-decoration: none;
        color: inherit;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        transition: border-color 0.15s;
      }
      .tool-item:hover {
        border-color: #a3a3a3;
      }
      .tool-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: #666666;
      }
      .tool-desc {
        font-size: 0.875rem;
        color: #737373;
      }
    `,
  ],
})
export class ToolsComponent {}
