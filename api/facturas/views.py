from argparse import Action
import os
from django.db import IntegrityError
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from openpyxl import load_workbook
from rest_framework.decorators import action
from rest_framework import viewsets, status
from django.db.models import Q
from .models import Solicitud
from .serializer import SolicitudSerializer
from rest_framework.response import Response
from django.core.files.storage import default_storage
from datetime import date
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from openpyxl import load_workbook  
from openpyxl.styles import Border, Side, Alignment, Font 


class SolicitudViewSet(viewsets.ModelViewSet):
    queryset = Solicitud.objects.all()
    serializer_class = SolicitudSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        # Obtener el parámetro de consulta 'aprobador'
        email = self.request.query_params.get('aprobador', None)
        # cosulta por estado
        estado = self.request.query_params.get('estado', None)
        # Obtener todas las solicitudes
        queryset = Solicitud.objects.all()

        if email:
            # Filtrar solicitudes  aprobadorNombre o aprobador o email
            queryset = queryset.filter(
                Q(aprobador=email, estado='por_aprobar') | 
                Q(aprobadorDos=email, estado='en_aprobacion_dos') | 
                Q(aprobadorTres=email, estado='en_aprobacion_tres')
            )
        
        if estado:
            # Filtrar por el estado si está presente en los parámetros
            queryset = queryset.filter(estado=estado)

        return queryset


    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        nuevo_estado = request.data.get('estado', None)
        glosa = request.data.get('glosa', None)
        pago = request.data.get('pago', None)
        nueva_factura = request.FILES.get('factura', None)

        # Actualizar campos generales
        instance.correlativo = request.data.get('correlativo', instance.correlativo)
        instance.fechaGenerado = request.data.get('fechaGenerado', instance.fechaGenerado)
        instance.fechaVencimiento = request.data.get('fechaVencimiento', instance.fechaVencimiento)
        instance.unidadNegocio = request.data.get('unidadNegocio', instance.unidadNegocio)
        instance.aprobador = request.data.get('aprobador', instance.aprobador)
        instance.aprobadorRut = request.data.get('aprobadorRut', instance.aprobadorRut)
        instance.aprobadorDos = request.data.get('aprobadorDos', instance.aprobadorDos)
        instance.aprobadorTres = request.data.get('aprobadorTres', instance.aprobadorTres)
        instance.mesContable = request.data.get('mesContable', instance.mesContable)
        instance.anioMesContable = request.data.get('anioMesContable', instance.anioMesContable)
        instance.fechaGenerado = request.data.get('fechaGenerado', instance.fechaGenerado)
        instance.fechaVencimiento = request.data.get('fechaVencimiento', instance.fechaVencimiento)


        # Reemplazar la factura si se subió una nueva
        if nueva_factura:
            if instance.factura:
                instance.factura.delete(save=False)
            instance.factura = nueva_factura

        # Lógica para manejar el pago
        if pago is not None:
            pago = int(pago)
            if pago <= 0:
                return Response({"error": "El pago debe ser mayor a 0"}, status=400)
            if instance.pagado is None:
                instance.pagado = 0
            saldo_pendiente = instance.monto - instance.pagado
            if pago > saldo_pendiente:
                return Response({"error": "El monto ingresado supera el saldo pendiente"}, status=400)
            instance.pagado += pago
            instance.pendiente = instance.monto - instance.pagado

        # Lógica para cerrar la solicitud explícitamente
        if nuevo_estado == 'cerrada':
            if instance.pendiente == 0:  # Solo cierra si el saldo está en 0
                instance.estado = 'cerrada'

        # Lógica para manejar el cambio de estado
        if nuevo_estado and nuevo_estado != instance.estado:
            hoy = date.today()
                # Cambio a 'rechazada' desde cualquier estado permitido
            if nuevo_estado == 'rechazada':
                if instance.estado in ['por_aprobar', 'en_aprobacion_dos', 'en_aprobacion_tres']:
                    # Se permite rechazar en estos estados
                    if instance.estado == 'por_aprobar':
                        instance.glosaAprobador = glosa if glosa else ""
                        instance.visadoAprobador = "Rechazado"
                        instance.fechaAprobacion = hoy
                    elif instance.estado == 'en_aprobacion_dos':
                        instance.glosaAprobadorDos = glosa if glosa else ""
                        instance.visadoAprobadorDos = "Rechazado"
                        instance.fechaDosAprobacion = hoy
                    elif instance.estado == 'en_aprobacion_tres':
                        instance.glosaAprobadorTres = glosa if glosa else ""
                        instance.visadoAprobadorTres = "Rechazado"
                        instance.fechaTresAprobacion = hoy
                    instance.estado = 'rechazada'
                else:
                    return Response({"error": "No se puede rechazar la solicitud en el estado actual"}, status=400)

            elif instance.estado == 'por_aprobar' and nuevo_estado == 'en_aprobacion_dos':
                instance.fechaAprobacion = hoy
                instance.glosaAprobador = glosa if glosa else ""
                instance.visadoAprobador = "Aprobado"
                instance.estado = 'en_aprobacion_dos'

            elif instance.estado == 'en_aprobacion_dos' and nuevo_estado in ['en_pago', 'en_aprobacion_tres']:
                instance.fechaDosAprobacion = hoy
                instance.glosaAprobadorDos = glosa if glosa else ""
                instance.visadoAprobadorDos = "Aprobado"

                if instance.aprobadorTres:  # Si hay un aprobador tres, avanza a en_aprobacion_tres
                    instance.estado = 'en_aprobacion_tres'
                else:  # Si no hay, avanza a en_pago
                    instance.estado = 'en_pago'


            elif instance.estado == 'en_aprobacion_tres' and nuevo_estado == 'en_pago':
                instance.fechaTresAprobacion = hoy
                instance.glosaAprobadorTres = glosa if glosa else ""
                instance.visadoAprobadorTres = "Aprobado"
                instance.estado = 'en_pago'

            elif instance.estado == 'en_pago' and nuevo_estado == 'cerrada':
                instance.estado = 'cerrada'

            elif nuevo_estado == 'por_aprobar':
                instance.estado = 'por_aprobar'

            else:
                return Response({"error": "Cambio de estado no válido"}, status=400)

        # Guardar la instancia
        instance.save()
        return Response(SolicitudSerializer(instance).data)
    

    @action(detail=True, methods=['post'])
    def rechazar_solicitud(self, request, pk=None):
        instance = self.get_object()
        glosa = request.data.get('glosa', None)

        # Verificar que se haya proporcionado una glosa
        if not glosa:
            return Response({"error": "Se requiere una glosa para rechazar la solicitud"}, status=400)

        hoy = date.today()

        # Manejar los diferentes estados
        if instance.estado == 'por_aprobar':
            instance.estado = 'rechazada'
            instance.glosaAprobador = glosa
            instance.visadoAprobador = "Rechazado"
            instance.fechaAprobacion = hoy  # Guardar la fecha de rechazo del primer aprobador
        elif instance.estado == 'en_aprobacion_dos':
            instance.estado = 'rechazada'
            instance.glosaAprobadorDos = glosa
            instance.visadoAprobadorDos = "Rechazado"
            instance.fechaDosAprobacion = hoy  # Guardar la fecha de rechazo del segundo aprobador
        elif instance.estado == 'en_aprobacion_tres':
            instance.estado = 'rechazada'
            instance.glosaAprobadorTres = glosa
            instance.visadoAprobadorTres = "Rechazado"
            instance.fechaTresAprobacion = hoy  # Guardar la fecha de rechazo del tercer aprobador
        else:
            return Response({"error": "No se puede rechazar la solicitud en el estado actual"}, status=400)

        # Guardar la instancia y retornar la respuesta
        instance.save()
        return Response(SolicitudSerializer(instance).data)



    @action(detail=True, methods=['delete'])
    def eliminar_soli(self, request, *args, **kwargs):
        instance = self.get_object()

        # Eliminar la factura si existe
        if instance.factura:
            default_storage.delete(instance.factura.path)

        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def crear_solicitud(request):
        try:
            serializer = SolicitudSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse(serializer.data, status=status.HTTP_201_CREATED)
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return JsonResponse({"error": "El correlativo ya existe. Ingrese otro."}, status=status.HTTP_400_BAD_REQUEST)
 