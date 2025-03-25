import { Routes } from '@angular/router';
import { SolicitudesComponent } from './solicitudes/solicitudes.component';
import { ViajesComponent } from './viajes/viajes.component';
import { BitacoraComponent } from './bitacora/bitacora.component';
import { DetallebitComponent } from './detallebit/detallebit.component';
import { AppFullcalendarComponent } from './fullcalendar/fullcalendar.component';
import { FinviajesComponent } from './finviajes/finviajes.component';
import { StarterComponent } from './starter/starter.component';

export const ViajesRoutes: Routes = [
  {
    path: '',
    component: StarterComponent,
    data: {
      view: 'false',
      title: 'Pagina Principal',
    },
  },
  {
    path: 'solicitud',
    component: SolicitudesComponent,
    data: {
      title: 'Solicitudes',
    }
  },
  {
    path: 'viajes',
    component: ViajesComponent,
    data: {
      title: 'viajes',
    }
  },
  {
    path: 'bitacora',
    component: BitacoraComponent,
    data: {
      title: 'Bitácoras de Viajes',
    },
  },
  {
    path: 'detallebit/:id',
    component: DetallebitComponent,
    data: {
      title: 'Detalle Bitácora',
    },
  },
  {
    path: 'fullcalendar',
    component: AppFullcalendarComponent,
    data: {
      title: 'Calendario',
    },
  },
  {
    path: 'finviajes',
    component: FinviajesComponent,
    data: {
      title: 'Registro de Viajes completados',
    },
  },


];
