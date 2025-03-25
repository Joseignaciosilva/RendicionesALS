from rest_framework import viewsets,generics
from .models import Asignacion, Jerarquia,Solicitud,Usuario,Bitacora,Rol
from .serializer import AsignacionSerializer, BitacorasSerializer, JerarquiaSerializer ,RolSerializer,BitacorasSerializer,SolicitudSerializer,UsuariosSerializer, BitacorasSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

#@authentication_classes([TokenAuthentication])
#@permission_classes([IsAuthenticated])

#Trae las solicitudes de un usuario
@api_view(['POST']) 
def solicitudes_usuario(request):
    try:
        solicitud_usuario = Solicitud.objects.filter(contacto=request.data['contacto'])
        serializer = SolicitudSerializer(solicitud_usuario, many=True)
        return Response(serializer.data)

    except Solicitud.DoesNotExist:
        return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)
#Trae las solicitudes que esten en estado pendiente/pre aprobado
@api_view(['GET']) 
def solicitudes_pendientes(request):
    try:
        solicitud_usuario = Solicitud.objects.filter(estadoActual__in=["Pendiente", "Pre Aprobado"])
        serializer = SolicitudSerializer(solicitud_usuario, many=True)
        return Response(serializer.data)

    except Solicitud.DoesNotExist:
        return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET']) 
def solicitudes_gerente(request):
    try:
        solicitudes_gerente = Solicitud.objects.filter(estadoActual__in=["Pre Aprobado"])
        serializer = SolicitudSerializer(solicitudes_gerente, many=True)
        return Response(serializer.data)

    except Solicitud.DoesNotExist:
        return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def solicitudes_bitacoras(request):
    try:
        solicitud_usuario = Solicitud.objects.filter(estadoActual__in=["Bitacora"])
        serializer = SolicitudSerializer(solicitud_usuario, many=True)
        return Response(serializer.data)

    except Solicitud.DoesNotExist:
        return Response({'error': 'Solicitud no encontrada'}, status=status.HTTP_404_NOT_FOUND)

class SolicitudViewSet(viewsets.ModelViewSet):
    queryset = Solicitud.objects.all()
    serializer_class = SolicitudSerializer

    def create(self, request, *args, **kwargs):
        print("Solicitud recibida con datos:", request.data)  # <-- Esto debería verse en la consola de Django
        contacto = request.data.get('contacto')

        estados_restringidos = ["Bitacora", "Aprobado", "Pre Aprobado"]
        # estados_restringidos = ["Bitacora", "Aprobado"]
        solicitud_activa = Solicitud.objects.filter(contacto=contacto, estadoActual__in=estados_restringidos).exists()

        if solicitud_activa:
            print("Solicitud rechazada por estado restringido")  # <-- Agregar este log
            return Response(
                {"error": "No puedes crear una nueva solicitud hasta finalizar o rechazar la anterior."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)



    
class SolicitudView(APIView):
    def get(self, request):
        estado_final = request.GET.get('estadoActual')
        if estado_final:
            solicitudes = Solicitud.objects.filter(estadoActual=estado_final)
        else:
            solicitudes = Solicitud.objects.all()
        serializer = SolicitudSerializer(solicitudes, many=True)
        return Response(serializer.data)

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuariosSerializer
    
class BitacoraViewSet(viewsets.ModelViewSet):
    queryset = Bitacora.objects.all()
    serializer_class = BitacorasSerializer
    
    
class BitacoraList(generics.ListAPIView):
    queryset = Bitacora.objects.all()
    serializer_class = BitacorasSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        id_viaje = self.request.GET.get('idViaje')

        if id_viaje:
            queryset = queryset.filter(idViaje=id_viaje)

        return queryset


class BitacoraView(APIView):
  def get(self, request):
    id_viaje = request.GET.get('idViaje')
    bitacoras = Bitacora.objects.filter(id_viaje=id_viaje)
    serializer = BitacorasSerializer(bitacoras, many=True)
    return Response(serializer.data)

class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer

class AsignacionViewSet(viewsets.ModelViewSet):
    queryset = Asignacion.objects.all()
    serializer_class = AsignacionSerializer

class JerarquiaViewSet(viewsets.ModelViewSet):
    queryset = Jerarquia.objects.all()
    serializer_class = JerarquiaSerializer

# class BitacoraAPIView(APIView):
#     def post(self, request):
#         serializer = BitacoraMailSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response({'message': 'Bitacora created successfully'})
#         return Response(serializer.errors, status=400)


# Create your views here.
