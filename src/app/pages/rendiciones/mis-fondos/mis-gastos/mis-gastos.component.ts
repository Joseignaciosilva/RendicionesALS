import { Component, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import { FondosService } from 'src/app/services/fondos.service';
import { NotiService } from 'src/app/services/noti.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { Gasto } from '../../rendir/gastos/interface';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CommonModule } from '@angular/common';
import { MatDatepicker } from '@angular/material/datepicker';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';

export const CHILEAN_DATE_FORMATS = {
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
  selector: 'app-mis-gastos',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, CommonModule, MatDatepicker, MonedaChilenaPipe],
  providers: [
      provideNativeDateAdapter(),
      { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS },
      { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
  ],
  templateUrl: './mis-gastos.component.html',
  styleUrl: './mis-gastos.component.scss'
})
export class MisGastosComponent implements OnInit {

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  displayedColumns: string[] = ['numeroServicio', 'nombreComprobante', 'numeroComprobante', 'tipoComprobante', 'proveedor','tipoGasto', 'descripcion', 'fechaGasto', 'montoGasto'];
  dataSource = new MatTableDataSource<Gasto>([]);

  idFondo: number
  gastos: Gasto[] =[]
  
  constructor(
  private router: Router,
  private route: ActivatedRoute,
  private fondoService: FondosService,
  ){

  }

  isTextTruncated(element: HTMLElement): boolean {
    if (!element) return false;
    return element.scrollWidth > element.clientWidth;
  }
  
  ngOnInit(): void {
      this.idFondo = Number(this.route.snapshot.paramMap.get('id'));
      this.cargarGastos(this.idFondo)
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  cargarGastos(idFondo: number): void {
    this.fondoService.obtenerGastosPorFondo(idFondo).subscribe(
      (gastos: Gasto[]) => {
        this.gastos = gastos;
        // Actualizar la dataSource de la tabla
        this.dataSource.data = this.gastos;
      },
      (error) => {
        console.error('Error al cargar los gastos:', error)
      }
    )
  }

  verComprobante(gasto: Gasto) {
    this.router.navigate(['/rendiciones/comprobante', gasto.id]); // Pasamos solo el ID del gasto
  }

  volver(): void {
    this.router.navigate(['/rendiciones/misfondos/']); 
  }
}
