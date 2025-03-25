export interface Solicitud {
    id: number;
    correlativo: string;
    mesContable: string;
    anioMesContable: string;
    unidadNegocio: string;
    aprobador: string;
    aprobadorRut: string;
    visadoAprobador: string;
    aprobadorDos: string;
    aprobadorRutDos: string;
    visadoAprobadorDos: string;
    aprobadorTres: string;
    aprobadorRutTres: string;
    visadoAprobadorTres: string;
    factura: string;
    fechaGenerado: string; 
    fechaVencimiento: string; 
    monto: number;
    pendiente: number;
    pagado: number;
    fechaAprobacion: string;
    fechaDosAprobacion: string;
    fechaTresAprobacion: string;
    estado: string;
    glosaAprobador: string;
    glosaAprobadorDos: string;
    glosaAprobadorTres: string;
    glosa?: string;
}

export interface Usuario {
    id: number;
    idUsuario : number;
    nombre : string;
    apellidoPaterno : string;
    apellidoMaterno : string;
    cargo: string;
    email : string;
    rut : string;
    rol: string;
}
  
export interface Usuario {
    id: number;
    idUsuario : number;
    nombre : string;
    apellidoPaterno : string;
    apellidoMaterno : string;
    cargo: string;
    email : string;
    rut : string;
    rol: string;
}
  