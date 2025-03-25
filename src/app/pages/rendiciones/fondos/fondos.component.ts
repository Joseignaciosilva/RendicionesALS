import { Component, ChangeDetectorRef } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, provideNativeDateAdapter } from '@angular/material/core';
import { centroCosto, Usuario, jefatura } from './interface';
import { map, Observable, startWith } from 'rxjs';
import { FondosService } from 'src/app/services/fondos.service';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncPipe, NgFor, NgForOf, NgIf } from '@angular/common';
import { NotificacionesService } from 'src/app/services/notificaciones.service'
import { Router } from '@angular/router';
import { EmailService } from 'src/app/services/email.service';
import { NotiService } from 'src/app/services/noti.service';
import { CommonModule } from '@angular/common'; 

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
  selector: 'fondos',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatCheckboxModule, MatDatepickerModule, 
            AsyncPipe, NgForOf, NgFor, NgIf, FormsModule, ReactiveFormsModule, FormsModule, CommonModule],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS },{ provide: MAT_DATE_LOCALE, useValue: 'es-CL' },],
  templateUrl: './fondos.component.html',
  styleUrl: './fondos.component.scss'
})

export class FondosComponent {

  //centros
  centroOption: centroCosto[] = [];
  centroFiltrados: Observable<centroCosto[]>;
  //usuarios
  usuarioOption: Usuario[] = [];
  usuariosFiltrados: Observable<Usuario[]>;
  //jefaturas: 
  jefe: jefatura[] = [];
  jefeFiltrados: Observable<jefatura[]>;
  //Adminstrativo
  admin: any[] = []; // Para almacenar los usuarios bajo una jefatura
  adminFiltrados: Observable<any[]>; 
  //formulario de fondo
  formFondo : FormGroup;
  //roles
  rolesUsuario: string[] = [];

  constructor(private fondoServicio: FondosService, 
    private formBuilder: FormBuilder, 
    private notificacionesService : NotificacionesService,
    private emailService: EmailService,
    private notiService: NotiService,
    private cdr: ChangeDetectorRef, 
    private router: Router) { 

    this.formFondo = this.formBuilder.group({
      rendidor: ['', Validators.required],
      nombre: ['', Validators.required],
      rut: ['', Validators.required],
      aprobadorJefatura: ['', Validators.required],
      aprobadorAdmin: ['', Validators.required],
      referencia: ['', [Validators.required, Validators.maxLength(200)]],
      montoAsignado: ['', Validators.required],
      motoNave: ['0', Validators.required],
      centroCosto: [''],
      fechaAsignado: ['', Validators.required],
      totalRendido: ['0'], 
      estado: ['pendiente'],
      asignacion: ['asignado'],
    });
  }
  
  get f() {
    return this.formFondo.controls;
  }

  // Llamar a los CENTROS habilitados //
  obtenerCentros() {
    this.fondoServicio.obtenerCentroCosto().subscribe({
      next: (resp: any) => {
        if (resp) {
          this.centroOption = resp;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar los datos:', error);
      }
    });
  }
        // Filtro centros
        private _filter(value: string): centroCosto[] {
          const filterValue = value.toLowerCase();
          return this.centroOption.filter((centroCosto) => centroCosto.nombre.toLowerCase().includes(filterValue));
        }
        // Por centros
        trackCentroById(index: number, centro: centroCosto): number {
          return centro.id;
        }

  // USUARIOS //
  getUsuarios() {
    const token = localStorage.getItem('token') as string;
    this.fondoServicio.UsuariosHabilitados(token).subscribe({
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
    // Autocompletar nombre y rut
    this.formFondo.patchValue({
      nombre: `${usuario.nombre} ${usuario.apellidoPaterno}`,
      rut: usuario.rut
    });

      //Completar jefatura
      this.fondoServicio.getJefePorCorreo(usuario.email).subscribe({
        next: (response) => {
          console.log(response);
          // Aquí accedemos al primer elemento de la respuesta (si es una lista)
          const jefe = response[0]?.usuarioJefe;
          if (jefe) {
            this.formFondo.patchValue({
              aprobadorJefatura: `${jefe.email}`
            });
          }
        },
        error: (err) => {
          console.error('Error al obtener el jefe:', err);
        }
      });
    }

    obtenerJefaturas(): void {
      const token = localStorage.getItem('token') as string;
      this.fondoServicio.jefeHabilitados(token).subscribe({
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

  // Obtener usuarios por ADMINSTRACION (basado en el nombre de la jefatura) //
  getUsuariosPorAdmin(jefaturaNombre: string) {
    this.fondoServicio.getUsuariosPorAdmin(jefaturaNombre).subscribe({
      next: (resp: any) => {
        if (resp && resp.length > 0) {
          this.admin = resp[0]?.usuarios || [];  
          console.log(this.admin); 
        }
      },
      error: (error: any) => {
        console.error('Error al obtener los usuarios de la jefatura:', error);
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
    // Extraigo el usuario seleccionado de la jefatura
    onAdminSelect(admin: any) {
      // Aquí puedes tomar el usuario seleccionado y hacer algo con él
      this.formFondo.patchValue({
        aprobadorAdmin: `${admin.usuario.email}`
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
    const rolesValidos = ['ADM'];
    if (!this.tieneRolNecesario(rolesValidos)) {
      this.notificacionesService.reporte(
        'failure',
        'Acceso Denegado',
        'Por ahora no cuentas con un rol privilegiado para visualizar esta página. Comuniquese con el área de TI',
        'Entendido',
        () => {// Callback al hacer clic en el botón
            this.router.navigate(['/home']); 
        }
      );
    return};

    // Filtros de cambios para los centros
    this.obtenerCentros();
    this.centroFiltrados = this.f['centroCosto'].valueChanges.pipe(
      startWith(''),
      map((value: string | null) => value ?? ''),
      map((value: string) => this._filter(value))
    );
    
    // Filtros de cambios para los usuarios
    this.getUsuarios();
    this.usuariosFiltrados = this.f['rendidor'].valueChanges.pipe(
      startWith(''),
      map((value: string | null) => value ?? ''),
      map((value: string) => this._filterU(value)),
    );
    //Jefatura
    this.obtenerJefaturas();
    this.jefeFiltrados = this.f['aprobadorJefatura'].valueChanges.pipe(
    startWith(''),
    map((value: string | null) => value ?? ''),
    map((value: string) => this._filterJefe(value))
     );
    //Adminstracion
    this.getUsuariosPorAdmin('ADMINISTRACION');
    this.adminFiltrados = this.f['aprobadorAdmin'].valueChanges.pipe(
      startWith(''),
      map((value: string | null) => value ?? ''),
      map((value: string) => this._filterAdmin(value))
    );
  }

  // Método para enviar el correo con el monto asignado y el correo del usuario
  enviarCorreo() {
    const email = this.formFondo.value.rendidor; // Tomamos el correo del usuario
    const montoAsignado = this.formFondo.value.montoAsignado;
    const fechaAsignado = this.formFondo.value.fechaAsignado;
    const nombreCompleto = this.formFondo.value.nombre || 'Usuario desconocido'; // Obtén el nombre del formulario

    // Formatear el monto a moneda chilena
    const montoFormateado = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0, // Evitar mostrar decimales si no son necesarios
    }).format(montoAsignado);
    
    // Formatear la fecha en formato chileno (DD/MM/YYYY)
    const fechaFormateada = new Date(fechaAsignado).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    // Construir la URL del enlace
    const urlRendicion = 'https://rendiciones2.als-inspection.cl/rendiciones/rendidor';
    
    // Crear el mensaje con un enlace y diseño atractivo
    const asunto = 'Asignación de fondo';
    const mensaje = ``
    const mensaje_html = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://als-inspection.cl/wp-content/uploads/2022/03/120.png" alt="ALS Inspection" style="max-width: 200px; height: auto;">
          </div>
          <h1 style="color: #0056b3; text-align: center;">Asignación de Fondo</h1>
          <p>Hola, ${nombreCompleto}</p>
          <p>Nos complace informarte que se te ha asignado un fondo de:</p>
          <p style="font-size: 20px; font-weight: bold; text-align: center;">${montoFormateado}</p>
          <p>La asignación fue realizada el día <strong>${fechaFormateada}</strong>.</p>
          <p>Puedes empezar a rendir este fondo en la sección Rendir Gastos dentro de la plataforma Rendiciones, o haciendo clic en el siguiente enlace:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${urlRendicion}" target="_blank" 
              style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #0056b3; text-decoration: none; border-radius: 5px;">
              Ir a rendir gastos
            </a>
          </div>
          <p>Saludos cordiales,<br>El equipo de ALS Inspection</p>
        </div>
      `;
    
    // Aquí utilizas el servicio para enviar el correo
    this.emailService.sendEmail(email, asunto, mensaje, mensaje_html).subscribe(
      (response) => {
        console.log('Correo enviado exitosamente', response);
      },
      (error) => {
        console.error('Error al enviar el correo', error);
      }
    );
  }
    
  crearFondo(): void {
  this.notificacionesService.showloading('Cargando...');

  // Verificar fondos pendientes antes de proceder
  const email = this.formFondo.value.rendidor; // Suponiendo que 'rendidor' es el campo de correo del usuario
  
  this.fondoServicio.obtenerFondosPorRendidor(email).subscribe({
    next: (fondos: any[]) => {
      // Filtrar fondos pendientes (estado 'pendiente' o 'en_rendicion')
      const fondosPendientes = fondos.filter(fondo => 
        fondo.estado === 'pendiente' || fondo.estado === 'en_rendicion'
      );

      // Verificar si algún fondo tiene más de 15 días de antigüedad
      const fondoAntiguo = fondosPendientes.find(fondo => {
        const fechaAsignado = new Date(fondo.fechaAsignado);
        const fechaActual = new Date();
        const diferenciaEnMilisegundos = fechaActual.getTime() - fechaAsignado.getTime();
        const diferenciaEnDias = diferenciaEnMilisegundos / (1000 * 3600 * 24); // Convertir a días
        return diferenciaEnDias > 15; // Verificar si han pasado 15 días o más
      });

      if (fondoAntiguo) {
        // Mostrar confirmación al usuario
        this.notificacionesService.ConfirmAlert(
          'Rendidor con Fondo Pendiente',
          'El Rendidor cuenta con un fondo PENDIENTE por rendir desde hace más de 15 días. ¿Desea continuar?',
          'Si, asignar',
          'Cancelar',
          (confirm) => {
            if (confirm) {
              // Usuario decide continuar, procedemos con la creación
              this.procesarCreacionFondo();
              
            } else {
              console.log('Creación del fondo cancelada por el usuario.');
              this.notificacionesService.removeLoading();
            }
          }
        );
      } else {
        // No hay fondos pendientes o no cumplen con la regla de 15 días, proceder directamente
        this.procesarCreacionFondo();
      }
    },
    error: (error) => {
      console.error('Error al verificar fondos pendientes:', error);
      this.notificacionesService.failure('Hubo un error al verificar los fondos pendientes');
      this.notificacionesService.removeLoading();
    }
  });
  }

  procesarCreacionFondo(): void {
  // Formatear fechaAsignado
  const fechaAsignado = new Date(this.formFondo.value.fechaAsignado).toISOString().split('T')[0];
  const formData = {
    ...this.formFondo.value,
    fechaAsignado: fechaAsignado,
  };

  // Llamar al servicio para crear el fondo
  this.fondoServicio.crearFondo(formData).subscribe({
    next: (response) => {

      this.notificacionesService.success('Fondo creado correctamente.');
      this.notificacionesService.removeLoading();
      //enviar correo
      this.notificacionesService.success('Usuario notificado correctamente.');
      this.enviarCorreo();

      const email =  this.formFondo.value.rendidor; 
        if (email) {
        this.notiService.sendNotification(
          email,
          `Se te a asignado un nuevo fondo "${this.formFondo.value.referencia}" `,
          `rendiciones/rendidor/`
        )
      }

      // Resetear y deshabilitar el formulario
      Object.keys(this.formFondo.controls).forEach(controlName => {
        const control = this.formFondo.get(controlName);
        control?.clearValidators();
        control?.updateValueAndValidity({ emitEvent: false });
        control?.disable();
      });
      
      this.formFondo.reset();

      Object.keys(this.formFondo.controls).forEach(controlName => {
        const control = this.formFondo.get(controlName);
        control?.updateValueAndValidity({ emitEvent: false });
        control?.disable();
      });

      this.formFondo.markAsPristine();
      this.formFondo.markAsUntouched();
      this.formFondo.markAsPristine();
      this.formFondo.patchValue({ motoNave: '0' });
      // Esperar 3 segundos antes de redirigir
      setTimeout(() => {
        this.router.navigate(['/rendiciones/listarfondos']);
      }, 2000);  
    },
    error: (error) => {
      console.error('Error al crear el fondo:', error);
      this.notificacionesService.failure('Ocurrió un error al crear el fondo. Rellene todos los campos');
      this.notificacionesService.removeLoading();
    }
  });
  }

}
  

