import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Inicio',
    iconName: 'home',
    route: '/home',
  },
  {
    navCap: 'RENDIR',
    roles: ['ADM','GER', 'JEF', 'USR', 'USRP'],
  },
    { 
      displayName: 'Rendir Gastos',
      iconName: 'coins',
      route: '/rendiciones/rendidor',
      roles: ['ADM','GER', 'JEF', 'USR', 'USRP'],
    },
    {
      displayName: 'Historial mis fondos',
      iconName: 'calendar',
      route: '/rendiciones/misfondos',
      roles: ['ADM','GER', 'JEF', 'USR', 'USRP'],
    },
    { 
      displayName: 'Crear Reembolso',
      iconName: 'pig-money',
      route: '/rendiciones/reembolso',
      roles: ['ADM','GER', 'JEF', 'USRP'],
    },
    // SIN FACTURAS, SOLO RENDICIONES (FONDO)
    {
      navCap: 'VISAR',
      roles: ['ADM','JEF','GER'],
    },
      { displayName: 'Aprobar Gastos', //Aprobar Gastos / Fondos.
        iconName: 'check',
        route: '/rendiciones/aprobador',
        roles: ['ADM','JEF','GER'],
      },
      {
        navCap: 'ADM',
        roles: ['ADM'],
      },
        { 
          displayName: 'Asignar Fondos',
          iconName: 'cash',
          route: '/rendiciones/fondos',
          roles: ['ADM'],
        },
        {
          displayName: 'Listar Fondos',
          iconName: 'list',
          route: '/rendiciones/listarfondos',
          roles: ['ADM'],  
        },
        {
          displayName: 'Facturas',
          iconName: 'receipt',
          route: '/rendiciones/facturas',
          roles: ['ADM'],
        },       
        {
          displayName: 'Cierre fondos',
          iconName: 'square-x',
          route: '/rendiciones/cierre',
          roles: ['ADM'],
        }, 

  // INTEGRACIONES DE FACTURAS Y RENDICIONES (FONDO) PARA QUE NO TENGAS TANTO TRABAJO PEDRO :)
  // {
  //   navCap: 'VISAR',
  //   roles: ['ADM', 'JEF', 'GER'],
  // },
  // {
  //   displayName: 'Aprobar',
  //   iconName: 'check',
  //   roles: ['ADM', 'JEF', 'GER'],
  //   children: [
  //     { displayName: 'Gastos / Fondos', 
  //       iconName: 'point', 
  //       route: '/rendiciones/aprobador' 
  //     },
  //     { displayName: 'Solicitud de Factura', 
  //       iconName: 'point', 
  //       route: '/facturas/aprobar' 
  //     },
  //   ],
  // },
  // {
  //   navCap: 'ADM',
  //   roles: ['ADM'],
  // },
  // {
  //   displayName: 'Fondos',
  //   iconName: 'cash',
  //   roles: ['ADM'],
  //   children: [
  //     { displayName: 'Asignar Fondo', 
  //       iconName: 'point', 
  //       route: '/rendiciones/fondos' 
  //     },
  //     { displayName: 'Listar Fondos', 
  //       iconName: 'point', 
  //       route: '/rendiciones/listarfondos' 
  //     },
  //     { displayName: 'Facturas Gastos', 
  //       iconName: 'point', 
  //       route: '/rendiciones/facturas' 
  //     },
  //     { displayName: 'Cierre Fondos', 
  //       iconName: 'point', 
  //       route: '/rendiciones/cierre' 
  //     },
  //   ],
  // },
  // {
  //   displayName: 'Facturas',
  //   iconName: 'receipt',
  //   roles: ['ADM'],
  //   children: [
  //     { displayName: 'Ingreso Solicitud', 
  //       iconName: 'point', 
  //       route: '/facturas/solicitar' 
  //     },
  //     { displayName: 'Listar Facturas', 
  //       iconName: 'point', 
  //       route: '/facturas/listar' 
  //     },
  //     { displayName: 'Pago Facturas', 
  //       iconName: 'point', 
  //       route: '/facturas/pagar' 
  //     },
  //   ],
  // },
];
