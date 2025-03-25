import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, catchError, tap } from 'rxjs';
import { map } from 'rxjs';
import { Token } from '@angular/compiler';
import { coerceStringArray } from '@angular/cdk/coercion';
import { of } from 'rxjs';
export interface usuarios {
  administrador: boolean;
  apellidoMaterno: string;
  apellidoPaterno: string;
  cargo: string;
  changePass: boolean;
  email: string;
  externo: boolean;
  habilitado: boolean;
  idUsuario: number;
  last_login: Date;
  nombre: string;
  password: string;
  rut: string;
}
@Injectable({
  providedIn: 'root',
})

export class SeguridadService {
  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token') as string;
    this.listarUsuarios(token).subscribe((res) => {
      this.usuarios = res;
    });
  }
  usuarios: usuarios[] = [];
  private codigoRol: string;

  // UpdateAsignacion(mail: string, fieldName: string, fieldValue: any): Observable<any> {
  //   // let url = 'http://127.0.0.1:8000/api_solicitud/v1/asignacion/';
  //   let url = 'http://127.0.0.1:8000/viajes/asignacion/'
  //   const body = { [fieldName]: fieldValue };
  //   let headers = new HttpHeaders({
  //     'Content-Type': 'application/json',
  //   });
  
  //   return this.http.get(url, { headers: headers }).pipe(
  //     map((response: any) => {
  //       if (response && response.length > 0) {
  //         for (let item of response) {
  //           if (item.correoUser === mail) {
  //             const userId = item.id; 
  //             const patchUrl = `${url}${userId}/`; 
  //             return this.http.patch(patchUrl, body).pipe(
  //               catchError(error => {
  //                 console.error('Error al actualizar usuario:', error);
  //                 return of(null); 
  //               }),
  //               tap(() => console.log('Usuario actualizado correctamente')) 
  //             ).subscribe(); 
  //           }
  //         }
  //       }
  //       console.log('No se ha actualizado ningún usuario');
  //       return of(null); 
  //     })
  //   );
  // }

  // getUser(token: string): Observable<any> {
  //   const headers = new HttpHeaders({
  //     Authorization: `token ${token}`,
  //     'Content-Type': 'application/json',
  //   });
  //   return this.http.get(`${environment.apiUrl}usuarios/?habilitado=true`, {
  //     headers,
  //   });
  // }

  // checkMail(mail: string): Observable<boolean> {
  //   // let url = 'http://127.0.0.1:8000/api_solicitud/v1/asignacion/';
  //   let url = 'http://127.0.0.1:8000/viajes/asignacion/'
  //   let headers = new HttpHeaders({
  //     'Content-Type': 'application/json',
  //   });

  //   return this.http.get(url, { headers: headers }).pipe(
  //     map((response: any) => {
  //       if (response && response.length > 0) {
  //         for (let item of response) {
  //           if (item.correoUser === mail) {
  //             return true;
  //           }
  //         }
  //       }
  //       return false;
  //     })
  //   );
  // }

checkRol(mail: string, rol: string): Observable<boolean> {
    // localhost
    // let url = 'http://127.0.0.1:8000/viajes/asignacion/'
    // servidor
    let url = 'https://control.als-inspection.cl/api_rendiciones/viajes/asignacion/'

  let headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  return this.http.get(url, { headers: headers }).pipe(
    map((response: any) => {
      return response && response.length > 0
        ? response.find((item: any) => item.correoUser === mail && item.codigoRol === rol) !== undefined
        : false;
    })
  );
}

  listarUsuarios(token: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    });
    return this.http.get(`${environment.apiUrl}usuarios/?habilitado=true`, {
      headers,
    });
  }

  checkDeletedUsers(token: string): void {
    let usuariosConRol = [];
    let usuarios = [];
    this.listarUsuarios(token).subscribe((res) => {
    // localhost
    // let url = 'http://127.0.0.1:8000/viajes/asignacion/'
    // servidor
    let url = 'https://control.als-inspection.cl/api_rendiciones/viajes/asignacion/'

      let headers = new HttpHeaders({
        'Content-Type': 'application/json',
      });
      for (let item of res) {
        usuarios.push(item);
      }
      this.http
        .get(url, { headers: headers })
        .pipe(
          map((response: any) => {
            if (response && response.length > 0) {
              for (let item of response) {
                usuariosConRol.push(item);
              }
              console.log('Estos son los usuarios con rol: ');
              console.log('-----------------------');
              console.log(usuariosConRol);
              console.log('-----------------------');
              for (let ur of usuariosConRol) {
                let existe = false;
                for (let us of usuarios) {
                  if (ur.correoUser === us.email) {
                    existe = true;
                    break;
                  }
                }
                if (!existe) {
                  //borrar usuario
                  console.log(ur.correoUser + '  eliminandose');
                  this.http.delete(url + ur.id + '/').subscribe();
                }
              }
            }
          })
        )
        .subscribe();
    });
  }

  //le pasas un mail, te retorna el rol
  getRol(mail: string): Promise<string> {
    // localhost
    // let url = 'http://127.0.0.1:8000/viajes/asignacion/'
    // servidor
    let url = 'https://control.als-inspection.cl/api_rendiciones/viajes/asignacion/'
    
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
  
    return this.http.get(url, { headers: headers }).toPromise().then(response => {
      if (response) { // Verificar que response no sea undefined
        const asignaciones = response as any[];
        for (const asignacion of asignaciones) {
          if (asignacion.correoUser === mail) {
            this.setCodigoRol(asignacion.codigoRol)
            return this.getCodigoRol();
          }
        }
        return 'No encontrado';
      } else {
        return 'Error al obtener la respuesta';
      }
    });
  }

  setCodigoRol(codigoRol: string) {
    this.codigoRol = codigoRol;
  }

  getCodigoRol(): string {
    return this.codigoRol;
  }
}

//``
