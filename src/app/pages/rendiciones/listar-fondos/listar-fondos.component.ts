import { ChangeDetectorRef, Component, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FondosService } from 'src/app/services/fondos.service';
import { Fondo, Usuario } from '../fondos/interface';
import { centroCosto, jefatura } from './interface';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';
import { CommonModule, DatePipe } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { map, Observable, of, startWith } from 'rxjs';
import { EmailService } from 'src/app/services/email.service';


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
  selector: 'app-listar-fondos',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatCheckboxModule, MatDatepickerModule,
    FormsModule, ReactiveFormsModule, CommonModule, MatDatepicker, MonedaChilenaPipe],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS }, { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },],
  templateUrl: './listar-fondos.component.html',
  styleUrls: ['./listar-fondos.component.scss']
})
export class ListarFondosComponent implements OnInit {
  //tabla
  displayedColumns: string[] = ['rendidor', 'rut', 'aprobadorJefatura', 'referencia', 'centroCosto', 'montoAsignado', 'fechaAsignado', 'totalRendido', 'estado', 'asignacion', 'Acción'];
  //fondos
  fondo: Fondo[] = [];
  fondoId: string | null = null;
  //data de la tabla
  dataSource = new MatTableDataSource<Fondo>([]);
  //centroCosto
  centroCosto: centroCosto[] = [];
  centroFiltrados: centroCosto[];
  //usuarios
  usuarioOption: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  //capturar input filtro
  inputFiltros: any = {
    fechaDesde: '',
    fechaHasta: '',
    referencia: '',
    centroCosto: '',
    rendidor: '',
    estado: '',
    asignacion: '',
  }
  //roles
  rolesUsuario: string[] = [];

  isAlertConditionMet(fondo: any): boolean {
    const hoy = new Date();
    const fechaAsignado = new Date(fondo.fechaAsignado);
    const diasDiferencia = Math.floor(
      (hoy.getTime() - fechaAsignado.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diasDiferencia > 15 && fondo.totalRendido === 0;
  }

  @ViewChild('paginator1') paginator1: MatPaginator;

  constructor(
    private router: Router,
    private fondosService: FondosService,
    private notificacionesService: NotificacionesService,
    private emailService: EmailService,
    private titleService: Title,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
  ) { }

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

      this.obtenerFondos();
      this.obtenerCentrosCosto();
      this.obtenerUsuariosHabilitados();
      this.usuariosFiltrados = this.usuarioOption;
      this.titleService.setTitle('Lista fondos');
      this.aplicarFiltros();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator1;
  }

  obtenerFondos(): void {
    this.fondosService.obtenerFondos().subscribe({
      next: (fondos: Fondo[]) => {
        this.fondo = fondos;
        this.fondo = fondos.reverse();
        this.dataSource.data = this.fondo;
      },
      error: (error) => {
        console.error('Error al obtener los fondos', error);
      }
    });
  }

  //centroCostos. Filtros y autocompleta.
  obtenerCentrosCosto(): void {
    this.fondosService.obtenerCentroCosto().subscribe({
      next: (centrosCosto) => {
        this.centroCosto = centrosCosto;  // Asignamos los centros de costo a la propiedad
      },
      error: (error) => {
        console.error('Error al obtener los centros de costo', error);
      }
    });
  }
  filtrarCentroCosto(event: Event): void {
    const inputValue = (event.target as HTMLInputElement)?.value || '';
    const filtro = inputValue.toLowerCase();
    this.centroFiltrados = this.centroCosto.filter(centro =>
      centro.nombre.toLowerCase().includes(filtro)
    );
  }

  //Usuarios. (rendidor)Filtros y autocompleta2.
  obtenerUsuariosHabilitados(): void {
    const token = localStorage.getItem('token') as string;
    this.fondosService.UsuariosHabilitados(token).subscribe({
      next: (resp: Usuario[]) => {
        if (resp) {
          this.usuarioOption = resp;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar los datos:', error);
      }
    });
  }
  filtrarUsuarios(event: Event): void {
    const inputValue = (event.target as HTMLInputElement)?.value || '';
    const filtro = inputValue.toLowerCase();
    this.usuariosFiltrados = this.usuarioOption.filter(usuario =>
      `${usuario.nombre} ${usuario.apellidoPaterno}`.toLowerCase().includes(filtro)
    );
  }


  // Método para abrir el diálogo 
  openDialog(action: string, fondo: Fondo): void {
      const dialogRef = this.dialog.open(AppFondoModalComponent, {
        data: { fondo, action }, // Pasa el fondo y la acción al modal
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result.event === 'Editar') {
          this.editarFondo(result.data);
        }
      });
  }

  aplicarFiltros() {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const filters = JSON.parse(filter);

      // Formatear la fecha desde y hasta del filtro a 'YYYY-MM-DD'
      const fechaDesdeFiltro = filters.fechaDesde ? new Date(filters.fechaDesde).toISOString().slice(0, 10) : null;
      const fechaHastaFiltro = filters.fechaHasta ? new Date(filters.fechaHasta).toISOString().slice(0, 10) : null;
      // Las fechas en los datos ya están en formato 'YYYY-MM-DD'
      const fechaDesdeData = data.fechaAsignado;
      const fechaHastaData = data.fechaAsignado;
      // Comparar las fechas formateadas
      const fechaDesdeOk = fechaDesdeFiltro ? (fechaDesdeData && fechaDesdeData >= fechaDesdeFiltro) : true;
      const fechaHastaOk = fechaHastaFiltro ? (fechaHastaData && fechaHastaData <= fechaHastaFiltro) : true;
      const fechasOk = fechaDesdeOk && fechaHastaOk;

      //filtross 
      const referenciaOk = filters.referencia ? data.referencia.toLowerCase().startsWith(filters.referencia.toLowerCase()) : true;
      const centroCostoOk = filters.centroCosto ? data.centroCosto.toLowerCase() === filters.centroCosto.toLowerCase() : true;
      const rendidorOk = filters.rendidor ? data.rendidor.toLowerCase() === filters.rendidor.toLowerCase() : true;
      const estadoOk = filters.estado ? data.estado.toLowerCase() === filters.estado.toLowerCase() : true;
      const asignacionOk = filters.asignacion ? data.asignacion.toLowerCase() === filters.asignacion.toLowerCase() : true;

      return fechasOk && centroCostoOk && referenciaOk && rendidorOk && estadoOk && asignacionOk;
    };
  }

  editarFondo(fondo: Fondo): void {
    // Formatear la fecha antes de enviarla
    const fechaFondoFormateada = new Date(fondo.fechaAsignado).toISOString().split('T')[0];
    fondo.fechaAsignado = fechaFondoFormateada;

    this.fondosService.editarFondoPorId(fondo.id, fondo).subscribe({
      next: (response) => {
        this.notificacionesService.success('Fondo actualizado correctamente.');
        this.obtenerFondos(); // Actualizar la lista de fondos
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al editar el fondo', err);
        this.notificacionesService.failure('Error al editar el fondo.');
      },
    });
  }

  eliminarFondo(fondoId: number): void {
    this.notificacionesService.ConfirmAlert('ELIMINAR FONDO', '¿Desea eliminar este fondo?', 'Aceptar', 'Cancelar', (confirm) => {
      if (confirm) {
        // Si el usuario confirma, procedemos con la eliminación
        this.fondosService.eliminarFondo(fondoId).subscribe({
          next: (response) => {
            this.notificacionesService.success('Fondo eliminado correctamente.');
            this.obtenerFondos(); // Actualizar la lista de fondos
          },
          error: (err) => {
            console.error('Error al eliminar el fondo', err);
            this.notificacionesService.failure('Error al eliminar el fondo.');
          }
        });
      } else {
        console.log('Cancelado'); 
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = JSON.stringify(this.inputFiltros);
  }

  updateFechaDesde(event: any) {
    this.inputFiltros.fechaDesde = event.value;
    this.applyFilter();
  }

  updateFechaHasta(event: any) {
    this.inputFiltros.fechaHasta = event.value;
    this.applyFilter();
  }

  updateReferencia(event: any) {
    this.inputFiltros.referencia = event.target.value;
    this.applyFilter();
  }

  updateCentroCosto(nombre: string) {
    this.inputFiltros.centroCosto = nombre;
    this.applyFilter();
  }

  updateRendidor(email: string): void {
    this.inputFiltros.rendidor = email;
    this.applyFilter();
  }

  updateEstado(value: any) {
    this.inputFiltros.estado = value;
    this.applyFilter();
  }

  updateAsignacion(value: any) {
    this.inputFiltros.asignacion = value;
    this.applyFilter();
  }

  limpiarFiltros(): void {
    this.inputFiltros = {
    };
    this.dataSource.filter = JSON.stringify(this.inputFiltros);
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

  notificarRendidor(fondo: any): void {
    this.notificacionesService.ConfirmAlert('NOTIFICAR RENDIDOR', '¿Desea enviar un correo recordatorio del fondo no rendido?', 'Aceptar', 'Cancelar', (confirm) => {
      if (confirm) {
            const email = fondo.rendidor
            const referencia = fondo.referencia || 'Sin referencia';
            const montoAsignado = fondo.montoAsignado || 0;
            const fechaAsignado = fondo.fechaAsignado || new Date().toISOString();
            // Obtener el correo del aprobadorADMIN
            const correo = fondo.rendidor;

            // Extraer nombre y apellido desde el correo
            const [nombre, apellido] = correo.split('@')[0].split('.');

            // Capitalizar el nombre y apellido
            const nombreSeparado = `${this.capitalizar(nombre)} ${this.capitalizar(apellido)}`;
          
            // Formatear el monto a CLP
            const montoFormateado = new Intl.NumberFormat('es-CL', {
              style: 'currency',
              currency: 'CLP',
              minimumFractionDigits: 0,
            }).format(montoAsignado);
            
            // Formatear la fecha
            const fechaFormateada = new Date(fechaAsignado).toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          
            // Construir la URL para que el rendidor ingrese a rendir gastos
            const urlRendicion = `https://rendiciones2.als-inspection.cl/rendiciones/rendidor`;
          
            // Asunto del correo
            const asunto = 'Recordatorio: Aún no has rendido gastos de tu fondo asignado';
          
            // Mensaje en texto plano (opcional)
            const mensaje = `Te recordamos que tienes un fondo/reembolso "${referencia}", pendiente de rendir gastos.`;
            // Mensaje en formato HTML
            const mensaje_html = `
              <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="https://als-inspection.cl/wp-content/uploads/2022/03/120.png" alt="ALS Inspection" style="max-width: 200px; height: auto;">
                </div>
                <h1 style="color: #FFA500; text-align: center;">⚠ Recordatorio de Rendición de Gastos</h1>
                <p>Hola <strong>${nombreSeparado}</strong>,</p>
                <p>Te recordamos que tienes un fondo/reembolso asignado con referencia "<strong>${referencia}</strong>" y aún no has rendido gastos.</p>
                <p>Monto Asignado: <strong>${montoFormateado}</strong></p>
                <p>Fecha de Asignación: <strong>${fechaFormateada}</strong></p>
                <p>Puedes rendir tus gastos en la plataforma haciendo click en el siguiente botón:</p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${urlRendicion}" target="_blank" 
                    style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #FFA500; text-decoration: none; border-radius: 5px;">
                    Ir a rendir gastos
                  </a>
                </div>
                <p>Saludos cordiales,<br>El equipo de ALS Inspection</p>
              </div>
            `;
  
            // Llamar al servicio para enviar el correo
            this.emailService.sendEmail(email, asunto, mensaje, mensaje_html).subscribe({
              next: () => {
                this.notificacionesService.reporte('success', 'Notificación enviada', 'Se ha enviado un recordatorio al rendidor.', 'Entendido');
                console.log('Notificación enviada correctamente', email);
              },
              error: (error) => {
                console.error('Error al enviar la notificación', error);
                this.notificacionesService.reporte('failure', 'Error al notificar', 'No se pudo enviar la notificación.', 'Entendido');
              }
            });
          } else {
            console.log('Cancelado'); 
          }
        });
      }

     // Método para capitalizar una palabra
     private capitalizar(palabra: string): string {
      return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    } 
  
}


//modal fondos
@Component({
  selector: 'app-dialog-content',
  standalone: true,
  imports: [MaterialModule, FormsModule, ReactiveFormsModule, MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatCheckboxModule, MatDatepickerModule, CommonModule, MatNativeDateModule],
  templateUrl: 'fondo-modal.html',
  providers: [DatePipe,
    provideNativeDateAdapter(), // Adaptador nativo
    { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS }, // Formato personalizado
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' }
  ],
})

// Configuración del Dialog Modal
export class AppFondoModalComponent {
  action: string;
  local_data: any;
  fondo: any;

  //centroCosto
  centrosCosto: centroCosto[] = [];
  centroFiltrados: Observable<centroCosto[]>;
  
  //Adminstrativo
  admin: any[] = []; // Para almacenar los usuarios bajo una jefatura
  adminFiltrados: Observable<any[]>; 

  //jefaturas: 
  jefe: jefatura[] = [];
  jefeFiltrados: Observable<jefatura[]>;


  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AppFondoModalComponent>,
    public fondosService: FondosService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    
    this.local_data = { ...data.fondo }; // Fondo recibido
    this.action = data.action;

    // Ajustar la fecha para corregir desfase de zona horaria
    if (this.local_data.fechaAsignado) {
      const fecha = new Date(this.local_data.fechaAsignado);
      // Agregar desfase de la zona horaria local
      fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
      this.local_data.fechaAsignado = fecha;
    }

    // Pre-cargar valores en el formulario
    this.fondoForm.patchValue({
      aprobadorJefatura: this.local_data.aprobadorJefatura || '',
      aprobadorAdmin: this.local_data.aprobadorAdmin || '',
      referencia: this.local_data.referencia || '',
      montoAsignado: this.local_data.montoAsignado || '0',
      centroCosto: this.local_data.centroCosto || '',
      fechaAsignado: this.local_data.fechaAsignado || '',
      asignacion: this.local_data.asignacion || '',
    });
  }


  fondoForm = this.formBuilder.group({
    id: [''],
    aprobadorJefatura: ['', Validators.required],
    aprobadorAdmin: ['', Validators.required],
    referencia: ['', Validators.required],
    montoAsignado: ['', [Validators.required, Validators.min(0)]],
    centroCosto: ['', Validators.required],
    fechaAsignado: ['', Validators.required],
    asignacion: ['', Validators.required],
  });

  get f() {
    return this.fondoForm.controls;
  }
  
  ngOnInit(): void {
    this.obtenerJefaturas();
    this.jefeFiltrados = this.f['aprobadorJefatura'].valueChanges.pipe(
    startWith(''),
    map((value: string | null) => value ?? ''),
    map((value: string) => this._filterJefe(value))
  );
    // Filtros de cambios para los centros
    this.obtenerCentrosCosto();
    this.centroFiltrados = this.f['centroCosto'].valueChanges.pipe(
      startWith(''),
      map((value: string | null) => value ?? ''),
      map((value: string) => this._filter(value))
    );
    //Adminstracion
    this.getUsuariosPorAdmin('ADMINISTRACION');
    this.adminFiltrados = this.f['aprobadorAdmin'].valueChanges.pipe(
      startWith(''),
      map((value: string | null) => value ?? ''),
      map((value: string) => this._filterAdmin(value))
    );
    // Establece un valor inicial aquí si aún no se ha establecido
    if (!this.fondoForm.get('aprobadorAdmin')?.value) {
      this.f['aprobadorAdmin'].setValue('');
    }
  }

  //centroCostos. Filtros y autocompleta.
  obtenerCentrosCosto(): void {
    this.fondosService.obtenerCentroCosto().subscribe({
      next: (centrosCosto) => {
        this.centrosCosto = centrosCosto;  // Asignamos los centros de costo a la propiedad
      },
      error: (error) => {
        console.error('Error al obtener los centros de costo', error);
      }
    });
  }
      // Filtro centros
      private _filter(value: string): centroCosto[] {
        const filterValue = value.toLowerCase();
          return this.centrosCosto.filter((centroCosto) => centroCosto.nombre.toLowerCase().includes(filterValue));
        }
      // Por centros
      trackCentroById(index: number, centro: centroCosto): number {
        return centro.id;
      }

      
  getUsuariosPorAdmin(jefaturaNombre: string): void {
      this.fondosService.getUsuariosPorAdmin(jefaturaNombre).subscribe({
        next: (resp: any) => {
          if (resp && resp.length > 0) {
            this.admin = resp[0]?.usuarios || [];
        
            this.adminFiltrados = of(this.admin);
            } else {
              this.adminFiltrados = of([]);
            }
          },
          error: (error) => {
            console.error('Error al obtener los usuarios de la jefatura:', error);
            this.admin = [];
            this.adminFiltrados = of([]);
          }
        });
    }  
      // Filtro para los jefes administrativos (filtra por nombre o apellido)
      private _filterAdmin(value: string): any[] {
        const filterValue = value.toLowerCase();
        return this.admin.filter((usuario) =>
          usuario.usuario.nombre.toLowerCase().includes(filterValue) || 
          usuario.usuario.apellidoPaterno.toLowerCase().includes(filterValue)
        );
      }


  obtenerJefaturas(): void {
    const token = localStorage.getItem('token') as string;
    this.fondosService.jefeHabilitados(token).subscribe({
      next: (jefaturas: jefatura[]) => {
        // Filtrar jefaturas duplicadas en `usuarioJefe`
        const jefesUnicos = jefaturas.filter(
          (jefe, index, self) =>
          index === self.findIndex((j) => j.usuarioJefe === jefe.usuarioJefe)
        );
        this.jefe = jefesUnicos;
      },
      error: (error) => {
        console.error('Error al obtener jefaturas:', error);
        this.jefe = [];
      }
    });
  }
        // Filtro para jefaturas
        private _filterJefe(value: string): jefatura[] {
          const filterValue = value.toLowerCase();
          return this.jefe.filter(j => j.usuarioJefe.toLowerCase().includes(filterValue));
        }


  check() {
    console.log(this.fondoForm.value);
  }

  doAction(): void {
    if (this.fondoForm) {
      this.local_data.aprobadorJefatura = this.fondoForm.value.aprobadorJefatura;
      this.local_data.aprobadorAdmin = this.fondoForm.value.aprobadorAdmin;
      this.local_data.referencia = this.fondoForm.value.referencia;
      this.local_data.montoAsignado = this.fondoForm.value.montoAsignado;
      this.local_data.centroCosto = this.fondoForm.value.centroCosto;
      this.local_data.fechaAsignado = this.fondoForm.value.fechaAsignado;
      this.local_data.asignacion = this.fondoForm.value.asignacion;
      delete this.local_data.action;

    } else {
      console.log("Formulario inválido");
    }

    this.dialogRef.close({ event: this.action, data: this.local_data });
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancelar' });
  }

  
}
