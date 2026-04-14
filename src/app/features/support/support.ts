import { Component } from '@angular/core';

@Component({
  selector: 'app-support',
  template: `
    <div class="support-page">
      <h1>Soporte</h1>
      <div class="content">
        <p>¿Necesitás ayuda? Contactános.</p>
        <div class="info-card">
          <h2>Información de contacto</h2>
          <p>Email: mequiroga@tdf.edu.ar</p>
          <p>Teléfono: (02964) XXXXX</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .support-page {
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
      .content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      p {
        color: #737373;
        margin: 0;
      }
      .info-card {
        background: #f5f5f5;
        border: 1px solid #d4d4d4;
        border-radius: 0.5rem;
        padding: 1.5rem;
      }
      .info-card h2 {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 1rem;
        color: #666666;
      }
      .info-card p {
        margin: 0.5rem 0;
        color: #737373;
      }
    `,
  ],
})
export class SupportComponent {}
