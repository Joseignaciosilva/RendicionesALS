import { Component, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MaterialModule } from '../../../material.module';
import { CommonModule, NgFor, NgForOf, NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { FacturasService } from '../../../services/facturas.service';
import { Solicitud } from '../solicitar/interface';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormsModule } from '@angular/forms';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { Router } from '@angular/router';


@Component({
  selector: 'app-pagar',
  standalone: true,
  imports:[MatTableModule, CommonModule, MatCardModule,MaterialModule, MatFormFieldModule, MatInputModule, TablerIconsModule,
    MatChipsModule, MatCardModule,MatButtonModule, NgFor,NgForOf, MonedaChilenaPipe, NgIf, FormsModule,MatPaginatorModule],
  templateUrl: './pagar.component.html',
  styleUrl: './pagar.component.scss'
})
export class PagarComponent implements OnInit {
  // roles
  rolesUsuario: string[] = [];
  
  solicitudes: Solicitud[] = [];
  //data de la tabla
  dataSource = new MatTableDataSource<Solicitud>([]);
  displayedColumns: string[] = ['correlativo', 'fechaGenerado', 'fechaVencimiento'];
  solicitudSeleccionada: Solicitud | null = null;
  monto: number = 0;

  // isMobile: boolean = window.innerWidth <= 768;
  isMobile: boolean = window.innerWidth <= 1200;


  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private facturasService: FacturasService,
    private notificacionesService: NotificacionesService,
    public dialog: MatDialog,
    private router: Router,
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
    // Ejemplo: verificar si el usuario tiene roles 'ADM' 
    const rolesValidos = ['ADM'];
    if (!this.tieneRolNecesario(rolesValidos)) {
      this.notificacionesService.reporte(
        'failure',
        'Acceso Denegado',
        'Por ahora no cuentas con un rol privilegiado para visualizar esta página. Comuniquese con el área de TI',
        'Entendido',
        () => {// Callback al hacer clic en el botón
            this.router.navigate(['/home']); // Redirige después de 2 segundos
        }
      );
    return;
    }

    this.cargarSolicitudes();
    window.addEventListener('resize', this.checkScreenSize.bind(this)); //checkeo tamañao pantalla
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 1200;
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  cargarSolicitudes(): void {
    this.facturasService.obtenerSolicitudPorEstado('en_pago').subscribe({
      next: (data) => {
        (this.solicitudes = data),
        this.dataSource.data = [...this.solicitudes].reverse();
      },
      error: (err) => console.error(err),
    });
  }

  seleccionarSolicitud(solicitud: any) {
    if (this.isMobile) {
        const dialogRef = this.dialog.open(PagoModalComponent, {
            width: '90%',
            data: solicitud,
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result?.event === 'Pagar' && result.monto) {
            this.solicitudSeleccionada = solicitud;
            this.monto = result.monto;
            this.procesarPago();
          } else if (result?.event === 'Cerrar') {
            this.solicitudSeleccionada = solicitud;
            this.cerrarSolicitud();
          }
        });
    } else {
      this.solicitudSeleccionada = solicitud;
      this.monto = 0; 
    }
  }

  procesarPago(): void {
    if (!this.solicitudSeleccionada || this.monto <= 0) {
      this.notificacionesService.failure('Ingrese un monto válido.');
      return;
    }

    const saldoPendiente = this.solicitudSeleccionada.monto - (this.solicitudSeleccionada.pagado || 0);

    if (saldoPendiente === 0) {
      this.notificacionesService.failure('No puedes pagar más porque el saldo pendiente es 0.');
      return;
    }

    if (this.monto > saldoPendiente) {
      this.notificacionesService.failure(`No puedes pagar más del saldo pendiente: $${saldoPendiente}`);
      return;
    }

    this.facturasService
      .cambiarMontoPagado(this.solicitudSeleccionada.id.toString(), this.monto)
      .subscribe({
        next: () => {
          this.notificacionesService.success('Pago registrado con éxito.');

          // Actualizar valores 
          this.solicitudSeleccionada!.pagado = (this.solicitudSeleccionada!.pagado || 0) + this.monto;
          this.solicitudSeleccionada!.pendiente = this.solicitudSeleccionada!.monto - this.solicitudSeleccionada!.pagado;

          if (this.solicitudSeleccionada!.pendiente === 0) {
            this.solicitudSeleccionada!.estado = 'cerrada';
          }

          this.monto = 0; 
        },
        error: (err) => {
          console.error(err);
          this.notificacionesService.failure('Error al registrar el pago.');
        },
      });
  }

  cerrarSolicitud(): void {
    if (this.solicitudSeleccionada) {
      if (this.solicitudSeleccionada.pendiente === 0) {
        this.facturasService
          .cambiarEstadoGlosa(this.solicitudSeleccionada.id.toString(), 'cerrada', null)
          .subscribe({
            next: () => {
              if (this.solicitudSeleccionada) {
              this.notificacionesService.success('Solicitud cerrada con éxito.');
              this.solicitudSeleccionada.estado = 'cerrada';
              this.solicitudes = this.solicitudes.filter(s => s.id !== this.solicitudSeleccionada!.id);
              this.dataSource.data = [...this.solicitudes].reverse();

              if (this.solicitudes.length > 0) {
                this.solicitudSeleccionada = this.solicitudes[0]
              } else {
                this.solicitudSeleccionada = null;
              }
            }},
            error: (err) => {
              console.error(err);
              this.notificacionesService.failure('Error al cerrar la solicitud.');
            }
          });
      } else {
        this.notificacionesService.failure('No se puede cerrar la solicitud si tiene saldo pendiente.');
      }
    }
  }
  
}




//modal pagos movil
@Component({
  selector: 'app-dialog-content',
  standalone: true,
  imports: [MaterialModule, MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, CommonModule, MonedaChilenaPipe, FormsModule, NgFor,MatButtonModule,
    
  ],
  templateUrl: 'pagar-modal.html',
  styleUrl: './pagar.component.scss'
})

export class PagoModalComponent {
  monto: number = 0; 
  pendiente: number = 0
  solicitudSeleccionada: any; 

  constructor(
    public dialogRef: MatDialogRef<PagoModalComponent>,
    private notificacionesService: NotificacionesService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log(data);
    if (data) {
      this.solicitudSeleccionada = { ...data }; 
    }
  }

  procesarPago() {
    if (this.monto <= 0) {
      this.notificacionesService.failure('Ingrese un monto válido.');
        return;
    }
    this.dialogRef.close({ event: 'Pagar', monto: this.monto });
  }

  cerrarSolicitud() {
    if (this.solicitudSeleccionada) {
      if (this.solicitudSeleccionada.pendiente === 0) {
        this.dialogRef.close({ event: 'Cerrar' });
      } else {
        this.notificacionesService.failure('No se puede cerrar la solicitud si tiene saldo pendiente.');
      }
    }
  }
  
  
}


