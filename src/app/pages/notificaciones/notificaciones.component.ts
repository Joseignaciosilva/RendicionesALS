import { Component, OnInit, ChangeDetectorRef, signal, ViewChild } from '@angular/core';
import { NotiService } from 'src/app/services/noti.service';
import { Notificaciones } from 'src/app/interfaces/interface';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { MatToolbar } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { MatListItem, MatNavList } from '@angular/material/list';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import {MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTable, MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [TablerIconsModule, MatCardContent, MatDivider, MatToolbar, MatSidenav, MatListItem, MatNavList,MatSidenavContainer, 
            MatCard, MatSidenavContent,NgFor, NgIf,NgClass,MaterialModule,MatPaginator, MatTable, MatPaginatorModule,
            MatTableModule,],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss'
})

export class NotificacionesComponent implements OnInit {
  
  sidePanelOpened = signal<boolean>(true);
  public showSidebar = signal<boolean>(false);
  notifications = signal<Notificaciones[]>([]); // Lista de notificaciones
  filteredNotifications = signal<Notificaciones[]>([]); // Notificaciones filtradas
  selectedCategory = signal<string>('noVisualizada'); // Categoría 
  visualizadasCount = signal<number>(0); // Contador de notificaciones visualizadas
  noVisualizadasCount = signal<number>(0); // Contador de notificaciones no visualizadas
  email = localStorage.getItem('email') || '';

  noti: Notificaciones[] = [];
  //paginator
  public currentPage = 0; // Página actual
  public pageSize = 10; // Tamaño de la página
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private notiService: NotiService,
    private notificacionesService : NotificacionesService,
    public snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  isOver(): boolean {
    return window.matchMedia(`(max-width: 960px)`).matches;
  }

  mobileSidebar(): void {
    this.showSidebar.set(!this.showSidebar);
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  getStatusInfo() {
    const count =
      this.selectedCategory() === 'visualizada'
        ? this.visualizadasCount()
        : this.noVisualizadasCount();
  
    return {
      text: this.selectedCategory() === 'visualizada' ? 'Leídas' : 'Pendientes',
      count: count,
      colorClass: this.selectedCategory() === 'visualizada' ? 'bg-success' : 'bg-primary',
    };
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges(); 
  }
  

  ngOnInit(): void {
    this.notificacionesService.showloading('Cargando notificaciones...');
    this.startPolling();

    this.notiService.notificaciones$.subscribe({
      next: (notificaciones) => {
        this.notifications.set(notificaciones);
        this.actualizarNotis();
        this.filtrarNotis(this.selectedCategory());
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al suscribirse a notificaciones:', error);
      },
    });

    this.getNoti();
  }

  //para recibir en tiempo real si llega una notificacion
  startPolling(): void {
    this.notiService.startPolling(this.email, (notificaciones: Notificaciones[]) => {
      this.notifications.set(notificaciones);
      this.actualizarNotis();
  
      // Mantener la página actual después del polling
      const startIndex = this.currentPage * this.pageSize;
      const endIndex = startIndex + this.pageSize;
  
      const filtered =
        this.selectedCategory() === 'visualizada'
          ? notificaciones.filter((notif) => notif.visualizado)
          : notificaciones.filter((notif) => !notif.visualizado);
  
      this.filteredNotifications.set(filtered.slice(startIndex, endIndex));
      this.updatePaginator();
      this.cdr.detectChanges();
    });
  }
  
  //traigo todo las noitificaciones el usuario, las agrego a notificaciones para luego filtrarlas y mostrarlas
  getNoti(): void { //Consulta todas las notificaciones y actualiza: notificaciones, totalpendiente.
    this.notiService.getNoti(this.email).subscribe({
      next: (notificaciones: Notificaciones[]) => {
        this.notifications.set(notificaciones);

        // Inicializa el total pendiente
        const nuevosPendientes = notificaciones.filter((n) => !n.visualizado).length;
        this.notiService.updateTotalPendiente(nuevosPendientes);

        this.actualizarNotis();
        this.filtrarNotis(this.selectedCategory());
        this.cdr.detectChanges();
        this.notificacionesService.removeLoading();
      },
      error: (err) => {
        console.error('Error al obtener notificaciones:', err);
        this.notificacionesService.removeLoading(); // Asegurarse de quitarlo también en caso de error
      },
    });
  }

  // Filtrar las notificaciones según la categoría
  filtrarNotis(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage = 0;

    const allNotifications = this.notifications();
    const filtered = category === 'visualizada'
        ? allNotifications.filter((notif) => notif.visualizado)
        : allNotifications.filter((notif) => !notif.visualizado);
  
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    this.filteredNotifications.set(filtered.slice(startIndex, endIndex))
    this.updatePaginator();
    this.cdr.detectChanges();
  }
  
  // Cambiar de página en el paginador
  cambioPagina(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;

    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    const allNotifications =
      this.selectedCategory() === 'visualizada'
        ? this.notifications().filter((notif) => notif.visualizado)
        : this.notifications().filter((notif) => !notif.visualizado);

    this.filteredNotifications.set(allNotifications.slice(startIndex, endIndex));
    this.cdr.detectChanges();
  }
      updatePaginator(): void {
        const filteredNotifications =
          this.selectedCategory() === 'visualizada'
            ? this.notifications().filter((notif) => notif.visualizado)
            : this.notifications().filter((notif) => !notif.visualizado);
      
        this.paginator.length = filteredNotifications.length; // Cambiar el length dinámicamente
        this.paginator.pageSize = this.pageSize;
        this.paginator.pageIndex = this.currentPage;
      }
  

  // Actualizar los contadores de notificaciones
  actualizarNotis(): void {
    const allNotifications = this.notifications();
    this.visualizadasCount.set(
      allNotifications.filter((n) => n.visualizado).length
    );
    this.noVisualizadasCount.set(
      allNotifications.filter((n) => !n.visualizado).length
    );
    this.cdr.detectChanges();
  }

  // Marcar una notificación como visualizada
  visualizarNoti(notification: Notificaciones): void {
    this.notiService.visualizarNoti(String(notification.id)).subscribe({
      next: () => {
        notification.visualizado = true;
        
        // Recalcula el total pendiente
        const nuevosPendientes = this.notifications().filter((n) => !n.visualizado).length;
        this.notiService.updateTotalPendiente(nuevosPendientes);

        // Actualizar la vista
        this.actualizarNotis();
        this.filtrarNotis(this.selectedCategory());
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al visualizar notificación:', err),
    });
  }

  // Eliminar una notificación
  eliminarNoti(id: number): void {
    this.notificacionesService.ConfirmAlert('Eliminar notificación ', '¿Desea eliminar esta notificación?', 'Aceptar', 'Cancelar', (confirm) => {
      if (confirm) {
        this.notiService.deleteNoti(String(id)).subscribe({
          next: (response) => {
            // Eliminar la notificación localmente en el array de notificaciones
            this.notifications.set(this.notifications().filter((notif) => notif.id !== id));
  
            // Recalcular el total pendiente y actualizar
            const nuevosPendientes = this.notifications().filter((n) => !n.visualizado).length;
            this.notiService.updateTotalPendiente(nuevosPendientes);
  
            // Actualizar la vista
            this.notificacionesService.success('Notificación eliminada');
            this.actualizarNotis();
            this.filtrarNotis(this.selectedCategory());
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error al eliminar la notificación', err);
            this.notificacionesService.failure('Error al eliminar la notificación: ' + err);
            // Se mantiene el estado actual y se vuelve a intentar actualizar la vista
            this.actualizarNotis();
            this.filtrarNotis(this.selectedCategory());
            this.cdr.detectChanges();
          }
        });
      } else {
        console.log('Eliminación cancelada');
      }
    });
  }
  
  // Marcar como visualizada y redirigir al enlace
visualizarNotiClick(notification: Notificaciones): void {

  // Actualiza localmente antes de la llamada al servidor
  notification.visualizado = true;
  const nuevosPendientes = this.notifications().filter((n) => !n.visualizado).length;
  this.notiService.updateTotalPendiente(nuevosPendientes);

  // Enviar la actualización al servidor
  this.notiService.visualizarNoti(String(notification.id)).subscribe({
    next: () => {
      console.log('Notificación marcada como visualizada en el servidor');
      this.actualizarNotis();
      window.open(notification.link, '_blank');
      this.filtrarNotis(this.selectedCategory());
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error al visualizar notificación:', err);
    },
  });
}

}