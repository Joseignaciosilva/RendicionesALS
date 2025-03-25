import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { FormGroup, FormControl, Validators, FormBuilder, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { ChangepassService } from 'src/app/services/changepass.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-resetpass',
  standalone: true,
  imports: [RouterModule, MaterialModule, NgIf, FormsModule, ReactiveFormsModule],
  templateUrl: './resetpass.component.html',
})
export class ResetpassComponent {
  form !: FormGroup;
  hide1 = true;
  hide2 = true;

  constructor(private settings: CoreService, private router: Router, private formBuilder: FormBuilder, private changepassService: ChangepassService, private notificacionesService: NotificacionesService, private route: ActivatedRoute) { }
  
  ngOnInit(): void {
    // Obtén el parámetro 'rut' de la URL
    this.route.queryParams.subscribe(params => {
      let rutFromQueryParams = params['rut'];

      console.log(rutFromQueryParams)
      this.form = this.formBuilder.group({
        rut: [rutFromQueryParams],
        new_password_1: ['', [Validators.required]],
        new_password: ['', [Validators.required]]
      }, {
        validators: this.passwordMatchValidator.bind(this)
      });
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
    console.log(this.form.value);
    if (this.form.valid) {
      this.changepassService.changePass(this.form.value).subscribe({
        next: (resp: any) => {
          console.log('Respuesta del servidor:', resp);
          this.notificacionesService.reporte('success', 'Cambio reslizado!', resp.message, 'OK');
          //this.form.reset();
          // Puedes realizar otras acciones según la respuesta del servidor
          this.router.navigate(['/authentication/login']);
        },
        error: (error: any) => {
          console.error('Error al cambiar la contraseña:', error);
          this.notificacionesService.reporte('failure', 'No se pudo cambiar la Contraseña',
            error.error.error || 'Error al cambiar la contraseña. Inténtalo de nuevo.', 'OK');
        }
      });
    } else {
      // Formulario inválido, mostrar errores si es necesario
      console.log('Formulario inválido');
    }
  }

  toggleShowPassword1() {
    this.hide1 = !this.hide1;
  }
  toggleShowPassword2() {
    this.hide2 = !this.hide2;
  }
}
