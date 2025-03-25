interface Region {
    region: string;
    region_number: string;
    region_iso_3166_2: string;
    provincias: Provincia[];
  }
  
  interface Provincia {
    name: string;
    comunas: Comuna[];
  }
  
  interface Comuna {
    name: string;
    code: string;
  }

  interface Departamentos{
    idDepartamento: number;
    nombreDepartamento: string;
  }