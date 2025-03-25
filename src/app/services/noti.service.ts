import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Notificaciones } from 'src/app/interfaces/interface';
import { catchError, map, Observable, BehaviorSubject, of, tap, finalize  } from 'rxjs';

@Injectable({
  providedIn: 'root'
})export class NotiService {
  private url: string = "https://control.als-inspection.cl/api/" // URL de la API
  private pollingInterval: any; // Intervalo de tiempo para polling

  // BehaviorSubject para el total de pendientes
  private totalPendienteSubject = new BehaviorSubject<number>(0);
  totalPendiente$ = this.totalPendienteSubject.asObservable();

  // BehaviorSubject para las notificaciones
  private notificacionesSubject = new BehaviorSubject<Notificaciones[]>([]);
  notificaciones$ = this.notificacionesSubject.asObservable();
  private deletingNotiIds = new Set<string>();

  
  constructor(private http: HttpClient) { }

  //Long Polling para obtener notificaciones
  startPolling(email: string, onNewData: (notificaciones: Notificaciones[]) => void): void {
    const poll = () => {
      this.getNoti(email).subscribe({
        next: (notificaciones: Notificaciones[]) => {
          onNewData(notificaciones) // Pasar las notificaciones completas al callback
          // this.pollingInterval = setTimeout(poll, 5000); // Reintentar cada 5 segundos
          this.pollingInterval = setTimeout(poll, 30000) // 30 segundos
        },
        error: (error) => {
          console.error('Error al obtener notificaciones:', error);
          // this.pollingInterval = setTimeout(poll, 5000); // Reintentar incluso tras error
          this.pollingInterval = setTimeout(poll, 30000)
        },
      })
    }
    poll()
  }

  // Detener el polling
  stopPolling(): void {
    clearTimeout(this.pollingInterval)
  }

  // Método para actualizar el total pendiente
  updateTotalPendiente(value: number): void {
    this.totalPendienteSubject.next(value);
  }
  // Método para actualizar las notificaciones compartidas
  updateNotificaciones(notificaciones: Notificaciones[]): void {
    this.notificacionesSubject.next(notificaciones);
  }

  // Enviar notificación
  sendNotification(userId: string, message: string, url: string | null): void {
    if (!userId || !message) {
      console.error('No se puede enviar notificación, usuario o mensaje no válido');
      return
    }

    this.crearNoti(userId, message, url).subscribe({
      next: (resp) => {
        console.log('Notificación enviada y almacenada correctamente:', resp);
      },
      error: (error) => {
        console.error('Error al enviar o guardar notificación:', error);
      },
    })
  }

  // Crear la notificación
  crearNoti(usuario: string, subtitulo: string, url: string | null): Observable<any> {
    const icon = "coin";
    const titulo = "Rendiciones";
    const link = `https://rendiciones2.als-inspection.cl/${url || ''}`;
    const visualizado = false

    const body = { usuario, icon, titulo, subtitulo, link, visualizado }
    return this.http.post(this.url + '/noti_api/notificacion/', body)
  }

  //obtener total de notificaciones pendientes
  totalNoti(email: string): Observable<any> {
    const body = { email }
    return this.http.post(this.url + 'noti_api/total_noti/', body).pipe(
      catchError((error) => {
        console.error('Error en totalNoti:', error)
        throw error
      })
    );
  }

  // Obtener las notificaciones por usuario
  getNoti(email: string): Observable<any[]> {
    const body = { email };
    const observable = this.http.post<any[]>(this.url + '/noti_api/noti_usuario/', body).pipe(
      map((notificaciones) =>
        // Filtrar solo las notificaciones destinadas al usuario actual
        notificaciones.filter((noti) => noti.usuario === email)
      ),
      catchError((error) => {
        console.error('Error al obtener notificaciones:', error);
        return of([]); // Devuelve un Observable con un array vacío si hay error
      })
    );
  
    // Actualizar el BehaviorSubject al obtener las notificaciones
    observable.subscribe((notificaciones) => {
      this.notificacionesSubject.next(notificaciones);
    });
  
    return observable; // Devuelve el Observable como antes
  }
  

  // Eliminar una notificación
  deleteNoti(id: string): Observable<any> {
    if (this.deletingNotiIds.has(id)) {
      console.warn(`Ya se está eliminando la notificación con ID: ${id}`);
      return of(null);
    }
  
    this.deletingNotiIds.add(id);
  
    const observable = this.http.delete(this.url + 'noti_api/notificacion/' + id + '/').pipe(
      catchError((error) => {
        console.error('Error en deleteNoti:', error);
        throw error;
      }),
      finalize(() => {
        this.deletingNotiIds.delete(id);
      })
    );
  
    return observable.pipe(
      tap(() => {
        const notificacionesActuales = this.notificacionesSubject.getValue();
        const notificacionesActualizadas = notificacionesActuales.filter((noti) => noti.id !== Number(id));
        this.notificacionesSubject.next(notificacionesActualizadas);
      })
    );
  }
  

  // Visualizar una notificación
  visualizarNoti(id: string): Observable<any> {
    const body = { visualizado: true };
    const observable = this.http.patch(this.url + 'noti_api/notificacion/' + id + '/', body).pipe(
      catchError((error) => {
        console.error('Error en visualizarNoti:', error);
        throw error;
      })
    );
  
    // Suscribirse al observable para actualizar el BehaviorSubject
    observable.subscribe(() => {
      const notificacionesActuales = this.notificacionesSubject.getValue();

      // Actualizar el estado de la notificación visualizada
      const notificacionesActualizadas = notificacionesActuales.map((noti) =>
        noti.id === Number(id) ? { ...noti, visualizado: true } : noti
      );
  
      // Emitir las notificaciones actualizadas
      this.notificacionesSubject.next(notificacionesActualizadas);
    });
  
    return observable; // Retornar el Observable como antes
  }
  

}