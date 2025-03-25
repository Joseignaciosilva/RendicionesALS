import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';
import { FondosService } from 'src/app/services/fondos.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { Fondo, Usuario } from '../fondos/interface';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Gasto } from '../rendir/gastos/interface';

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
  selector: 'app-facturas',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatCheckboxModule, MatDatepickerModule, 
            FormsModule, ReactiveFormsModule, CommonModule, MatDatepicker, MonedaChilenaPipe],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS },{ provide: MAT_DATE_LOCALE, useValue: 'es-CL' },],
  templateUrl: './facturas.component.html',
  styleUrl: './facturas.component.scss'
})

export class FacturasComponent {

  //tabla
  displayedColumns: string[] = ['rendidor', 'nombreComprobante', 'numeroComprobante', 'montoGasto', 'fechaGasto', 'tipoGasto','proveedor','referencia'];
  //fondos
  fondo: Fondo[] = [];
  fondoId: string | null = null;
  //data de la tabla
  dataSource = new MatTableDataSource<Gasto>([]);
  //usuarios
  usuarioOption: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  //input filtros
  inputFiltros: any = {
    fechaDesde: '',
    fechaHasta: '',
    rendidor: '',
  }
  //roles
  rolesUsuario: string[] = [];

  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private router: Router,
    private fondosService: FondosService,
    private notificacionesService: NotificacionesService,
    private cdr: ChangeDetectorRef,
  ) {}

  isTextTruncated(element: HTMLElement): boolean {
    if (!element) return false;
    return element.scrollWidth > element.clientWidth;
  }

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
    // Ejemplo: verificar si el usuario tiene roles 'ADM' o 'JEF'
    const rolesValidos = ['ADM'];
    if (!this.tieneRolNecesario(rolesValidos)) {
      this.notificacionesService.reporte(
        'failure',
        'Acceso Denegado',
        'Por ahora no cuentas con un rol privilegiado para visualizar esta página. Comuniquese con el área de TI',
        'Entendido',
        () => {// Callback al hacer clic en el botón
            this.router.navigate(['/home']); // Redirige después de 2 segundos
        }
      );
    return;
    }

    this.obtenerFondos();
    this.obtenerUsuariosHabilitados();
    this.usuariosFiltrados = this.usuarioOption;
    this.aplicarFiltros();
    this.verFacturas();
  }

  aplicarFiltros(){
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const filters = JSON.parse(filter);

      // Formatear la fecha desde y hasta del filtro a 'YYYY-MM-DD'
      const fechaDesdeFiltro = filters.fechaDesde ? new Date(filters.fechaDesde).toISOString().slice(0, 10) : null;
      const fechaHastaFiltro = filters.fechaHasta ? new Date(filters.fechaHasta).toISOString().slice(0, 10) : null;
      // Las fechas en los datos ya están en formato 'YYYY-MM-DD'
      const fechaDesdeData = data.fechaGasto;
      const fechaHastaData = data.fechaGasto;
      // Comparar las fechas formateadas
      const fechaDesdeOk = fechaDesdeFiltro ? (fechaDesdeData && fechaDesdeData >= fechaDesdeFiltro) : true;
      const fechaHastaOk = fechaHastaFiltro ? (fechaHastaData && fechaHastaData <= fechaHastaFiltro) : true;
      const fechasOk = fechaDesdeOk && fechaHastaOk ;

      //rendidor
      const rendidorOk = filters.rendidor ? data.fondo?.rendidor.toLowerCase() === filters.rendidor.toLowerCase() : true;

      return fechasOk  && rendidorOk;
    };
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  obtenerFondos(): void {
    this.fondosService.obtenerFondos().subscribe({
      next: (fondos: Fondo[]) => {
        this.fondo = fondos;
      },
      error: (error) => {
        console.error('Error al obtener los fondos', error);
      }
    });
  }

  //usuarios - rendidor
  obtenerUsuariosHabilitados(): void {
    const token = localStorage.getItem('token') as string;
    this.fondosService.UsuariosHabilitados(token).subscribe({
      next: (resp: Usuario[]) => {
        if (resp) {
          this.usuarioOption = resp;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar los datos:', error);
      }
    });
  }
        
  filtrarUsuarios(event: Event): void {
    const inputValue = (event.target as HTMLInputElement)?.value || '';
    const filtro = inputValue.toLowerCase();
    this.usuariosFiltrados = this.usuarioOption.filter(usuario =>
      `${usuario.nombre} ${usuario.apellidoPaterno}`.toLowerCase().includes(filtro)
    );
  }


  applyFilter(): void {
    this.dataSource.filter = JSON.stringify(this.inputFiltros);
    const filteredArray = this.dataSource.filteredData;
  }

  updateFechaDesde(event: any){
    this.inputFiltros.fechaDesde = event.value;
    this.applyFilter();
  }

  updateFechaHasta(event: any){
    this.inputFiltros.fechaHasta = event.value;
    this.applyFilter();
  }

  updateRendidor(email: string): void {
    this.inputFiltros.rendidor = email;
    this.applyFilter();
  }

  limpiarFiltros(): void {
    this.inputFiltros = {
    };
    this.dataSource.filter = JSON.stringify(this.inputFiltros);
  }

  verFacturas(): void {
    this.fondosService.obtenerFacturas('FACTURA').subscribe({
      next: (gastos: Gasto[]) => {
        this.dataSource.data = gastos.reverse();
      },
      error: (error) => {
        console.error('Error al obtener facturas:', error);
      }
    });
  }
  

  verComprobante(gasto: Gasto) {
    this.router.navigate(['/rendiciones/comprobante', gasto.id]); // Pasamos solo el ID del gasto
  }

}