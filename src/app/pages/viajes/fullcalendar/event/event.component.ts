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
import { Router, RouterModule } from '@angular/router';

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

@Component({
  selector: 'app-event',
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
  templateUrl: './event.component.html',
  styleUrl: './event.component.scss'
})
export class EventComponent {
  viaje: viajesData;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<EventComponent>,
    private router: Router
  ) {
    this.viaje = data;
  }

  estado : string = ''

  ngOnInit(){

  }

  verViaje(){
    console.log(this.data)
  }

  revisarBitacora(id: number, modo: string) {
    this.router.navigate(['/viajes/detallebit/', id], { queryParams: { modo: modo } });
    this.dialogRef.close();
  }
  closeDialog() {
    this.dialogRef.close();
  }

  getEstadoViaje(viaje: any): boolean {
    const fechaActual = new Date();
    const fechaDeparto = new Date(viaje.fechaDeparto);
    
    if (fechaActual < fechaDeparto) {
      return true;
    }else{
      return false;
    }
  }

  


}
