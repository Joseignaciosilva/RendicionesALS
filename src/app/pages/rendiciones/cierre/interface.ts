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
    // Nuevos campos
    saldo_rendidor?: number;
    saldo_empresa?: number;
}

export interface Neteo{
    idfondo: number;
    saldo_rendidor: number;
    saldo_empresa: number;
}