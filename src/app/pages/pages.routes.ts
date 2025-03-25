import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { AppAccountSettingComponent } from './account-setting/account-setting.component'

export const PagesRoutes: Routes = [
  {
    path: '',
    component: StarterComponent,
    data: {
      view: 'false',
      title: 'Rendiciones'
    },
  },
  {
    path: 'perfil',
    component: AppAccountSettingComponent,
    data: {
      title: 'Perfil de Usuario',
    },
  },

];
