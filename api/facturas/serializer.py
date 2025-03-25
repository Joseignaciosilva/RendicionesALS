from rest_framework import serializers
from .models import  Solicitud

class SolicitudSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solicitud
        fields = '__all__'
        
            # Validaciones de fecha de aprobacion
        def validate_fechaAprobacion(self, value):
            if self.instance and self.instance.fechaAprobacion != value:
                raise serializers.ValidationError("No se puede modificar la fecha de aprobación manualmente.")
            return value

        def validate_fechaDosAprobacion(self, value):
            if self.instance and self.instance.fechaDosAprobacion != value:
                raise serializers.ValidationError("No se puede modificar la fecha de aprobación del segundo aprobador manualmente.")
            return value
        

