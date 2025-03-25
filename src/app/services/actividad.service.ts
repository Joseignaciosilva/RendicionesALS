import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActividadesService {

  // localhost
  // private apiUrl = 'http://127.0.0.1:8000/viajes/bitacoras/'
  // servidor
  private apiUrl = 'https://control.als-inspection.cl/api_rendiciones/viajes/bitacoras/'

  constructor(private http: HttpClient) { }

  getActividades(idViaje: number): Observable<any> {
    const params = new HttpParams().set('idViaje', idViaje.toString());
    return this.http.get(this.apiUrl, { params: params });
  }

  filterActividades(actividades: any[], user: string): any[] {
    return actividades.filter(actividad => actividad.idUsuario === user);
  }

}