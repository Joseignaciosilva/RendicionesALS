import { Routes } from '@angular/router';
import { FondosComponent } from './fondos/fondos.component';
import { RendidorComponent } from './rendidor/rendidor.component';
import { RendirComponent } from './rendir/rendir.component';
import { VerComprobanteComponent } from './ver-comprobante/ver-comprobante.component';
import { ListarFondosComponent } from './listar-fondos/listar-fondos.component';
import { AprobadorComponent } from './aprobador/aprobador.component';
import { GastosComponent } from './aprobador/gastos/gastos.component';
import { FacturasComponent } from './facturas/facturas.component';
import { ReembolsoComponent } from './reembolso/reembolso.component';
import { CierreComponent } from './cierre/cierre.component';
import { MisFondosComponent } from './mis-fondos/mis-fondos.component';
import { MisGastosComponent } from './mis-fondos/mis-gastos/mis-gastos.component';

export const RendicionesRoutes: Routes = [
  {
    path: 'fondos',
    component: FondosComponent, //asignacion de fondos 
    data: {
      title: 'Fondos'
    }
  },
  {
    path: 'rendidor',
    component: RendidorComponent, //lista de fondos   (deberia ser por usuario)
    data: {
      title: 'Rendidor'
    }
  },
  {
    path: 'misfondos',
    component: MisFondosComponent, //historial de fondos (deberia ser por usuario)
    data: {
      title: 'Historial de mis fondos rendidos y/o enviados'
    }
  },
  {
    path: 'misfondos/:id/misgastos',
    component: MisGastosComponent, //Ver gastos del fondo en historial
    data: {
      title: 'Gastos del fondo'
    }
  },
  { path: 'rendir/:id', 
    component: RendirComponent,   //rendir gastos al fondo (deberia ser por usuario)
    data: {
      view: 'false',
    },
  },
  {
     path:'comprobante/:id',   //visualizar y descargar imagen (Comprobante)
     component: VerComprobanteComponent,
     data: {
      view: 'false',
    },
  },
  { path: 'listarfondos', 
    component: ListarFondosComponent,   //listar todo los fondos para aplicar buscador
    data: {
      view: 'false',
    },
  },

  { path: 'aprobador', 
    component: AprobadorComponent,   //listar todo los gastos por aprobar
    data: {
      title: 'Aprobación de Fondos y Gastos'
    }
  },
  { path: 'gastos/:id', 
    component: GastosComponent,   //vista para visadoJefe o visadoAdmin segun correspondas
    data: {
      view: 'false',
    },
  },
  { path: 'facturas', 
    component: FacturasComponent,   //ver facturas y filtros
    data: {
      title: 'Facturas'
    }
  },
  { path: 'reembolso', 
    component: ReembolsoComponent,   //formulario de reembolso
    data: {
      title: 'Reembolso'
    }
  },
  { path: 'cierre', 
    component: CierreComponent,   //cierre del fondo, neteo etc...
    data: {
      title: 'Cierre de Fondos'
    }
  }

];
