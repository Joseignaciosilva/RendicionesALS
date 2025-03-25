import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import Notiflix from 'notiflix';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Injectable } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import {
  MatDateRangeSelectionStrategy,
  DateRange,
  MAT_DATE_RANGE_SELECTION_STRATEGY,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatDatepickerInput } from '@angular/material/datepicker';
import { TablerIconsModule } from 'angular-tabler-icons';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { EditarsolicitudComponent } from './editarsolicitud/editarsolicitud.component';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { AuthService } from 'src/app/services/AuthService.service';
import { SolicitudService } from 'src/app/services/solicitudes.service';
import { addIcons } from "ionicons";
import { NotificacionesService } from 'src/app/services/notificaciones.service';

// --------------------------IMPORTS--------------------------

let ncolumna = -1;
export interface solicitudData {
  id: number;
  nombreUsuario: string;
  contacto: string;
  oficina: string;
  departamento: string;
  dirSalida: string;
  dirDestino: string;
  fechaDeparto: string;
  fechaRetorno: string;
  fechaSolicitud: string;
  horaIda: string;
  horaVuelta: string;
  transportes: string;
  hotel: string;
  cantnoches: number;
  costonoche: number;
  costoAlimento: number;
  costoTransporte: number;
  costoHospedaje: number;
  costoTotal: number;
  tipoMoneda: string;
  propuestaAgenda: string;
  ponos: string;
  nproyecto: string;
  clienteIntercompannia: string;
  notasExtras: string;
  estadoActual: string; //Pendiente - Pre.Aprobado - Aprobado - Rechazado
  aprobadoJefatura: string; //Empieza como pendiente, termina en aprobado o rechazado
  aprobadoGerencia: string; //Empieza como pendiente, termina en aprobado o rechazado
}

export interface PeriodicElement {
  name: string;
  position: string;
  id: number;
  project: string;
  symbol: string;
  description: string;
}
@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    MaterialModule,
    MatPaginatorModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    TablerIconsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class SolicitudesComponent implements OnInit {
  @ViewChild('paginator1') paginator1: MatPaginator;
  @ViewChild('paginator2') paginator2: MatPaginator;
  ngAfterViewInit() {
    this.dataPaginator1.paginator = this.paginator1;
    this.dataPaginator2.paginator = this.paginator2;
    this.paginator1.pageSizeOptions = [5, 10, 20];
    this.paginator1.pageSize = 5;
    this.paginator2.pageSizeOptions = [5, 10, 20];
    this.paginator2.pageSize = 5;
  }

  // dataSource = ELEMENT_DATA;
  dataPaginator1 = new MatTableDataSource<any>([]);
  dataPaginator2 = new MatTableDataSource<any>([]);
  // roles
  rolesUsuario: string[] = [];
  // localhost
  // urlApi = 'http://127.0.0.1:8000/viajes/solicitud/';
  // servidor
  urlApi = 'https://control.als-inspection.cl/api_rendiciones/viajes/solicitud/';  

  // localhost
  // urlSolicitudes = "http://127.0.0.1:8000/viajes/"
  // servidor
  urlSolicitudes = 'https://control.als-inspection.cl/api_rendiciones/viajes/';  
  esUsr: boolean;
  esUsp: boolean
  esGer: boolean;
  esJef: boolean;
  esAdm : boolean;
  tieneHistorial:boolean;
  tienePendientes: boolean;
  dataSource: solicitudData[] = [];
  modifiedData = [];
  solicitudes: solicitudData[] = [];
  tituloColumns = [
    'id',
    'Nombre Usuario',
    'Departamento',
    'Fecha Solicitud',
    'Estado',
  ];
  columnsToDisplay = [
    'id',
    'nombreUsuario',
    'departamento',
    'fechaSolicitud',
    'estadoActual',
  ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: PeriodicElement | null = null;
  constructor(
    private dialog: MatDialog,
    private as: AuthService,
    private http: HttpClient,
    private ss: SolicitudService,
    private notificacionesService: NotificacionesService, 
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

    this.as.checkRol('USR').then((codigoRol: any) => {
      if (codigoRol) {
        const userEmail = localStorage.getItem('email');
        const data = { contacto: userEmail };
        fetch( this.urlSolicitudes + 'solicitudes_usuario/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((res) => {
            this.dataSource = res;
            this.dataSource.sort((a, b) => {
              return (
                new Date(b.fechaSolicitud).getTime() -
                new Date(a.fechaSolicitud).getTime()
              );
            });
            this.dataPaginator1.data = this.dataSource;
            this.dataPaginator2.data = this.dataSource;
            this.esUsr = true;

            const hasPendingRequests = this.dataSource.some((request) => request.estadoActual);
            this.tieneHistorial = hasPendingRequests;
          });
      }
    });

    this.as.checkRol('USRP').then((codigoRol: any) => {
      if (codigoRol) {
        const userEmail = localStorage.getItem('email');
        const data = { contacto: userEmail };
        fetch( this.urlSolicitudes + 'solicitudes_usuario/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((res) => {
            this.dataSource = res;
            this.dataSource.sort((a, b) => {
              return (
                new Date(b.fechaSolicitud).getTime() -
                new Date(a.fechaSolicitud).getTime()
              );
            });
            this.dataPaginator1.data = this.dataSource;
            this.dataPaginator2.data = this.dataSource;

            const hasPendingRequests = this.dataSource.some((request) => request.estadoActual);
            this.tieneHistorial = hasPendingRequests;
            this.esUsr = true;
          });
      }
    });

    this.as.checkRol('ADM').then((codigoRol: any) => {
      if (codigoRol) {
        const userEmail = localStorage.getItem('email');
        const data = { contacto: userEmail };
        fetch( this.urlSolicitudes + 'solicitudes_usuario/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((res) => {
            this.dataSource = res;
            this.dataSource.sort((a, b) => {
              return (
                new Date(b.fechaSolicitud).getTime() -
                new Date(a.fechaSolicitud).getTime()
              );
            });
            this.dataPaginator1.data = this.dataSource;
            this.esAdm = true;
            const hasPendingRequests = this.dataSource.some((request) => request.estadoActual);
            this.tieneHistorial = hasPendingRequests;
          });
          fetch( this.urlSolicitudes + 'solicitudes_pendientes/')
          .then((response) => response.json())
          .then(async (res) => {
            this.dataSource = res;
            this.dataSource.sort((a, b) => {
              return (
                new Date(b.fechaSolicitud).getTime() -
                new Date(a.fechaSolicitud).getTime()
              );
            });
            console.log(this.dataSource)
            this.dataPaginator2.data = this.dataSource;
            const hasPendingRequests = this.dataSource.some((request) => request.estadoActual);
            this.tienePendientes = hasPendingRequests;
            this.esJef = true;
          });
      }
    });

    this.as.checkRol('GER').then((codigoRol: any) => {
      if (codigoRol) {
        fetch( this.urlSolicitudes + 'solicitudes_gerente')
          .then((response) => response.json())
          .then((res) => {
            this.dataSource = res;
            this.dataSource.sort((a, b) => {
              return (
                new Date(b.fechaSolicitud).getTime() -
                new Date(a.fechaSolicitud).getTime()
              );
            });
            this.dataPaginator1.data = this.dataSource;
            this.dataPaginator2.data = this.dataSource;
            this.esGer = true;
            const hasPendingRequests = this.dataSource.some((request) => request.estadoActual);
            this.tienePendientes = hasPendingRequests;
          });
      }
    });

    this.as.checkRol('JEF').then((codigoRol: any) => {
      if (codigoRol) {
        const userEmail = localStorage.getItem('email');
        const data = { contacto: userEmail };
        fetch( this.urlSolicitudes + 'solicitudes_usuario/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((res) => {
            this.dataSource = res;
            this.dataSource.sort((a, b) => {
              return (
                new Date(b.fechaSolicitud).getTime() -
                new Date(a.fechaSolicitud).getTime()
              );
            });
            this.dataPaginator1.data = this.dataSource;
            this.esJef = true;
            const hasPendingRequests = this.dataSource.some((request) => request.estadoActual);
            this.tieneHistorial = hasPendingRequests;
          });
          fetch( this.urlSolicitudes + 'solicitudes_pendientes/')
          .then((response) => response.json())
          .then(async (res) => {
            const correosJefe = await this.ss.getCorreosJefe();
            this.dataSource = res.filter((solicitud : solicitudData) => correosJefe.includes(solicitud.contacto));
            this.dataSource.sort((a, b) => {
              return (
                new Date(b.fechaSolicitud).getTime() -
                new Date(a.fechaSolicitud).getTime()
              );
            });
            console.log(this.dataSource)
            this.dataPaginator2.data = this.dataSource;
            this.esJef = true;
            const hasPendingRequests = this.dataSource.some((request) => request.estadoActual);
            this.tienePendientes = hasPendingRequests;
          });
      }
    });
  }

  prepararData() {
    console.log('cargando data');
    for (let index = 0; index < this.dataSource.length; index++) {
      if (this.dataSource[index]) {
        console.log(this.dataSource[index]);
      }
    }
  }
  cargarColumna() {
    ncolumna = ncolumna += 1;
    if (ncolumna > 4) {
      ncolumna = 0;
    }
    return ncolumna;
  }

  editar(element: any) {
    const dialogRef = this.dialog.open(EditarsolicitudComponent, {
      data: element,
    });

    dialogRef.afterClosed().subscribe((result: solicitudData) => {
      this.ngOnInit();
    });
  }

  aprobarGerente(element: any) {
    Notiflix.Confirm.show(
      'Aprobar solicitud',
      '¿Desea aprobar esta solicitud?',
      'Si',
      'No',
      () => {
        element.aprobadoGerencia = 'Aprobado';

        if (element.aprobadoJefatura == 'Aprobado') {
          element.estadoActual = 'Aprobado';
          this.http.put(this.urlApi + element.id + '/', element).subscribe(
            (response) => {
              console.log('Solicitud actualizada');
              Notiflix.Notify.success('Solicitud aprobada como gerente', {});
            },
            (error) => {
              console.error('Error al actualizar la solicitud');
            }
          );
        } else {
          element.estadoActual = 'Pre Aprobado';
          this.http.put(this.urlApi + element.id + '/', element).subscribe(
            (response) => {
              console.log('Solicitud actualizada');
              Notiflix.Notify.success('Solicitud aprobada correctamente', {});
            },
            (error) => {
              Notiflix.Notify.failure('Error al aprobar solicitud', {});
              console.error('Error al actualizar la solicitud');
            }
          );
        }
      },
      () => {
        close;
      },
      {}
    );
  }

  aprobarJefe(element: any) {
    Notiflix.Confirm.show(
      'Aprobar solicitud',
      '¿Desea aprobar esta solicitud?',
      'Si',
      'No',
      () => {
        element.aprobadoJefatura = 'Aprobado';
        element.estadoActual = 'Pre Aprobado';
        this.http.put(this.urlApi + element.id + '/', element).subscribe(
          (response) => {
            console.log('Solicitud actualizada');
            Notiflix.Notify.success('Solicitud aprobada correctamente', {});
          },
          (error) => {
            Notiflix.Notify.failure('Error al aprobar solicitud', {});
            console.error('Error al actualizar la solicitud');
          }
        );
      },
      () => {
        close;
      },
      {}
    );
  }

  rechazarGerente(element: any) {
    Notiflix.Confirm.show(
      'Rechazar solicitud',
      '¿Desea rechazar esta solicitud?',
      'Si',
      'No',
      () => {
        element.aprobadoGerencia = 'Rechazado';

        if (element.aprobadoJefatura == 'Aprobado') {
          element.estadoActual = 'Rechazado';
          this.http.put(this.urlApi + element.id + '/', element).subscribe(
            (response) => {
              console.log('Solicitud actualizada');
              Notiflix.Notify.success('Solicitud rechazada como gerente', {});
            },
            (error) => {
              console.error('Error al actualizar la solicitud');
            }
          );
        } else {
          element.estadoActual = 'Rechazado';
          this.http.put(this.urlApi + element.id + '/', element).subscribe(
            (response) => {
              console.log('Solicitud actualizada');
              Notiflix.Notify.success('Solicitud rechazada correctamente', {});
            },
            (error) => {
              Notiflix.Notify.failure('Error al rechazar solicitud', {});
              console.error('Error al actualizar la solicitud');
            }
          );
        }
      },
      () => {
        close;
      },
      {}
    );
  }

  rechazarJefe(element: any) {
    Notiflix.Confirm.show(
      'Rechazar solicitud',
      '¿Desea rechazar esta solicitud?',
      'Si',
      'No',
      () => {
        element.aprobadoJefatura = 'Rechazado';
        element.estadoActual = 'Rechazado';
        this.http.put(this.urlApi + element.id + '/', element).subscribe(
          (response) => {
            console.log('Solicitud rechazada');
            Notiflix.Notify.success('Solicitud rechazada correctamente', {});
          },
          (error) => {
            Notiflix.Notify.failure('Error al rechazar solicitud', {});
            console.error('Error al actualizar la solicitud');
          }
        );
      },
      () => {
        close;
      },
      {}
    );
  }
}
