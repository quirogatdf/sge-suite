import { Routes } from '@angular/router';
import { LayoutComponent } from './features/layout/components/layout';
import { HomeComponent } from './features/home/home';
import { ToolsComponent } from './features/tools/tools';
import { SupportComponent } from './features/support/support';
import { PdfCompressorPage } from './features/pdf-compressor/pdf-compressor';
import { PdfMergerPage } from './features/pdf-merger/pdf-merger';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'herramientas', component: ToolsComponent },
      { path: 'soporte', component: SupportComponent },
      { path: 'comprimir-pdf', component: PdfCompressorPage },
      { path: 'combinar-pdf', component: PdfMergerPage },
    ],
  },
  { path: '**', redirectTo: '' },
];
