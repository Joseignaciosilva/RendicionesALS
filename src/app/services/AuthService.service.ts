import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Notiflix from 'notiflix';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}
  async checkRol(rol: string): Promise<boolean> {
    const userRol: any = await this.getRolUsuario();
    if(userRol?.[0]?.rol === 'ADM' || userRol?.[0]?.rol === 'GER' || userRol?.[0]?.rol === 'JEF' || userRol?.[0]?.rol === 'USR' || userRol?.[0]?.rol === 'USRP'){
      return userRol?.[0]?.rol === rol;
    }
    else{
      this.noTieneRol()
      return false;
    }
  }

  async noTieneRol(){
    Notiflix.Notify.failure('No tiene rol para realizar esta acción, comuniquese con TI');
    this.router.navigate(['/authentication/login']); // Redirige a la página de login
  }

  async getRolUsuario(): Promise<any> {
    const token = localStorage.getItem('token');
    const apiUrl = 'https://control.als-inspection.cl/api/rendiciones_api/rol_usuario';
    const headers = new HttpHeaders({
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    });
    const data = {
      email: localStorage.getItem('email') ?? '',
    };
    const response = await this.http.post(apiUrl, data, { headers }).toPromise();
    return response;
  }
}
