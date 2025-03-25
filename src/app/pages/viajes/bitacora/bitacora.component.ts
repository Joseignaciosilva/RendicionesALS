import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import Notiflix from 'notiflix';
import { HttpClient } from '@angular/common/http';
import { viajeData } from '../detallebit/detallebit.component';
import { MatTabsModule } from '@angular/material/tabs';
import { BitacoraService } from 'src/app/services/bitacora.service';
import { AuthService } from 'src/app/services/AuthService.service';
import { addIcons } from "ionicons";
import { NotificacionesService } from 'src/app/services/notificaciones.service';

export interface viajesData {
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

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [
    MatTabsModule,
    MatCardModule,
    TablerIconsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatDividerModule,
    RouterModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
    MatToolbarModule,
  ],
  templateUrl: './bitacora.component.html',
  styleUrl: './bitacora.component.scss',
})
export class BitacoraComponent implements OnInit {
  // roles
  rolesUsuario: string[] = [];

  seleccionEstado = '';
  dataViajes: viajesData[] = [];
  dataViajeUsuario: viajesData[] = [];
  esUsr: boolean;
  esUsp: boolean;
  esGer: boolean;
  esJef: boolean;
  esAdm: boolean;
  // local
  // urlSolicitudes = "http://127.0.0.1:8000/viajes/"
  // servidor
  urlSolicitudes = "https://control.als-inspection.cl/api_rendiciones/viajes/"

  constructor(
    private bs: BitacoraService,
    private as: AuthService,
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router,
    private notificacionesService: NotificacionesService,
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

    this.bs
      .obtenerSolicitudesAprobadas()
      .then((data) => (this.dataViajes = data))
      .catch((error) => console.error(error));

    this.bs
      .obtenerSolicitudUsuario()
      .then((data) => (this.dataViajeUsuario = data))
      .catch((error) => console.error(error));

    this.as.checkRol('USR').then((codigoRol: any) => {
      if (codigoRol) {
        this.esUsr = true;
      }
    });

    this.as.checkRol('ADM').then((codigoRol: any) => {
      if (codigoRol) {
        this.esAdm = true;
      }
    });

    this.as.checkRol('GER').then((codigoRol: any) => {
      if (codigoRol) {
        this.esGer = true;
      }
    });

    this.as.checkRol('JEF').then((codigoRol: any) => {
      if (codigoRol) {
        this.esJef = true;
      }
    });
  }

  getEstadoViaje(viaje: any): string {
    const fechaActual = new Date();
    const fechaDeparto = new Date(viaje.fechaDeparto);
    if (fechaActual < fechaDeparto) {
      return 'pendiente';
    }
    if (fechaActual >= fechaDeparto ) {
      if(viaje.estadoActual=='Bitacora'){
        return 'finalizado'
      }
      return 'en-curso';
    }
    return 'error';
  }

  viajePendiente(viaje: any): boolean {
    return this.getClaseEstadoViaje(viaje) == 'bg-pendiente';
  }

  getClaseEstadoViaje(viaje: any): string {
    const estado = this.getEstadoViaje(viaje);

    switch (estado) {
      case 'pendiente':
        return 'bg-pendiente';
      case 'en-curso':
        return 'bg-en-curso';
      case 'finalizado':
        return 'bg-finalizado';
      default:
        return 'bg-error';
    }
  }

  revisarBitacora(id: number, modo: string) {
    this.router.navigate(['/viajes/detallebit/', id], {
      queryParams: { modo: modo },
    });
  }

  cerrarBitacora(viaje: viajeData) { 
    Notiflix.Confirm.show(
      'Finalizar Bitacora',
      '¿Está seguro que desea finalizar esta bitácora?',
      'Sí',
      'No',
      () => {
        const apiUrl = this.urlSolicitudes + 'solicitud/';
        const body = {
          aprobadoGerencia: viaje.aprobadoGerencia,
          aprobadoJefatura: viaje.aprobadoJefatura,
          cantnoches: viaje.cantnoches,
          clienteIntercompannia: viaje.clienteIntercompannia,
          contacto: viaje.contacto,
          costoAlimento: viaje.costoAlimento,
          costoHospedaje: viaje.costoHospedaje,
          costoTotal: viaje.costoTotal,
          costoTransporte: viaje.costoTransporte,
          costonoche: viaje.costonoche,
          departamento: viaje.departamento,
          dirDestino: viaje.dirDestino,
          dirSalida: viaje.dirSalida,
          fechaDeparto: viaje.fechaDeparto,
          fechaRetorno: viaje.fechaRetorno,
          fechaSolicitud: viaje.fechaSolicitud,
          horaIda: viaje.horaIda,
          horaVuelta: viaje.horaVuelta,
          hotel: viaje.hotel,
          nombreUsuario: viaje.nombreUsuario,
          notasExtras: viaje.notasExtras,
          nproyecto: viaje.nproyecto,
          oficina: viaje.oficina,
          ponos: viaje.ponos,
          propuestaAgenda: viaje.propuestaAgenda,
          tipoMoneda: viaje.tipoMoneda,
          transportes: viaje.transportes,
          estadoActual: 'Bitacora',
        };
        const url = `${this.urlSolicitudes}solicitud/${viaje.id}/`;
        this.http.put(url, body).subscribe(
          (response) => {
            console.log('Bitacora aprobada correctamente');
            Notiflix.Report.success(
              'Bitacora cerrada correctamente',
              'La bitacora se ha cerrado correctamente. Bitacora quedará pendiente a aprobación de su jefe',
              'Cerrar'
            );
            this.ngOnInit();
          },
          (error) => {
            console.error(error);
            console.log('No se pudo aprobar la bitacora');
          }
        );
      },
      () => {
        console.log('Finalización cancelada');
      }
    );
  }

  aprobarBitacora(viaje: viajeData) {
    Notiflix.Confirm.show(
      'Aprobar Bitacora',
      '¿Está seguro que desea aprobar esta bitácora?',
      'Sí',
      'No',
      () => {
        const apiUrl = this.urlSolicitudes + 'solicitud/';
        const body = {
          aprobadoGerencia: viaje.aprobadoGerencia,
          aprobadoJefatura: viaje.aprobadoJefatura,
          cantnoches: viaje.cantnoches,
          clienteIntercompannia: viaje.clienteIntercompannia,
          contacto: viaje.contacto,
          costoAlimento: viaje.costoAlimento,
          costoHospedaje: viaje.costoHospedaje,
          costoTotal: viaje.costoTotal,
          costoTransporte: viaje.costoTransporte,
          costonoche: viaje.costonoche,
          departamento: viaje.departamento,
          dirDestino: viaje.dirDestino,
          dirSalida: viaje.dirSalida,
          fechaDeparto: viaje.fechaDeparto,
          fechaRetorno: viaje.fechaRetorno,
          fechaSolicitud: viaje.fechaSolicitud,
          horaIda: viaje.horaIda,
          horaVuelta: viaje.horaVuelta,
          hotel: viaje.hotel,
          nombreUsuario: viaje.nombreUsuario,
          notasExtras: viaje.notasExtras,
          nproyecto: viaje.nproyecto,
          oficina: viaje.oficina,
          ponos: viaje.ponos,
          propuestaAgenda: viaje.propuestaAgenda,
          tipoMoneda: viaje.tipoMoneda,
          transportes: viaje.transportes,
          estadoActual: 'Finalizado',
        };
        const url = `${this.urlSolicitudes}solicitud/${viaje.id}/`;
        this.http.put(url, body).subscribe(
          (response) => {
            console.log('Bitacora aprobada correctamente');
            Notiflix.Report.success(
              'Bitacora aprobada correctamente',
              'La bitacora se ha aprobado correctamente',
              'Cerrar'
            );
            this.ngOnInit();
          },
          (error) => {
            console.error(error);
            console.log('No se pudo aprobar la bitacora');
          }
        );
      },
      () => {
        console.log('Finalización cancelada');
      }
    );
  }

  // rechazarBitacora() {
  //   Notiflix.Confirm.show(
  //     'Rechazar Bitacora',
  //     '¿Está seguro que desea rechazar esta bitácora?',
  //     'Sí',
  //     'No',
  //     () => {
  //       Notiflix.Report.success(
  //         'Bitacora rechazada',
  //         'La bitacora se ha rechazado y se notificará al usuario para su corrección',
  //         'Cerrar'
  //       );

  //       this.ngOnInit();
  //     }
  //   );
  // }
}
