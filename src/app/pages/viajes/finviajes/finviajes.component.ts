import { usuarios } from './../../../services/seguridad.service';
import {
  Component,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
} from '@angular/core';
import {
  MatTableDataSource,
  MatTableModule,
  MatTable,
} from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { IconTable } from 'angular-tabler-icons/icons';
import { IconTableRow } from 'angular-tabler-icons/icons';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Router } from '@angular/router';
import { MatPaginatorModule } from '@angular/material/paginator';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorDefaultOptions,
} from '@angular/material/paginator';
import { ChangeDetectorRef } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexYAxis,
  ApexLegend,
  ApexXAxis,
  ApexTooltip,
  ApexTheme,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

export type ChartOptionsD = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: any;
  theme: ApexTheme;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  colors: string[];
  markers: any;
  grid: ApexGrid;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  labels: string[];
};

export interface bitacoraData {
  id: number;
  nombreUsuario: string;
  contacto: string;
  oficina: string;
  fechaSolicitud: string;
  fechaDeparto: string;
  fechaRetorno: string;
  costoTotal: number;
  action: string;
}

@Component({
  selector: 'app-finviajes',
  standalone: true,
  imports: [
    NgApexchartsModule,
    MatPaginatorModule,
    TablerIconsModule,
    MatTable,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    CommonModule,
    MatInputModule,
  ],
  templateUrl: './finviajes.component.html',
  styleUrl: './finviajes.component.scss',
})
export class FinviajesComponent {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  displayedColumns: string[] = [
    'nombreUsuario',
    'oficina',
    'fechaSolicitud',
    'fechaDeparto',
    'fechaRetorno',
    'costoTotal',
    'action',
  ];
  ELEMENT_DATA: bitacoraData[] = [];
  dataSource = new MatTableDataSource<bitacoraData>([]);
  paginator: MatPaginator;
  gastosUsuariosDataSource = new MatTableDataSource<any>([]);
  // roles
  rolesUsuario: string[] = [];

  public doughnutChartOptions: Partial<ChartOptionsD> | any;
  @ViewChild(MatPaginator) paginator1: MatPaginator;
  @ViewChild(MatPaginator) gastosUsuariosPaginator: MatPaginator;
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator1;
    this.paginator1.pageSizeOptions = [5, 10, 20];
    this.paginator1.pageSize = 5;
    this.gastosUsuariosDataSource.paginator = this.gastosUsuariosPaginator;
    this.gastosUsuariosPaginator.pageSizeOptions = [1, 10, 20];
    this.gastosUsuariosPaginator.pageSize = 5;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private notificacionesService: NotificacionesService,
  ) {
    this.doughnutChartOptions = {
      series: [],
      labels: ['Hace 2 meses', 'Hace 1 mes', 'Este mes'],
      chart: {
        id: 'donut-chart',
        type: 'donut',
        height: 350,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        foreColor: '#adb0bb',
      },
      dataLabels: {
        enabled: true,
      },
      plotOptions: {
        pie: {
          donut: {
            show: true,
            size: '70px',
          },
        },
      },
      legend: {
        show: true,
        position: 'bottom',
        width: '50px',
        labels: ['Hace 2 meses', 'Hace 1 mes', 'Este mes'], // Agrega esta línea
      },
      colors: ['#3DC2EC', '#4B70F5', '#4C3BCF'],
      tooltip: {
        theme: 'dark',
        fillSeriesColor: false,
      },
    };
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
    // Ejemplo: verificar si el usuario tiene roles 'ADM' o 'JEF'
    const rolesValidos = ['ADM', 'JEF', 'GER'];
    if (!this.tieneRolNecesario(rolesValidos)) {
      this.notificacionesService.reporte(
        'failure',
        'Acceso Denegado',
        'Por ahora no cuentas con un rol privilegiado para visualizar esta página. Comuniquese con el área de TI',
        'Entendido',
        () => {
            this.router.navigate(['/home']); 
        }
      );
    return;
    }

    this.http
      .get(
        // localhost
        // 'http://127.0.0.1:8000/viajes/solicitud/'
        // servidor
        'https://control.als-inspection.cl/api_rendiciones/viajes/solicitud/'
      )
      .subscribe((response: any) => {
        const filteredData = response.filter(
          (item: any) => item.estadoActual === 'Finalizado'
        );
        const gastosUsuarios: any[] = [];
        filteredData.forEach((item: any) => {
          if (item.nombreUsuario && item.costoTotal) {
            // Verificar que existan las propiedades usuario y costo
            const userName = item.nombreUsuario;
            const cost = item.costoTotal;
            const existingUser = gastosUsuarios.find(
              (user) => user.nombreUsuario === userName
            );
            if (existingUser) {
              existingUser.totalGastado += cost;
            } else {
              gastosUsuarios.push({
                nombreUsuario: userName,
                totalGastado: cost,
              });
            }
          }
        });
        this.gastosUsuariosDataSource.data = gastosUsuarios;
      });

    this.http
      .get(
        // localhost
        // 'http://127.0.0.1:8000/viajes/solicitud/'
        // servidor
        'https://control.als-inspection.cl/api_rendiciones/viajes/solicitud/'
      )
      .subscribe((response: any) => {
        const filteredData = response.filter(
          (item: any) => item.estadoActual === 'Finalizado'
        );
        this.ELEMENT_DATA = filteredData;
        this.dataSource.data = this.ELEMENT_DATA;

        let series: Number[] = [];
        const fechaActual = new Date();
        const mesActual = fechaActual.getMonth() + 1;
        let unmes = 0;
        let dosmes = 0;
        let tresmes = 0;
        for (let i in this.dataSource.data) {
          const fechaSolicitud = Date.parse(
            this.dataSource.data[i].fechaSolicitud
          );
          const fechaSolicitudDate = new Date(fechaSolicitud);
          fechaSolicitudDate.setDate(fechaSolicitudDate.getDate() + 1);
          const mesSolicitud = fechaSolicitudDate.getMonth() + 1;
          switch (mesSolicitud - mesActual) {
            case -2:
              tresmes += 1;
              break;
            case -1:
              dosmes += 1;
              break;
            case 0:
              unmes += 1;
              break;
          }
        }
        series.push(tresmes);
        series.push(dosmes);
        series.push(unmes);
        this.doughnutChartOptions.series = series;
      });
  }

  action(element: any) {
    console.log(element.id);
  }

  revisarBitacora(id: number, modo: string) {
    this.router.navigate(['/viajes/detallebit/', id], {
      queryParams: { modo: modo },
    });
  }

  handlePageEvent(event: any) {
    this.dataSource.paginator = this.paginator;
    this.dataSource.data = this.ELEMENT_DATA.slice(
      event.pageIndex * event.pageSize,
      (event.pageIndex + 1) * event.pageSize
    );
  }

  handleGastosPageEvent(event: any) {
    this.gastosUsuariosDataSource.paginator = this.paginator;
    this.gastosUsuariosDataSource.data =
      this.gastosUsuariosDataSource.data.slice(
        event.pageIndex * event.pageSize,
        (event.pageIndex + 1) * event.pageSize
      );
  }
}
