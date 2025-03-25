import re
from django.db import models
from django.forms import ValidationError
from .utils import rename_factura
class Solicitud(models.Model):
    correlativo = models.CharField(max_length=100, unique=True)
    mesContable = models.CharField(max_length=100)
    anioMesContable = models.IntegerField(null=True, blank=True)
    unidadNegocio = models.CharField(max_length=255)
    aprobador = models.CharField(max_length=255, blank=True, null=True)
    aprobadorRut = models.CharField(max_length=10, blank=True, null=True)
    visadoAprobador = models.CharField(max_length=9, blank=True, null=True)
    aprobadorDos = models.CharField(max_length=255)
    aprobadorRutDos = models.CharField(max_length=10)
    visadoAprobadorDos = models.CharField(max_length=9, blank=True, null=True)
    aprobadorTres = models.CharField(max_length=255, blank=True, null=True)
    aprobadorRutTres = models.CharField(max_length=10, blank=True, null=True)
    visadoAprobadorTres = models.CharField(max_length=9, blank=True, null=True)
    factura = models.FileField(upload_to=rename_factura)
    fechaGenerado = models.DateField()
    fechaVencimiento = models.DateField()
    monto = models.IntegerField(null=True, blank=True)
    pendiente = models.IntegerField(null=True, blank=True)
    pagado = models.IntegerField(null=True, blank=True)
    fechaAprobacion = models.DateField(null=True, blank=True)
    fechaDosAprobacion = models.DateField(null=True, blank=True)
    fechaTresAprobacion = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, null=True, blank=True) 
    glosaAprobador = models.CharField(max_length=300, null=True, blank=True)
    glosaAprobadorDos = models.CharField(max_length=300, null=True, blank=True)
    glosaAprobadorTres = models.CharField(max_length=300, null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if self.monto is not None and self.pagado is not None:
            self.pendiente = self.monto - self.pagado  # Calcular el pendiente
        super().save(*args, **kwargs)

    class Meta: 
        db_table = 'facturas_solicitud'
        
    def __str__(self):
        return f"{self.nombreComprobante}, {self.descripcion}"