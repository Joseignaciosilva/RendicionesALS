import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { ChangepassService } from 'src/app/services/changepass.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

@Component({
  selector: 'app-mailresetpass',
  standalone: true,
  imports: [RouterModule, MaterialModule, NgIf, FormsModule, ReactiveFormsModule],
  templateUrl: './mailresetpass.component.html',
})
export class MailresetpassComponent {
  form !: FormGroup;

  constructor(private settings: CoreService, private router: Router, private formBuilder: FormBuilder, private changepassService: ChangepassService, private notificacionesService: NotificacionesService) {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    })
  }

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
  }

  enviar() {
    this.changepassService.ResetPass(this.form.value).subscribe({
      next: (resp: any) => {
        console.log(resp);
        this.notificacionesService.reporte('success', 'Solicitud enviada!', resp.message, 'OK');
      },
      error: (error: any) => {
        console.log(error);
        this.notificacionesService.reporte('failure', 'Error!',
          error.error.error || 'No se pudo enviar la solicitud.', 'OK');
      }
    })
  }

}
