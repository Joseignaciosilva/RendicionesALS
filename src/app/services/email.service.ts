import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private http: HttpClient) { }

  //Enviar email
  sendEmail(email: string, asunto: string, mensaje: string, mensajeHtml: string): Observable<any> {
    const token = localStorage.getItem('token') as string;
    const headers = new HttpHeaders({
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json'
    });
    const body = {
      asunto: asunto,
      mensaje: mensaje,
      email: email,
      mensaje_html: mensajeHtml,
    };
    return this.http.post(environment.apiSendMail, body, { headers });
  }
}
