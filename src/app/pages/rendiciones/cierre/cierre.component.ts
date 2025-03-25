import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { FondosService } from 'src/app/services/fondos.service';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { Fondo,  } from './interface';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';
import { forkJoin } from 'rxjs';
import { NotiService } from 'src/app/services/noti.service';

@Component({
  selector: 'app-cierre',
  standalone: true,
  imports: [
    MaterialModule, CommonModule, RouterLink, FormsModule, ReactiveFormsModule, TablerIconsModule, MonedaChilenaPipe,
  ],
  templateUrl: './cierre.component.html',
  styleUrl: './cierre.component.scss'
})
export class CierreComponent {
  
  fondos: Fondo[] = [];
  fondoId: string ;

  //roles
  rolesUsuario: string[] = [];

  constructor(private fondosService: FondosService, 
    private notificacionesService: NotificacionesService,
    private notiService: NotiService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ){
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
    
    this.cargarFondosSolicitados();
    this.cdr.detectChanges();
  }

  //mostrar todo los fondos junto sus valores a netear
  cargarFondosSolicitados(): void {
    const usuario = localStorage.getItem('email'); // Email del usuario autenticado
    if (!usuario) {
      this.notificacionesService.failure('No se encontró información del usuario.');
      return;
    }

    forkJoin({
      fondos: this.fondosService.obtenerFondos(),
      neteos: this.fondosService.obtenerNeteos(),
    }).subscribe({
      next: ({ fondos, neteos }) => {
        const neteosMap = new Map(neteos.map(n => [n.fondo.id, n]));
  
        this.fondos = fondos.reverse()
          .filter(fondo => fondo.estado === 'en_cierre' && fondo.aprobadorAdmin === usuario)
          .map(fondo => {
            const neteo = neteosMap.get(fondo.id);
            return {
              ...fondo,
              saldo_empresa: neteo?.saldo_empresa || 0,
              saldo_rendidor: neteo?.saldo_rendidor || 0,
            };
          });
      },
      error: (error: any) => {
        console.error('Error al cargar fondos o neteos:', error);
        this.notificacionesService.failure('Ocurrió un error al cargar los datos.');
      },
    });
  }
  
  
  documentoExcel(fondoId: number) {
    this.fondosService.exportDetalleRendicion(fondoId).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fondo_${fondoId}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
  
  netear(fondoId: number): void {
    const fondo = this.fondos.find(f => f.id === fondoId);
    if (!fondo) {
      this.notificacionesService.failure('El fondo no se encontró. Intente nuevamente.');
      return;
    }

    if (fondo.saldo_empresa === 0 && fondo.saldo_rendidor === 0) {
      this.notificacionesService.info('Los saldos ya están en 0. No es necesario netear.');
      return;
    }
  
    this.notificacionesService.ConfirmAlert('Netear saldos','¿Está seguro de realizar el neteo?','Aceptar','Cancelar',
      (confirm) => {
        if (confirm) {
          this.fondosService.netearFondo(String(fondoId)).subscribe({
            next: (response) => {
              this.notificacionesService.success(response.message);
              // Actualizar los saldos en la lista local
              fondo.saldo_empresa = 0;
              fondo.saldo_rendidor = 0;
            },
            error: (error) => {
              console.error('Error al netear el fondo:', error);
              this.notificacionesService.failure('No se pudo netear el fondo.');
            },
          });
        } else {
          this.notificacionesService.info('La acción ha sido cancelada.');
        }
      }
    );
  }


  cerrarFondo(fondoId: number): void {
    const fondoIndex = this.fondos.findIndex(f => f.id === fondoId);
  
    if (fondoIndex === -1) {
      this.notificacionesService.failure('El fondo no se encontró. Intente nuevamente.');
      return;
    }
  
    const fondo = this.fondos[fondoIndex];
  
    if (fondo.saldo_empresa !== 0 || fondo.saldo_rendidor !== 0) {
      this.notificacionesService.info('No puede cerrar el fondo hasta que los saldos estén neteados.');
      return;
    }
  
    this.notificacionesService.ConfirmAlert('Cerrar fondo', '¿Está seguro de que desea cerrar este fondo?', 'Aceptar', 'Cancelar',
      (confirm) => {
        if (confirm) {
          this.fondosService.updateEstadoFondo(String(fondoId), 'finalizado').subscribe({
            next: (response) => {
              this.notificacionesService.success('Fondo cerrado con éxito.');
  
              // Enviar una notificación al rendidor
              const email = fondo.rendidor; // Asegúrate de que el objeto "fondo" tenga el email del rendidor
              if (email) {
                  this.notiService.sendNotification(
                      email,
                      `Fondo "${fondo.referencia}" ha finalizado correctamente.`,
                      `rendiciones/misfondos/`
                    )
              }

              // Agregar la clase de animación
              const elemento = document.querySelector(`#fondo-${fondoId}`);
              if (elemento) {
                elemento.classList.add('removing');
              }
  
              // Esperar a que la animación termine antes de eliminarlo
              setTimeout(() => {
                this.fondos.splice(fondoIndex, 1);
                this.cdr.detectChanges();
              }, 500); // Duración de la animación
            },
            error: (error) => {
              console.error('Error al cerrar el fondo:', error);
              this.notificacionesService.failure('No se pudo cerrar el fondo.');
            },
          });
        } else {
          this.notificacionesService.info('La acción ha sido cancelada.');
        }
      }
    );
  }
  
}


