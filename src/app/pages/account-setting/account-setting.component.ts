import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ProfileService } from 'src/app/services/profile.service';
import { ChangepassService } from 'src/app/services/changepass.service';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule, AbstractControl } from '@angular/forms';
import { NgIf } from '@angular/common';
import { NotificacionesService } from 'src/app/services/notificaciones.service';



@Component({
  selector: 'app-account-setting',
  standalone: true,
  imports: [MatCardModule, MatIconModule, TablerIconsModule, MatTabsModule, MatFormFieldModule, MatSlideToggleModule, MatSelectModule, MatInputModule, MatButtonModule, MatDividerModule, FormsModule, NgIf, ReactiveFormsModule,],
  templateUrl: './account-setting.component.html',
})
export class AppAccountSettingComponent implements OnInit {

  form !: FormGroup;
  hide1 = true;
  hide2 = true;
  hide3 = true;
  nombre: any
  apellidoPaterno: any
  email: any
  cargo: any;

  constructor(@Inject(ProfileService) private PerfilService: ProfileService, private formBuilder: FormBuilder, private changepassService: ChangepassService,private notificacionesService : NotificacionesService) {


    let rutFromLocalStorage = localStorage.getItem('rut');

    this.form = this.formBuilder.group({
      rut: [rutFromLocalStorage],
      actual_password: ['', [Validators.required]],
      new_password_1: ['', [Validators.required]],
      new_password: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator.bind(this)
    });

  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const newPassword1 = control.get('new_password_1')?.value;
    const newPassword2 = control.get('new_password')?.value;

    if (newPassword1 !== newPassword2) {
   
      return { 'passwordMismatch': true };
    }

    return null;
  }

  get f() {
    return this.form.controls;
  }


  enviar() {

    if (this.form.valid) {
      this.changepassService.changePass(this.form.value).subscribe({
        next: (resp: any) => {
          console.log('Respuesta del servidor:', resp);
          this.notificacionesService.reporte('success','Cambio reslizado!',resp.message,'OK');
          this.form.reset();
          // Puedes realizar otras acciones según la respuesta del servidor
        },
        error: (error: any) => {
          console.error('Error al cambiar la contraseña:', error);
          this.notificacionesService.reporte('failure','No se pudo cambiar la Contraseña',
            error.error.error || 'Error al cambiar la contraseña. Inténtalo de nuevo.','OK');
        }
      });
    } else {
      // Formulario inválido, mostrar errores si es necesario
      console.log('Formulario inválido');
    }
  }

  // Aquí podrías tener lógica para obtener las iniciales del usuario desde localStorage o cualquier otra fuente
  getInitials(): string {
    const nombre = localStorage.getItem('nombre') || '';
    const apellidoPaterno = localStorage.getItem('apellidoPaterno') || '';

    // Obtener la primera letra de nombre y apellido paterno
    const initialNombre = nombre.charAt(0).toUpperCase();
    const initialApellido = apellidoPaterno.charAt(0).toUpperCase();

    // Concatenar las iniciales
    return initialNombre + initialApellido;
  }

  async ngOnInit(): Promise<void> {

    try {
      // Retrieve the token from localStorage
      const token = localStorage.getItem('token') as string;
      const email = localStorage.getItem('email') as string;

      // Llamar al servicio para obtener los datos del perfil
      this.PerfilService.Perfil(email, token).subscribe(
        
        (resp: any) => {
          this.notificacionesService.showBlock('#profile-card')

          if (resp.profile) {
            const user = resp.profile;
            this.nombre = user.nombre;
            this.apellidoPaterno = user.apellidoPaterno;
            this.email = user.email;
            this.cargo = user.cargo || '';
            this.notificacionesService.removeBlock('#profile-card')
          }
        },
        (error) => {
          console.error('Error al obtener el perfil:', error);
        }
      );
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
    }
  }

  toggleShowPassword1() {
    this.hide1 = !this.hide1;
  }
  toggleShowPassword2() {
    this.hide2 = !this.hide2;
  }
  toggleShowPassword3() {
    this.hide3 = !this.hide3;
  }

} 
