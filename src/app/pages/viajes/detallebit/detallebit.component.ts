import { Component,Inject  } from '@angular/core';
import { MatCommonModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ActivatedRoute } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogContent } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatTabsModule} from '@angular/material/tabs';
import { ThemePalette } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import {DatePipe} from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import  Notiflix  from 'notiflix';
import { HttpParams } from '@angular/common/http';
import { ActividadesService } from 'src/app/services/actividad.service';
import { BitacoraService } from 'src/app/services/bitacora.service';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { EditbitComponent } from './editbit/editbit.component';
import { MatTableDataSource } from '@angular/material/table';
import { NotificacionesService } from 'src/app/services/notificaciones.service';


export interface viajeData {
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
  tipoMoneda: string,
  propuestaAgenda: string;
  ponos: string;
  nproyecto: string;
  clienteIntercompannia: string;
  notasExtras: string;
  estadoActual: string; //Pendiente - Pre.Aprobado - Aprobado - Rechazado
  aprobadoJefatura: string; //Empieza como pendiente, termina en aprobado o rechazado
  aprobadoGerencia: string; //Empieza como pendiente, termina en aprobado o rechazado
}

export interface actividadData{
  cliente : string,
  contactoUsuario : string,
  dia : number,
  fecha : string,
  horaActividadI : string
  horaActividadT : string
  id : number
  idUsuario : string
  idViaje: number
  lugar: string
  motivo : string
  nombreUsuario : string
  participantes : string
  resultadoEsperado : string
}

const ELEMENT_DATA: actividadData[] = [];

@Component({
  selector: 'app-detallebit',
  standalone: true,
  imports: [MatDialogModule,MaterialModule,MatIconModule,MatTabsModule,ReactiveFormsModule,FormsModule,CommonModule,MatDividerModule,MatDialogContent,TablerIconsModule,MatCommonModule,MatCardModule,MatStepperModule, MatInputModule, MatButtonModule],
  templateUrl: './detallebit.component.html',
  styleUrl: './detallebit.component.scss'
})
export class DetallebitComponent {
  constructor(private dialog: MatDialog, private bitacoraService: BitacoraService, private actividadesService: ActividadesService,
    private notificacionesService: NotificacionesService, private router: Router,private route: ActivatedRoute ,private http: HttpClient) { }
  // localhost
  // urlViajes = "http://127.0.0.1:8000/viajes/"
  // servidor
  urlViajes = "https://control.als-inspection.cl/api_rendiciones/viajes/"

  // roles
  rolesUsuario: string[] = [];

  horaActividadI: string;
  horaActividadT: string;
  actividad:any={};
  viaje: viajeData;
  cantDias : number;
  diasDeViaje:number[] = [];
  horas: any[] = [];
  cliente: string;
  lugar: string;
  participantes: string;
  motivo:string;
  resultado:string;
  idViaje : number;
  fecha : Date;
  fondo : string;
  nombreBitacora : string;
  actividades : any;
  displayedColumns: string[] = ['horaActividadI', 'horaActividadT','cliente','lugar','participantes'];
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  dia: number;
  modo: string;

  cerrarDetalle(){
    this.router.navigate(['/viajes/bitacora']);
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

    this.idViaje = this.route.snapshot.params['id'];
    this.modo = this.route.snapshot.queryParams['modo'];
    this.viaje = this.obtenerViaje(this.idViaje);

    this.actividades = this.obtenerActividades()
    this.dataSource.data = this.actividades;
    console.log(this.dataSource.data)
    console.log(this.actividades)
    console.log("data cargada")
    
}

obtenerActividades(): void {
  const apiUrl = this.urlViajes + 'bitacoras/';
  const idViaje = this.route.snapshot.params['id'];
  const params = new HttpParams().set('idViaje', idViaje);
  this.http.get(apiUrl, { params: params })
    .subscribe(data => {
      this.actividades = (data as any[]).filter((actividad: any) => actividad.idViaje === Number(idViaje));
      this.dataSource.data = this.actividades
    }, error => console.error(error));
}

  obtenerViaje(idViaje: number): any {
    fetch( `${this.urlViajes}solicitud/${idViaje}/`)
    .then(response => response.json())
    .then(data => {
      this.viaje = data;
      this.cantDias = this.calcularDiasViaje(this.viaje.fechaDeparto, this.viaje.fechaRetorno)
      for (let i = 0; i <= this.cantDias; i++){
        let dia = i;
        this.diasDeViaje.push(dia+1);
      }
      this.fondo = this.getEstadoViaje(this.viaje)
      this.nombreBitacora = this.viaje.nombreUsuario
      this.cargarHoras();
    })
    .catch(error => console.log(error));

  }
  cargarHoras() {
    for (let i = 9; i < 19; i++) {
      for (let j = 0; j < 4; j++) {
        if(i == 18 && j == 1){break}
        const hour = i < 10 ? `0${i}` : `${i}`;
        const minute = j * 15 < 10 ? `0${j * 15}` : `${j * 15}`;
        this.horas.push({
          value: `${hour}:${minute}`,
          label: `${hour}:${minute}`,
        });
      }
    }
  }
  calcularDiasViaje(fechaDeparto : string, fechaRetorno: string):number{
    let fechaInicio = new Date(fechaDeparto);
    let fechaFin = new Date(fechaRetorno);
    let diferencia = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
    let dias = Math.ceil(diferencia / (1000 * 3600 * 24));
    return dias;
  }

  getEstadoViaje(viaje: viajeData): string {
    const fechaActual = new Date();
    const fechaDeparto = new Date(viaje.fechaDeparto);
    const fechaRetorno = new Date(viaje.fechaRetorno);
    
    if (fechaActual < fechaDeparto) {
      return 'pendiente';
    }
    else if (fechaActual >= fechaDeparto && fechaActual<fechaRetorno) {
      return 'en-curso';
    } 
    else if (fechaActual >= fechaRetorno) {
      return 'finalizado';
    }
    else {
      return 'error';
    }
  }

  sumarDias(fecha: string, dias: number): Date {
    const fechaSumada = new Date(fecha);
    fechaSumada.setDate(fechaSumada.getDate() + dias);
    return fechaSumada;
  }

  getNombreUsuario(viaje: any): string{
    return viaje.nombreUsuario
  }

  filterByDay(actividades: any[], dia: number): any[] {
    return actividades.filter(actividad => actividad.dia === dia);
  }

  filterDataByDay(data: actividadData[], dia: number): actividadData[] {
    return data.filter(dato => dato.dia === dia);
  }


  agregarActividad(dia : number, fecha : Date): void{

  this.actividad.idViaje = this.route.snapshot.params['id'];
  this.actividad.idUsuario = this.viaje.contacto;
  this.actividad.nombreUsuario = this.viaje.nombreUsuario;
  this.actividad.contactoUsuario = this.viaje.contacto;
  this.actividad.horaActividadI = this.horaActividadI
  this.actividad.horaActividadT = this.horaActividadT
  this.actividad.dia=dia
  this.actividad.cliente=this.cliente;
  this.actividad.lugar=this.lugar;
  this.actividad.participantes=this.participantes;
  this.actividad.motivo=this.motivo;
  this.actividad.resultadoEsperado=this.resultado;
  this.actividad.fecha = new DatePipe('en-US').transform(fecha, 'dd/MM/yyyy');
  
  console.log("Agregando actividad...")
  this.http.post( this.urlViajes + 'bitacoras/', this.actividad).subscribe(
     (response) => {
      console.log("Actividad agregada día: "+ dia)
      console.log("Actividad agregada correctamente")
      console.log(response);
      window.location.reload();
      Notiflix.Report.success('Actividad agregada correctamente', 'La actividad se ha agregado correctamente', 'Cerrar');
      // this.router.navigate(['/home/detallebit/',this.actividad.idViaje]);
     },
     (error) => {
       console.error(error);
       console.log("No se pudo agregar la actividad")
     }
  )
    console.log("Actividad agregada día: "+ dia)
    console.log("Actividad agregada correctamente")

  }

  editarActividad(dia : number, fecha : Date, actividad : any, modo : string): void {
    this.dialog.open(EditbitComponent, {
      width: '800px',
      height:'600px' ,
      data: {dia:dia, fecha: fecha, viaje: this.viaje, actividad: actividad, modo : modo , idViaje : this.idViaje}
    });
  }

  eliminarActividad(idActividad: number): void {
    Notiflix.Confirm.show(
      'Eliminar Actividad',
      '¿Está seguro que desea eliminar esta actividad?',
      'Sí',
      'No',
      () => {
        const apiUrl = this.urlViajes + 'bitacoras/';
        this.http.delete(`${apiUrl}${idActividad}`)
          .subscribe(
            (response) => {
              console.log("Actividad eliminada correctamente");
              window.location.reload();
              Notiflix.Report.success('Actividad eliminada correctamente', 'La actividad se ha eliminado correctamente', 'Cerrar');
            },
            (error) => {
              console.error(error);
              console.log("No se pudo eliminar la actividad");
            }
          );
      },
      () => {
        console.log("Eliminación cancelada");
      }
    );
  }

  nuevaActividad(dia : number, fecha : Date): void{
    this.editarActividad(dia , fecha ,null,'Agregar')
  }

  cerrarBitacora(viaje: viajeData) { 
    Notiflix.Confirm.show(
      'Finalizar Bitacora',
      '¿Está seguro que desea finalizar esta bitácora?',
      'Sí',
      'No',
      () => {
        const apiUrl = this.urlViajes + 'solicitud/';
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
        const url = `${this.urlViajes}solicitud/${viaje.id}/`;
        this.http.put(url, body).subscribe(
          (response) => {
            console.log('Bitacora cerrada correctamente');
            Notiflix.Report.success(
              'Bitacora cerrada correctamente',
              'La bitacora quedará pendiente a aprovación de su jefe',
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


}
