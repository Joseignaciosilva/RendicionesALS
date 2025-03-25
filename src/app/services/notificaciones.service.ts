import { Injectable } from '@angular/core';
import Notiflix from 'notiflix';

@Injectable({
  providedIn: 'root',
})
export class NotificacionesService {
  constructor() {
    Notiflix.Notify.init({
      width: '280px',
      position: 'right-top',
      distance: '10px',
      opacity: 1,
      borderRadius: '5px',
      rtl: false,
      timeout: 5000,
      messageMaxLength: 110,
      // Puedes agregar más configuraciones según tu necesidad
    });

    Notiflix.Loading.init({
      className: 'notiflix-loading',
      zindex: 4001,
      backgroundColor: 'rgba(0,0,0,0.8)', // Color de fondo del overlay
      rtl: false, // Si el texto debe ser RTL
      fontFamily: 'Quicksand', // Familia de fuentes
      cssAnimation: true, // Si se debe usar la animación CSS
      cssAnimationDuration: 400, // Duración de la animación CSS
      clickToClose: false, // Si hacer clic cierra el overlay
      customSvgUrl: null, // URL del SVG personalizado
      svgSize: '80px', // Tamaño del SVG
      svgColor: '#ffffff', // Color del SVG
      messageID: 'NotiflixLoadingMessage',
      messageFontSize: '15px', // Tamaño de la fuente del mensaje
      messageMaxLength: 34, // Longitud máxima del mensaje
      messageColor: '#dcdcdc', // Color del mensaje
    });
    

    Notiflix.Report.init({
      className: 'notiflix-report',
      width: '320px', // Ancho del reporte
      backgroundColor: '#f8f8f8', // Color de fondo
      borderRadius: '25px', // Radio del borde
      rtl: false, // Si el texto debe ser RTL
      zindex: 4002, // Z-index del reporte
      backOverlay: true, // Si se debe mostrar el overlay de fondo
      backOverlayColor: 'rgba(0,0,0,0.5)', // Color del overlay de fondo
      fontFamily: 'Quicksand', // Familia de fuentes
      cssAnimation: true, // Si se debe usar la animación CSS
      cssAnimationDuration: 360, // Duración de la animación CSS
      cssAnimationStyle: 'fade', // Estilo de la animación CSS
      success: {
        svgColor: '#32c682', // Color del SVG para éxito
        titleColor: '#1e1e1e', // Color del título para éxito
        messageColor: '#242424', // Color del mensaje para éxito
        buttonBackground: '#32c682', // Color de fondo del botón para éxito
        buttonColor: '#fff', // Color del texto del botón para éxito
      },
      failure: {
        svgColor: '#ff5549', // Color del SVG para fallo
        titleColor: '#1e1e1e', // Color del título para fallo
        messageColor: '#242424', // Color del mensaje para fallo
        buttonBackground: '#ff5549', // Color de fondo del botón para fallo
        buttonColor: '#fff', // Color del texto del botón para fallo
      },
      warning: {
        svgColor: '#eebf31', // Color del SVG para advertencia
        titleColor: '#1e1e1e', // Color del título para advertencia
        messageColor: '#242424', // Color del mensaje para advertencia
        buttonBackground: '#eebf31', // Color de fondo del botón para advertencia
        buttonColor: '#fff', // Color del texto del botón para advertencia
      },
      info: {
        svgColor: '#26c0d3', // Color del SVG para información
        titleColor: '#1e1e1e', // Color del título para información
        messageColor: '#242424', // Color del mensaje para información
        buttonBackground: '#26c0d3', // Color de fondo del botón para información
        buttonColor: '#fff', // Color del texto del botón para información
      },
    });

    Notiflix.Block.init({
      querySelectorLimit: 200,
      className: 'notiflix-block',
      position: 'absolute',
      zindex: 1000,
      backgroundColor: 'rgba(255,255,255,0.9)',
      rtl: false,
      fontFamily: 'Quicksand',
      cssAnimation: true,
      cssAnimationDuration: 100,
      svgSize: '45px',
      svgColor: '#383838',
      messageFontSize: '14px',
      messageMaxLength: 34,
      messageColor: '#383838',
      });

      Notiflix.Confirm.init({
        className: 'notiflix-confirm',
        width: '300px',
        zindex: 4003,
        position: 'center',
        distance: '10px',
        backgroundColor: '#f8f8f8',
        borderRadius: '25px',
        backOverlay: true,
        backOverlayColor: 'rgba(0,0,0,0.5)',
        rtl: false,
        fontFamily: 'Quicksand',
        cssAnimation: true,
        cssAnimationDuration: 300,
        cssAnimationStyle: 'fade',
        plainText: true,
        titleColor: 'black',
        titleFontSize: '16px',
        titleMaxLength: 34,
        messageColor: '#1e1e1e',
        messageFontSize: '14px',
        messageMaxLength: 110,
        buttonsFontSize: '15px',
        buttonsMaxLength: 34,
        okButtonColor: '#f8f8f8',
        okButtonBackground: '#4AABFF',
        cancelButtonColor: '#f8f8f8',
        cancelButtonBackground: '#E66684',
        });
  }

  

  // Notificaciones PUSH
  success(message: string) {
    Notiflix.Notify.success(message);
  }

  failure(message: string) {
    Notiflix.Notify.failure(message);
  }

  info(message: string) {
    Notiflix.Notify.info(message);
  }

  warning(message: string) {
    Notiflix.Notify.warning(message);
  }

  // Notificaciones MODAL
  reporte(tipo: string, titulo: string, mensaje: string, mensajeBoton: string, callback?: () => void): void {
  const action = () => {
    if (callback) {
      callback();
    }
  };

  switch (tipo) {
    case 'failure':
      Notiflix.Report.failure(titulo, mensaje, mensajeBoton, action);
      break;
    case 'success':
      Notiflix.Report.success(titulo, mensaje, mensajeBoton, action);
      break;
    case 'warning':
      Notiflix.Report.warning(titulo, mensaje, mensajeBoton, action);
      break;
    case 'info':
      Notiflix.Report.info(titulo, mensaje, mensajeBoton, action);
      break;
    default:
      alert('No existe este tipo de notificación');
  }
}

  // Spinner carga
  showloading(message: any) {
    Notiflix.Loading.hourglass(message);
  }

  removeLoading() {
    Notiflix.Loading.remove();
  }

  showBlock(idElement:any) {
    Notiflix.Block.dots(idElement);
  }

  removeBlock(idElement:any) {
    Notiflix.Block.remove(idElement,100);
  }

  //Metodo para confirmaciones
  ConfirmAlert(titulo: string, mensaje: string, mensajeBotonConfirm: string, mensajeBotonCancel: string, callback: (confirm: boolean) => void): void {
    Notiflix.Confirm.show(
      titulo,
      mensaje,
      mensajeBotonConfirm,
      mensajeBotonCancel,
      // Opcional: función a ejecutar cuando se confirma
      () => {
        callback(true);
      },
      // Opcional: función a ejecutar cuando se cancela
      () => {
        callback(false);
      }
    );
  }
}
