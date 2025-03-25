import { NavItem } from '../../vertical/sidebar/nav-item/nav-item';

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
    navCap: 'Otro',
  },
  {
    displayName: 'Menú',
    iconName: 'box-multiple',
    route: '/menu-level',
    children: [
      {
        displayName: 'Menú 1',
        iconName: 'point',
        route: '/menu-1',
        children: [
          {
            displayName: 'Menú 1',
            iconName: 'point',
            route: '/menu-1',
          },

          {
            displayName: 'Menú 2',
            iconName: 'point',
            route: '/menu-2',
          },
        ],
      },

      {
        displayName: 'Menú 2',
        iconName: 'point',
        route: '/menu-2',
      },
    ],
  },
  {
    displayName: 'Deshabilitado',
    iconName: 'ban',
    route: '/disabled',
    disabled: true,
  },
];
