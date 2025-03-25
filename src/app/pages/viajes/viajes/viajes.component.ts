import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import Notiflix from 'notiflix';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
import  NgxMaskModule  from 'ngx-mask';
import { NgModule } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { image } from 'html2canvas/dist/types/css/types/image';
import { addIcons } from "ionicons";
import { NotificacionesService } from 'src/app/services/notificaciones.service';
const today = new Date();
const month = today.getMonth();
const year = today.getFullYear();

@Component({
  selector: 'app-viajes',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './viajes.component.html',
  styleUrl: './viajes.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ViajesComponent {
  providers: [CurrencyPipe]
  solFormGroup: FormGroup;
  datos1: any = [];
  datos2: any = [];
  valorSeleccionado: any = null;
  departamentoSeleccionado: any = null;
  horaIda: string;
  horaVuelta: string;
  horas: any[] = [];
  totalTransportes: number;
  totalHospedajes: number;
  totalAlimentos: number;
  costonoche: number;
  cantnoches: number;
  oficina: any;
  transportesUsados: string;
  costoTotal: number;
  radioValue: number;
  aceptaCondiciones: false;
  tipoMoneda: String;
  nombreUsuario : String;
  apellidoUsuario : String

  // roles
  rolesUsuario: string[] = [];

  constructor(
    private dateAdapter: DateAdapter<Date>,
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private notificacionesService: NotificacionesService,
  ) {
    this.dateAdapter.setLocale('es-ES');

    this.solFormGroup = this.fb.group({
      nombreUsuario: [(localStorage.getItem('nombre') +' ' + localStorage.getItem('apellidoPaterno')), Validators.required],
      contacto: [localStorage.getItem('email') ?? '', Validators.required],
      oficina: ['', Validators.required],
      departamento: ['', Validators.required],
      dirSalida: ['', Validators.required],
      dirDestino: ['', Validators.required],
      fechaDeparto: [new Date(), Validators.required],
      fechaRetorno: [new Date(), Validators.required],
      fechaSolicitud: [new Date(), Validators.required],
      horaIda: ['', Validators.required],
      horaVuelta: ['', Validators.required],
      transportes: ['', Validators.required],
      hotel: ['', Validators.required],
      cantnoches: ['', Validators.required],
      costonoche: ['', Validators.required],
      costoAlimento: ['', Validators.required],
      costoHospedaje: ['', Validators.required],
      costoTransporte: ['', Validators.required],
      costoTotal: ['', Validators.required],
      tipoMoneda: ['CLP', Validators.required],
      propuestaAgenda: ['', Validators.required],
      ponos: ['', Validators.required],
      nproyecto: ['', Validators.required],
      clienteIntercompannia: ['', Validators.required],
      notasExtras: ['', Validators.required],
      estadoActual: ['Pendiente', Validators.required], //Pendiente - Pre.Aprobado - Aprobado - Rechazado
      aprobadoJefatura: ['Pendiente', Validators.required], //Empieza como pendiente, termina en aprobado o rechazado
      aprobadoGerencia: ['Pendiente', Validators.required] //Empieza como pendiente, termina en aprobado o rechazado
      
    });
  }

  // localhost
  // private apiUrl = 'http://127.0.0.1:8000/viajes/solicitud/';
  // servidor
  private apiUrl = 'https://control.als-inspection.cl/api_rendiciones/viajes/solicitud/';

  // URL api regiones
  private regUrl =
    'https://gist.githubusercontent.com/rhernandog/7d055482f5cc803852a762de873bea62/raw/2bed9aed94ab644533b5e624a4e8f165a4650d48/regiones-provincias-comunas.json';
  // URL api departamentos
  private depUrl =
    'https://control.als-inspection.cl/api_rendiciones/rendiciones/centrocostos/';
  loadData() {
    this.http.get(this.regUrl).subscribe((res) => {
      this.datos1 = res;
    });

    this.http.get(this.depUrl).subscribe((res) => {
      this.datos2 = res;
    });
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

    this.loadData();
    this.cargarHoras();
    this.radioValue = 2;
  }

  transporte = this.fb.group({
    avion: false,
    avionmonto: '0',
    vehiculo: false,
    vehiculomonto: '0',
    ferry: false,
    ferrymonto: '0',
    tren: false,
    trenmonto: '0',
    taxi: false,
    taximonto: '0',
    otro: false,
    otromonto: '0',
    transportes: [],
  });
  hospedaje = this.fb.group({
    hotel: false,
    hotelnombre: '',
    cantnoches: 0,
    costonoche: 0,
    costoHospedaje: 0,
    costoAlimento: 0,
  });
  avionCheck = false;
  vehiculoCheck = false;
  ferryCheck = false;
  trenCheck = false;
  taxiCheck = false;
  otroCheck = false;
  hospedajeCheck = false;

  calcularTotalTransporte(): number {
    let total = 0;
    let nombresTransportes = [];
    if (this.transporte.value.avion) {
      total += Number(this.transporte.value.avionmonto);
      nombresTransportes.push('Avión'); // Agregamos 'avion' al arreglo
    }
    if (this.transporte.value.vehiculo) {
      total += Number(this.transporte.value.vehiculomonto);
      nombresTransportes.push('Vehículo'); // Agregamos 'ehiculo' al arreglo
    }
    if (this.transporte.value.ferry) {
      total += Number(this.transporte.value.ferrymonto);
      nombresTransportes.push('Ferry'); // Agregamos 'ferry' al arreglo
    }
    if (this.transporte.value.tren) {
      total += Number(this.transporte.value.trenmonto);
      nombresTransportes.push('Tren'); // Agregamos 'tren' al arreglo
    }
    if (this.transporte.value.taxi) {
      total += Number(this.transporte.value.taximonto);
      nombresTransportes.push('Taxi'); // Agregamos 'taxi' al arreglo
    }
    if (this.transporte.value.otro) {
      total += Number(this.transporte.value.otromonto);
      nombresTransportes.push('Otro'); // Agregamos 'otro' al arreglo
    }
    this.totalTransportes = total;
    this.transportesUsados = nombresTransportes.join(', ');
    if(total==0){
      console.log('No se asigna monto para transportes');
      this.solFormGroup.get('transportes')?.setValue('Ninguno');}
    else{
      console.log('El monto total de transporte es: ' + total);
      this.solFormGroup.get('transportes')?.setValue(this.transportesUsados);
      console.log('Los transportes usados son: ' + nombresTransportes.join(', '));
    }
    this.solFormGroup.get('costoTransporte')?.setValue(total);
    return total;
  }

  calcularTotalHospedaje(): number {
    let total = 0;
    if (this.hospedaje.value.hotelnombre) {
      if (this.hospedaje.value.cantnoches) {
        if (this.hospedaje.value.costonoche) {
          total =
            this.hospedaje.value.cantnoches * this.hospedaje.value.costonoche;
          this.hospedaje.value.costoHospedaje = total;
          console.log('el monto total de hospedaje es: ' + total);
          this.totalHospedajes = total;
          this.solFormGroup.get('costoHospedaje')?.setValue(total);
          this.solFormGroup
            .get('hotel')
            ?.setValue(this.hospedaje.value.hotelnombre);
          this.solFormGroup
            .get('cantnoches')
            ?.setValue(this.hospedaje.value.cantnoches);
          this.solFormGroup
            .get('costonoche')
            ?.setValue(this.hospedaje.value.costonoche);
        }
      }
    } else {
      this.solFormGroup.get('costoHospedaje')?.setValue(0);
      this.solFormGroup.get('hotel')?.setValue('No');
      this.solFormGroup.get('cantnoches')?.setValue(0);
      this.solFormGroup.get('costonoche')?.setValue(0);
    }
    return total;
  }

  calcuarCosteTotal(): number {
    let total = 0;
    let alimento = 0;
    let hospedaje = this.calcularTotalHospedaje();
    let transporte = this.calcularTotalTransporte();
    if (this.solFormGroup.get('costoAlimento')?.value) {
      alimento = this.solFormGroup.get('costoAlimento')?.value;
    } else {
      alimento = 0;
      this.solFormGroup.get('costoAlimento')?.setValue(alimento);
    }
    total = Number(hospedaje) + Number(transporte) + Number(alimento);
    this.solFormGroup.get('costoTotal')?.setValue(total);
    console.log('El total requerido para el viaje es: ' + total);

    return total;
  }


  cargarHoras() {
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 4; j++) {
        const hour = i < 10 ? `0${i}` : `${i}`;
        const minute = j * 15 < 10 ? `0${j * 15}` : `${j * 15}`;
        this.horas.push({
          value: `${hour}:${minute}`,
          label: `${hour}:${minute}`,
        });
      }
    }
  }

  isDisabled(transporte: string): boolean {
    switch (transporte) {
      case 'avion':
        return !this.avionCheck;
      case 'vehiculo':
        return !this.vehiculoCheck;
      case 'ferry':
        return !this.ferryCheck;
      case 'tren':
        return !this.trenCheck;
      case 'taxi':
        return !this.taxiCheck;
      case 'otro':
        return !this.otroCheck;
      default:
        return true;
    }
  }


  async registerSolicitud() {
    Notiflix.Loading.init({
      svgColor: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.8)'
    });
    Notiflix.Loading.circle('Cargando solicitud...',{
      backgroundColor: 'rgba(0,0,0,0.8)',
    });
    Notiflix.Loading.remove(3500);
    // Llamada a checkData
    this.calcuarCosteTotal()
    await this.checkData();
  }

  async checkBitacoraPendiente(): Promise<boolean> {

    // Si existe una de estas solicitudes pendientes, el usuario es notificado y redirigido sin enviar la solicitud.
    const email = this.solFormGroup.get('contacto')?.value;
  
    return new Promise((resolve) => {
      this.http.get<any[]>(`${this.apiUrl}?email=${email}`).subscribe({
        next: (solicitudes) => {
          // Verificar si hay una solicitud en estado 'PreAprobado', 'Aprobado', o 'Bitacora'
          const solicitudPendiente = solicitudes.some(solicitud => 
            ['Aprobado', 'Pre Aprobado', 'Bitacora'].includes(solicitud.estadoActual)
          );
  
          if (solicitudPendiente) {
            this.notificacionesService.reporte(
              'warning',
              'Bitácora pendiente',
              'Tienes una bitácora por finalizar o en aprobación, por lo tanto no podrás ingresar otra solicitud. Comunícate con el área de TI.',
              'Entendido',
              () => {
                this.router.navigate(['/viajes']);
              }
            );
            resolve(true); 
          } else {
            resolve(false); 
          }
        },
        error: (error) => {
          console.error('Error al verificar solicitudes:', error);
          this.notificacionesService.failure('Hubo un error al verificar las solicitudes pendientes.');
          resolve(true); 
        }
      });
    });
  }
  
  async checkData() {
    const tieneBitacoraPendiente = await this.checkBitacoraPendiente();
    if (tieneBitacoraPendiente) return; 
  
    // Continuar con la validación de los campos
    if (!this.solFormGroup.get('propuestaAgenda')?.value) {
      this.solFormGroup.get('propuestaAgenda')?.setValue('No');
    }
    if (!this.solFormGroup.get('ponos')?.value) {
      this.solFormGroup.get('ponos')?.setValue('No');
    }
    if (!this.solFormGroup.get('nproyecto')?.value) {
      this.solFormGroup.get('nproyecto')?.setValue(0);
    }
    if (!this.solFormGroup.get('clienteIntercompannia')?.value) {
      this.solFormGroup.get('clienteIntercompannia')?.setValue('No');
    }
    if (!this.solFormGroup.get('notasExtras')?.value) {
      this.solFormGroup.get('notasExtras')?.setValue('No');
    }
  
    let camposFaltantes = [];
    if (this.solFormGroup.get('nombreUsuario')?.value === '') {
      camposFaltantes.push('Nombre');
    }
    if (this.solFormGroup.get('contacto')?.value === '') {
      camposFaltantes.push('Contacto');
    }
    if (this.solFormGroup.get('oficina')?.value === '') {
      camposFaltantes.push('Oficina');
    }
    if (this.solFormGroup.get('departamento')?.value === '') {
      camposFaltantes.push('Departamento');
    }
    if (this.solFormGroup.get('dirSalida')?.value === '') {
      camposFaltantes.push('Dirección de salida');
    }
    if (this.solFormGroup.get('dirDestino')?.value === '') {
      camposFaltantes.push('Dirección de destino');
    }
    if (this.solFormGroup.get('horaIda')?.value === '') {
      camposFaltantes.push('Hora de salida');
    }
    if (this.solFormGroup.get('horaVuelta')?.value === '') {
      camposFaltantes.push('Hora de Regreso');
    }
  
    if (camposFaltantes.length > 0) {
      Notiflix.Report.failure(
        'Solicitud no realizada!',
        'Revise que se hayan completado correctamente los siguientes datos: ' + camposFaltantes.join(', '),
        'Ok'
      );
    } else {
      this.sendData(); 
    }
  }
  

  sendData() {
    const formData = this.solFormGroup.value;
    const formDataToSend = new FormData();
    let nuevoDeparto = formData.fechaDeparto.toISOString().slice(0, 10);
    let nuevoRetorno = formData.fechaRetorno.toISOString().slice(0, 10);
    let nuevaSolicitud = formData.fechaSolicitud.toISOString().slice(0, 10);
    formData.fechaDeparto = nuevoDeparto;
    formData.fechaRetorno = nuevoRetorno;
    formData.fechaSolicitud = nuevaSolicitud;
    Object.keys(formData).forEach((key) => {
      if (formData[key] instanceof File) {
        formDataToSend.append(key, formData[key], formData[key].name);
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });
    this.downloadPDF()
    this.http.post(this.apiUrl, formDataToSend).subscribe(
      (response) => {
        console.log(response);
        this.router.navigate(['/viajes']);
        Notiflix.Report.success(
          'Solicitud realizada!',
          'La solicitud se ha realizado correctamente',
          'Ok'
        );
      },
      (error) => {
        console.error(error);
      }
    );
  }

  downloadPDF(): void {
    const DATA = document.getElementById('htmlData');
    if (DATA !== null) {
      const doc = new jsPDF('p', 'pt', 'letter');
      const options = {
        background: 'white',
        scale: 3
      };
      html2canvas(DATA, options).then((canvas) => {
        const fondo = new Image();
        const img = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(img);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        console.log(pdfWidth)
        console.log(pdfHeight)
    
        doc.addImage(img, 'PNG', 0, 0, pdfWidth, pdfHeight);
        doc.save(`${new Date().toISOString()}_solicitud.pdf`);
      });
    } else {
      console.error('No se encontró el elemento con id "htmlData"');
    }
    Notiflix.Loading.remove();
  }
  


}
