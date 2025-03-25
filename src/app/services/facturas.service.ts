import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Solicitud } from '../pages/facturas/solicitar/interface';

@Injectable({
  providedIn: 'root'
})
export class FacturasService {
  constructor(private http: HttpClient) { }

  // Obtener usuarios habilitados
  UsuariosHabilitados(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`, // Usando 'Token' 
      'Content-Type': 'application/json'
    });
    return this.http.get(environment.apiUrl + 'usuarios/?habilitado=true', { headers });
  }  

  jefeHabilitados(): Observable<any> {
    const token = localStorage.getItem('token') as string;
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get(environment.apiJefes, { headers });
  }

  // Obtener lista de jefes
  jefeListado(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`, // Usando 'Token' 
      'Content-Type': 'application/json'
    });
    return this.http.get(environment.apiJefes, { headers });
  }
  
  // Obtener usuario jefe de ADMINISTRACION (carlos blanco)
  getJefeAdministracion(): Observable<string> {
    return new Observable<string>((observer) => {
      this.jefeHabilitados().subscribe({
        next: (resp: any[]) => {
          const administracion = resp.find(j => j.nombre === 'ADMINISTRACION');
          observer.next(administracion ? administracion.usuarioJefe : '');
          observer.complete();
        },
        error: (error) => {
          console.error('Error al obtener jefe de ADMINISTRACION:', error);
          observer.error(error);
        }
      });
    });
  }

  // Obtener usuario jefe de GERENCIA (humberto arroyo)
  getJefeGerencia(): Observable<string> {
    return new Observable<string>((observer) => {
      this.jefeHabilitados().subscribe({
        next: (resp: any[]) => {
          const gerencia = resp.find(j => j.nombre === 'GERENCIA');
          observer.next(gerencia ? gerencia.usuarioJefe : '');
          observer.complete();
        },
        error: (error) => {
          console.error('Error al obtener jefe de GERENCIA:', error);
          observer.error(error);
        }
      });
    });
  }  

  crearSolicitud(formData: FormData): Observable<any> {
    return this.http.post<Solicitud>(environment.apiRendiciones + 'facturas/solicitud/', formData);
  }


  obtenerSolicitudPorAprobador(email: string): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${environment.apiRendiciones}facturas/solicitud/?aprobador=${email}`);
  }

  obtenerSolicitudPorEstado(estado: string): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${environment.apiRendiciones}facturas/solicitud/?estado=${estado}`);
  }

  cambiarEstadoGlosa(solicitudId: string, estado: string, glosa: string | null): Observable<any> {
    return this.http.patch<Solicitud>(`${environment.apiRendiciones}facturas/solicitud/${solicitudId}/`,
        { estado, glosa });
  }

  cambiarMontoPagado(solicitudId: string, pago: number): Observable<any> {
    return this.http.patch(`${environment.apiRendiciones}facturas/solicitud/${solicitudId}/`, { pago });
  }
  
  //Obtener toda las soli // listar.component
  obtenerSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(environment.apiRendiciones + 'facturas/solicitud/');
  }
  
  editarSolicitudPorId(id: number, solicitud: any, facturaFile?: File) {
    const formData = new FormData();
    
    // Agregar los datos del formulario al FormData
    for (const key in solicitud) {
      if (solicitud[key] !== null && solicitud[key] !== undefined) {
        formData.append(key, solicitud[key]);
      }
    }
  
    // Si hay un archivo, agregarlo también
    if (facturaFile) {
      formData.append('factura', facturaFile);
    }
  
    return this.http.put(`${environment.apiRendiciones}facturas/solicitud/${id}/`, formData);
  }
  
  eliminarSolicitud(id: number): Observable<any> {
    return this.http.delete(`${environment.apiRendiciones}facturas/solicitud/${id}/eliminar_soli/`);
  }
}