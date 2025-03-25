import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { LoginGuard } from './pages/guard/login.guard';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones.component';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivate: [LoginGuard],
    children: [
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full',
      },
      {
          path: 'notificaciones',
          component: NotificacionesComponent,
          data: {
            title: 'Mis Notificaciones',
          }
      },
      {
        path: 'home',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'rendiciones',
        loadChildren: () =>
          import('./pages/rendiciones/rendiciones.routes').then((m) => m.RendicionesRoutes),
      },
      {
        path: 'viajes',
        loadChildren: () =>
          import('./pages/viajes/viajes.routes').then((m) => m.ViajesRoutes),
      },
      {
        path: 'facturas',
        loadChildren: () =>
          import('./pages/facturas/facturas.routes').then((m) => m.FacturasRoutes),
      },
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
