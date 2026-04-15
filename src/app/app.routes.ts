import { Routes } from '@angular/router';
import { LayoutComponent } from './features/layout/components/layout';
import { HomeComponent } from './features/home/home';
import { ToolsComponent } from './features/tools/tools';
import { SupportComponent } from './features/support/support';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'herramientas', component: ToolsComponent },
      { path: 'soporte', component: SupportComponent },
      {
        path: 'comprimir-pdf',
        loadComponent: () =>
          import('./features/pdf-compressor/pdf-compressor').then((m) => m.PdfCompressorPage),
      },
      {
        path: 'combinar-pdf',
        loadComponent: () =>
          import('./features/pdf-merger/pdf-merger').then((m) => m.PdfMergerPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
