import { ChangeDetectorRef, Component, Inject, NgModule, OnInit, Optional } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';
import { Solicitud } from '../solicitar/interface';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { Router } from '@angular/router';
import { CommonModule, NgFor, NgForOf, NgIf } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { FacturasService } from 'src/app/services/facturas.service';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogContent, MatDialogModule } from '@angular/material/dialog';

export const CHILEAN_DATE_FORMATS: MatDateFormats = {
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
  selector: 'app-aprobar',
  standalone: true,
  imports: [
    MaterialModule, 
    TablerIconsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatNativeDateModule, 
    MatChipsModule, 
    MatCardModule, 
    MatDatepickerModule,
    MatButtonModule, 
    NgFor, 
    CommonModule, 
    NgForOf, 
    MonedaChilenaPipe, 
    NgIf, FormsModule,
    MatDialogModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
  ],
  templateUrl: './aprobar.component.html',
  styleUrl: './aprobar.component.scss'
})
export class AprobarComponent implements OnInit {

  solicitudes: Solicitud[] = [];
  pdfVisible = false;
  pdfUrl: string | null = null;
  glosa: string | null = null;

  constructor(
    private facturasService: FacturasService,
    private notificacionesService: NotificacionesService,
    private notiService: NotiService,
    private emailService: EmailService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    public dialog: MatDialog,
  ) {
    
  }
  
  ngOnInit(): void {
    const email = localStorage.getItem('email');

    if (email) {
      this.cargarSolicitudes(email);
    } else {
      this.notificacionesService.failure('No se encontró un correo electrónico válido.');
      this.router.navigate(['/authentication/error']); // Redirigir si no hay correo válido
    }
  }

  cargarSolicitudes(email: string): void {
    this.facturasService.obtenerSolicitudPorAprobador(email).subscribe({
        next: (solicitudes: Solicitud[]) => {
            console.log('Solicitudes filtradas por email:', solicitudes); // Debug adicional
            this.solicitudes = solicitudes;
            this.cdr.detectChanges();
        },
        error: (error: any) => {
            console.error('Error al obtener las solicitudes:', error);
            this.notificacionesService.failure('Ocurrió un error al cargar las solicitudes.');
        }
    });
  }
  
  aprobarSolicitud(solicitud: Solicitud): void {
    let nuevoEstado: string | null = null;
    let siguienteAprobadorEmail: string | null = null;
  
    // Obtener los roles del usuario actual
    const rolesUsuario = JSON.parse(localStorage.getItem('roles') || '[]');
    const rolActual = rolesUsuario.find((rol: string) => rol === 'JEF' || rol === 'ADM' || rol === 'GER');
  
    // Validar permisos según el nivel de aprobación
    if (solicitud.estado === 'por_aprobar' && rolActual !== 'JEF') {
      this.notificacionesService.failure('No tienes permisos para aprobar en el nivel 1.');
      return;
    } else if (solicitud.estado === 'en_aprobacion_dos' && rolActual !== 'ADM') {
      this.notificacionesService.failure('No tienes permisos para aprobar en el nivel 2.');
      return;
    } else if (solicitud.estado === 'en_aprobacion_tres' && rolActual !== 'GER') {
      this.notificacionesService.failure('No tienes permisos para aprobar en el nivel 3.');
      return;
    }
  
    // Determinar el nuevo estado y el siguiente aprobador
    if (solicitud.estado === 'por_aprobar') {
      nuevoEstado = 'en_aprobacion_dos';
      siguienteAprobadorEmail = solicitud.aprobadorDos;
    } else if (solicitud.estado === 'en_aprobacion_dos') {
      nuevoEstado = solicitud.aprobadorTres ? 'en_aprobacion_tres' : 'en_pago';
      siguienteAprobadorEmail = solicitud.aprobadorTres;
    } else if (solicitud.estado === 'en_aprobacion_tres') {
      nuevoEstado = 'en_pago';
      siguienteAprobadorEmail = null; // Ya no hay más aprobadores
    } else {
      console.error('Estado no manejado:', solicitud.estado);
      return;
    }
  
    // Confirmación y ejecución de la aprobación
    this.notificacionesService.ConfirmAlert(
      'Aprobación de Solicitud',
      '¿Desea enviar su aprobación?',
      'Aceptar',
      'Cancelar',
      (confirm) => {
        if (confirm) {
          this.facturasService
            .cambiarEstadoGlosa(String(solicitud.id), nuevoEstado, solicitud.glosa || '')
            .subscribe({
              next: () => {
                // Eliminar de la lista las solicitudes aprobadas
                this.solicitudes = this.solicitudes.filter(s => s.id !== solicitud.id);
                this.notificacionesService.success('La solicitud fue aprobada correctamente.');
  
                // Enviar correo al siguiente aprobador, si existe
                if (siguienteAprobadorEmail) {
                  this.enviarCorreoAprobador(siguienteAprobadorEmail, nuevoEstado, solicitud);
  
                  // Enviar notificación en la plataforma al siguiente aprobador
                  this.notiService.sendNotification(
                    siguienteAprobadorEmail,
                    `Factura "${solicitud.correlativo}" lista para aprobación`,
                    `facturas/aprobar/`
                  );
  
                  this.notificacionesService.success('Usuario notificado correctamente.');
                }
              },
              error: (err) => {
                console.error('Error al aprobar la solicitud:', err);
                this.notificacionesService.failure('Ocurrió un error al aprobar la solicitud.');
              },
            });
        } else {
          this.notificacionesService.info('La acción ha sido cancelada.');
        }
      }
    );
  }
  
  
  enviarCorreoAprobador(email: string, estado: string, solicitud: Solicitud): void {
    const asunto = `Aprobación de Solicitud - Nivel ${estado}`;
    const monto = solicitud.monto

    // Formatear el monto a moneda chilena
    const montoFormateado = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(monto);

    const mensaje_html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://als-inspection.cl/wp-content/uploads/2022/03/120.png" alt="ALS Inspection" style="max-width: 200px; height: auto;">
        </div>
        <h1 style="color: #0056b3; text-align: center;">Nueva Solicitud de Aprobación</h1>
        <p>Se te ha asignado la revisión de una solicitud de FACTURA, porfavor realiza el visado de: <strong>${estado}</strong>.</p>
        <p>Detalles de la solicitud: </p>
        <ul>
          <li>Correlativo: <strong>${solicitud.correlativo}</strong></li>
          <li>Mes Contable: <strong>${solicitud.mesContable}</strong> - Año: <strong>${solicitud.anioMesContable}</strong></li>
          <li>Unidad de Negocio: <strong>${solicitud.unidadNegocio}</strong></li>
          <li>Monto: <strong>${montoFormateado}</strong></li>
          <li>Fecha de Vencimiento: <strong>${solicitud.fechaVencimiento}<strong></li>
        </ul>
      <p>Por favor, revisa esta solicitud y toma una de las siguientes acciones:</p>
        <ul>
          <li><strong>Aprobar:</strong> Si todo está correcto y deseas continuar con el flujo de la solicitud.</li>
          <li><strong>Rechazar:</strong> Si encuentras algún error o no estás de acuerdo con los detalles.</li>
        </ul>

        <p>Haz clic en el siguiente enlace para proceder con la aprobación o rechazo:</p>
        <div style="text-align: center; margin: 20px 0;">
            <a href="https://rendiciones2.als-inspection.cl/facturas/aprobar" target="_blank"
              style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #0056b3; text-decoration: none; border-radius: 5px;">
              Ir a Aprobación
            </a>
          </div>
        <p>Saludos cordiales,<br>El equipo de ALS Inspection</p>
      </div>
    `;
  
    // Enviar el correo
    this.emailService.sendEmail(email, asunto, '', mensaje_html).subscribe({
      next: () => {
        console.log(`Correo enviado a (${email}) para aprobación.`);
      },
      error: (err) => {
        console.error(`Error al enviar correo a (${email})`, err);
      },
    });
  }

  rechazarSolicitud(solicitud: Solicitud, glosa: string | undefined): void {
    // Asegurarse de que glosa sea un string o null, no undefined
    const glosaFinal: string | null = glosa ?? ''; // Usa '' si glosa es undefined

    console.log('Glosa Final:', glosaFinal); // Verifica el valor final de la glosa

    if (!glosaFinal) {
        console.error('Error: La glosa está vacía');
        this.notificacionesService.failure('Debe proporcionar una glosa para rechazar la solicitud.');
        return;
    }

    this.notificacionesService.ConfirmAlert(
      'Rechazo de Solicitud',
      '¿Desea rechazar la solicitud?',
      'Aceptar',
      'Cancelar',
      (confirm) => {
          if (confirm) {
              this.facturasService
                  .cambiarEstadoGlosa(String(solicitud.id), 'rechazada', glosaFinal) // Asegúrate de pasar un valor válido
                  .subscribe({
                      next: () => {
                          this.solicitudes = this.solicitudes.filter(s => s.id !== solicitud.id);
                          this.notificacionesService.success('La solicitud fue rechazada correctamente.');
                      },
                      error: (err) => {
                          console.error('Error al rechazar la solicitud:', err);
                          this.notificacionesService.failure('Ocurrió un error al rechazar la solicitud.');
                      },
                  });
          } else {
              this.notificacionesService.info('La acción ha sido cancelada.');
          }
      }
    );
  }

  abrirFacturaModal(pdfUrl: string): void {
   this.dialog.open(PdfModalComponent, {
      width: '85vw', 
      height: '85vh', 
      panelClass: 'custom-dialog-container', 
      data: { pdfUrl }
    });   
  }
}






import { MatDialogRef } from '@angular/material/dialog';
import { SafeUrlPipe } from 'src/app/pipe/SafeUrl.pipe';  
import { MatIcon } from '@angular/material/icon';
import { EmailService } from 'src/app/services/email.service';
import { NotiService } from 'src/app/services/noti.service';

@Component({
  selector: 'app-pdf-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    SafeUrlPipe, 
    TablerIconsModule,
    MatIcon,
  ],
  templateUrl: './factura-modal.html', 
})
export class PdfModalComponent {
  constructor(
    public dialogRef: MatDialogRef<PdfModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pdfUrl: string }
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}

