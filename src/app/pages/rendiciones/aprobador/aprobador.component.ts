import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';
import { Fondo } from '../fondos/interface';
import { FondosService } from 'src/app/services/fondos.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { Router } from '@angular/router';
import { Gasto } from '../rendir/gastos/interface';
import { CommonModule, NgFor, NgForOf, NgIf } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { Title } from '@angular/platform-browser';


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
  selector:  'app-aprobador',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, MatNativeDateModule, MatChipsModule, MatCardModule, MatDatepickerModule,
    MatButtonModule, NgFor, CommonModule, NgForOf, MonedaChilenaPipe, NgIf],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
  ],
  templateUrl: './aprobador.component.html',
  styleUrls: ['./aprobador.component.scss']

})
export class AprobadorComponent implements OnInit {

  fondos: Fondo[] = [];
  gastos: Gasto[] = [];


  constructor(
    private fondosService: FondosService,
    private notificacionesService: NotificacionesService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    const roles = localStorage.getItem('roles');
    let rolActual = '';
  
    if (roles) {
      try {
        // Parsear el JSON almacenado en localStorage
        const parsedRoles: string[] = JSON.parse(roles);
  
        // Verificar si incluye un rol específico
        if (parsedRoles.includes('JEF')) {
          rolActual = 'JEF'; /* VisadoJEFE */
        } else if (parsedRoles.includes('GER')) {
          rolActual = 'JEF'; /* VisadoJEFE */
        } else if (parsedRoles.includes('ADM')) {
          rolActual = 'ADM'; /* VisadoADMIN */
        }
      } catch (error) {
        console.error('Error al parsear roles:', error);
      }
    this.cdr.detectChanges();
    }
  
    console.log('Rol actual:', rolActual);
  
    if (rolActual === 'JEF' || rolActual === 'GER' || rolActual === 'ADM') { //opcional para el GER ya que es lo mismo que el JEFE
      this.cargarFondosSolicitados(rolActual); // Cargar fondos según el rol
      this.cdr.detectChanges();
    } else {
      this.router.navigate(['/authentication/error']); // Redirigir si no tiene rol válido
    }
  }
  


  // Método para cargar fondos filtrados por rol
  cargarFondosSolicitados(rol: string): void {
  this.fondosService.obtenerFondosPorRol(rol).subscribe({
    next: (fondos: Fondo[]) => {
      console.log('Fondos recibidos:', fondos); // Verifica la respuesta
      this.fondos = fondos;
      this.cdr.detectChanges();
    },
    error: (error: any) => {
      console.error('Error al obtener los fondos por rol:', error);
      this.notificacionesService.failure('Ocurrió un error al cargar los fondos.');
    }
  });
}
  

  cargarGastosPorFondo(idfondo: number): void {
    this.fondosService.obtenerGastosPorFondo(idfondo).subscribe({
      next: (gastos: Gasto[]) => {
        this.gastos = [...this.gastos, ...gastos]; 
      },
      error: (error: any) => {
        console.error(`Error al obtener los gastos para el fondo ${idfondo}:`, error);
      }
    });
  }

  obtenerGastosPorFondo(idfondo: number): Gasto[] {
    return this.gastos.filter(gasto => Number(gasto.idfondo) === idfondo); 
  }
  
  verGastos(fondoId: string) {
    this.router.navigate(['/rendiciones/gastos', fondoId]);
  }
}
