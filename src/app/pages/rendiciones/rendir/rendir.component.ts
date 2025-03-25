import { Component, Inject, OnInit, Optional, ViewChild, ViewEncapsulation,ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FondosService } from 'src/app/services/fondos.service';
import { Fondo } from '../fondos/interface';
import { Gasto } from './gastos/interface'; 
import { CommonModule, DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { MaterialModule } from 'src/app/material.module';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { NotiService } from 'src/app/services/noti.service';
import { EmailService } from 'src/app/services/email.service';

export const CHILEAN_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};


@Component({
  selector: 'app-rendir-gastos',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatCheckboxModule, MatDatepickerModule, 
     FormsModule, ReactiveFormsModule, CommonModule, MatDatepicker, MonedaChilenaPipe],
  providers: [
      provideNativeDateAdapter(),
      { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS },
      { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './rendir.component.html',
  styleUrl: './rendir.component.scss'

})

export class RendirComponent implements OnInit {
  
  displayedColumns: string[] = ['numeroServicio', 'nombreComprobante', 'numeroComprobante', 'tipoComprobante', 'proveedor','tipoGasto', 'descripcion', 'fechaGasto', 'montoGasto', 'Acción'];
  fondo: Fondo [] = [];
  gastos: Gasto[] = [];
  fondoId: string | null = null;
  findFondo: any;
  //roles
  rolesUsuario: string[] = [];


  @ViewChild('paginator1') paginator1: MatPaginator;

  dataSource1 = new MatTableDataSource<Gasto>([]);

  constructor(
    private route: ActivatedRoute,
    private fondosService: FondosService,
    private titleService: Title,
    public dialog: MatDialog, 
    private notificacionesService: NotificacionesService,
    private notiService: NotiService,
    private emailService: EmailService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    
  ) {

    }

  isTextTruncated(element: HTMLElement): boolean {
    if (!element) return false;
    return element.scrollWidth > element.clientWidth;
  }

  ngAfterViewInit(): void {
    this.dataSource1.paginator = this.paginator1;
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
    // Ejemplo: verificar si el usuario tiene roles necesarios
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
        // Obtener el ID del fondo de la URL
        this.route.paramMap.subscribe(params => {
          this.fondoId = params.get('id');  // Aquí capturamos el fondoId desde la URL
          console.log('Fondo ID:', this.fondoId); 
          if (this.fondoId){
          this.obtenerFondo(this.fondoId);
          this.obtenerGastosDelFondo();   
        }
          this.titleService.setTitle('Detalle fondo');
        });
  }

  // Método para obtener los datos del fondo seleccionado
  obtenerFondo(id: any) {
    this.fondosService.obtenerFondos().subscribe({
      next: (fondos: Fondo[]) => {
        this.fondo = fondos;
        this.findFondo = fondos.find(f => f.id === +id) 
        console.log(this.findFondo)
      },
      error: (error) => {
        console.error('Error al obtener los datos del fondo:', error);
      }
    });
  }

    // Método para obtener los gastos del fondo específico
  obtenerGastosDelFondo(): void {
    if (this.fondoId) {
      this.fondosService.obtenerGastosPorFondo(+this.fondoId).subscribe(
        (data: Gasto[]) => {
          this.gastos = data;
          console.log('Gastos obtenidos:', this.gastos);
          // Actualizar la dataSource de la tabla
          this.dataSource1.data = this.gastos;
        },
        error => {
          console.error('Error al obtener los gastos:', error);
        }
      );
    }
  }

  verComprobante(gasto: Gasto) {
    this.router.navigate(['/rendiciones/comprobante', gasto.id]); // Pasamos solo el ID del gasto
  }

  applyFilter1(filterValue: string): void {
    this.dataSource1.filter = filterValue.trim().toLowerCase();
  }

  // Método para abrir el diálogo 
  openDialog(action: string, obj: any): void {
    obj.action = action;
    obj.idfondo = this.fondoId;
    const dialogRef = this.dialog.open(AppGastosModalComponent, {
      data: obj,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result.event === 'Agregar') {
        this.agregarGasto(result.data);
      } else if (result.event === 'Editar') {
        this.editarGastoDelFondo(result.data);
      }
    });
  }

  // Metodo para guardar un Gasto
  agregarGasto(formGasto: Gasto): void {

    // Formatear fechaGasto en el formato adecuado
    const fechaGastoFormateada = new Date(formGasto.fechaGasto).toISOString().split('T')[0];
    // Crear FormData con la fecha formateada
    const formData = new FormData();
    formData.append('idfondo', formGasto.idfondo);
    formData.append('nombreComprobante', formGasto.nombreComprobante);
    formData.append('numeroComprobante', formGasto.numeroComprobante);
    formData.append('tipoComprobante', formGasto.tipoComprobante);
    formData.append('proveedor', formGasto.proveedor);
    formData.append('tipoGasto', formGasto.tipoGasto);
    formData.append('fechaGasto', fechaGastoFormateada); 
    formData.append('montoGasto', String(formGasto.montoGasto));
    formData.append('descripcion', formGasto.descripcion);
    formData.append('numeroServicio', formGasto.numeroServicio);
  
    // Enviar datos al servicio
    this.fondosService.crearGasto(formData).subscribe({
      next: (response) => {
        this.notificacionesService.success('Gasto Registrado Exitosamente.');
        this.obtenerGastosDelFondo();
        this.cdr.detectChanges();
        this.obtenerFondo(this.fondoId);
        this.cdr.detectChanges();
        if (this.fondoId) {
          this.fondosService.updateEstadoFondo(this.fondoId, 'en_rendicion').subscribe({
          });
        }
      },
      
      error: (err) => {
        console.error('Error', err);
        this.notificacionesService.failure('Error al intentar registrar gasto.');
      },
    });
  }
  

// Método para editar
editarGastoDelFondo(formGasto: Gasto): void {
  // Formatear la fecha antes de enviarla
  const fechaGastoFormateada = new Date(formGasto.fechaGasto).toISOString().split('T')[0];

  const formData = new FormData();
  formData.append('id', String(formGasto.id));
  formData.append('idfondo', formGasto.idfondo);

  if (formGasto.nombreComprobante) {
    formData.append('nombreComprobante', formGasto.nombreComprobante);
  }

  formData.append('numeroComprobante', formGasto.numeroComprobante);
  formData.append('tipoComprobante', formGasto.tipoComprobante);
  formData.append('proveedor', formGasto.proveedor);
  formData.append('tipoGasto', formGasto.tipoGasto);
  formData.append('fechaGasto', fechaGastoFormateada); 
  formData.append('montoGasto', String(formGasto.montoGasto));
  formData.append('descripcion', formGasto.descripcion);
  formData.append('numeroServicio', formGasto.numeroServicio);

  this.fondosService.editarGastoPorFondo(formData).subscribe({
    next: (response) => {
      this.notificacionesService.success('Gasto actualizado correctamente.');
      this.obtenerGastosDelFondo();
      this.cdr.detectChanges();
      this.obtenerFondo(this.fondoId);
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error ', err);
      this.notificacionesService.failure('Error al editar el gasto.');
    }
  });
}


  eliminarGastoDelFondo(id: Gasto): void {
    this.notificacionesService.ConfirmAlert('ELIMINAR GASTO', '¿Desea eliminar este gasto?', 'Aceptar', 'Cancelar', (confirm) => {
      if (confirm) {
        this.fondosService.eliminarGastoPorFondo(id).subscribe({
          next: (response) => {
            this.notificacionesService.success('Gasto eliminado correctamente.')
            this.obtenerGastosDelFondo();
            this.cdr.detectChanges()
            this.obtenerFondo(this.fondoId);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error', err);
            this.notificacionesService.failure('Error al eliminar el gasto.');
          }
        });
      } else {
        console.log('Cancelado');
      }
    });
  }
  
  volver(): void {
    this.router.navigate(['/rendiciones/rendidor/']); 
  }

  enviarRendicion(fondoId: string | null): void {
    if (!fondoId) {
      this.notificacionesService.failure('El ID del fondo es inválido.');
      return;
    }
    this.notificacionesService.ConfirmAlert(
      'Enviar Rendición',
      '¿Desea enviar la rendición para su aprobación?',
      'Aceptar',
      'Cancelar',
      (confirm) => {
        if (confirm) {
          // Verificar si el fondo tiene gastos
          this.fondosService.obtenerGastosPorFondo(Number(fondoId)).subscribe({
            next: (gastos) => {
              if (gastos.length > 0) {
                // Cambiar el estado del fondo
                this.fondosService.updateEstadoFondo(fondoId, 'en_jefatura').subscribe({
                  next: () => {
                    // Obtener el fondo actualizado para enviar la notificación
                    const fondo = this.fondo.find((f) => String(f.id) === fondoId);
                    if (fondo) {
                      this.notificarJefatura(fondo);
                      const email =  fondo.aprobadorJefatura; // email del jefe del fondo
                      if (email) {
                      this.notiService.sendNotification(
                        email,
                        `Fondo "${fondo.referencia}" listo para aprobación`,
                        `rendiciones/gastos/${fondo.id}`
                      )}
                    }
                    const mostrarReporte = true; // Cambiar según condición si aplica
                    if (mostrarReporte) {
                      this.notificacionesService.reporte(
                        'success',
                        'Rendición enviada',
                        'Fondo enviado correctamente. Le solicitamos amablemente esperar la aprobación correspondiente.',
                        'Entendido',
                        () => {
                          setTimeout(() => {
                            this.router.navigate(['/rendiciones/rendidor']);
                            this.cdr.detectChanges();
                          }, 500);
                        }
                      );
                    } else {
                      this.notificacionesService.success('La rendición ha sido enviada correctamente.');
                    }
                    this.fondo = this.fondo.filter((fondo) => String(fondo.id) !== fondoId);
                    this.cdr.detectChanges();
                  },
                });
              } else {
                this.notificacionesService.failure('No se puede enviar la rendición, ya que no hay gastos rendidos.');
              }
            },
          });
        } else {
          this.notificacionesService.info('La acción ha sido cancelada.');
        }
      }
    );
  }

    // Método para notificar al jefe
    private notificarJefatura(fondo: Fondo): void {
      const email = fondo.aprobadorJefatura;
      const asunto = 'Nueva Rendición para Aprobación';
      const mensaje = ``
      const montoFormateado = fondo.montoAsignado.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
      const fechaFormateada = new Date(fondo.fechaAsignado).toLocaleDateString('es-CL');
      const urlAprobacion = `${window.location.origin}/rendiciones/aprobador`;
        // Obtener el correo del aprobadorJEFE
      const correoJefe = fondo.aprobadorJefatura;
  
      // Extraer nombre y apellido desde el correo
      const [nombre, apellido] = correoJefe.split('@')[0].split('.');
  
      // Capitalizar el nombre y apellido
      const nombreJefe = `${this.capitalizar(nombre)} ${this.capitalizar(apellido)}`;
      const mensajeHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://als-inspection.cl/wp-content/uploads/2022/03/120.png" alt="ALS Inspection" style="max-width: 200px; height: auto;">
          </div>
          <h1 style="color: #0056b3; text-align: center;">Nueva Rendición para Aprobación</h1>
          <p>Hola, ${nombreJefe}</p>
          <p>El rendidor <strong>${fondo.rendidor}</strong> ha enviado una rendición para su aprobación.</p>
          <p>Detalles del fondo:</p>
          <ul>
            <li>Referencia: ${fondo.referencia}</li>
            <li>Monto asignado: <strong>${montoFormateado}</strong></li>
            <li>Fecha asignado: ${fechaFormateada}</li>
          </ul>
          <p>Para revisar y aprobar esta rendición, haz clic en el siguiente enlace:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${urlAprobacion}" target="_blank" 
              style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #0056b3; text-decoration: none; border-radius: 5px;">
              Revisar y Aprobar
            </a>
          </div>
          <p>Saludos cordiales,<br>El equipo de ALS Inspection</p>
        </div>
      `;
    
      this.emailService.sendEmail(email, asunto, mensaje, mensajeHtml).subscribe({
        next: () => console.log('Correo enviado al jefe correctamente.'),
        error: (error: any) => console.error('Error al enviar el correo al jefe:', error),
      });
    }
    // Método para capitalizar una palabra
    private capitalizar(palabra: string): string {
      return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    } 
}



//modal
@Component({
  selector: 'app-dialog-content',
  standalone: true,
  imports: [MaterialModule, FormsModule, ReactiveFormsModule, MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatCheckboxModule, MatDatepickerModule, CommonModule, MatNativeDateModule],
  templateUrl: 'gastos/gastos-modal.html',
  providers: [DatePipe,
    provideNativeDateAdapter(), // Adaptador nativo
    { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS }, // Formato personalizado
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' } 
  ],
})

// Configuración del Dialog Modal
export class AppGastosModalComponent {
  action: string;
  local_data: any;
  gasto: any;
  selectedImage: File | null = null; 
  selectedImageName: string = 'Ningún archivo seleccionado'; // Nombre del archivo

  constructor(
    private formBuilder: FormBuilder, public dialogRef: MatDialogRef<AppGastosModalComponent>,
    // @Optional() is used to prevent error if no data is passed
    @Optional() @Inject(MAT_DIALOG_DATA) public data: Gasto
  ) {

    this.local_data = { ...data };
    this.action = this.local_data.action;

    // Ajustar la fecha para corregir desfase de zona horaria
    if (this.local_data.fechaGasto) {
      const fecha = new Date(this.local_data.fechaGasto);
      // Agregar desfase de la zona horaria local
      fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
      this.local_data.fechaGasto = fecha;
    }

    if (this.local_data.id) {
      this.formGasto.patchValue({
        numeroComprobante: this.local_data.numeroComprobante || '',
        tipoComprobante: this.local_data.tipoComprobante || '',
        proveedor: this.local_data.proveedor || '',
        tipoGasto: this.local_data.tipoGasto || '',
        fechaGasto: this.local_data.fechaGasto || '',
        montoGasto: this.local_data.montoGasto || '',
        descripcion: this.local_data.descripcion || '',
        numeroServicio: this.local_data.numeroServicio || '',
      });
  
      // Limpia el valor de nombreComprobante después de aplicar patchValue
    this.formGasto.get('nombreComprobante')?.setValue('');
    // Eliminar el validador del campo nombreComprobante
    this.formGasto.get('nombreComprobante')?.clearValidators();
    this.formGasto.get('nombreComprobante')?.updateValueAndValidity();

    }
  }

  formGasto = this.formBuilder.group({
    nombreComprobante: ['',Validators.required],
    numeroComprobante: ['', [Validators.required, Validators.maxLength(150)]],
    tipoComprobante: ['', Validators.required],
    proveedor: ['', [Validators.required, Validators.maxLength(100)]], // Obligatorio y limitado
    tipoGasto: ['', Validators.required],
    fechaGasto: ['', Validators.required],
    montoGasto: ['', Validators.required],
    descripcion: ['', [Validators.required, Validators.maxLength(300)]],
    numeroServicio: ['', Validators.maxLength(50)], // Opcional
    
  });

  get f() {
    return this.formGasto.controls;
  }
  

  check() {
    console.log(this.formGasto.value);
  }

  doAction(): void {
    if (this.formGasto) {
      this.local_data.nombreComprobante = this.selectedImage;
      this.local_data.numeroComprobante = this.formGasto.value.numeroComprobante;
      this.local_data.tipoComprobante = this.formGasto.value.tipoComprobante;
      this.local_data.proveedor = this.formGasto.value.proveedor;
      this.local_data.tipoGasto = this.formGasto.value.tipoGasto;
      this.local_data.fechaGasto = this.formGasto.value.fechaGasto;
      this.local_data.montoGasto = this.formGasto.value.montoGasto;
      this.local_data.descripcion = this.formGasto.value.descripcion;
      this.local_data.numeroServicio = this.formGasto.value.numeroServicio;
      delete this.local_data.action;
    if(!this.formGasto.value.nombreComprobante){
      delete this.local_data.nombreComprobante;
    }

    } else {
      console.log("Formulario inválido");
    }   

    this.dialogRef.close({ event: this.action, data: this.local_data });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancelar' });
  }


  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
      this.selectedImageName = this.selectedImage.name; // Asigna el nombre
    } else {
      this.selectedImage = null;
      this.selectedImageName = 'Ningún archivo seleccionado';
    }
  }
  
}
