import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Fondo } from '../pages/rendiciones/fondos/interface';
import { Gasto } from '../pages/rendiciones/rendir/gastos/interface';

@Injectable({
  providedIn: 'root'
})
export class FondosService {
  constructor(private http: HttpClient) { }

/**
   * Descarga un archivo desde una URL proporcionada.
   * @param url - La URL del archivo a descargar.
   * @param filename - El nombre con el que se descargará el archivo.
*/

  // Obtener centros de costo // filtro
  obtenerCentroCosto(): Observable<any[]> {
    return this.http.get<any[]>(environment.apiCC);
  }

  // Obtener usuarios habilitados
  UsuariosHabilitados(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`, // Usando 'Token' 
      'Content-Type': 'application/json'
    });
    return this.http.get(environment.apiUrl + 'usuarios/?habilitado=true', { headers });
  }

  // Obtener jefe directo por correo
  getJefePorCorreo(correo: string): Observable<any> {
    const token = localStorage.getItem('token'); // extraigo el token del localstorage
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,  // Usando 'Token' 
      'Content-Type': 'application/json'
    });
    const body = { email: correo };  // El cuerpo de la solicitud
    return this.http.post<any>(environment.apiJefatura, body, { headers });
  }
  
  // Obtener usuarios bajo ADMINSTRACION por nombre //fondos y listar-fondos ts
  getUsuariosPorAdmin(admiNombre: string): Observable<any> {
    const token = localStorage.getItem('token') as string;  // Extraigo el token
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,  // Usando 'Token' 
      'Content-Type': 'application/json'
    });
    const body = { nombre: admiNombre };
    return this.http.post<any>(environment.apiAdministrativa, body, { headers });
  }

  //Crear el fondo y enviarlo
  crearFondo(fondoData: Fondo): Observable<Fondo> {
    return this.http.post<Fondo>(environment.apiRendiciones + 'rendiciones/fondo/', fondoData);
  }

  editarFondoPorId(id: number, fondoData: Partial<Fondo>): Observable<Fondo> {
    const token = localStorage.getItem('token') as string;
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    });
    return this.http.patch<Fondo>(`${environment.apiRendiciones}rendiciones/fondo/${id}/`, fondoData, { headers });
  }

  eliminarFondo(id: number): Observable<any> {
    return this.http.delete(`${environment.apiRendiciones}rendiciones/fondo/${id}/eliminar_fondo/`);
  }
  

  // Obtener fondo específico por ID // rendir-gastos
  obtenerFondoPorId(id: number): Observable<Fondo> {
    const token = localStorage.getItem('token') as string;
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<Fondo>(`${environment.apiRendiciones}rendiciones/fondo/${id}/`, { headers });
  }

  //Obtener todo los fondos // listar-fondos.component
  obtenerFondos(): Observable<Fondo[]> {
    return this.http.get<Fondo[]>(environment.apiRendiciones + 'rendiciones/fondo/');
  }

  // Obtener solo jefes
  jefeHabilitados(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`, // Usando 'Token' 
      'Content-Type': 'application/json'
    });
    return this.http.get(environment.apiJefes, { headers });
  }

  // cambiar 'estado' fondo
  updateEstadoFondo(fondoId: string, estado: string): Observable<any> {
    return this.http.patch<Fondo>(`${environment.apiRendiciones}rendiciones/fondo/${fondoId}/`, { estado });
  }

  obtenerFondosPorRendidor(email: string): Observable<Fondo[]> {
    return this.http.get<Fondo[]>(`${environment.apiRendiciones}rendiciones/fondo/?rendidor=${email}`);
  }

  obtenerFondosPorRol(rol: string): Observable<Fondo[]> {
    const usuario = localStorage.getItem('email'); // Suponiendo que el correo del usuario está guardado
    const params = new HttpParams().set('rol', rol).set('usuario', usuario || ''); // Asegúrate de pasar el correo del usuario autenticado

    return this.http.get<Fondo[]>(`${environment.apiRendiciones}rendiciones/fondo/`, { params });
  }
  
  
  


  // **** GAASSTOOOOSS ***** //

  crearGasto(gastoData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiRendiciones}rendiciones/gasto/`, gastoData);
  }

  // Obtener los gastos por idfondo
  obtenerGastosPorFondo(idfondo: number): Observable<Gasto[]> {
    return this.http.get<Gasto[]>(`${environment.apiRendiciones}rendiciones/gasto/getFondo/?idfondo=${idfondo}`);
  }

  editarGastoPorFondo(data: FormData): Observable<any[]> {
    return this.http.patch<any[]>(`${environment.apiRendiciones}rendiciones/gasto/${data.get('id')}/`, data);
  }

  eliminarGastoPorFondo(id: Gasto): Observable<any> {
    return this.http.delete(`${environment.apiRendiciones}rendiciones/gasto/${id}/`);
  }

  obtenerTodosLosGastos(): Observable<Gasto[]> {
    return this.http.get<Gasto[]>(`${environment.apiRendiciones}rendiciones/gasto/`);
  }

  obtenerGastoPorId(id: number): Observable<Gasto> {
    return this.http.get<Gasto>(`${environment.apiRendiciones}rendiciones/gasto/${id}/`);
  }



  getComprobanteDescargarUrl(nombreComprobante: string): string {
    // Si el nombre del comprobante ya incluye una URL completa, devuélvela tal cual
    if (nombreComprobante.startsWith('http')) {
      return nombreComprobante;
    }
    // Si no, genera la URL relativa
    console.log(nombreComprobante)
    return `${environment.apiRendiciones}/media/descargar_comprobante/${nombreComprobante}`;
    
  }

  descargarComprobante(nombreComprobante: string): Observable<Blob> {
    const url = this.getComprobanteDescargarUrl(nombreComprobante);
    return this.http.get(url, { responseType: 'blob' });
  }


  // Aprobar gasto --- VISADO JEFE
  aprobarGastoJefe(id: number): Observable<any> {
    return this.http.post<any>(`${environment.apiRendiciones}rendiciones/gasto/${id}/aprobar_jefe/`, {});
  }

  // Rechazar gasto --- VISADO JEFE
  rechazarGastoJefe(id: number): Observable<any> {
    return this.http.post<any>(`${environment.apiRendiciones}rendiciones/gasto/${id}/rechazar_jefe/`, {});
  }

  // Aprobar gasto --- VISADO ADMIN
  aprobarGastoAdmin(id: number): Observable<any> {
    return this.http.post<any>(`${environment.apiRendiciones}rendiciones/gasto/${id}/aprobar_admin/`, {});
  }

  // Rechazar gasto --- VISADO ADMIN
  rechazarGastoAdmin(id: number): Observable<any> {
    return this.http.post<any>(`${environment.apiRendiciones}rendiciones/gasto/${id}/rechazar_admin/`, {});
  }
  
  //para ver solo facturas
  obtenerFacturas(tipoComprobante: string): Observable<Gasto[]> {
    return this.http.post<Gasto[]>(`${environment.apiRendiciones}rendiciones/getfacturas/`, { tipoComprobante });
  }




  //***** cierre fondo */
  //aprobadorAdmin
  updateTotalRendido(fondoId: string, totalRendido: number): Observable<any> {
    return this.http.post<any>(`${environment.apiRendiciones}rendiciones/fondo/${fondoId}/actualizar_total_rendido/`, { totalRendido });
  }
  //aprobadorAdmin
  calcularNeteo(fondoId: string, totalRendido: number): Observable<any> {
    return this.http.post<any>(`${environment.apiRendiciones}rendiciones/fondo/${fondoId}/calcular_neteo/`, { totalRendido });
  }
  //exportar excel cierre fondo
  exportDetalleRendicion(fondoId: number): Observable<Blob> {
    return this.http.get(`${environment.apiRendiciones}api/fondos/${fondoId}/export_detalle_rendiciones`, { responseType: 'blob' });
  }
  //cierre fondo
  obtenerNeteos(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiRendiciones}rendiciones/neteo/`);
  }
  
  netearFondo(fondoId: string): Observable<any> {
    return this.http.post<any>(`${environment.apiRendiciones}rendiciones/fondo/${fondoId}/netear/`, {});
  }
  

}

