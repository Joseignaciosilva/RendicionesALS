import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {

  // private apiUrl = 'https://control.als-inspection.cl/api_rendiciones/api_solicitud/v1/solicitud/';
  // localhost
  // private apiUrl = 'http://127.0.0.1:8000/viajes/solicitud/';
  // servidor
  private apiUrl = 'https://control.als-inspection.cl/api_rendiciones/viajes/solicitud/'

  constructor(private http: HttpClient) { }

  obtenerSolicitudesAprobadas(): Promise<any> {
    return this.http.get(`${this.apiUrl}?estadoActual=Aprobado`)
      .toPromise()
      .then(response => response as any)
      .then(data => data.filter((viaje: any) => viaje.estadoActual === 'Aprobado' || viaje.estadoActual === 'Bitacora'))
      .catch(error => console.error(error));
  }

  obtenerSolicitudUsuario(): Promise<any> {
    let email = localStorage.getItem('email')
    return this.http.get(`${this.apiUrl}?estadoActual=Aprobado`)
      .toPromise()
      .then(response => response as any)
      .then(data => data.filter((viaje: any) => (viaje.estadoActual === 'Aprobado' || viaje.estadoActual === 'Bitacora') && viaje.contacto === email))
      .catch(error => console.error(error));
  }

  obtenerBitacorasCerradas():Promise<any>{
    return this.http.get(`${this.apiUrl}?estadoActual=Bitacora`)
      .toPromise()
      .then(response => response as any)
      .then(data => data.filter((viaje: any) => viaje.estadoActual === 'Bitacora'))
      .catch(error => console.error(error));
  }

}