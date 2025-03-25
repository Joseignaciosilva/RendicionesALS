import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../../services/AuthService.service';
import Notiflix from 'notiflix';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const mail = localStorage.getItem('email')??'';   //?????????
    const rol = 'ADM';
    const notiflix = Notiflix
    return this.auth.checkRol(rol).then(hasAccess => {
      if (!hasAccess) {
        console.log('No cuenta con el permiso para esta función')
        console.log(this.auth.checkRol(rol))
        this.router.navigate(['/authentication/error']);
        notiflix.Notify.failure('No tiene acceso a esta función');
      }
      return hasAccess;
    });
  }

}