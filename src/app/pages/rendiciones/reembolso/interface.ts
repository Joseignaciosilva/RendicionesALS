export interface centroCosto {
    id: number,
    codigo: string,
    nombre: string,
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

export interface Fondo {
    id: number;
    correo: string;
    rendidor: string;
    rut: string;
    aprobadorJefatura: string;
    aprobadorAdmin: string;
    referencia: string;
    montoAsignado: number;
    motoNave: number;
    centroCosto: string;
    fechaAsignado: string; 
    totalRendido: number;
    estado: string;
    asignacion: string;
}
  
export interface jefatura {
    idJefatura: number,
    nombre: string,
    usuarioJefe: string;
}