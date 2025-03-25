import {Component,ChangeDetectionStrategy,Inject,TemplateRef} from '@angular/core';
import { CommonModule, DOCUMENT, NgSwitch } from '@angular/common';
import {MatDialog,MatDialogRef,MatDialogConfig,MAT_DIALOG_DATA,MatDialogModule,} from '@angular/material/dialog';
import {FormsModule,ReactiveFormsModule,UntypedFormGroup,} from '@angular/forms';
import {startOfDay,subDays,addDays,endOfMonth,isSameDay,isSameMonth,addHours,} from 'date-fns';
import { Subject } from 'rxjs';
import {CalendarDateFormatter,CalendarEvent,CalendarEventAction,CalendarEventTimesChangedEvent,CalendarModule,CalendarView,} from 'angular-calendar';
import { MaterialModule } from 'src/app/material.module';
import {MatNativeDateModule,provideNativeDateAdapter,} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CalendarMonthViewDay } from 'angular-calendar';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatDialogContent } from '@angular/material/dialog';
import { EventComponent } from './event/event.component';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { Router } from '@angular/router';


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

registerLocaleData(localeEs);

const colors: any = {
  yellow: {
    primary: '#FFDE59',
    secondary: '#FCFFC3',
  },
  blue: {
    primary: '#5d87ff',
    secondary: '#ecf2ff',
  },
  green: {
    primary: '#23CD1B',
    secondary: '#C5E7C3',
  },
};



@Component({
  selector: 'app-fullcalendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fullcalendar.component.html',
  styleUrls: ['./fullcalendar.component.scss'],
  standalone: true,
  imports: [
    MatDialogContent,
    TablerIconsModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgSwitch,
    CalendarModule,
    CommonModule,
    MatDatepickerModule,
    MatDialogModule, MatFormFieldModule
  ],
  providers: [provideNativeDateAdapter(), CalendarDateFormatter],
})
export class AppFullcalendarComponent {

  constructor(public dialog: MatDialog, @Inject(DOCUMENT) doc: any,private cdr: ChangeDetectorRef, 
            private notificacionesService: NotificacionesService, private router: Router) {   
    this.cargarData();
  }

  dataViajes: viajesData[] = [];
  // roles
  rolesUsuario: string[] = [];

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

  ngOnInit(){

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

    this.cargarData()
  }

  cargarData(): void {
    fetch(
      // localhost
      // 'http://127.0.0.1:8000/viajes/solicitud/?estadoActual=Aprobado'
      // servidor 
      'https://control.als-inspection.cl/api_rendiciones/viajes/solicitud/?estadoActual=Aprobado'
      )
    .then(response => response.json())
    .then(data => {
      this.dataViajes = data.filter((viaje: viajesData) => viaje.estadoActual === 'Aprobado' || viaje.estadoActual === 'Finalizado' )
      console.log(this.dataViajes)
      let events : CalendarEvent[]=[];
      events = this.prepData(this.dataViajes).events; // Asignar la propiedad events
      this.events = events
      this.cdr.markForCheck(); 
    })
    .catch(error => console.error(error));
  }
  events: CalendarEvent[] = [];

  prepData(dataViajes: viajesData[]) {
    return { events: dataViajes.map((item: viajesData) => ({
      title: item.nombreUsuario,
      start: addDays(new Date(item.fechaDeparto), 1),
      end: addDays(new Date(item.fechaRetorno),1),
      description: item.propuestaAgenda,
      color: this.getEstadoViaje(item)
    })) };
  }

  getEstadoViaje(viaje: any): any {
    const fechaActual = new Date();
    const fechaDeparto = new Date(viaje.fechaDeparto);
    
    if (fechaActual < fechaDeparto) {
      return colors.yellow;
    }
    if (viaje.estadoActual==='Bitacora'){
      return colors.blue;
    }
    if (viaje.estadoActual==='Finalizado'){
      return colors.green;
    } 
    return 'error'
  }

  getPendientes(dataViajes: viajesData[]): viajesData[] {
    const fechaActual = new Date();
    return dataViajes.filter((viaje: viajesData) => {
      const fechaDeparto = new Date(viaje.fechaDeparto);
      return fechaDeparto > fechaActual;
    });
  }
  
  getEnCurso(dataViajes: viajesData[]): viajesData[] {
    const fechaActual = new Date();
    return dataViajes.filter((viaje: viajesData) => {
      const fechaDeparto = new Date(viaje.fechaDeparto);
      const fechaRetorno = new Date(viaje.fechaRetorno);
      return fechaActual >= fechaDeparto && fechaActual < fechaRetorno;
    });
  }
  
  getFinalizados(dataViajes: viajesData[]): viajesData[] {
    const fechaActual = new Date();
    return dataViajes.filter((viaje: viajesData) => {
      const fechaRetorno = new Date(viaje.fechaRetorno);
      return fechaActual >= fechaRetorno;
    });
  }

  filtrarPendientes(): void {
    this.events = this.prepData(this.getPendientes(this.dataViajes)).events;
    this.cdr.markForCheck();
  }
  
  filtrarEnCurso(): void {
    this.events = this.prepData(this.getEnCurso(this.dataViajes)).events;
    this.cdr.markForCheck();
  }
  
  filtrarFinalizados(): void {
    this.events = this.prepData(this.getFinalizados(this.dataViajes)).events;
    this.cdr.markForCheck();
  }

  getTodos() {
    this.cargarData()
  }

  lastCloseResult = '';
  actionsAlignment = '';

  config: MatDialogConfig = {
    disableClose: false,
    width: '',
    height: '',
    position: {
      top: '',
      bottom: '',
      left: '',
      right: '',
    },
    data: {
      action: '',
      event: [],
    },
  };
  numTemplateOpens = 0;

  view: any = 'month';
  viewDate: Date = new Date();



  refresh: Subject<any> = new Subject();


  activeDayIsOpen = false;


  // dayClicked({ day ,date, events }: { day : any ,date: Date; events: CalendarEvent[] }): void {
  //   console.log(day);
  //   if (isSameMonth(date, this.viewDate)) {
  //     if (
  //       (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
  //       events.length === 0
  //     ) {
  //       this.activeDayIsOpen = false;
  //     } else {
  //       this.activeDayIsOpen = true;
  //       this.viewDate = date;

  //       events.forEach((event: CalendarEvent) => {
  //       });
  //     }
  //   }
  // }


  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    this.events = this.events.map((iEvent) => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd,
        };
      }
      return iEvent;
    });


  }

  formatDay(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }

  dayClicked(day: any) {
    console.log(day);
    if (isSameMonth(day.date, this.viewDate)) {
          if (
            (isSameDay(this.viewDate, day.date) && this.activeDayIsOpen === true) ||
            day.events.length === 0
          ) {
            this.activeDayIsOpen = false;
          } else {
            this.activeDayIsOpen = true;
            this.viewDate = day.date;
          }
        }
  }

  getDataDeViaje(event: CalendarEvent): any{
    for(let viaje of this.dataViajes){
      if(viaje.nombreUsuario == event.title){
        return viaje;
        }
    }
    return null
  }

  eventClicked(event: CalendarEvent): void {
    console.log(event);
    let viaje = this.getDataDeViaje(event)
    console.log(viaje)
    this.openDialog(viaje)
    
  }

    openDialog(viaje: viajesData): void {
      const dialogRef = this.dialog.open(EventComponent, {
      data: viaje,
      width: '400px',
      height:'max' ,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }

}




