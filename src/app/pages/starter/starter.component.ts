import { Component, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-starter',
  templateUrl: './starter.component.html',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, MatFormFieldModule, MatNativeDateModule, MatCardModule, MatButtonModule],
  styleUrls: ['./starter.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class StarterComponent {
  nombreCompleto: string = '';
  rolesUsuario: string = '';

  constructor() {
    const nombre = localStorage.getItem('nombre');
    const apellidoPaterno = localStorage.getItem('apellidoPaterno');
    const roles = localStorage.getItem('roles'); // ["ADM", "USER"]

    if (nombre && apellidoPaterno) {
      // Concatenar nombre y apellido paterno
      this.nombreCompleto = `${nombre} ${apellidoPaterno}`;
    }
    if (roles) {
      try {
        // Convertir el string JSON a un array y unirlo en una cadena
        const parsedRoles = JSON.parse(roles);
        if (Array.isArray(parsedRoles)) {
          this.rolesUsuario = parsedRoles.join(', '); 
        }
      } catch (error) {
        console.error('Error parsing roles:', error);
      }
    }
  }
}
