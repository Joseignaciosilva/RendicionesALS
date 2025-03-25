import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ProfileService {
  constructor(private http: HttpClient) { }
  Perfil(email: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    });
    const body = { email };
    return this.http.post(environment.apiUrl + 'profile', body, { headers });
  }

}
