import { Component, ChangeDetectorRef } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, provideNativeDateAdapter } from '@angular/material/core';
import { map, Observable, startWith } from 'rxjs';
import { FondosService } from 'src/app/services/fondos.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, } from "@angular/forms";
import { AsyncPipe, NgFor, NgForOf } from '@angular/common';
import { NotificacionesService } from 'src/app/services/notificaciones.service'
import { centroCosto, Usuario, Fondo, jefatura } from './interface';
import { Router } from '@angular/router';

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
  selector: 'app-reembolso',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatCheckboxModule, MatDatepickerModule, 
          AsyncPipe, NgForOf, NgFor, FormsModule, ReactiveFormsModule],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS },{ provide: MAT_DATE_LOCALE, useValue: 'es-CL' },],
  templateUrl: './reembolso.component.html',
  styleUrl: './reembolso.component.scss'
})
export class ReembolsoComponent {
  
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
  //formulario de fondoREEMBOLSO
  formReembolso : FormGroup;

  //roles
  rolesUsuario: string[] = [];


  constructor(private fondoServicio: FondosService, private formBuilder: FormBuilder, private notificacionesService : NotificacionesService,
    private cdr: ChangeDetectorRef, private router: Router, ) { 

      this.formReembolso = this.formBuilder.group({
        rendidor: ['', Validators.required],
        nombre: [''],
        rut: ['', Validators.required],
        aprobadorJefatura: ['', Validators.required],
        aprobadorAdmin: ['', Validators.required],
        referencia: ['', Validators.required],
        montoAsignado: ['0'],
        motoNave: ['0', Validators.required],
        centroCosto: [''],
        fechaAsignado: ['', Validators.required],
        totalRendido: ['0'], 
        estado: ['pendiente'],
        asignacion: ['reembolso'],
      });
  }

  get f() {
    return this.formReembolso.controls;
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
    this.formReembolso.patchValue({
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
            this.formReembolso.patchValue({
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

  // Obtener usuarios admin y cargar un admin defecto (cambiable)
  getUsuariosPorJefatura(jefaturaNombre: string) {
    this.fondoServicio.getUsuariosPorAdmin(jefaturaNombre).subscribe({
      next: (resp: any) => {
        if (resp && resp.length > 0) {
          this.admin = resp[0]?.usuarios || [];
          // Buscar a Fernando Orellana y asignarlo por defecto
          const fernando = this.admin.find(
            (usuario) => usuario.usuario.nombre === 'Fernando' && usuario.usuario.apellidoPaterno === 'Orellana'
          );
          if (fernando) {
            this.formReembolso.patchValue({
              aprobadorAdmin: fernando.usuario.email,  // Asignar su correo como valor por defecto
            });
          }
        }
      },
      error: (error: any) => {
        console.error('Error al obtener los usuarios de la ADMINISTRACION:', error);
      },
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

  ngOnInit() : void {
    this.cargarRoles();
    // Ejemplo: verificar si el usuario tiene roles 'ADM' o 'JEF'
    const rolesValidos = ['USRP', 'GER', 'JEF', 'ADM'];
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
    
        /// Cargar la fecha de hoy (en formato chileno) al formulario
        const hoy = new Date();
        this.formReembolso.patchValue({
          fechaAsignado: hoy
        });
        // Traer datos del localStorage al reembolso
        const correo = localStorage.getItem('email');
        const nombre = localStorage.getItem('nombre');
        const apellidoPaterno = localStorage.getItem('apellidoPaterno');
        const rut = localStorage.getItem('rut');

        if (correo || nombre || apellidoPaterno || rut) {
          this.formReembolso.patchValue({
            rendidor: correo || '',
            nombre: `${nombre || ''} ${apellidoPaterno || ''}`.trim(),        
            rut: rut || '',
          });
        }
        // Obtener jefe directo usando el correo del usuario
        if (correo) {
          this.fondoServicio.getJefePorCorreo(correo).subscribe({
            next: (response) => {
              console.log('Jefe directo:', response);
              const jefe = response[0]?.usuarioJefe;
              if (jefe) {
                this.formReembolso.patchValue({
                  aprobadorJefatura: `${jefe.email}`,
                });
              }
            },
            error: (err) => {
              console.error('Error al obtener el jefe directo:', err);
            },
          });
        }

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
        this.getUsuariosPorJefatura('ADMINISTRACION');
        this.adminFiltrados = this.f['aprobadorAdmin'].valueChanges.pipe(
          startWith(''),
          map((value: string | null) => value ?? ''),
          map((value: string) => this._filterAdmin(value))
        );

    
  }

  // enviar Fondo
  crearReembolso(): void {
    this.notificacionesService.showloading('Cargando...');
  
    // Obtener el correo del usuario
    const email = this.formReembolso.value.rendidor; // Suponiendo que 'rendidor' es el campo de correo del usuario
    
    // Verificar fondos pendientes antes de proceder
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
          return diferenciaEnDias > 15; // Verificar si han pasado 15 días 
        });
  
        if (fondoAntiguo) {
          // Si hay un fondo pendiente por más de 15 días, mostrar advertencia y redirigir
          this.notificacionesService.reporte(
            'warning',
            'Fondo pendiente por rendir',
            'Tienes un fondo asignado sin rendir, por lo tanto no podras solicitar reembolso. Comuniquese con el área de TI.',
            'Entendido',
            () => {// Callback al hacer clic en el botón
                this.router.navigate(['/rendiciones/misfondos']); // Redirige después de 2 segundos
            }
          );
          // Remover loading
          this.notificacionesService.removeLoading();
        } else {
          // No hay fondos pendientes con más de 15 días, proceder con la creación del reembolso
          this.procesarCreacionReembolso();
          setTimeout(() => {
            this.router.navigate(['/rendiciones/misfondos']);
          }, 1000);  
        }
      },
      error: (error) => {
        console.error('Error al verificar fondos pendientes:', error);
        this.notificacionesService.failure('Hubo un error al verificar los fondos pendientes');
        this.notificacionesService.removeLoading();
      }
    });
  }
  
  procesarCreacionReembolso(): void {
    // Formatear fechaAsignado en el formato adecuado (YYYY-MM-DD)
    const fechaAsignado = new Date(this.formReembolso.value.fechaAsignado).toISOString().split('T')[0];
  
    const formData = {
      ...this.formReembolso.value,
      fechaAsignado: fechaAsignado, // Fecha formateada
    };
  
    // Llamar al servicio para crear el reembolso
    this.fondoServicio.crearFondo(formData).subscribe({
      next: (response) => {
        // Notificar éxito y opcionalmente resetear el formulario
        this.notificacionesService.success('Reembolso creado exitosamente.');
        this.notificacionesService.removeLoading();
  
        // Resetear y deshabilitar el formulario
        Object.keys(this.formReembolso.controls).forEach(controlName => {
          const control = this.formReembolso.get(controlName);
          control?.clearValidators();
          control?.updateValueAndValidity({ emitEvent: false });
          control?.disable();
        });
  
        this.formReembolso.reset();
  
        Object.keys(this.formReembolso.controls).forEach(controlName => {
          const control = this.formReembolso.get(controlName);
          control?.updateValueAndValidity({ emitEvent: false });
          control?.disable();
        });
  
        this.formReembolso.markAsPristine();
        this.formReembolso.markAsUntouched();
        this.formReembolso.patchValue({ motoNave: '0' });
      },
      error: (error) => {
        console.error('Error al crear el reembolso:', error);
        this.notificacionesService.failure('Ocurrió un error al solicitar el reembolso. Rellene todos los campos');
        this.notificacionesService.removeLoading();
      }
    });
  }
  
}
  


  


