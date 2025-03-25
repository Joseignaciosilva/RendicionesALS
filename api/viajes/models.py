from django.db import models
from datetime import date

class Solicitud(models.Model):
    nombreUsuario = models.CharField(max_length=100)
    contacto = models.CharField(max_length=100)
    oficina = models.CharField(max_length=50)
    departamento = models.CharField(max_length=50)
    dirSalida = models.CharField(max_length=50)
    dirDestino = models.CharField(max_length=50)
    fechaSolicitud = models.DateField()
    fechaDeparto = models.DateField()
    fechaRetorno = models.DateField()
    horaIda = models.CharField(max_length=10)
    horaVuelta = models.CharField(max_length=10)
    transportes = models.CharField(max_length=100)
    hotel = models.CharField(max_length=50)
    cantnoches = models.PositiveIntegerField()
    costonoche = models.PositiveIntegerField()
    costoAlimento = models.PositiveIntegerField()
    costoHospedaje = models.PositiveIntegerField()
    costoTransporte = models.PositiveIntegerField()
    costoTotal = models.PositiveIntegerField()
    tipoMoneda = models.CharField(max_length=3)
    propuestaAgenda = models.CharField(max_length=500)
    ponos = models.CharField(max_length=50)
    nproyecto = models.PositiveIntegerField()
    clienteIntercompannia = models.CharField(max_length=50)
    notasExtras = models.CharField(max_length=50)
    estadoActual = models.CharField(max_length=50) #Pendiente - Pre.Aprobado - Aprobado - Rechazado - Finalizado
    aprobadoJefatura = models.CharField(max_length=50) #Empieza como pendiente, termina en aprobado o rechazado
    aprobadoGerencia = models.CharField(max_length=50) #Empieza como pendiente, termina en aprobado o rechazado

class Usuario(models.Model):
    idUsuario = models.IntegerField(primary_key=True)
    nombreUsuario = models.CharField(max_length=50)
    email = models.EmailField(max_length=50)
    
class Bitacora(models.Model):
    idViaje = models.IntegerField()
    idUsuario = models.CharField(max_length=50)
    nombreUsuario = models.CharField(max_length=50)
    contactoUsuario = models.EmailField(max_length=50)
    fecha = models.CharField(max_length=50)
    dia = models.IntegerField()
    horaActividadI = models.CharField(max_length=5)
    horaActividadT = models.CharField(max_length=5)
    cliente = models.CharField(max_length=50)
    lugar = models.CharField(max_length=50)
    participantes = models.CharField(max_length=100)
    motivo = models.CharField(max_length=100)
    resultadoEsperado = models.CharField(max_length=1000)
    
    
class Rol(models.Model):
    nombreRol = models.CharField(max_length=50)
    codigoRol = models.CharField(max_length=5)
    
class Asignacion(models.Model):
    correoUser = models.CharField(max_length=100, unique=True)
    codigoRol = models.CharField(max_length=5)
    
class Jerarquia(models.Model):
    idUsuario = models.IntegerField(null=False)
    nombreUsuario = models.CharField(max_length=50, null=False)
    idJefe = models.IntegerField(null=True, blank=True)
    nombreJefe = models.CharField(max_length=50, null=True, blank=True)

class Regiones(models.Model):
    nombreRegion = models.CharField(max_length=50)
    
# Create your models here.
