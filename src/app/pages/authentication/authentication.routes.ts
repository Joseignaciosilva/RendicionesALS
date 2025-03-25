import { Routes } from '@angular/router';

import { AppErrorComponent } from './error/error.component';
import { LoginComponent } from './login/login.component';
import { AppSideRegisterComponent } from './side-register/side-register.component';
import { MailresetpassComponent } from './mailresetpass/mailresetpass.component';
import { AppAccountSettingComponent } from '../account-setting/account-setting.component'
import { ResetpassComponent } from './resetpass/resetpass.component';


export const AuthenticationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'error',
        component: AppErrorComponent,
      },

      {
        path: 'login',
        component: LoginComponent,
      },
      {
        path: 'mailresetpass',
        component: MailresetpassComponent,
      },
      {
        path: 'resetpass',
        component: ResetpassComponent,
      },
      {
        path: 'register',
        component: AppSideRegisterComponent,
      },
    ],
  },
];
