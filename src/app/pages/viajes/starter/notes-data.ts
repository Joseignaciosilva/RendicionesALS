import { Note } from './note';

export const notes: Note[] = [
  {
    color: 'primary',
    title:
      'Solicitud de viaje',
    datef: 'Formulario para presentar una solicitud de un viaje programado. La solicitud quedará pendiente de aprobación',
    ref:'viajes'
  },
  {
    color: 'warning',
    title:
      'Gestion de solicitudes',
    datef: 'Apartado para poder visualizar el estado de las solicitudes realizadas.',
    ref: 'solicitud'
  },
  {
    color: 'error',
    title:
      'Bitacora de viajes',
    datef: 'Apartado para poder registrar las actividades realizadas diariamente en la bitácora de viaje, como aprobar las bitácoras completadas de ser el caso.',
    ref:'bitacora'
  },
  {
    color: 'success',
    title:
    'Registro de viajes completados',
    datef: 'Historial de viajes finalizados',
    ref:'finviajes'
  },
  {
    color: 'error',
    title:
      'Calendario de viajes',
    datef: 'Apartado para calendario en el que se podrá acceder al registro de viajes realizados, viajes en curso y viajes programados.',
    ref:'fullcalendar'
  },
];
