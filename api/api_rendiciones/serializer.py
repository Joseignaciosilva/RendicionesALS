from rest_framework import serializers
from .models import  CentroCostos, Fondo,Gasto,Neteo
from django.conf import settings

        
class FondoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fondo
        fields = '__all__'

class GastoSerializer(serializers.ModelSerializer):
    idfondo = serializers.PrimaryKeyRelatedField(
        queryset=Fondo.objects.all(), write_only=True
    )
    fondo = FondoSerializer(read_only=True, source='idfondo')
    class Meta:
        model = Gasto
        fields = '__all__'
     
    def get_nombreComprobante_url(self, obj):
        if obj.nombreComprobante:
            return f"{settings.MEDIA_URL}{obj.nombreComprobante}" # URl de la imagen
        return None

class NeteoSerializer(serializers.ModelSerializer):
    idfondo = serializers.PrimaryKeyRelatedField(
        queryset=Fondo.objects.all(), write_only=True
    )
    fondo = FondoSerializer(read_only=True, source='idfondo')
    class Meta:
        model = Neteo
        fields = '__all__'
        

class CentroCostosSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = CentroCostos
        fields = '__all__'