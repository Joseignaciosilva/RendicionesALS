// mis-fondos.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { FondosService } from 'src/app/services/fondos.service';
import { Fondo } from './interface';
import { MatTableDataSource } from '@angular/material/table';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatChipsModule } from '@angular/material/chips';
import { AsyncPipe, NgForOf, NgFor } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { Title } from '@angular/platform-browser';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mis-fondos',
  standalone: true,
  imports: [AsyncPipe, NgForOf, NgFor, CommonModule, MaterialModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MonedaChilenaPipe, MatChipsModule, TablerIconsModule],
  templateUrl: './mis-fondos.component.html',
  styleUrls: ['./mis-fondos.component.scss']
})

export class MisFondosComponent implements OnInit {

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  displayedColumns: string[] = ['referencia', 'montoAsignado', 'totalRendido', 'fechaAsignado', 'estado', 'asignacion','gastos'];
  dataSource = new MatTableDataSource<Fondo>([]);

  estadoSeleccionado: string = '';
  totalCount = 0;
  //roles
  rolesUsuario: string[] = [];

  // Grupos de estados
  private readonly estadosVisado = ['en_administracion', 'en_jefatura'];
  private readonly estadosCierre = ['en_cierre'];
  private readonly estadoFinalizado = 'finalizado';

  constructor(
    private fondosService: FondosService,
    private notificacionesService: NotificacionesService,
    private titleService: Title,
    private router: Router,
    ) {}

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

    // Ejemplo: verificar si el usuario tiene roles 'ADM' o 'JEF'
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

    const email = localStorage.getItem('email');
    if (email) {
      this.cargarFondos(email);
      this.titleService.setTitle('Historial Fondos');
    }

    this.dataSource.filterPredicate = (data: Fondo, filter: string) => {
      return filter === 'all' 
        ? true
        : filter.split(',').some(grupo => data.estado.toLowerCase() === grupo.toLowerCase());
    };
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  cargarFondos(email: string): void {
    this.fondosService.obtenerFondosPorRendidor(email).subscribe(
      (fondos: Fondo[]) => {
        this.dataSource.data = fondos;
        this.totalCount = fondos.length; // Total de fondos
      },
      (error) => {
        console.error('Error al cargar los fondos:', error);
      }
    );
  }

  filtrarPorEstado(estado: string): void {
    this.estadoSeleccionado = estado;
    this.dataSource.filter = estado ? estado.trim().toLowerCase() : 'all';
  }

  filtrarPorGrupoDeEstados(grupo: number): void {
    const estados = grupo === 0
      ? 'all' // Todos los fondos
      : grupo === 1
      ? this.estadosVisado.join(',')
      : grupo === 2
      ? this.estadosCierre.join(',')
      : this.estadoFinalizado;

    this.dataSource.filter = estados;
  }

  countFondosByGrupo(grupo: number): number {
    const estados = grupo === 0
      ? 'all'
      : grupo === 1
      ? this.estadosVisado
      : grupo === 2
      ? this.estadosCierre
      : [this.estadoFinalizado];

    return this.dataSource.data.filter(fondo =>
      estados.includes(fondo.estado.toLowerCase())
    ).length;
  }

  verGastos(idfondo: number): void {
    this.router.navigate([`/rendiciones/misfondos/${idfondo}/misgastos`]);
  }
}

