import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header';
import { FooterComponent } from './footer';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="layout">
      <app-header />
      <main class="main">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
  styles: [
    `
      .layout {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .main {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class LayoutComponent {}
