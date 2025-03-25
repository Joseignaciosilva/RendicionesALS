import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginService } from 'src/app/services/login.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { MaterialModule } from 'src/app/material.module';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, NgIf, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})

export class LoginComponent {
  hide = true;
  options = this.settings.getOptions();

  constructor(
    private settings: CoreService, 
    private router: Router, 
    private loginService : LoginService, 
    private notificacionesService : NotificacionesService,
    private titleService: Title,
  ) { }

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    // Suscribirse a los cambios del campo "email"
    this.form.get('email')?.valueChanges.subscribe(value => {
      if (value) {
        const lowercasedEmail = value.toLowerCase();
        this.form.get('email')?.setValue(lowercasedEmail, { emitEvent: false });
      }
    });
    this.titleService.setTitle('Rendiciones ALS');
  }

  submit() {
    this.notificacionesService.showloading('Iniciando sesión...');

    this.loginService.login(this.form.value).subscribe({
      next: (resp: any) => {
        this.notificacionesService.removeLoading();
        
        if (resp.token) {
          // Almacenar el token en localStorage
          localStorage.setItem('token', resp.token);
        }
        if (resp.user) {
          // Almacenar los datos del usuario en localStorage
          const user = resp.user;
          localStorage.setItem('idUsuario', user.idUsuario);
          localStorage.setItem('rut', user.rut);
          localStorage.setItem('nombre', user.nombre);
          localStorage.setItem('apellidoPaterno', user.apellidoPaterno);
          localStorage.setItem('apellidoMaterno', user.apellidoMaterno || ''); // En caso de ser null, almacenamos una cadena vacía
          localStorage.setItem('email', user.email);
          localStorage.setItem('changePass', user.changePass.toString());
          localStorage.setItem('nombreCargo', user.cargo || '');
          
          this.loginService.obtenerRolUsuario(user.email).subscribe({
            next: (resp: any) => {
              console.log(resp);
              if (resp.length > 0) {
                const roles: any = [];
                resp.forEach((element: any) => {
                  roles.push(element.rol);
                });
                // Convertir el array a una cadena JSON antes de guardarlo en localStorage
                localStorage.setItem('roles', JSON.stringify(roles));  
                console.log(roles);
              } else {
                localStorage.clear();
                this.notificacionesService.reporte('failure', 'Permiso denegado', 'Actualmente no cuenta con permisos asignados, comuníquese con el área de TI.', 'OK');
                this.router.navigateByUrl('/authentication/login');
              }
            }
          })
        }
        // Redirigir a otra página después del inicio de sesión
        this.router.navigateByUrl('/');
      },
      error: (error: any) => {
        console.log('inicio sesión error: ' + error);
        this.notificacionesService.removeLoading();
        this.notificacionesService.failure( error.error.error);
      },
    
    });
  }

  toggleShowPassword() {
    this.hide = !this.hide;
  }
}
