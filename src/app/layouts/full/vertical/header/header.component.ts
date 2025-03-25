import {
  Component, Output, EventEmitter, Input, ViewEncapsulation, signal, ChangeDetectionStrategy, ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { MatDialog } from '@angular/material/dialog';
import { navItems } from '../sidebar/sidebar-data';
import { TranslateService } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AppSettings } from 'src/app/config';
import { BrandingComponent } from '../sidebar/branding.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatMenuModule } from '@angular/material/menu';
import { NotiService } from 'src/app/services/noti.service';
//interface para las notificaciones para poder exportar al Servicio
import { Notificaciones } from 'src/app/interfaces/interface';
import { Subscription } from 'rxjs';


interface profiledd {
  id: number;
  img: string;
  title: string;
  subtitle: string;
  link: string;
}

interface Apps {
  id: number;
  icon: string;
  titulo: string;
  subtitulo: string;
  link: string;
}

interface ContadorNoti {
  id: number;
  totalNoti: number;
  totalPendiente: number;
  usuario: string
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule,
    CommonModule,
    NgScrollbarModule,
    TablerIconsModule,
    MaterialModule,
    BrandingComponent,
    FormsModule,
    NgIf,
    MatMenuModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @Output() optionsChange = new EventEmitter<AppSettings>();
  private pollingInterval: any; // Intervalo para Long Polling
  
  hideSingleSelectionIndicator = signal(true);
  hideMultipleSelectionIndicator = signal(true);
  private htmlElement!: HTMLHtmlElement;
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
  @ViewChild('menuTrigger') menuTrigger: MatMenuTrigger;


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
  token: any

  apps: Apps[] = []

  noti: Notificaciones[] = [];
  notisRecientes: Notificaciones[] = [];     // Notificaciones recientes (máximo 7)
  totalPendiente: number = 0;
  private subscription!: Subscription;
  audio = new Audio('assets/sounds/noti.mp3');
  prevTotalPendiente: number = 0;

  constructor(
    private settings: CoreService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private http: HttpClient,
    private notificaciones: NotificacionesService,
    private notiService: NotiService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {
    translate.setDefaultLang('es');
    this.nombreUsuario = localStorage.getItem('nombre');
    this.apellidoUsuario = localStorage.getItem('apellidoPaterno');
    this.emailUsuario = localStorage.getItem('email');
    this.nombreCargo = localStorage.getItem('nombreCargo');
    this.token = localStorage.getItem('token');
    this.htmlElement = document.querySelector('html')!;

  }

  options = this.settings.getOptions();

  toggleTheme() {
    this.options.theme = this.options.theme === 'light' ? 'dark' : 'light';
    this.setDark();  // Llama a la función para aplicar el cambio de tema
  }

  setDark() {
    if (this.options.theme === 'dark') {
      this.htmlElement.classList.add('dark-theme');
      this.htmlElement.classList.remove('light-theme');
      localStorage.setItem('darkMode', 'true');
    } else {
      this.htmlElement.classList.remove('dark-theme');
      this.htmlElement.classList.add('light-theme');
      localStorage.setItem('darkMode', 'false');
    }
    this.optionsChange.emit(this.options);
  }

  setColor() {
    this.optionsChange.emit(this.options);
  }

  setDir() {
    this.optionsChange.emit(this.options);
  }

  setSidebar() {
    this.optionsChange.emit(this.options);
  }

  cerrarMenu(): void {
    this.menuTrigger.closeMenu();
  }

  //Abrir el buscador 
  openDialog() {
    const dialogRef = this.dialog.open(AppSearchDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

  logout(): void {
    localStorage.clear();
  }

  changeLanguage(lang: any): void {
    this.translate.use(lang.code);
    this.selectedLanguage = lang;
  }

  //Carga de apps 
  getApps(): void {

    const headers = new HttpHeaders({
      'Authorization': `token ${this.token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<Apps[]>('https://control.als-inspection.cl/api/apps_api/apps/', { headers })
      .subscribe({
        next: (response: Apps[]) => {
          this.apps = response;
        },
        error: (error) => {
          console.error('Error al obtener apps:', error);
          // Maneja el error aquí, por ejemplo, mostrando un mensaje al usuario
        }
      });
  }

  // Inicia Long Polling al cargar el componente 
  ngOnInit(): void {
    const email = localStorage.getItem('email');
    if (!email) {
      console.warn('No se encontró el email en el localStorage');
      return;
    }
    
    this.notiService.notificaciones$.subscribe({
      next: (notificaciones) => {
        this.noti = notificaciones;
        this.notisRecientes = notificaciones.slice(0, 7);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al suscribirse a notificaciones:', error);
      },
    });

    this.subscription = this.notiService.totalPendiente$.subscribe((total) => {
      this.totalPendiente = total; // Actualiza el contador del header
      this.cdr.detectChanges();
    });

    this.startPolling(email);
    this.getApps();
  }

  // Limpia el intervalo al destruir el componente
  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
    this.stopPolling();
  }

  // Inicia el Long Polling
  startPolling(email: string): void {
  
    const savedPrevTotalPendiente = localStorage.getItem('prevTotalPendiente'); // Recuperar el valor previo de pendientes
    this.prevTotalPendiente = savedPrevTotalPendiente ? parseInt(savedPrevTotalPendiente, 10) : 0;

      this.notiService.startPolling(email, (notificaciones: Notificaciones[]) => {
        // Calcular el total de no leídas
        const totalPendientes = notificaciones.filter((noti) => !noti.visualizado).length;
        // Mostrar el mensaje de la última notificación solo si el total ha aumentado
        if (totalPendientes > this.prevTotalPendiente) {
          const nuevaNotificacion = notificaciones.find((noti) => !noti.visualizado); // Buscar la nueva no leída
          if (nuevaNotificacion) {
            this.notificaciones.info(nuevaNotificacion.subtitulo); // Mostrar solo el mensaje
            this.audio.play(); // Reproducir sonido
          }
        }
    
        // Actualizar valores de variables
        this.prevTotalPendiente = totalPendientes;
        localStorage.setItem('prevTotalPendiente', totalPendientes.toString()); //guardao en localstorage
        this.noti = notificaciones;
        this.notisRecientes = this.noti.slice(0, 7);
        this.totalPendiente = totalPendientes;
    
        // Forzar la detección de cambios si es necesario
        this.cdr.detectChanges();
        this.getNoti()
    });
  }
  
  // Detiene el Long Polling
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  // Obtiene todas las notificaciones y el total pendiente
  getNoti(): void {
    const email = localStorage.getItem('email');
    if (!email) {
      console.warn('No se encontró el email en el localStorage');
      return;
    }

    // Total pendiente
    this.notiService.totalNoti(email).subscribe({
      next: (resp: ContadorNoti[]) => {
        this.totalPendiente = resp && resp.length ? resp[0].totalPendiente : 0;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al cargar el total de notificaciones pendientes:', error);
      },
    });

    // Detalles de notificaciones
    this.notiService.getNoti(email).subscribe({
      next: (resp: Notificaciones[]) => {
        this.noti = resp || [];
        // Filtrar las 7 notificaciones más recientes
        this.notisRecientes = this.noti.slice(0, 7);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al cargar las notificaciones:', error);
      },
    });
  }


  // Eliminar notificación
  eliminarNoti(id: any): void {
    this.notificaciones.ConfirmAlert('Eliminar notificación','¿Deseas eliminar esta notificación?','Aceptar','Cancelar',
      (confirm) => {
        if (confirm) {
          this.notiService.deleteNoti(id).subscribe({
            next: () => {
              this.notificaciones.success('Notificación eliminada');
              this.getNoti();
              console.log('Notificación eliminada');
            },
            error: (error: any) => {
              this.notificaciones.failure('Error al eliminar la notificación: ' + error);
            },
          });
        } else {
          console.log('Eliminación cancelada');
        }
      }
    );
  }

  // Visualizar notificación
  visualizarNoti(id: any): void {
    this.notiService.visualizarNoti(id).subscribe({
      next: () => {
        this.getNoti()
      },
      error: (error: any) => {
        this.notificaciones.failure('Error al visualizar la notificación: ' + error)
      },
    });
  }

  // marcar visualizada al ahcer click encima de la noti
  visualizarNotiClick(id: string, link: string): void {
  
      this.notiService.visualizarNoti(id).subscribe({
        next: () => {
          console.log('Notificación marcada como visualizada');
          window.open(link, '_blank')
          this.getNoti()
        },
        error: (error: any) => {
          console.error('Error al marcar la notificación como visualizada:', error);
        },
      });
  }

  todasMisNotis(): void {
    this.router.navigate(['/notificaciones']); 
  }

  
  profiledd: profiledd[] = [
    {
      id: 1,
      img: '/assets/images/svgs/icon-account.svg',
      title: 'Mi Perfil',
      subtitle: 'Configuración de Cuenta',
      link: '/home/perfil',
    },
  ];
}





//Componente del Contactos de soporte...
@Component({
  selector: 'search-dialog',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    TablerIconsModule,
    FormsModule,
    NgForOf,
  ],
  templateUrl: 'search-dialog.component.html',
})
export class AppSearchDialogComponent {
  searchText: string = '';
  navItems = navItems;

  navItemsData = navItems.filter((navitem) => navitem.displayName);

  // filtered = this.navItemsData.find((obj) => {
  //   return obj.displayName == this.searchinput;
  // });
}