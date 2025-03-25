import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  constructor(private http: HttpClient) {
  }

  login(data : any) {
    return this.http.post(environment.apiUrl + 'login', JSON.stringify(data), {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe( tap( () => { localStorage.setItem('isAuth' , 'true') }))
  }

  // obtenerRolUsuario(idUsuario: any) {
  //   return this.http.get(`${environment.apiRoles}`, { params: { idUsuario }});
  // }
  
  obtenerRolUsuario(email: any) {
    const token = localStorage.getItem('token'); // extraigo el token del localstorage
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,  // Usando 'Token' 
      'Content-Type': 'application/json'
    });
    return this.http.post(`${environment.apiRoles}`, {email}, {headers});
  }
}
