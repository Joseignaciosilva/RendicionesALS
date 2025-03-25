from django.db import models
from .utils import rename_comprobante
from django.db.models import Sum
from django.db import models

class Fondo(models.Model):
    rendidor = models.CharField(max_length=200)
    rut = models.CharField(max_length=10)
    aprobadorJefatura = models.CharField(max_length=200, null=True, blank=True)
    aprobadorAdmin = models.CharField(max_length=200)
    referencia = models.CharField(max_length=200)
    montoAsignado = models.IntegerField(null=True, blank=True)
    fechaAsignado = models.DateField()
    centroCosto = models.CharField(max_length=50, null=True, blank=True)
    motoNave = models.BooleanField(default=False)
    totalRendido = models.IntegerField(null=True, blank=True)
    estado = models.CharField(max_length=20) 
    asignacion = models.CharField(max_length=20, null=True, blank=True) 

    class Meta: 
        db_table = 'rendiciones_fondo'
        
    def __str__(self):
        return f"{self.referencia}, {self.rendidor}"
    
    def update_total_rendido(self):
        total_gastos = self.id_gastos.aggregate(Sum('montoGasto'))['montoGasto__sum'] or 0
        self.totalRendido = total_gastos
        self.save()  
    
    def calcular_saldo(self):
        if self.montoAsignado is None or self.totalRendido is None:
            raise ValueError("El monto asignado o el total rendido no pueden ser nulos.")

        saldo_empresa = max(0, self.montoAsignado - self.totalRendido)
        saldo_rendidor = max(0, self.totalRendido - self.montoAsignado)

        neteo, created = Neteo.objects.update_or_create(
            idfondo=self,
            defaults={
                'saldo_empresa': saldo_empresa,
                'saldo_rendidor': saldo_rendidor,
            }
        )
        return neteo
    

class Gasto(models.Model):
    idfondo = models.ForeignKey(Fondo, on_delete=models.CASCADE, related_name='id_gastos')
    nombreComprobante = models.ImageField(upload_to=rename_comprobante)
    numeroComprobante = models.CharField(max_length=150)
    tipoComprobante = models.CharField(max_length=20)
    proveedor = models.CharField(max_length=100)  
    tipoGasto = models.CharField(max_length=30)
    descripcion = models.CharField(max_length=300, null=True, blank=True)
    fechaGasto = models.DateField()
    montoGasto = models.IntegerField()
    visadoJefe = models.CharField(max_length=20, null=True, blank=True)
    visadoAdmin = models.CharField(max_length=20, null=True, blank=True)
    numeroServicio = models.CharField(max_length=50, null=True, blank=True)

    class Meta: 
        db_table = 'rendiciones_gasto'
        
    def __str__(self):
        return f"{self.nombreComprobante}, {self.descripcion}"
    

class Neteo(models.Model):
    idfondo = models.OneToOneField(Fondo, on_delete=models.CASCADE, related_name='neteo')
    saldo_empresa = models.IntegerField(default=0)
    saldo_rendidor = models.IntegerField(default=0)

    class Meta:
        db_table = 'rendiciones_neteo'

    def __str__(self):
        return f"Neteo de Fondo ID: {self.idfondo.id}"

class CentroCostos(models.Model):
    
    codigo = models.CharField(max_length=5)
    nombre = models.CharField(max_length=50, unique=True)
    
    class Meta:
        db_table = 'centrocostos'

    def str(self):
        return f"{self.nombre}"