import { Component, Inject, OnInit, Optional, ViewChild, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FondosService } from 'src/app/services/fondos.service';
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
import { MatNativeDateModule, NativeDateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { Fondo, Usuario } from '../../fondos/interface';
import { Gasto } from '../../rendir/gastos/interface';
import { EmailService } from 'src/app/services/email.service';
import { NotiService } from 'src/app/services/noti.service';

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
  selector: 'app-gastos',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatCheckboxModule, MatDatepickerModule,
    FormsModule, ReactiveFormsModule, CommonModule, MatDatepicker, MonedaChilenaPipe],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './gastos.component.html',
  styleUrl: './gastos.component.scss'

})

export class GastosComponent {

  rolActual: string = '';
  fondo: Fondo[] = [];
  fondoId: string | null = null;
  findFondo: any;
  
  displayedColumns: string[] = ['numeroServicio', 'tipoComprobante','nombreComprobante','numeroComprobante', 'proveedor','tipoGasto', 'descripcion', 'fechaGasto', 'montoGasto', 'Acción'];
  gastos: Gasto[] = [];


  @ViewChild('paginator') paginator: MatPaginator;

  dataSource = new MatTableDataSource<Gasto>;

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
    this.dataSource.paginator = this.paginator;
    this.cdr.detectChanges(); // Refresca la vista tras asignar el paginator
  }

  ngOnInit(): void {
    const roles = localStorage.getItem('roles');
    if (roles) {
      try {
        const parsedRoles: string[] = JSON.parse(roles);
        if (parsedRoles.includes('JEF') || parsedRoles.includes('GER')) { /* JEFE Y GERENTE SE COMPORTAN IGUAL */
          this.rolActual = 'JEF'; /* JEFE Y GERENTE pueden rechazar a aprobar un gasto para visadoJefe*/
        } else if (parsedRoles.includes('ADM')) {
          this.rolActual = 'ADM'; //solo admnin puede aprobar o rechazar un gasto para visadoAdmin
        }
      } catch (error) {
        console.error('Error al parsear roles:', error);
      }
    }

    this.cargarColumnas();
  
    if (this.rolActual === 'JEF' || this.rolActual === 'ADM') {
      this.route.paramMap.subscribe(params => {
        this.fondoId = params.get('id');
        console.log('Fondo ID:', this.fondoId);
        if (this.fondoId) {
          this.cargarGastosPorFondo(Number(this.fondoId));
        }
        this.titleService.setTitle('Detalle gastos');
      });
      this.cargarFondosSolicitados(this.rolActual);
    } else {
      this.router.navigate(['/authentication/error']);
    }
  }
  
  cargarColumnas(): void {
    // Verificar el rol y ajustar las columnas
    if (this.rolActual === 'ADM') {
      const index = this.displayedColumns.indexOf('Acción');
      // desplazar el visadojefe antes de las acciones
      if (index !== -1) {
        this.displayedColumns.splice(index, 0, 'visadoJefe');
      }
    } else {
      const index = this.displayedColumns.indexOf('visadoJefe');
      if (index !== -1) {
        this.displayedColumns.splice(index, 1);
      }
    }
  }

  cargarFondosSolicitados(rol: string): void {
    this.fondosService.obtenerFondosPorRol(rol).subscribe({
      next: (fondos: Fondo[]) => {
        console.log('Fondos recibidos:', fondos);
        this.fondo = fondos;
        
        // Asignar el fondo encontrado por ID
        if (this.fondoId) {
          this.findFondo = fondos.find(f => f.id === Number(this.fondoId));
          console.log('Fondo seleccionado:', this.findFondo);
        }
      },
      error: (error: any) => {
        console.error('Error al obtener los fondos por rol:', error);
        this.notificacionesService.failure('Ocurrió un error al cargar los fondos.');
      }
    });
  }
  
  // Método para obtener los gastos del fondo específico
  cargarGastosPorFondo(fondoId: number): void {
    this.fondosService.obtenerGastosPorFondo(fondoId).subscribe({
      next: (gastos) => {
        if (Array.isArray(gastos)) {
          this.gastos = gastos;
          this.dataSource.data = gastos;
          console.log('Gastos cargados:', this.gastos);
        } else {
          console.warn('La respuesta no contiene un arreglo de gastos válido:', gastos);
        }
      },
      error: (err) => {
        console.error('Error al cargar los gastos:', err);
      }
    });
  }
  
  
  gestionarGasto(gastoId: number, rol: 'jefe' | 'admin', accion: 'aprobar' | 'rechazar'): void {
    const metodo = rol === 'jefe' 
      ? (accion === 'aprobar' ? this.fondosService.aprobarGastoJefe : this.fondosService.rechazarGastoJefe)
      : (accion === 'aprobar' ? this.fondosService.aprobarGastoAdmin : this.fondosService.rechazarGastoAdmin);
  
    metodo.call(this.fondosService, gastoId).subscribe(
      () => {
        const gasto = this.gastos.find(g => g.id === gastoId);
        if (gasto) {
          if (rol === 'jefe') gasto.visadoJefe = accion === 'aprobar' ? 'aprobado' : 'rechazado';
          if (rol === 'admin') gasto.visadoAdmin = accion === 'aprobar' ? 'aprobado' : 'rechazado';
        }
        this.cdr.detectChanges();
        this.notificacionesService.success(`Gasto ${accion === 'aprobar' ? 'aprobado' : 'rechazado'} correctamente.`);
      },
      error => this.notificacionesService.failure(`Error al ${accion} el gasto: ${error.message}`)
    );
  }
  


  finVisado(): void {
    this.notificacionesService.ConfirmAlert(
      'Cerrar proceso de revisión',
      '¿Desea terminar el proceso de revisión?',
      'Aceptar',
      'Cancelar',
      (confirm) => {
        if (confirm) {
          if (!this.fondoId) {
            this.notificacionesService.failure('El ID del fondo no está definido. Intenta nuevamente.');
            return;
          }
  
          let nuevoEstado = '';
          let gastosAprobados: Gasto[] = [];
          let gastosPendientes: Gasto[] = [];
  
          // Determinar el comportamiento según el rol actual
          if (this.rolActual === 'JEF') {
            gastosPendientes = this.gastos.filter((g) => !g.visadoJefe);
            gastosAprobados = this.gastos.filter((g) => g.visadoJefe === 'aprobado');
            nuevoEstado = 'en_administracion';
  
            if (gastosPendientes.length > 0) {
              this.notificacionesService.failure('No se puede avanzar, hay gastos pendientes de revisión.');
              return;
            }
  
            this.cambiarEstadoFondo(nuevoEstado, true);

            // Enviar correo al administrador
            if (this.findFondo && this.findFondo.aprobadorAdmin) {
              const email = this.findFondo.aprobadorAdmin;
              const asunto = `Jefatura a enviado un fondo por aprobar`;
              const mensaje = `El jefe ha finalizado la revisión de los gastos del fondo con ID ${this.fondoId}. Por favor, revise los detalles en el sistema.`;
              const fechaFormateada = new Date(this.findFondo.fechaAsignado).toLocaleDateString('es-CL');
              const montoFormateado = this.findFondo.montoAsignado.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
              const urlVisadoAdmin = `${window.location.origin}/rendiciones/aprobador`;
              // Obtener el correo del aprobadorADMIN
              const correoAdmin = this.findFondo.aprobadorAdmin;

              // Extraer nombre y apellido desde el correo
              const [nombre, apellido] = correoAdmin.split('@')[0].split('.');

              // Capitalizar el nombre y apellido
              const nombreAdmin = `${this.capitalizar(nombre)} ${this.capitalizar(apellido)}`;
              const mensajeHtml = `
              <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="https://als-inspection.cl/wp-content/uploads/2022/03/120.png" alt="ALS Inspection" style="max-width: 200px; height: auto;">
                </div>
                <h1 style="color: #0056b3; text-align: center;">Continúa con la Revisión de Gastos</h1>
                <p>Hola, ${nombreAdmin},</p>
                  <p>El jefe del fondo ID: <strong>${this.fondoId}</strong> ha finalizado la revisión de los gastos, ¡Continúa con la revisión de gastos! </p>
                <p>Detalles del fondo:</p>
                <ul>
                  <li>Referencia: ${this.findFondo?.referencia || 'N/A'}</li>
                  <li>Monto asignado: <strong>${montoFormateado|| 'N/A'}</strong></li>
                  <li>Fecha asignado: ${fechaFormateada || 'N/A'}</li>
                </ul>
                <p>Para continuar con la revisión, haz click en el siguiente enlace:</p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${urlVisadoAdmin}" target="_blank" 
                    style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #0056b3; text-decoration: none; border-radius: 5px;">
                    Revisar Fondo
                  </a>
                </div>
                <p>Saludos cordiales,<br>El equipo de ALS Inspection</p>
              </div>
            `;


              this.emailService.sendEmail(email, asunto, mensaje, mensajeHtml).subscribe({
                next: () => {
                  this.notificacionesService.success('El administrador ha sido notificado correctamente.');
                },
                error: (error) => {
                  console.error('Error al enviar el correo al administrador:', error);
                  this.notificacionesService.failure('No se pudo notificar al administrador.');
                }
              });
            } else {
              console.warn('No se encontró el correo del administrador en el fondo.');
              this.notificacionesService.failure('No se pudo enviar la notificación porque no se encontró el correo del administrador.');
            }

            
            // Aquí es donde agregamos el envío de notificación al rendidor
            const email = this.findFondo.aprobadorAdmin;
            if (email) {
              this.notiService.sendNotification(
                email, 
                `Fondo "${this.findFondo.referencia}" listo para aprobación.`, 
                `rendiciones/rendir/${this.fondoId}` 
              );
            }

          } else if (this.rolActual === 'ADM') {
            gastosPendientes = this.gastos.filter((g) => !g.visadoAdmin);
            gastosAprobados = this.gastos.filter((g) => g.visadoAdmin === 'aprobado');
            nuevoEstado = 'en_cierre';
  
            if (gastosPendientes.length > 0) {
              this.notificacionesService.failure('No se puede cerrar el proceso, hay gastos pendientes de revisión.');
              return;
            }
  
            const totalRendido = gastosAprobados.reduce((acc, g) => acc + g.montoGasto, 0);
  
            this.fondosService.updateTotalRendido(String(this.fondoId), totalRendido).subscribe({
              next: () => {
                if (this.findFondo) this.findFondo.totalRendido = totalRendido;
  
                this.fondosService.calcularNeteo(String(this.fondoId), totalRendido).subscribe({
                  next: () => {
                    console.log('Neteo calculado');
                    this.cambiarEstadoFondo(nuevoEstado, true);
                  },
                  error: () => {
                    this.notificacionesService.failure('No se pudo calcular el neteo. Intenta nuevamente.');
                  },
                });
              },
              error: () => {
                this.notificacionesService.failure('No se pudo actualizar el total rendido. Intenta nuevamente.');
              },
            });
          } else {
            this.notificacionesService.failure('Acción cancelada');
          }
        }
      }
    );
  }
  
   // Método para capitalizar una palabra
   private capitalizar(palabra: string): string {
    return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
  } 
  
  // Método para cambiar el estado del fondo
  private cambiarEstadoFondo(nuevoEstado: string, mostrarReporte: boolean = false): void {
    
    if (!this.fondoId) {
      this.notificacionesService.failure('El ID del fondo no está definido. Intenta nuevamente.');
      return;
    }
  
    this.fondosService.updateEstadoFondo(String(this.fondoId), nuevoEstado).subscribe({
      next: () => {
        if (this.findFondo) {
          this.findFondo.estado = nuevoEstado; // Actualiza el estado local
        }
        this.cdr.detectChanges(); // Refresca la vista para reflejar cambios
  
        if (mostrarReporte) {
          this.notificacionesService.reporte(
            'success', // Tipo de reporte
            'Proceso finalizado', // Título
            'El proceso de revisión se cerró correctamente.', // Mensaje
            'Entendido', // Texto del botón
            () => { // Callback al hacer clic en el botón
              setTimeout(() => {
                this.router.navigate(['/rendiciones/aprobador']); // Redirige después de 2 segundos
              }, 1000);
            }
          );
        } else {
          this.notificacionesService.success('El proceso de revisión se cerró correctamente.');
        }
      },
      error: () => {
        this.notificacionesService.failure('No se pudo cerrar el proceso de revisión. Intenta nuevamente.');
      },
    });
  }
  

  devolverFondo(estado: string): void {
    this.notificacionesService.ConfirmAlert('Devolver fondo', '¿Desea devolver el fondo?', 'Aceptar', 'Cancelar', (confirm) => {
      if (confirm) {
        if (!this.fondoId) {
          this.notificacionesService.failure('El ID del fondo no está definido. Intenta nuevamente.');
          return;
        }
        //primero cambia de estado
        this.fondosService.updateEstadoFondo(this.fondoId, estado).subscribe({
          next: () => {
            this.notificacionesService.success('Se notificó correctamente al rendidor que el fondo ha sido devuelto.');
            this.cdr.detectChanges(); 
                // Redirige y fuerza la recarga de datos
                this.router.navigate(['/rendiciones/aprobador']).then(() => {
                  this.cargarFondosSolicitados('rolActual'); // Cambia 'rolActual' según cómo obtengas el rol
                });
          }, error: (error) => {
            this.notificacionesService.failure('No se pudo actualizar el estado del fondo. Intenta nuevamente.');
          },
        });

        // Después de devolver el fondo, envía una notificación al rendidor
        const email = this.findFondo.rendidor
        if (email) {
            this.notiService.sendNotification(
                email, // Usuario que recibirá la notificación
                `Fondo "${this.findFondo.referencia}" ha sido devuelto, revisa los gastos.`, // Mensaje
                `rendiciones/rendir/${this.fondoId}` // URL asociada, si aplica
            );
        }
        this.cdr.detectChanges();
        this.router.navigate(['/rendiciones/aprobador']);
        this.cdr.detectChanges();

      } else {
        this.notificacionesService.info('La acción ha sido cancelada.');
      }
    });
  }
  
  verComprobante(gasto: Gasto) {
    this.router.navigate(['/rendiciones/comprobante', gasto.id]); // Pasamos solo el ID del gasto
  }
  
  volver(): void {
    this.router.navigate(['/rendiciones/aprobador']); 
  }
}