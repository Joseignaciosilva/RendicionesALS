from rest_framework import serializers
from .models import Jerarquia, Solicitud,Usuario,Bitacora,Rol,Asignacion

class SolicitudSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solicitud
        fields = '__all__'

class UsuariosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
        
class BitacorasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bitacora
        fields = '__all__'
        
class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'
        
class AsignacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignacion
        fields = '__all__'
        
class JerarquiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Jerarquia
        fields = '__all__'

# class BitacoraMailSerializer(serializers.ModelSerializer):
#     emails = serializers.ListField(child=serializers.EmailField())

#     class Meta:
#         model = Bitacora
#         fields = ['idViaje', 'emails']