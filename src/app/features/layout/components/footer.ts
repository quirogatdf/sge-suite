import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Address {
  dependency: string;
  address: string;
  city: string;
  phone: string;
}

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <!-- Franja Superior: Gris #F1F2F2 - 264px de alto -->
      <div class="footer-top">
        <div class="footer-top-content">
          <!-- Logo del Gobierno -->
          <div class="footer-logo">
            <a routerLink="/" class="logo-link">
              <img
                src="/images/logo-gobierno.svg"
                alt="Gobierno de Tierra del Fuego"
                class="logo-image"
                width="106"
                height="81"
              />
            </a>
          </div>

          <!-- Direcciones -->
          <div class="footer-addresses">
            @for (addr of addresses; track addr.dependency) {
              <div class="address-block">
                <span class="address-dependency">{{ addr.dependency }}</span>
                <span class="address-detail">{{ addr.address }}</span>
                <span class="address-city">{{ addr.city }}</span>
                <span class="address-phone">{{ addr.phone }}</span>
              </div>
            }
          </div>

          <!-- Redes Sociales -->
          <div class="footer-social">
            <a
              href="https://facebook.com/gobiernotdf"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-social"
              aria-label="Facebook"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </a>
            <a
              href="https://twitter.com/gobiernotdf"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-social"
              aria-label="Twitter"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon">
                <path
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                />
              </svg>
            </a>
            <a
              href="https://instagram.com/gobiernotdf"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-social"
              aria-label="Instagram"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" class="social-icon">
                <path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Franja Inferior: Naranja #FF6600 - 150px de alto -->
      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <p class="footer-legal">
            © 2026 Secretaría de Gestión Educativa - Todos los derechos reservados
          </p>
          <p class="footer-disclaimer">Este sitio es una suite herramienta ofimaticas</p>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      /* ========================================
       Footer Gubernamental - Manual de Marca
       ======================================== */

      .footer {
        width: 100%;
      }

      /* ----------------------------------------
       Franja Superior: Gris #F1F2F2
       ---------------------------------------- */
      .footer-top {
        width: 100%;
        height: 264px;
        background-color: #f1f2f2;
        padding: 2rem 4rem;
      }

      .footer-top-content {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 3rem;
      }

      /* Logo (106x81px) */
      .footer-logo {
        flex-shrink: 0;
      }

      .logo-link {
        display: block;
      }

      .logo-image {
        width: 106px;
        height: 81px;
        object-fit: contain;
      }

      /* Direcciones - Alineación izquierda */
      .footer-addresses {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 600px;
      }

      .address-block {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .address-dependency {
        font-size: 0.875rem;
        font-weight: 700;
        color: #666666;
        text-transform: uppercase;
        letter-spacing: -0.025em;
      }

      .address-detail {
        font-size: 0.875rem;
        font-weight: 400;
        color: #666666;
        letter-spacing: -0.025em;
      }

      .address-city {
        font-size: 0.875rem;
        font-weight: 400;
        color: #666666;
        letter-spacing: -0.025em;
      }

      .address-phone {
        font-size: 0.875rem;
        font-weight: 400;
        color: #ff6600;
        letter-spacing: -0.025em;
      }

      /* Redes Sociales - Botones 43x43px */
      .footer-social {
        display: flex;
        gap: 0.75rem;
        flex-shrink: 0;
      }

      .btn-social {
        width: 43px;
        height: 43px;
        background-color: rgb(204, 204, 204);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease;
      }

      .btn-social:hover {
        background-color: #a3a3a3;
      }

      .social-icon {
        width: 20px;
        height: 20px;
        color: #454444;
      }

      /* ----------------------------------------
       Franja Inferior: Naranja #FF6600
       ---------------------------------------- */
      .footer-bottom {
        width: 100%;
        height: 150px;
        background-color: #ff6600;
        padding: 2rem 4rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .footer-bottom-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        text-align: center;
      }

      .footer-legal {
        font-size: 0.875rem;
        font-weight: 600;
        color: #ffffff;
        letter-spacing: -0.025em;
        margin: 0;
      }

      .footer-disclaimer {
        font-size: 0.75rem;
        font-weight: 400;
        color: #ffffff;
        opacity: 0.9;
        letter-spacing: -0.025em;
        margin: 0;
      }

      /* ----------------------------------------
         Responsive
         ---------------------------------------- */
      @media (max-width: 1024px) {
        .footer-top {
          height: auto;
          padding: 1.5rem 2rem;
        }

        .footer-top-content {
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.5rem;
        }

        .footer-addresses {
          align-items: center;
        }

        .address-block {
          text-align: center;
        }
      }

      @media (max-width: 768px) {
        .footer-top {
          padding: 1rem 1.5rem;
        }

        .footer-bottom {
          padding: 1.25rem 1rem;
        }

        .logo-image {
          width: 80px;
          height: auto;
        }

        .address-dependency {
          font-size: 0.75rem;
        }

        .address-detail,
        .address-city,
        .address-phone {
          font-size: 0.75rem;
        }
      }

      @media (max-width: 480px) {
        .footer-top {
          padding: 1rem;
        }

        .footer-bottom {
          padding: 1rem;
        }

        .footer-legal {
          font-size: 0.75rem;
        }

        .footer-disclaimer {
          font-size: 0.65rem;
        }

        .btn-social {
          width: 32px;
          height: 32px;
        }

        .social-icon {
          width: 14px;
          height: 14px;
        }

        .footer-social {
          gap: 0.5rem;
        }

        .logo-image {
          width: 70px;
        }
      }
    `,
  ],
})
export class FooterComponent {
  protected readonly addresses: Address[] = [
    {
      dependency: 'Ministerio de Gobierno',
      address: 'Av. Maipú 555',
      city: 'V9420 Tierra del Fuego',
      phone: '(02901) 436000 / 436100',
    },
    {
      dependency: 'Secretaría de Legal y Técnica',
      address: 'Av. Maipú 555 - Planta Baja',
      city: 'V9420 Tierra del Fuego',
      phone: '(02901) 436200',
    },
  ];
}
