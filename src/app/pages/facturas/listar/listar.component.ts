import { ChangeDetectorRef, Component, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { NotificacionesService } from 'src/app/services/notificaciones.service';
import { MonedaChilenaPipe } from 'src/app/pipe/monedaCLP.pipe';
import { CommonModule, DatePipe } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats, MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { map, Observable, of, startWith } from 'rxjs';
import { Solicitud, Usuario } from './interface';
import { FacturasService } from 'src/app/services/facturas.service';
import { MatTableExporterModule } from 'mat-table-exporter';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';



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

interface Aprobador {
  nombre: string | null;
  visado: string | null;
  fechaVisado: string | null;
}

@Component({
  selector: 'app-listar',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatCheckboxModule, MatDatepickerModule,
    FormsModule, ReactiveFormsModule, CommonModule, MatDatepicker, MonedaChilenaPipe, MatTableExporterModule],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS }, { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },],
  templateUrl: './listar.component.html',
  styleUrl: './listar.component.scss'
})
export class ListarComponent {
  // roles
  rolesUsuario: string[] = [];

  displayedColumns: string[] = ['correlativo', 'mesAnioContable', 'aprobadores', 'fechaGenerado', 'fechaVencimiento', 'pendiente', 'pagado', 'unidadNegocio', 'estado', 'factura', 'glosa', 'Acción'];
  dataSource = new MatTableDataSource<Solicitud>([]);
  solicitud: Solicitud[] = [];
  solicitudId: string | null = null;  
  //capturar inputs del filtro
  inputFiltros: any = {
    correlativo: '',
    estado: '',
    unidadNegocio: '',
    fechaGenDesde: '',
    fechaGenHasta: '',
    fechaVencDesde: '',
    fechaVencHasta: '',
    mesContable: '',
    anioMesContable: '',
    // rendidor: '',
    // asignacion: '',

  }


  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    private router: Router,
    private facturaService: FacturasService,
    private notificacionesService: NotificacionesService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
  ) { }

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

  //filtrosss
  aplicarFiltros() {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const filters = JSON.parse(filter);
  
      // Fechas GENERADO hasta y desde
      const fechaGenDesdeFiltro = filters.fechaGenDesde ? new Date(filters.fechaGenDesde).toISOString().slice(0, 10) : null;
      const fechaGenHastaFiltro = filters.fechaGenHasta ? new Date(filters.fechaGenHasta).toISOString().slice(0, 10) : null;
      const fechaGenDesdeData = data.fechaGenerado;
      const fechagenHastaData = data.fechaGenerado;
      const fechaGenDesdeOk = fechaGenDesdeFiltro ? (fechaGenDesdeData && fechaGenDesdeData >= fechaGenDesdeFiltro) : true;
      const fechaGenHastaOk = fechaGenHastaFiltro ? (fechagenHastaData && fechagenHastaData <= fechaGenHastaFiltro) : true;
      // Fechas VENCIMEINTO hasta y desde
      const fechaVencDesdeFiltro = filters.fechaVencDesde ? new Date(filters.fechaVencDesde).toISOString().slice(0, 10) : null;
      const fechaVencHastaFiltro = filters.fechaVencHasta ? new Date(filters.fechaVencHasta).toISOString().slice(0, 10) : null;
      const fechaVencDesdeData = data.fechaVencimiento;
      const fechaVencHastaData = data.fechaVencimiento;
      const fechaVencDesdeOk = fechaVencDesdeFiltro ? (fechaVencDesdeData && fechaVencDesdeData >= fechaVencDesdeFiltro) : true;
      const fechaVencHastaOk = fechaVencHastaFiltro ? (fechaVencHastaData && fechaVencHastaData <= fechaVencHastaFiltro) : true;
      const fechasOk = fechaGenDesdeOk && fechaGenHastaOk && fechaVencDesdeOk && fechaVencHastaOk;
  
      // Mes contable y Año contable
      const mesContableOk = filters.mesContable ? data.mesContable.toLowerCase() === filters.mesContable.toLowerCase() : true;
      const anioMesContableOk = filters.anioMesContable ? data.anioMesContable == filters.anioMesContable : true;
  
      // Filtros adicionales
      const correlativoOk = filters.correlativo ? data.correlativo.toLowerCase().startsWith(filters.correlativo.toLowerCase()) : true;
      const unidadNegocioOk = filters.unidadNegocio ? data.unidadNegocio.toLowerCase() === filters.unidadNegocio.toLowerCase() : true;
      const estadoOk = filters.estado ? data.estado.toLowerCase() === filters.estado.toLowerCase() : true;
  
      return correlativoOk && fechasOk && estadoOk && unidadNegocioOk && mesContableOk && anioMesContableOk;
    };
  }  
  
  applyFilter(): void {
    this.dataSource.filter = JSON.stringify(this.inputFiltros);
  }

  updateCorrelativo(event: any) {
    this.inputFiltros.correlativo = event.target.value;
    this.applyFilter();
  }

  updateMesContable(value: any) {
    this.inputFiltros.mesContable = value;
    this.applyFilter();
  }

  updateAnioMesContable(value: any) {
    this.inputFiltros.anioMesContable = value;
    this.applyFilter();
  }

  updateFechaGenDesde(event: any) {
    this.inputFiltros.fechaGenDesde = event.value;
    this.applyFilter();
  }

  updateFechaGenHasta(event: any) {
    this.inputFiltros.fechaGenHasta = event.value;
    this.applyFilter();
  }

  updateFechaVencDesde(event: any) {
    this.inputFiltros.fechaVencDesde = event.value;
    this.applyFilter();
  }

  updateFechaVencHasta(event: any) {
    this.inputFiltros.fechaVencHasta = event.value;
    this.applyFilter();
  }

  updateUnidadNegocio(value: any) {
    this.inputFiltros.unidadNegocio = value;
    this.applyFilter();
  }

  updateEstado(value: any) {
    this.inputFiltros.estado = value;
    this.applyFilter();
  }

  limpiarFiltros(): void {
    this.inputFiltros = {
    };
    this.dataSource.filter = JSON.stringify(this.inputFiltros);
  }
  

  ngOnInit(){

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
    this.notificacionesService.showloading('Cargando solicitudes...');
    this.obtenerSolicitudes();
    this.aplicarFiltros();
    this.notificacionesService.removeLoading();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  getAprobadores(solicitud: Solicitud) {
    return [
        {
            nombre: solicitud.aprobador || null,
            visado: solicitud.visadoAprobador,
            fechaVisado: solicitud.fechaAprobacion,
        },
        {
            nombre: solicitud.aprobadorDos || null,
            visado: solicitud.visadoAprobadorDos,
            fechaVisado: solicitud.fechaDosAprobacion,
        },
        {
            nombre: solicitud.aprobadorTres || null,
            visado: solicitud.visadoAprobadorTres,
            fechaVisado: solicitud.fechaTresAprobacion,
        },
    ];
  }  

  obtenerSolicitudes(): void {
    this.facturaService.obtenerSolicitudes().subscribe({
      next: (solicitudes: Solicitud[]) => {
        console.log('Datos obtenidos después de la actualización:', solicitudes);
        this.solicitud = solicitudes;
        this.dataSource.data = [...solicitudes].reverse();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al obtener las solicitudes', error);
      }
    });
  }

  // Traer el estado para mostrar con emojis de color la aprobacion
  getEstadoClase(estado: string): string {
    if (estado === 'Aprobado') {
      return 'text-success'; // Verde - visado: Aprobado
    } else if (estado === 'Rechazado') {
      return 'text-danger'; // Rojo - visado: Rechazado
    }
    return 'text-secondary'; // Gris (Pendiente)
  }
  
  // si algun aprobador rechazo
  isRechazado(solicitud: Solicitud): boolean {
    const aprobadores: Aprobador[] = [
      { nombre: solicitud.aprobador, visado: solicitud.visadoAprobador, fechaVisado: solicitud.fechaAprobacion },
      { nombre: solicitud.aprobadorDos, visado: solicitud.visadoAprobadorDos, fechaVisado: solicitud.fechaDosAprobacion },
      { nombre: solicitud.aprobadorTres, visado: solicitud.visadoAprobadorTres, fechaVisado: solicitud.fechaTresAprobacion },
    ];
    
    return aprobadores.some(aprobador => aprobador.visado === 'Rechazado');
  }

  // Método para abrir el diálogo (EDITAR)
  openDialog(action: string, solicitud: Solicitud): void {
    const dialogRef = this.dialog.open(AppsolicitudModalComponent, {
      data: { solicitud, action },
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result.event === 'Editar') {
        this.editarSolicitud(result.data, result.facturaFile);
      }
    });
  }

  editarSolicitud(solicitud: Solicitud, facturaFile?: File): void {
    // Formatear la fecha antes de enviarla
    const fechaGeneradoFormateada = new Date(solicitud.fechaGenerado).toISOString().split('T')[0];
    solicitud.fechaGenerado = fechaGeneradoFormateada;
    const fechaVencimientoFormateada = new Date(solicitud.fechaVencimiento).toISOString().split('T')[0];
    solicitud.fechaVencimiento = fechaVencimientoFormateada;

    this.facturaService.editarSolicitudPorId(solicitud.id, solicitud, facturaFile).subscribe({
      next: (response) => {
        this.notificacionesService.success('Solicitud actualizada correctamente.');
        this.obtenerSolicitudes(); // Actualizar la lista
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al editar la solicitud', err);
        this.notificacionesService.failure('Error al editar la solicitud.');
      },
    });
  }
  
  eliminarSolicitud(solicitudId: number): void {
    this.notificacionesService.ConfirmAlert('ELIMINAR SOLICITUD', '¿Desea eliminar esta solicitud?', 'Aceptar', 'Cancelar', (confirm) => {
      if (confirm) {
        // Si el usuario confirma, procedemos con la eliminación
        this.facturaService.eliminarSolicitud(solicitudId).subscribe({
          next: (response) => {
            this.notificacionesService.success('Solicitud eliminada correctamente.');
            this.obtenerSolicitudes(); // Actualizar la lista 
          },
          error: (err) => {
            console.error('Error al eliminar la solicitud', err);
            this.notificacionesService.failure('Error al eliminar la solicitud.');
          },
        });
      } else {
        console.log('Cancelado'); 
      }
    });
  }

  //ABRIR DIALOG DE GLOSAS
  openGlosaDialog(solicitud: Solicitud): void {
    this.dialog.open(AppGlosaModalComponent, {
      data: { solicitud },
    });
  }

  //ABRIR DIALOG DE FACTURAS PDF
  abrirFacturaModal(pdfUrl: string): void {
    this.dialog.open(PdfModalComponent, {
      width: '85vw', 
      height: '85vh', 
      panelClass: 'custom-dialog-container', 
      data: { pdfUrl }
    });    
  }
 
  exportarExcel() {
    this.notificacionesService.showloading('Exportando excel detallado...');

    fetch('../../../../assets/plantillas/detalle_facturas.xlsx')
      .then(response => response.arrayBuffer())
      .then(async (data) => {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        const worksheet = workbook.getWorksheet(1); // Primera hoja de la plantilla
  
        if (!worksheet) {
          console.error('No se encontró la hoja en la plantilla.');
          return;
        }
  
        let startRow = 21; 
        const templateRow = worksheet.getRow(startRow); 
        // inyecto la data
        this.dataSource.filteredData.forEach((item: any, index: number) => {
          const newRowNumber = startRow + index;
          const row = worksheet.getRow(newRowNumber);
        
          // Hacer todas las celdad igual a la inicial
          templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const newCell = row.getCell(colNumber);
            newCell.style = { ...cell.style }; 
            if (cell.value) newCell.value = cell.value; 
          });
        
          // **Copiar altura de la fila 22**
          row.height = templateRow.height;
        
          // **Insertar fecha y hora **
          const hoy = new Date();
          const fechaFormateadaHoy = hoy.toISOString().replace('T', ' ').substring(0, 19); 
          worksheet.getCell('D16').value = fechaFormateadaHoy;
          worksheet.getCell('D16').font = { bold: true, size: 16 }; 
          worksheet.getCell('D16').alignment = { horizontal: 'center' }; 
          // **Asignar valores a las celdas**
          row.getCell('A').value = item.correlativo;
          row.getCell('B').value = `${item.mesContable} ${item.anioMesContable}`;
          row.getCell('C').value = this.formatearAprobadores(this.getAprobadores(item)).replace(/\n/g, '\r\n');
          row.getCell('D').value = item.fechaGenerado;
          row.getCell('E').value = item.fechaVencimiento;
          row.getCell('F').value = item.pendiente;
          row.getCell('G').value = item.pagado;
          row.getCell('H').value = item.unidadNegocio;
          row.getCell('I').value = item.estado;
        
          // **Aplicar alineación y bordes**
          row.eachCell((cell) => {
            cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });        
  
        // **Guardar archivo Excel**
        const buffer = await workbook.xlsx.writeBuffer();
        const hoy = new Date();
        const fechaFormateadaHoy = hoy.toISOString().replace('T', ' ').substring(0, 19);
        saveAs(new Blob([buffer]), `Detalle_facturas_${fechaFormateadaHoy}.xlsx`);
        this.notificacionesService.removeLoading();
      })
      .catch(error => console.error('Error cargando la plantilla:', error));
      this.notificacionesService.removeLoading();
  }

    private formatearEncabezado(col: string): string {
      return col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    
    private formatearAprobadores(aprobadores: any[]): string {
      if (!aprobadores || aprobadores.length === 0) return 'N/A';
      return aprobadores
        .filter(apr => apr.nombre) // Filtrar solo los aprobadores asignados
        .map(apr => `${apr.nombre}: ${apr.visado === 'Aprobado' ? '✓' : apr.visado === 'Rechazado' ? '❌' : '⏳'} - ${apr.fechaVisado || 'Sin fecha'}`)
        .join('\n');
    }
  
  exportarPDF() {
    this.notificacionesService.showloading('Exportando PDF...');

    const doc = new jsPDF();

    // Agregar Logo
    const logo = new Image();
    logo.src = "assets/images/logos/logo_redondo.png"; 
    doc.addImage(logo, "PNG", 20, 10, 18, 22); // Posición (x, y) y tamaño (ancho, alto)

    // Información de la empresa
    doc.setTextColor(0, 0, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("ALS Inspection Chile SpA", 170, 10);
    doc.text("79.752.350-K", 170, 14);
    doc.text("Limache 3405. Office 61", 170, 18);
    doc.text("Viña del Mar, CHILE", 170, 22);
    doc.text("+56 32 2545500", 170, 26);

    // Agregar títulos
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LISTADO DE SOLICITUDES FACTURAS", doc.internal.pageSize.width / 2, 45, { align: 'center' });
    doc.setFontSize(12);
    doc.text("ALS INSPECTIONS CHILE", doc.internal.pageSize.width / 2, 50, { align: 'center' });

    // Definir columnas visibles excluyendo las innecesarias
    const columnas = this.displayedColumns.filter(col => 
        col !== 'factura' && col !== 'glosa' && col !== 'Acción'
    );

    // Mapear los encabezados
    const encabezados = columnas.map(col => {
        if (col === 'mesAnioContable') return 'Mes';
        if (col === 'fechaGenerado') return 'F. Gen.';
        if (col === 'fechaVencimiento') return 'F. Venc';
        return this.formatearEncabezado(col);
    });

    // Obtener datos de la tabla
    const datos = this.dataSource.filteredData.map((item: Solicitud) => columnas.map(col => {
        if (col === 'mesAnioContable') return `${item.mesContable}-${item.anioMesContable}`;
        if (col === 'aprobadores') return this.formatearAprobadoresParaPdf(this.getAprobadores(item));
        if (col === 'pendiente' || col === 'pagado') 
            return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format((item as any)[col] || 0);
        return (item as any)[col] ?? ''; 
    }));

    // Agregar tabla con AutoTable
    autoTable(doc, {
        head: [encabezados],
        body: datos,
        startY: 55, // Ajuste para que la tabla no sobrepase el encabezado
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 11 },
            2: { cellWidth: 45 },
            3: { cellWidth: 11 },
            4: { cellWidth: 11 },
            5: { cellWidth: 19 },
            6: { cellWidth: 19 },
        }
    });

    // Guardo con fecha de Hoy
    const hoy = new Date();
    const fechaFormateadaHoy = hoy.toISOString().replace('T', ' ').substring(0, 19);
    doc.save(`Detalle_facturas_${fechaFormateadaHoy}.pdf`);
    this.notificacionesService.removeLoading();

  }

    private formatearAprobadoresParaPdf(aprobadores: any[]): string {
      if (!aprobadores || aprobadores.length === 0) return 'N/A';
      return aprobadores
        .filter(apr => apr.nombre) // Filtrar solo los aprobadores asignados
        .map(apr => `${apr.nombre}:\n${apr.visado === 'Aprobado' ? 'Aprobado' : apr.visado === 'Rechazado' ? 'Rechazado' : 'Pendiente'} - ${apr.fechaVisado || 'Sin fecha'}`)
        .join('\n');
    }
  
  imprimirDirecto() {
    const doc = new jsPDF();
  
    // Logo
    const logo = new Image();
    logo.src = "assets/images/logos/logo_redondo.png";
    doc.addImage(logo, "PNG", 20, 10, 18, 22);
  
    // Información de la empresa
    doc.setTextColor(0, 0, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("ALS Inspection Chile SpA", 170, 10);
    doc.text("79.752.350-K", 170, 14);
    doc.text("Limache 3405. Office 61", 170, 18);
    doc.text("Viña del Mar, CHILE", 170, 22);
    doc.text("+56 32 2545500", 170, 26);

    // Agregar títulos
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LISTADO DE SOLICITUDES FACTURAS", doc.internal.pageSize.width / 2, 45, { align: 'center' });
    doc.setFontSize(12);
    doc.text("ALS INSPECTIONS CHILE", doc.internal.pageSize.width / 2, 50, { align: 'center' });
  
    // Definir columnas visibles excluyendo las innecesarias
    const columnas = this.displayedColumns.filter(col => 
      col !== 'factura' && col !== 'glosa' && col !== 'Acción'
    );
  
    // Mapear los encabezados para mostrar nombres legibles
    const encabezados = columnas.map(col => {
      if (col === 'mesAnioContable') return 'Mes';
      if (col === 'fechaGenerado') return 'F. Gen.';
      if (col === 'fechaVencimiento') return 'F. \nVenc';
      return this.formatearEncabezado(col);
    });
  
    // Obtener datos de la tabla filtrada
    const datos = this.dataSource.filteredData.map((item: Solicitud) => columnas.map(col => {
      if (col === 'mesAnioContable') return `${item.mesContable}-${item.anioMesContable}`;
      if (col === 'aprobadores') return this.formatearAprobadoresParaPdf(this.getAprobadores(item));
      if (col === 'pendiente' || col === 'pagado') 
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format((item as any)[col] || 0); // CLP
      return (item as any)[col] ?? ''; 
    }));
  
    // Agregar tabla con AutoTable
    autoTable(doc, {
      head: [encabezados],
      body: datos,
      startY: 55,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 30 }, // Correlativo
        1: { cellWidth: 11 }, // Mes Contable 
        2: { cellWidth: 45 }, // Aprobadores 
        3: { cellWidth: 11 }, // F. Generado 
        4: { cellWidth: 11 }, // F. Venc. 
        5: { cellWidth: 19 }, // Pendiente
        6: { cellWidth: 19 }, // Pagado
      }
    });
  
    // Configurar para impresión automática
    doc.autoPrint();
    const pdfBlob = doc.output('blob');
  
    // Abrir la ventana de impresión directamente
    const url = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  }
  
  
  
}
  






//modal solicitud
@Component({
  selector: 'app-dialog-content',
  standalone: true,
  imports: [MaterialModule, FormsModule, ReactiveFormsModule, MaterialModule, TablerIconsModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatCheckboxModule, MatDatepickerModule, CommonModule, MatNativeDateModule],
  templateUrl: './dialogs/solicitud-modal.html',
  providers: [DatePipe,
    provideNativeDateAdapter(), // Adaptador nativo
    { provide: MAT_DATE_FORMATS, useValue: CHILEAN_DATE_FORMATS }, // Formato personalizado
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' }
  ],
})

// Configuración del Dialog Modal (EDITAR)
export class AppsolicitudModalComponent {
  action: string;
  local_data: any;
  facturaFile: File | null = null;
  fileName: string | null = null; 
  factura: any;

  //usuarios JEFES (APROBADOR 1)
  usuarioOption: Usuario[] = [];
  usuariosFiltrados: Observable<Usuario[]>;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AppsolicitudModalComponent>,
    public facturaService: FacturasService,
    public notificacionesService: NotificacionesService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.local_data = { ...data.solicitud };
    this.action = data.action;

    // Ajustar fechas
    ['fechaGenerado', 'fechaVencimiento'].forEach((campo) => {
      if (this.local_data[campo]) {
        const fecha = new Date(this.local_data[campo]);
        fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
        this.local_data[campo] = fecha;
      }
    });

     // Pre-cargar valores en el formulario
     this.soliForm.patchValue({
      correlativo: this.local_data.correlativo || '',
      aprobador: this.local_data.aprobador || '',
      fechaGenerado: this.local_data.fechaGenerado || '',
      fechaVencimiento: this.local_data.fechaVencimiento || '',
      unidadNegocio: this.local_data.unidadNegocio || '',
      mesContable: this.local_data.mesContable || '', 
      anioMesContable: String(this.local_data.anioMesContable),
    });
    console.log('Valor de anioMesContable:', this.local_data.anioMesContable);
  }

  soliForm = this.formBuilder.group({
    id: [''],
    correlativo: ['', Validators.required],
    aprobador: ['', Validators.required],
    fechaGenerado: ['', Validators.required],
    fechaVencimiento: ['', Validators.required],
    unidadNegocio: ['', [Validators.required, Validators.min(0)]],
    mesContable: ['', Validators.required],
    anioMesContable: ['', Validators.required],
  });

  get f() {
    console.log('Controles del formulario:', this.soliForm.controls);
    return this.soliForm.controls;
  }


  ngOnInit(): void {
    // Filtros de cambios para los usuarios
    this.getUsuarios();
    this.usuariosFiltrados = this.f['aprobador'].valueChanges.pipe(
      startWith(''),
      map((value: string | null) => value ?? ''),
      map((value: string) => this._filterU(value)),
    );
  }

  // USUARIOS //
  getUsuarios() {
    const token = localStorage.getItem('token') as string;
    this.facturaService.UsuariosHabilitados(token).subscribe({
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
    this.soliForm.patchValue({
      aprobador: usuario.email,
    });
  }

  check() {
    console.log(this.soliForm.value);
  }

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.facturaFile = event.target.files[0];
    }
  }
  



  doAction(): void {
    if (this.soliForm.valid) {
      // Asignar los valores del formulario a local_data
      this.local_data = {
        ...this.local_data, // Mantén los datos existentes
        correlativo: this.soliForm.value.correlativo,
        aprobador: this.soliForm.value.aprobador,
        fechaGenerado: this.soliForm.value.fechaGenerado,
        fechaVencimiento: this.soliForm.value.fechaVencimiento,
        unidadNegocio: this.soliForm.value.unidadNegocio,
        mesContable: this.soliForm.value.mesContable,
        anioMesContable: this.soliForm.value.anioMesContable,
      }
  
      // Cerrar el diálogo y enviar los datos
      this.dialogRef.close({ event: this.action, data: this.local_data, facturaFile: this.facturaFile });
      console.log("Modal cerrado con datos:", { event: this.action, data: this.local_data, facturaFile: this.facturaFile }); // Verifica los datos enviados
    } else {
      console.log("Formulario inválido");
      this.notificacionesService.failure('Por favor, complete todos los campos requeridos.'); // Muestra un mensaje de error
    }
  }
  
  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancelar' });
  }
  
}




//glosa-modal.html (GLOSAS)
@Component({
  selector: 'app-glosa-modal',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './dialogs/glosas-modal.html',
})
export class AppGlosaModalComponent {
  glosas: { nombre: string; texto: string | null }[] = [];

  constructor(
    public dialogRef: MatDialogRef<AppGlosaModalComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const solicitud = data.solicitud;
    this.glosas = [
      { nombre: solicitud.aprobador, texto: solicitud.glosaAprobador || null },
      { nombre: solicitud.aprobadorDos, texto: solicitud.glosaAprobadorDos || null },
      { nombre: solicitud.aprobadorTres, texto: solicitud.glosaAprobadorTres || null },
    ].filter(glosa => glosa.nombre); // Filtra solo los aprobadores asignados
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}





//factura-modal.html (FACTURAS PDF)

import { SafeUrlPipe } from 'src/app/pipe/SafeUrl.pipe';  
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-pdf-modal',
  standalone: true,
  imports: [
    MatDialogModule,
    SafeUrlPipe, 
    TablerIconsModule,
    MatIcon,
  ],
  templateUrl: './dialogs/factura-modal.html', 
})
export class PdfModalComponent {
  constructor(
    public dialogRef: MatDialogRef<PdfModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pdfUrl: string }
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}

