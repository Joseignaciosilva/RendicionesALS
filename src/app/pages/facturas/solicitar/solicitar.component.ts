import { ChangeDetectorRef, Component } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Solicitud, Usuario, Jefatura } from './interface';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import moment from 'moment';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { AsyncPipe, CommonModule, NgFor, NgForOf, NgIf } from '@angular/common';
import { FacturasService } from 'src/app/services/facturas.service';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin, map, Observable, startWith } from 'rxjs';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { EmailService } from 'src/app/services/email.service';
import { NotiService } from 'src/app/services/noti.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-solicitar',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatIconModule, FormsModule, ReactiveFormsModule,
           AsyncPipe, NgForOf, NgFor, NgIf, MatButtonModule, MatSlideToggleModule, MonedaChilenaPipe, CommonModule],
  providers: [provideNativeDateAdapter(), 
              { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
            ],
  templateUrl: './solicitar.component.html',
  styleUrl: './solicitar.component.scss'
})
export class SolicitarComponent {

  // roles
  rolesUsuario: string[] = [];
  //formulario Solicitud
  formSolicitud: FormGroup;
  mostrarTercerAprobador: boolean = false;
  //PDF
  selectedFile: File | null = null; 
  fileName: string | null = null; 
  //fechas
  date = new FormControl(moment());
  //usuarios
  jefeUsuarios: Usuario[] = [];
  usuarioOption: Usuario[] = [];
  usuariosFiltrados: Observable<Usuario[]>;
  // Jefe unidad (1er aprobador)
  // Jefe de Administración (2do aprobador Carlos Blanco)
  usuarioJefeAdministracion: string = '';
  usuarioRutJefeAdministracion: string = '';
  jefeAdministracionFiltrados: Observable<string[]>;
  //Jefe de Gerencia (3er aprobador Humberto Arroyo)
  usuarioJefeGerencia: string = '';
  usuarioRutJefeGerencia: string = '';

 
  constructor(
    private formBuilder: FormBuilder,
    private notificacionesService: NotificacionesService,
    private notiService: NotiService,
    private emailService: EmailService,
    private cdr: ChangeDetectorRef,
    private facturaService: FacturasService,
    private router: Router,
  ) {

    this.formSolicitud = this.formBuilder.group({
      correlativo: ['', [Validators.required, Validators.maxLength(100)]],
      mesContable: ['', Validators.required],
      anioMesContable: ['', Validators.required],
      unidadNegocio: ['', Validators.required],
      aprobador:  ['', ],
      aprobadorRut: ['', ],
      visadoAprobador: ['Pendiente', Validators.required],
      aprobadorDos:  ['', Validators.required],
      aprobadorRutDos: ['', Validators.required],  
      visadoAprobadorDos: ['Pendiente', Validators.required],
      aprobadorTres:  ['',],
      aprobadorRutTres: ['', ],
      visadoAprobadorTres: ['Pendiente', Validators.required],
      factura: ['', Validators.required],
      fechaGenerado: ['', Validators.required],
      fechaVencimiento: ['', Validators.required],
      monto: ['', Validators.required],
      pendiente: ['0'],
      pagado: ['0'],
      fechaAprobacion: [''],
      fechaDosAprobacion: [''],
      fechaTresAprobacion: [''],
      centroCosto: [''],
      motoNave: ['0'],
      estado: ['por_aprobar'],
      glosaAprobador: [''], //[Validators.maxLength(300)]
      glosaAprobadorDos: [''], //[Validators.maxLength(300)]
      glosaAprobadorTres: [''], //[Validators.maxLength(300)]
    });
  }

  get f() {
    return this.formSolicitud.controls;
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

  resetForm(): void {
    // Guardar los valores que deseas conservar
    const valoresPersistentes = {
      aprobadorDos: this.f['aprobadorDos'].value,
      aprobadorRutDos: this.f['aprobadorRutDos'].value,
      aprobadorTres: this.f['aprobadorTres'].value,
      aprobadorRutTres: this.f['aprobadorRutTres'].value,
    };
  
    // Reiniciar el formulario
    this.formSolicitud.reset({
      correlativo: '',
      aprobador: '',
      aprobadorRut: '',
      mesContable: '',
      anioMesContable: '',
      unidadNegocio: '',
      visadoAprobador: 'Pendiente',
      visadoAprobadorDos: 'Pendiente',
      visadoAprobadorTres: 'Pendiente',
      pendiente: '0',
      pagado: '0',
      estado: 'por_aprobar',
      glosaAprobador: '',
      glosaAprobadorDos: '',
      glosaAprobadorTres: '',
    });
  
    // Restaurar los valores persistentes
    this.formSolicitud.patchValue(valoresPersistentes);
  
    // Limpiar el archivo seleccionado
    this.selectedFile = null;
    this.fileName = null;      
  
    // Actualizar la vista en caso de que los cambios no se reflejen inmediatamente
    this.cdr.detectChanges();
  }
  
    // USUARIOS //
  getUsuarios() {
    const token = localStorage.getItem('token') as string;

    forkJoin({
      jefes: this.facturaService.jefeListado(token),  // Lista de jefaturas
      usuarios: this.facturaService.UsuariosHabilitados(token) // Lista de usuarios habilitados
    }).subscribe({
      next: ({ jefes, usuarios }) => {
        if (jefes && usuarios) {
          // Relacionar los jefes con los usuarios habilitados usando el email
          this.jefeUsuarios = jefes.map((jefatura: Jefatura) => {
            const usuarioEncontrado = usuarios.find((u: Usuario) => u.email === jefatura.usuarioJefe);
            return usuarioEncontrado
              ? { ...usuarioEncontrado, email: jefatura.usuarioJefe }
              : { nombre: 'Desconocido', apellidoPaterno: '', email: jefatura.usuarioJefe };
          });
          // Almacenar los usuarios habilitados también
          this.usuarioOption = usuarios;
        }
      },
      error: (error) => {
        console.error('Error al obtener jefes y usuarios:', error);
      }
    });
  }

        // Filtro usuarios
        private _filterU(value: string): Usuario[] {
          const filterValue = value.toLowerCase();
          return this.usuarioOption.filter((usuario) => usuario.nombre.toLowerCase().includes(filterValue));
        }
        // Por usuarios
        trackUsuarioById(index: number, usuario: Usuario): number {
          return usuario.idUsuario;
        }

        // Extraigo el usuario seleccionado (para nombre, rut y jefe)
        usuarioSeleccionado(usuario: Usuario) {
          this.formSolicitud.patchValue({
            aprobador: usuario.email,
            aprobadorRut: usuario.rut,
          });
        }


  // Obtener jefe de ADMINISTRACION (Carlos Blanco) y actualizo el form
  getJefeAdministracion(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.facturaService.getJefeAdministracion().subscribe({
        next: (usuarioJefe) => {
          this.usuarioJefeAdministracion = usuarioJefe;
          this.buscarRutJefeAdministracion();
          // Si se encontró el RUT, actualizar el form
          if (this.usuarioRutJefeAdministracion) {
            this.formSolicitud.patchValue({
              aprobadorDos: this.usuarioJefeAdministracion,
              aprobadorRutDos: this.usuarioRutJefeAdministracion
            });
          }
          resolve();
        },
        error: (error) => {
          console.error('Error obteniendo jefe de ADMINISTRACION:', error);
          reject(error);
        }
      });
    });
  }

    // Buscar el RUT del jefe de ADMINISTRACION en los usuarios habilitados
    buscarRutJefeAdministracion() {
      const usuarioHabilitado = this.usuarioOption.find(
        (usuario) => usuario.email === this.usuarioJefeAdministracion
      );

      if (usuarioHabilitado) {
        this.usuarioRutJefeAdministracion = usuarioHabilitado.rut;
      } else {
        console.error('No se encontró el usuario habilitado para asignar el RUT del jefe de ADMINISTRACION.');
      }
    }

    // Manejo de selección en el autocompletar
    onJefeAdministracionSelect(usuarioJefe: string) {
      const usuarioHabilitado = this.usuarioOption.find((usuario) => usuario.email === usuarioJefe);

      if (usuarioHabilitado) {
        this.formSolicitud.patchValue({
          aprobadorDos: usuarioJefe,
          aprobadorRutDos: usuarioHabilitado.rut,
        });
      }
    }

  // Función para manejar el tercer aprobador
  toggleTercerAprobador(value: boolean) {
    this.mostrarTercerAprobador = value;
    if (!value) {
      this.formSolicitud.patchValue({
        aprobadorTres: '',
        aprobadorRutTres: ''
      });
    } else if (this.usuarioJefeGerencia) {
      this.formSolicitud.patchValue({
        aprobadorTres: this.usuarioJefeGerencia,
        aprobadorRutTres: this.usuarioRutJefeGerencia
      });
    }
  }

    // Buscar el RUT del jefe de GERENCIA en los usuarios habilitados
    buscarRutJefeGerencia() {
      const usuarioHabilitado = this.usuarioOption.find(
        (usuario) => usuario.email === this.usuarioJefeGerencia
      );

      if (usuarioHabilitado) {
        this.usuarioRutJefeGerencia = usuarioHabilitado.rut;
      } else {
        console.error('No se encontró el usuario habilitado para asignar el RUT del jefe de GERENCIA.');
      }
    }
    
    // Para manejar la selección del tercer aprobador
    usuarioSeleccionadoTres(usuario: Usuario) {
      this.formSolicitud.patchValue({
        aprobadorTres: usuario.email,
        aprobadorRutTres: usuario.rut
      });
    }
  

  ngOnInit ():void {

    this.cargarRoles();
    // Ejemplo: verificar si el usuario tiene roles 'ADM' o 'JEF'
    const rolesValidos = ['ADM'];
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

    // Filtros de cambios para los usuarios
    this.getUsuarios();
    this.usuariosFiltrados = this.f['aprobador'].valueChanges.pipe(
      startWith(''),
      map((value: string | null) => value ?? ''),
      map((value: string) =>
        this.jefeUsuarios.filter((usuario) =>
          usuario.nombre.toLowerCase().includes(value.toLowerCase()) ||
          usuario.apellidoPaterno.toLowerCase().includes(value.toLowerCase())
        )
      )
    );

    // Obtener jefe de ADMINISTRACIÓN primero
    this.getJefeAdministracion().then(() => {
      this.jefeAdministracionFiltrados = this.f['aprobadorDos'].valueChanges.pipe(
        startWith(''),
        map((value: string | null) => value ?? ''),
        map((value: string) => [this.usuarioJefeAdministracion].filter(email => 
          email && email.toLowerCase().includes(value.toLowerCase()))
        )
      );
    });

     // Obtener jefe de GERENCIA y buscar su RUT
    this.facturaService.getJefeGerencia().subscribe({
      next: (usuarioJefe) => {
        this.usuarioJefeGerencia = usuarioJefe;
        this.buscarRutJefeGerencia();
      },
      error: (error) => {
        console.error('Error obteniendo jefe de GERENCIA:', error);
      }
    });
  }
  
  
  crearSolicitud(): void {

    if (this.formSolicitud.invalid) {
      this.notificacionesService.failure('Por favor, complete todos los campos obligatorios')
      return
    }

    const fechaGenerado = new Date(this.formSolicitud.value.fechaGenerado).toISOString().split('T')[0];
    const fechaVencimiento = new Date(this.formSolicitud.value.fechaVencimiento).toISOString().split('T')[0];
  
    const estado = this.formSolicitud.value.aprobador ? 'por_aprobar' : 'en_aprobacion_dos';
  
    const formData = new FormData();
    formData.append('correlativo', this.formSolicitud.value.correlativo);
    formData.append('mesContable', this.formSolicitud.value.mesContable);
    formData.append('anioMesContable', this.formSolicitud.value.anioMesContable);
    formData.append('unidadNegocio', this.formSolicitud.value.unidadNegocio);
    formData.append('aprobador', this.formSolicitud.value.aprobador);
    formData.append('aprobadorRut', this.formSolicitud.value.aprobadorRut);
    formData.append('visadoAprobador', this.formSolicitud.value.visadoAprobador);
    formData.append('aprobadorDos', this.formSolicitud.value.aprobadorDos);
    formData.append('aprobadorRutDos', this.formSolicitud.value.aprobadorRutDos);
    formData.append('visadoAprobadorDos', this.formSolicitud.value.visadoAprobadorDos);
    formData.append('aprobadorTres', this.formSolicitud.value.aprobadorTres);
    formData.append('aprobadorRutTres', this.formSolicitud.value.aprobadorRutTres);
    formData.append('visadoAprobadorTres', this.formSolicitud.value.visadoAprobadorTres);
    formData.append('pendiente', this.formSolicitud.value.pendiente)
    formData.append('pagado', this.formSolicitud.value.pagado)
    formData.append('fechaGenerado', fechaGenerado);
    formData.append('fechaVencimiento', fechaVencimiento);
    formData.append('monto', this.formSolicitud.value.monto.toString());
    formData.append('estado', estado);
  
    if (this.selectedFile) {
      formData.append('factura', this.selectedFile, this.selectedFile.name);
    } else {
      this.notificacionesService.failure('No se ha seleccionado un archivo para enviar.')
      return;
    }
  
    this.facturaService.crearSolicitud(formData).subscribe({
      next: () => {
        this.notificacionesService.success('Solicitud creada correctamente.')
        if (this.formSolicitud.value.aprobador) {
          this.enviarCorreoPrimerAprobador();
          const email =  this.formSolicitud.value.aprobador; 
          if (email) {
          this.notiService.sendNotification(
            email,
            `Factura "${this.formSolicitud.value.correlativo}" lista para aprobación`,
            `facturas/aprobar/`
          )
        }
        } else if (this.formSolicitud.value.aprobadorDos) {
          this.enviarCorreoAprobadorDos();
          const email =  this.formSolicitud.value.aprobadorDos; 
          if (email) {
          this.notiService.sendNotification(
            email,
            `Factura "${this.formSolicitud.value.correlativo}" lista para aprobación`,
            `facturas/aprobar/`
          )
        }
        }
        this.notificacionesService.success('Usuario notificado correctamente.');
      },
      error: (err) => {
        const mensajeError = err.error?.error || '';
      
        if (mensajeError.includes('El correlativo ya existe')) {
          this.notificacionesService.failure('El correlativo ya existe, ingrese otro.');
        } else {
          this.notificacionesService.failure('Error al crear la solicitud.');
        }
      }
    })
  }
  
  enviarCorreoPrimerAprobador() {
    // Datos de la solicitud
    const correlativo = this.formSolicitud.value.correlativo;
    const mesContable = this.formSolicitud.value.mesContable;
    const anioMesContable = this.formSolicitud.value.anioMesContable;
    const unidadNegocio = this.formSolicitud.value.unidadNegocio;
    const fechaVencimiento = new Date(this.formSolicitud.value.fechaVencimiento).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const montoAsignado = this.formSolicitud.value.monto;
    // Formatear el monto a moneda chilena
    const montoFormateado = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0, // Evitar mostrar decimales si no son necesarios
    }).format(montoAsignado);
    // Obtener el correo del aprobadorADMIN
    const correoAprobador = this.formSolicitud.value.aprobador; 

    // Extraer nombre y apellido desde el correo
    const [nombre, apellido] = correoAprobador.split('@')[0].split('.');

    // Capitalizar el nombre y apellido
    const nombreAprobador = `${this.capitalizar(nombre)} ${this.capitalizar(apellido)}`;

    // CORREO
    const email = this.formSolicitud.value.aprobador; 
    const baseUrl = 'https://rendiciones2.als-inspection.cl/facturas/aprobar';
    const asunto = `Aprobación - Factura`;
    const mensaje_html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://als-inspection.cl/wp-content/uploads/2022/03/120.png" alt="ALS Inspection" style="max-width: 200px; height: auto;">
      </div>
      <h1 style="color: #0056b3; text-align: center;">Nueva Solicitud de Aprobación</h1>
      <p>Hola, ${nombreAprobador}</p>
      <p>Se te ha asignado la revisión de una solicitud de FACTURA. A continuación, puedes ver los detalles de la solicitud que necesitas aprobar para que el flujo continúe:</p>
      <ul>
          <li>Correlativo: <strong>${correlativo}</strong></li>
          <li>Mes Contable: <strong>${mesContable}</strong> - Año: <strong>${anioMesContable}</strong></li>
          <li>Unidad de Negocio: <strong>${unidadNegocio}</strong></li>
          <li>Monto: <strong>${montoFormateado}</strong></li>
          <li>Fecha de Vencimiento: <strong>${fechaVencimiento}<strong></li>
      </ul>
      
      <p>Por favor, revisa esta solicitud y toma una de las siguientes acciones:</p>
      <ul>
        <li><strong>Aprobar:</strong> Si todo está correcto y deseas continuar con la solicitud.</li>
        <li><strong>Rechazar:</strong> Si encuentras algún error o no estás de acuerdo con los detalles.</li>
      </ul>
      
      <p>Haz clic en el siguiente enlace para proceder con la aprobación o rechazo:</p>
      <div style="text-align: center; margin: 20px 0;">
          <a href="${baseUrl}" target="_blank" 
            style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #0056b3; text-decoration: none; border-radius: 5px;">
            Ir a Aprobación
          </a>
        </div>
      
      <p>Una vez que se apruebe la solicitud, el flujo continuará con el siguiente aprobador. Si tienes alguna duda, por favor contacta al equipo de ALS Inspection.</p>
      
      <p>Saludos cordiales,<br>El equipo de ALS Inspection</p>
    </div>
  `;

    // Enviar correo
    this.emailService.sendEmail(email, asunto, '', mensaje_html).subscribe({
      next: () => {
        console.log(`Correo enviado a (${email}) para aprobación.`);
        this.resetForm();
      },
      error: (err) => {
        console.error(`Error al enviar correo a (${email})`, err);
      },
    });
  }
     // Método para capitalizar una palabra
     private capitalizar(palabra: string): string {
      return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    } 

  enviarCorreoAprobadorDos(): void {
    const aprobadorDosEmail = this.formSolicitud.value.aprobadorDos;
    if (!aprobadorDosEmail) return;
  
    // Datos de la solicitud
    const correlativo = this.formSolicitud.value.correlativo;
    const mesContable = this.formSolicitud.value.mesContable;
    const anioMesContable = this.formSolicitud.value.anioMesContable;
    const unidadNegocio = this.formSolicitud.value.unidadNegocio;
    const fechaVencimiento = new Date(this.formSolicitud.value.fechaVencimiento).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const montoAsignado = this.formSolicitud.value.monto;
    // Formatear el monto a moneda chilena
    const montoFormateado = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0, // Evitar mostrar decimales si no son necesarios
    }).format(montoAsignado);
    // Obtener el correo del aprobador
    const correoAprobador = this.formSolicitud.value.aprobadorDos; 

    // Extraer nombre y apellido desde el correo
    const [nombre, apellido] = correoAprobador.split('@')[0].split('.');

    // Capitalizar el nombre y apellido
    const nombreAprobador = `${this.capitalizar(nombre)} ${this.capitalizar(apellido)}`;

    // CORREO
    const baseUrl = 'https://rendiciones2.als-inspection.cl/facturas/aprobar';
    const asunto = `Aprobación - Factura`;
    const mensaje_html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://als-inspection.cl/wp-content/uploads/2022/03/120.png" alt="ALS Inspection" style="max-width: 200px; height: auto;">
      </div>
      <h1 style="color: #0056b3; text-align: center;">Nueva Solicitud de Aprobación</h1>
      <p>Hola, ${nombreAprobador}</p>
      <p>Se te ha asignado la revisión de una solicitud de FACTURA. A continuación, puedes ver los detalles de la solicitud que necesitas aprobar para que el flujo continúe:</p>
      <ul>
          <li>Correlativo: <strong>${correlativo}</strong></li>
          <li>Mes Contable: <strong>${mesContable}</strong> - Año: <strong>${anioMesContable}</strong></li>
          <li>Unidad de Negocio: <strong>${unidadNegocio}</strong></li>
          <li>Monto: <strong>${montoFormateado}</strong></li>
          <li>Fecha de Vencimiento: <strong>${fechaVencimiento}<strong></li>
      </ul>
      
      <p>Por favor, revisa esta solicitud y toma una de las siguientes acciones:</p>
      <ul>
        <li><strong>Aprobar:</strong> Si todo está correcto y deseas continuar con la solicitud.</li>
        <li><strong>Rechazar:</strong> Si encuentras algún error o no estás de acuerdo con los detalles.</li>
      </ul>
      
      <p>Haz clic en el siguiente enlace para proceder con la aprobación o rechazo:</p>
      <div style="text-align: center; margin: 20px 0;">
          <a href="${baseUrl}" target="_blank" 
            style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #0056b3; text-decoration: none; border-radius: 5px;">
            Ir a Aprobación
          </a>
        </div>
      
      <p>Una vez que se apruebe la solicitud, el flujo continuará con el siguiente aprobador. Si tienes alguna duda, por favor contacta al equipo de ALS Inspection.</p>
      
      <p>Saludos cordiales,<br>El equipo de ALS Inspection</p>
    </div>
  `;

    this.emailService.sendEmail(aprobadorDosEmail, asunto, '', mensaje_html).subscribe({
      next: () => {
        console.log(`Correo enviado a (${aprobadorDosEmail}) para aprobación.`),
        this.resetForm();
      },
      error: () => 
        this.notificacionesService.failure(`Error al enviar correo a ${aprobadorDosEmail}`)
    });
  }
  
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
  
      if (file.type === 'application/pdf') {
        this.selectedFile = file;          // Guarda el archivo completo
        this.fileName = file.name;         // Guarda solo el nombre del archivo para mostrar
      } else {
        console.error('El archivo seleccionado no es un PDF.');
        this.notificacionesService.failure('Por favor, selecciona un archivo PDF.');
        this.selectedFile = null;
        this.fileName = null;              // Limpiar nombre si no es un PDF
      }
    }
  }
  
  
}
