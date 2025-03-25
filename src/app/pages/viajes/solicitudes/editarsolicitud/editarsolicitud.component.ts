import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCommonModule } from '@angular/material/core';
import { Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormGroup,
} from '@angular/forms';
import { MatCard } from '@angular/material/card';
import { MatDialogContent } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MaterialModule } from 'src/app/material.module';
import { HttpClient } from '@angular/common/http';
import  Notiflix  from 'notiflix';
@Component({
  selector: 'app-editarsolicitud',
  standalone: true,
  imports: [
    MaterialModule,
    MatCommonModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatCard,
    MatDialogContent,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './editarsolicitud.component.html',
  styleUrl: './editarsolicitud.component.scss',
})
export class EditarsolicitudComponent {
  element: any;
  editFormGroup: FormGroup;
  // localhost
  // urlApi = 'http://127.0.0.1:8000/viajes/solicitud/';
  // servidor
  urlApi = 'https://control.als-inspection.cl/api_rendiciones/viajes/solicitud/';  

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditarsolicitudComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.element = data;
    this.editFormGroup = this.fb.group({
      nombreUsuario: [this.element.nombreUsuario, Validators.required],
      contacto: [this.element.contacto, Validators.required],
      oficina: [this.element.oficina, Validators.required],
      departamento: [this.element.departamento, Validators.required],
      dirSalida: [this.element.dirSalida, Validators.required],
      dirDestino: [this.element.dirDestino, Validators.required],
      fechaDeparto: [this.element.fechaDeparto, Validators.required],
      fechaRetorno: [this.element.fechaRetorno, Validators.required],
      fechaSolicitud: [this.element.fechaSolicitud, Validators.required],
      horaIda: [this.element.horaIda, Validators.required],
      horaVuelta: [this.element.horaVuelta, Validators.required],
      transportes: [this.element.transportes, Validators.required],
      hotel: [this.element.hotel, Validators.required],
      cantnoches: [this.element.cantnoches, Validators.required],
      costonoche: [this.element.costonoche, Validators.required],
      costoAlimento: [this.element.costoAlimento, Validators.required],
      costoHospedaje: [this.element.costoHospedaje, Validators.required],
      costoTransporte: [this.element.costoTransporte, Validators.required],
      costoTotal: [this.element.costoTotal, Validators.required],
      tipoMoneda: [this.element.tipoMoneda, Validators.required],
      propuestaAgenda: [this.element.propuestaAgenda, Validators.required],
      ponos: [this.element.ponos, Validators.required],
      nproyecto: [this.element.nproyecto, Validators.required],
      clienteIntercompannia: [this.element.clienteIntercompannia, Validators.required],
      notasExtras: [this.element.notasExtras, Validators.required],
      estadoPreaprobado: [false, Validators.required],
      estadoFinal: [false, Validators.required],
    });
  }

  closeDialog() {
    this.dialogRef.close(this.element);
  }

  actualizarSolicitud(): void {
    const updatedElement = { ...this.element, ...this.editFormGroup.getRawValue() };
    console.log('Datos actualizados:', updatedElement);
    
    this.http.put(this.urlApi + this.element.id + '/', updatedElement).subscribe(
      (response) => {
        console.log('Solicitud actualizada');
        Notiflix.Notify.success('Solicitud actualizada con éxito!');
        this.dialogRef.close();
      },
      (error) => {
        console.error('Error al actualizar la solicitud');
      }
    );
  }
}
