import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FondosService } from 'src/app/services/fondos.service';
import { Fondo } from '../fondos/interface';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { Observable } from 'rxjs';
import { AsyncPipe, CommonModule, NgFor, NgForOf } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';
import { MatChipsModule } from '@angular/material/chips';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, provideNativeDateAdapter } from '@angular/material/core';
import { EmailService } from 'src/app/services/email.service';
import { NotiService } from 'src/app/services/noti.service';

export const CHILEAN_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'rendidor',
  standalone: true,
  imports: [AsyncPipe, NgForOf, NgFor, CommonModule, MaterialModule, MatCardModule, MatFormFieldModule, MatInputModule,
           MatButtonModule,MonedaChilenaPipe, MatChipsModule, TablerIconsModule],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS },{ provide: MAT_DATE_LOCALE, useValue: 'es-CL' },],
  templateUrl: './rendidor.component.html',
  styleUrls: ['./rendidor.component.scss']
})
export class RendidorComponent implements OnInit {

  fondos: Fondo[] = []; // Aquí almacenaremos los fondos solicitados
  //roles
  rolesUsuario: string[] = [];

  constructor(private fondosService: FondosService, 
    private notificacionesService: NotificacionesService,
    private notiService: NotiService,
    private emailService: EmailService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {
  }

  //cargar y parsear roles del localStorage
  cargarRoles(): void {
    const rolesGuardados = localStorage.getItem('roles');
    if (rolesGuardados) {
      try {
        this.rolesUsuario = JSON.parse(rolesGuardados);
      } catch (error) {
        console.error('Error al cargar roles:', error);
        this.rolesUsuario = [];
      }
    }
  }

  // Método para verificar si tiene al menos un rol necesario
  tieneRolNecesario(rolesRequeridos: string[]): boolean {
    return this.rolesUsuario.some((rol) => rolesRequeridos.includes(rol));
  }

  ngOnInit(): void {

    this.cargarRoles();
    // Ejemplo: verificar si el usuario tiene roles necesarios
    const rolesValidos = ['USR', 'USRP', 'JEF', 'GER', 'ADM'];
    if (!this.tieneRolNecesario(rolesValidos)) {
      this.notificacionesService.reporte(
        'failure',
        'Acceso Denegado',
        'Por ahora no cuentas con un rol privilegiado para visualizar esta página. Comuniquese con el área de TI',
        'Entendido',
        () => {// Callback al hacer clic en el botón
            this.router.navigate(['/home']); 
        }
      ); return};

    this.cargarFondosSolicitados();
  }

  //mostrar todo los fondos de ese email
  cargarFondosSolicitados(): void {
    const email = localStorage.getItem('email');
    if (email) {
      this.fondosService.obtenerFondosPorRendidor(email).subscribe({
        next: (fondos: Fondo[]) => {
          this.fondos = fondos.filter(
            (fondo) => fondo.estado === 'pendiente' || fondo.estado === 'en_rendicion'
          );
        },
        error: (error: any) => {
          console.error('Error al cargar los fondos:', error);
          this.notificacionesService.failure('Ocurrió un error al obtener los fondos.');
        }
      });
    }
  }

  //componente de "Rendir Gastos" con el ID del fondo
  rendirGasto(fondoId: string) {
    this.router.navigate(['/rendiciones/rendir', fondoId])
  }

}
