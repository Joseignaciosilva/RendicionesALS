import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Notiflix from 'notiflix';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class SolicitudService {
  constructor(private http: HttpClient, private router: Router) {}


  async getCorreosJefe(){
    const email = localStorage.getItem('email');
    const token = localStorage.getItem('token'); // Obtener el token de autorización
    const body = { email: email };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `token ${token}` // Agregar el token de autorización en el header
    });
    return this.http.post('https://control.als-inspection.cl/api/rendiciones_api/dependencia_jefatura', body, { headers })
      .toPromise()
      .then((response: any) => {
        if (response[0].usuarios && Array.isArray(response[0].usuarios)) {
          return response[0].usuarios.map((usuario: any) => usuario.usuario.email);
        } else {
          console.log('La respuesta no contiene la propiedad usuarios o es un arreglo vacío');
          return [];
        }
      })
      .catch((error: any) => {
        console.error(error);
        return [];
      });
  }
}
