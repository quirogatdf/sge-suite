import { Component, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="header-content">
        <!-- Botón "SOMOS" con logo a la izquierda -->
        <a routerLink="/" class="somos-button">
          <img src="/img/logos/somos.png" alt="SOMOS" class="somos-logo" />
        </a>

        <!-- Navegación desktop (visible solo en desktop) -->
        @if (isDesktop()) {
          <nav class="nav-main" role="navigation" aria-label="Navegación principal">
            @for (item of navItems; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: item.route === '/' }"
                class="nav-link"
              >
                {{ item.label }}
              </a>
            }
          </nav>
        }

        <!-- Botón hamburguesa (visible solo en mobile) -->
        @if (!isDesktop()) {
          <button class="hamburger" (click)="toggleMenu()" aria-label="Abrir menú">
            @if (menuOpen()) {
              <svg class="hamburger-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            } @else {
              <svg class="hamburger-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            }
          </button>
        }
      </div>

      <!-- Menú móvil desplegable -->
      @if (!isDesktop() && menuOpen()) {
        <nav class="mobile-menu" role="navigation" aria-label="Menú móvil">
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.route === '/' }"
              class="mobile-nav-link"
              (click)="closeMenu()"
            >
              {{ item.label }}
            </a>
          }
        </nav>
      }
    </header>

    <!-- Pasador de Dependencia (Banner): 1920x400px -->
    <div class="dependency-banner">
      <div class="banner-content">
        <img
          src="/images/logo-oficial.svg"
          alt="Gobierno de Tierra del Fuego"
          class="banner-logo"
          width="200"
          height="100"
        />
        <h1 class="banner-title pt-1">Secretaría de Gestión Educativa</h1>
      </div>
    </div>
  `,
  styles: [
    `
      /* ========================================
       Header Gubernamental - Manual de Marca
       ======================================== */

      .header {
        width: 100%;
        background-color: #ffffff;
        border-bottom: 2px solid #ff6600;
        position: sticky;
        top: 0;
        z-index: 50;
      }

      .header-content {
        width: 100%;
        padding: 0.75rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
      }

      /* ----------------------------------------
       Botón "SOMOS" con logo (Izquierda)
       ---------------------------------------- */
      .somos-button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        background: none;
        border: none;
        cursor: pointer;
        flex-shrink: 0;
      }

      .somos-logo {
        height: 40px;
        width: auto;
        object-fit: contain;
        display: block;
      }

      .somos-button:hover .somos-logo {
        opacity: 0.9;
      }

      /* ----------------------------------------
       Navegación Principal (Derecha)
       Máx 5 secciones
       ---------------------------------------- */
      .nav-main {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .nav-link {
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #666666;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: -0.025em;
        border-radius: 0.25rem;
        transition: all 0.2s ease;
      }

      .nav-link:hover {
        background-color: #f5f5f5;
        color: #ff6600;
      }

      .nav-link.active {
        color: #ff6600;
        font-weight: 700;
      }

      /* ----------------------------------------
         Botón Hamburguesa
         ---------------------------------------- */
      .hamburger {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: none;
        border: none;
        color: #666666;
        cursor: pointer;
        flex-shrink: 0;
      }

      .hamburger:hover {
        color: #ff6600;
      }

      .hamburger-icon {
        width: 24px;
        height: 24px;
      }

      /* ----------------------------------------
         Menú Móvil
         ---------------------------------------- */
      .mobile-menu {
        display: flex;
        flex-direction: column;
        background-color: #ffffff;
        border-top: 1px solid #e5e5e5;
        padding: 0.5rem;
      }

      .mobile-nav-link {
        padding: 0.75rem 1rem;
        font-size: 1rem;
        font-weight: 500;
        color: #666666;
        text-decoration: none;
        text-transform: uppercase;
        border-radius: 0.25rem;
        transition: all 0.15s;
      }

      .mobile-nav-link:hover {
        background-color: #f5f5f5;
        color: #ff6600;
      }

      .mobile-nav-link.active {
        color: #ff6600;
        font-weight: 700;
      }

      /* ----------------------------------------
         Pasador de Dependencia (Banner)
         1920px de ancho x 400px de alto
         ---------------------------------------- */
      .dependency-banner {
        width: 100%;
        height: 400px;
        margin: 0 auto;
        background-color: #f1f2f2;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .banner-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .banner-logo {
        width: auto;
        height: 100px;
        object-fit: contain;
      }

      .banner-title {
        font-size: 2rem;
        font-weight: 700;
        color: #666666;
        letter-spacing: -0.025em;
        margin: 0;
        white-space: nowrap;
        text-align: center;
      }

      /* ----------------------------------------
         Responsive
         ---------------------------------------- */
      @media (max-width: 1024px) {
        .header-content {
          padding: 0.625rem 1.5rem;
        }

        .nav-link {
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
        }

        .somos-logo {
          height: 35px;
        }
      }

      @media (max-width: 768px) {
        .header-content {
          padding: 0.5rem 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .somos-button {
          order: 1;
        }

        .somos-logo {
          height: 30px;
        }

        .nav-main {
          order: 2;
          width: 100%;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.125rem;
        }

        .nav-link {
          padding: 0.25rem 0.5rem;
          font-size: 0.65rem;
        }

        .dependency-banner {
          height: 250px;
        }

        .banner-title {
          font-size: 1.25rem;
        }

        .banner-logo {
          height: 60px;
        }
      }

      @media (max-width: 480px) {
        .header-content {
          padding: 0.375rem 0.75rem;
        }

        .somos-logo {
          height: 28px;
        }

        .nav-link {
          padding: 0.25rem 0.375rem;
          font-size: 0.55rem;
        }

        .dependency-banner {
          height: 180px;
        }

        .banner-title {
          font-size: 1rem;
        }

        .banner-logo {
          height: 40px;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  protected readonly menuOpen = signal(false);
  protected readonly isDesktop = signal(true);

  protected readonly navItems: NavItem[] = [
    { label: 'INICIO', route: '/' },
    { label: 'HERRAMIENTAS', route: '/herramientas' },
    { label: 'SOPORTE', route: '/soporte' },
  ];

  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isDesktop.set(window.innerWidth >= 768);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
