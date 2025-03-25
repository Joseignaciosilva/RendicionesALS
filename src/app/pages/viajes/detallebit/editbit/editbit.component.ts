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
import { FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatOption } from '@angular/material/core';
import { MatLabel } from '@angular/material/form-field';
import { FormBuilder } from '@angular/forms';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

export interface nActividad{
  fecha : string;
  idViaje :Number;
  idUsuario :string;
  nombreUsuario :string;
  contactoUsuario :string;
  horaActividadI :string;
  horaActividadT :string;
  cliente:string;
  lugar:string;
  participantes:string;
  motivo:string;
  resultadoEsperado:string;
  dia : Number;
}

@Component({
  selector: 'app-editbit',
  standalone: true,
  imports: [MatLabel,MatOption,MatDialogModule,MaterialModule,MatIconModule,MatTabsModule,ReactiveFormsModule,FormsModule,CommonModule,MatDividerModule,MatDialogContent,TablerIconsModule,MatCommonModule,MatCardModule,MatStepperModule, MatInputModule, MatButtonModule],
  templateUrl: './editbit.component.html',
  styleUrl: './editbit.component.scss'
})
export class EditbitComponent {
  actividadForm : FormGroup;
  // localhost
  // private apiUrl = 'http://127.0.0.1:8000/viajes/bitacoras/';
  // servidor
  private apiUrl = "https://control.als-inspection.cl/api_rendiciones/viajes/bitacoras/"
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private notificacionesService: NotificacionesService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    console.log(data);
    this.actividad = data.actividad;
    this.modo = data.modo;
    this.viaje = data.viaje;
    this.idViaje = data.idViaje;
    this.dia = Number(data.dia);
    if(this.modo === 'Editar'){
      this.horaActividadI = this.actividad.horaInicio;
      this.horaActividadT = this.actividad.horaTermino;
      this.lugar = this.actividad.lugar;
      this.participantes = this.actividad.participantes;
      this.resultadoEsperado = this.actividad.resultadoEsperado;
      this.cliente = this.actividad.cliente;
      this.actividadForm = this.fb.group({
        horaActividadI: [this.actividad.horaActividadI,Validators.required],
        horaActividadT: [this.actividad.horaActividadT,Validators.required],
        cliente: [this.actividad.cliente,Validators.required],
        lugar: [this.actividad.lugar,Validators.required],
        participantes: [this.actividad.participantes,Validators.required],
        motivo: [this.actividad.motivo,Validators.required],
        resultado: [this.actividad.resultado,Validators.required],
        idViaje: [this.actividad.participantes,Validators.required],
        idUsuario: [this.actividad.idUsuario,Validators.required],
        contactoUsuario:[this.actividad.contactoUsuario,Validators.required],
        fecha:[this.actividad.fecha,Validators.required],
        dia:[this.actividad.fecha,Validators.required],
        nombreUsuario: [this.actividad.nombreUsuario,Validators.required],
      })
      this.actividadForm.patchValue({
        horaActividadI: this.actividad.horaActividadI,
        horaActividadT: this.actividad.horaActividadT,
      })
    }else{
      this.actividadForm = this.fb.group({
        horaActividadI: ['',Validators.required],
        horaActividadT: ['',Validators.required],
        cliente: ['',Validators.required],
        lugar: ['',Validators.required],
        participantes: ['',Validators.required],
        motivo: ['',Validators.required],
        resultado: ['',Validators.required],
        idViaje: ['',Validators.required],
        idUsuario: ['',Validators.required],
        contactoUsuario:['',Validators.required],
        fecha:['',Validators.required],
        dia:['',Validators.required],
        nombreUsuario: ['',Validators.required],
      })
    }

  }
  
  horaActividadI: string;
  horaActividadT: string;
  actividad:any;
  viaje:any;
  nActividad: nActividad;
  modo:string;
  cantDias : number;
  diasDeViaje:number[] = [];
  horas: any[] = [];
  cliente: string;
  lugar: string;
  participantes: string;
  motivo:string;
  resultadoEsperado:string;
  idViaje : number;
  fecha : string;
  fondo : string;
  nombreBitacora : string;
  actividades : any;
  contactoUsuario: string;
  dia: number;

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

    this.cargarHoras();
    if(this.actividad!=null){
      this.cargarDatos();
      this.horaActividadI = this.actividad.horaActividadI;
      this.horaActividadT = this.actividad.horaActividadT;
    }else{
      this.horaActividadI = '';
      this.horaActividadT = '';
      this.lugar = '';
      this.participantes = '';
      this.resultadoEsperado = '';
      this.dia=this.data.dia;
    }
    this.dia=this.data.dia;
    console.log(this.dia)

}

  cargarDatos():void{
    this.horaActividadI = this.actividad.horaInicio;
    this.horaActividadT = this.actividad.horaTermino;
    this.lugar = this.actividad.lugar;
    this.participantes = this.actividad.participantes;
    this.resultadoEsperado = this.actividad.resultadoEsperado;
    this.cliente = this.actividad.cliente;
    this.motivo = this.actividad.motivo;
    this.dia=this.data.dia;
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

actualizarActividad(): void {
  const actividadActualizada = {
    ...this.actividad,
    horaActividadI: this.horaActividadI,
    horaActividadT: this.horaActividadT,
    cliente: this.cliente,
    lugar: this.lugar,
    participantes: this.participantes,
    motivo: this.motivo,
    resultadoEsperado: this.resultadoEsperado,
  };
  console.log(actividadActualizada)
  this.http.put(`${this.apiUrl}${this.actividad.id}/`, actividadActualizada).subscribe(
    (response) => {
      console.log("Actividad actualizada correctamente");
      console.log(response);
      window.location.reload();
      Notiflix.Report.success('Actividad actualizada correctamente', 'La actividad se ha actualizado correctamente', 'Cerrar');
    },
    (error) => {
      console.error(error);
      console.log("No se pudo actualizar la actividad");
    }
  );
}

crearNuevaActividad(){
  let fechaFormato = new DatePipe('en-US').transform(this.data.fecha, 'dd/MM/yyyy');
  this.nActividad = {} as nActividad;
  this.nActividad.cliente=this.cliente;
  this.nActividad.contactoUsuario=this.viaje.contacto;
  this.nActividad.dia = this.dia;
  if(fechaFormato!=null){
    this.nActividad.fecha = fechaFormato;
  } 
  this.nActividad.horaActividadI = this.horaActividadI;
  this.nActividad.horaActividadT = this.horaActividadT;
  //id se asigna automaticamen3
  this.nActividad.idUsuario = this.viaje.contacto;
  this.nActividad.idViaje = this.idViaje;
  this.nActividad.lugar = this.lugar;
  this.nActividad.motivo = this.motivo;
  this.nActividad.nombreUsuario = this.viaje.nombreUsuario;
  this.nActividad.participantes = this.participantes;
  this.nActividad.resultadoEsperado = this.resultadoEsperado;
  return this.nActividad

}

agregarActividad(): void{
  this.nActividad = this.crearNuevaActividad();
  console.log("Agregando actividad...")
  console.log(this.nActividad)
  this.http.post(this.apiUrl,this.nActividad).subscribe(
       (response) => {
        console.log("Actividad agregada correctamente")
        console.log(response);
        window.location.reload();
        Notiflix.Report.success('Actividad agregada correctamente', 'La actividad se ha agregado correctamente', 'Cerrar');
       },
       (error) => {
         console.error(error);
         console.log("No se pudo agregar la actividad")
       }
   )
  }

}
