import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FondosService } from 'src/app/services/fondos.service'; 
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe, CommonModule, NgFor, NgForOf, Location  } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';
import { MatChipsModule } from '@angular/material/chips';
import { NgxImageZoomModule } from 'ngx-image-zoom';
import { Gasto } from '../rendir/gastos/interface';
import { HttpClient } from '@angular/common/http';
import { TablerIconsModule } from 'angular-tabler-icons';

@Component({
  selector: 'rendidor',
  templateUrl: './ver-comprobante.component.html',
  standalone: true,
  imports: [AsyncPipe, NgForOf, NgFor, CommonModule, MaterialModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MonedaChilenaPipe, MatChipsModule, MatIcon, NgxImageZoomModule, TablerIconsModule, ],
  styleUrls: ['./ver-comprobante.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class VerComprobanteComponent implements OnInit {
  thumbImage: string = '';
  fullImage: string = '';
  nombreComprobante: string | null = '';
  gasto!: Gasto; // Aseguramos que el gasto siempre se inicialice correctamente

  constructor(
    private route: ActivatedRoute,
    private titleService: Title,
    private fondosService: FondosService,
    private location: Location
  ) {}

  ngOnInit(): void {
    const gastoId = this.route.snapshot.paramMap.get('id');
    
    if (gastoId) {
      this.fondosService.obtenerGastoPorId(Number(gastoId)).subscribe(
        (gasto: Gasto) => {
          console.log('Datos del gasto:', gasto);
          this.gasto = gasto;

          // Configuramos las URLs de las imágenes si están disponibles
          if (gasto.nombreComprobante) {
            if (gasto.nombreComprobante.startsWith('http')) {
              this.thumbImage = gasto.nombreComprobante; // URL completa para thumb
              this.fullImage = gasto.nombreComprobante; // URL completa para full
            } else {
              const comprobanteUrl = this.fondosService.getComprobanteDescargarUrl(gasto.nombreComprobante);
              this.thumbImage = `${comprobanteUrl}/thumb`; 
              this.fullImage = `${comprobanteUrl}/full`;
            }
          } else {
            console.warn('El comprobante no está disponible para este gasto.');
          }

          this.titleService.setTitle('Detalle comprobante');
        },
        error => {
          console.error('Error al obtener los detalles del gasto:', error);
        }
      );
    }
  }

  descargarComprobante(): void {
    if (this.fullImage) {
      fetch(this.fullImage) // <-- Haces la petición a control.als-inspection.cl
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          // 1) Crear la URL temporal local
          const url = window.URL.createObjectURL(blob);
  
          // 2) Crear <a> para forzar la descarga (sin abrir en otra pestaña)
          const a = document.createElement('a');
          a.href = url;
          a.download = this.gasto.nombreComprobante?.split('/').pop() || 'comprobante.jpg';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
  
          // 3) Liberar memoria
          window.URL.revokeObjectURL(url);
        })
        .catch((error) => {
          console.error('Error al descargar el comprobante:', error);
          alert('No se pudo descargar el comprobante. Inténtalo nuevamente.');
        });
    } else {
      alert('No hay comprobante disponible para descargar.');
    }
  }
  
  volver() {
    this.location.back(); 
  }

}



