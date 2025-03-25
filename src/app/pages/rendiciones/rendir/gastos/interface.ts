export interface Gasto {
    id: number;
    idfondo: string;  
    nombreComprobante: string;
    numeroComprobante: string;
    numeroServicio: string;
    tipoComprobante: string;
    tipoGasto: string;
    proveedor: string;
    descripcion: string ;
    fechaGasto: string;  
    montoGasto: number;
    visadoJefe: string | null;  
    visadoAdmin: string | null;  
}