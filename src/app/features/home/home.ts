import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <div class="home">
      <section class="hero">
        <h1 class="title">Bienvenido/a a la suite PDF</h1>
        <p class="subtitle">
          Procesa tus documentos de forma segura. Todos los archivos se procesan 100% en tu
          computadora.
        </p>
      </section>

      <section class="tools">
        <a routerLink="/comprimir-pdf" class="tool-card">
          <div class="tool-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <h2 class="tool-title">Comprimir PDF</h2>
          <p class="tool-description">Reduce el tamaño de tus archivos PDF mantendo la calidad</p>
        </a>
      </section>
    </div>
  `,
  styles: [
    `
      .home {
        max-width: 1024px;
        margin: 0 auto;
        padding: 3rem 1.5rem;
      }

      .hero {
        text-align: center;
        margin-bottom: 4rem;
      }

      .title {
        font-size: 2.5rem;
        font-weight: 700;
        color: #666666;
        margin: 0 0 1rem;
        line-height: 1.2;
      }

      .subtitle {
        font-size: 1.125rem;
        color: #737373;
        margin: 0;
        max-width: 48ch;
        margin: 0 auto;
      }

      .tools {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
      }

      .tool-card {
        background: #f5f5f5;
        border: 1px solid #d4d4d4;
        border-radius: 0.75rem;
        padding: 2rem;
        text-decoration: none;
        color: inherit;
        transition:
          border-color 0.15s,
          transform 0.15s;
      }

      .tool-card:hover {
        border-color: #a3a3a3;
        transform: translateY(-2px);
      }

      .tool-icon {
        width: 3rem;
        height: 3rem;
        background: #ff6600;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 1rem;
        color: #ffffff;
      }

      .tool-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem;
        color: #666666;
      }

      .tool-description {
        font-size: 0.875rem;
        color: #737373;
        margin: 0;
      }

      @media (max-width: 640px) {
        .home {
          padding: 2rem 1rem;
        }

        .title {
          font-size: 1.75rem;
        }
      }
    `,
  ],
})
export class HomeComponent {}
