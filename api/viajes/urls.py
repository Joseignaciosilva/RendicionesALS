from django.urls import include, path, re_path
from rest_framework import routers
from viajes import views


router = routers.DefaultRouter()
router.register(r'solicitud', views.SolicitudViewSet, basename="solicitud_viajes")
router.register(r'usuarios',views.UsuarioViewSet)
router.register(r'bitacoras',views.BitacoraViewSet)
router.register(r'rol',views.RolViewSet)
router.register(r'asignacion',views.AsignacionViewSet)
router.register(r'jerarquia',views.JerarquiaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    re_path('solicitudes_usuario',views.solicitudes_usuario),
    re_path('solicitudes_pendientes', views.solicitudes_pendientes),
    re_path('solicitudes_gerente', views.solicitudes_gerente),
    re_path('solicitudes_bitacoras', views.solicitudes_bitacoras),
    # path('bitacora/', views.BitacoraAPIView.as_view()),
]
