import { Injectable } from '@angular/core';
import { CalendarDateFormatter } from 'angular-calendar';
import { DateAdapter } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import moment from 'moment';

@Injectable()
export class CustomCalendarDateFormatter extends CalendarDateFormatter {
    
  // Formato de fecha para la vista de día
  dayViewTitleFormatter(date: Date): string {
    return moment(date).format('dddd, MMMM D, YYYY');
  }

  // Formato de fecha para la vista de semana
  weekViewTitleFormatter(date: Date): string {
    return moment(date).format('MMMM D, YYYY');
  }

  // Formato de fecha para la vista de mes
  monthViewTitleFormatter(date: Date): string {
    return moment(date).format('MMMM YYYY');
  }

  // Formato de fecha para la vista de año
  yearViewTitleFormatter(date: Date): string {
    return moment(date).format('YYYY');
  }

  // Formato de fecha para la vista de hora
  hourViewTitleFormatter(date: Date): string {
    return moment(date).format('h:mm A');
  }

  // Formato de fecha para la vista de minuto
  minuteViewTitleFormatter(date: Date): string {
    return moment(date).format('h:mm A');
  }
}