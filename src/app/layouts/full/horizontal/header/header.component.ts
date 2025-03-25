import {
  Component,
  Output,
  EventEmitter,
  Input,
} from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { navItems } from '../../vertical/sidebar/sidebar-data';
import { TranslateService } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { BrandingComponent } from '../../vertical/sidebar/branding.component';
import { NgFor, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface notifications {
  id: number;
  img: string;
  title: string;
  subtitle: string;
}

interface profiledd {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
}

interface apps {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
}

interface quicklinks {
  id: number;
  title: string;
  link: string;
}

@Component({
  selector: 'app-horizontal-header',
  standalone: true,
  imports: [RouterModule, TablerIconsModule, MaterialModule, BrandingComponent, NgFor],
  templateUrl: './header.component.html',
})
export class AppHorizontalHeaderComponent {

  // Aquí podrías tener lógica para obtener las iniciales del usuario desde localStorage o cualquier otra fuente
  getInitials(): string {
    const nombre = localStorage.getItem('nombre') || '';
    const apellidoPaterno = localStorage.getItem('apellidoPaterno') || '';

    // Obtener la primera letra de nombre y apellido paterno
    const initialNombre = nombre.charAt(0).toUpperCase();
    const initialApellido = apellidoPaterno.charAt(0).toUpperCase();

    // Concatenar las iniciales
    return initialNombre + initialApellido;
  }

  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  showFiller = false;

  public selectedLanguage: any = {
    language: 'English',
    code: 'en',
    type: 'US',
    icon: '/assets/images/flag/icon-flag-en.svg',
  };

  public languages: any[] = [
    {
      language: 'English',
      code: 'en',
      type: 'US',
      icon: '/assets/images/flag/icon-flag-en.svg',
    },
    {
      language: 'Español',
      code: 'es',
      icon: '/assets/images/flag/icon-flag-es.svg',
    },
    {
      language: 'Français',
      code: 'fr',
      icon: '/assets/images/flag/icon-flag-fr.svg',
    },
    {
      language: 'German',
      code: 'de',
      icon: '/assets/images/flag/icon-flag-de.svg',
    },
  ];

  nombreUsuario: any
  apellidoUsuario: any
  emailUsuario: any
  nombreCargo: any
  constructor(
    private vsidenav: CoreService,
    public dialog: MatDialog,
    private translate: TranslateService
  ) {
    translate.setDefaultLang('es');
    this.nombreUsuario = localStorage.getItem('nombre');
    this.apellidoUsuario = localStorage.getItem('apellidoPaterno');
    this.emailUsuario = localStorage.getItem('email');
    this.nombreCargo = localStorage.getItem('nombreCargo');

  }

  openDialog() {
    const dialogRef = this.dialog.open(AppHorizontalSearchDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  changeLanguage(lang: any): void {
    this.translate.use(lang.code);
    this.selectedLanguage = lang;
  }

  notifications: notifications[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-office-bag-2.svg',
      title: 'Todo correcto!',
      subtitle: 'No hay notificaciones',
    },
    
  ];

  profiledd: profiledd[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-account.svg',
      title: 'Mi Perfil',
      subtitle: 'Configuración de Cuenta',
      link: 'home/perfil',
    },
  ];


 apps: apps[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-dd-lifebuoy.svg',
      title: 'Gestión',
      subtitle: 'Documentación',
      link: '/',
    },
    {
      id: 2,
      img: '/assets/images/svgs/icon-dd-invoice.svg',
      title: 'Rendiciones',
      subtitle: 'Rendición de gastos',
      link: '/',
    },
  ];

  quicklinks: quicklinks[] = [
    {
      id: 1,
      title: 'Ruta en especifica',
      link: '/',
    },
  ];


}

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [RouterModule, MaterialModule, TablerIconsModule, FormsModule, NgForOf],
  templateUrl: 'search-dialog.component.html',
})
export class AppHorizontalSearchDialogComponent {
  searchText: string = '';
  navItems = navItems;

  navItemsData = navItems.filter((navitem) => navitem.displayName);

  // filtered = this.navItemsData.find((obj) => {
  //   return obj.displayName == this.searchinput;
  // });
}
