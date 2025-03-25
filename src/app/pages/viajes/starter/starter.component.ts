import { Component, ViewEncapsulation } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { RoleGuard } from '../../guard/role.guard';
import { AuthService } from 'src/app/services/AuthService.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SolicitudService } from 'src/app/services/solicitudes.service';
import { addIcons } from "ionicons";
import { Note } from './note';
import { NoteService } from './note.service';
import { Router } from '@angular/router';
import { NotificacionesService } from 'src/app/services/notificaciones.service';

@Component({
  selector: 'app-starter',
  templateUrl: './starter.component.html',
  standalone: true,
  imports: [MaterialModule],
  styleUrls: ['./starter.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class StarterComponent {
  constructor(private as:AuthService ,public router:Router ,public noteService: NoteService,private ss : SolicitudService, private sc: AuthService, private rg : RoleGuard, 
              private http: HttpClient, private notificacionesService: NotificacionesService) {
    this.notes = this.noteService.getNotes()
  }
  // roles
  rolesUsuario: string[] = [];
  notes = this.noteService.getNotes();
  selectedNote: Note = Object.create(null);
  clrName = 'warning';
  colors = [
    { colorName: 'primary' },
    { colorName: 'warning' },
    { colorName: 'accent' },
    { colorName: 'error' },
    { colorName: 'success' },
  ];

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

  ngOnInit(){
    this.cargarRoles();
    // Ejemplo: verificar si el usuario tiene roles 'ADM' o 'JEF'
    const rolesValidos = ['ADM', 'JEF', 'GER'];
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
  }

  onSelect(note: Note): void {
    this.selectedNote = note;
    this.clrName = this.selectedNote.color;
    this.router.navigate(['/viajes/'+note.ref]);
  }

  checkRol(nombre: string): Promise<boolean> {
    return this.as.checkRol('USR').then((result) => result);
  }



}
