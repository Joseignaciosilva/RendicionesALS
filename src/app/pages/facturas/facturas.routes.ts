import { Routes } from "@angular/router";
import { StarterComponent } from "./starter/starter.component";
import { SolicitarComponent } from "./solicitar/solicitar.component";
import { AprobarComponent } from "./aprobar/aprobar.component";
import { ListarComponent } from "./listar/listar.component";
import { PagarComponent } from "./pagar/pagar.component";

export const FacturasRoutes: Routes = [
  {
    path: '',
    component: StarterComponent,
    data: {
      title: 'Pagina Principal',
    },
  },
  {
    path: 'solicitar',
    component: SolicitarComponent,
    data: {
      title: 'Solicitar Aprobación',
    }
  },
  {
    path: 'aprobar',
    component: AprobarComponent,
    data: {
      title: 'Aprobación de Factura',
    }
  },
  {
    path: 'listar',
    component: ListarComponent,
    data: {
      title: 'Listado Detallado',
      view: 'false',
    }
  },
  {
    path: 'pagar',
    component: PagarComponent,
    data: {
      title: 'Pagar Facturas',
    }
  },
]