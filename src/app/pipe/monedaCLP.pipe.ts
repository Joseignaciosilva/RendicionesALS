import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'monedaChilena',
  standalone: true
})
export class MonedaChilenaPipe implements PipeTransform {

  transform(value: number | null | undefined): string { // Permitir null y undefined
    if (value == null) {  // Esto cubre null y undefined
      return '';  // O puedes devolver '-' si prefieres un texto alternativo
    }

    // Formatear el número como CLP usando el formato chileno para miles
    return '$' + value.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).replace(/,/g, '.'); // Reemplazamos las comas con puntos
  }
}
