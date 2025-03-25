from django.urls import include, path, re_path
from rest_framework import routers
from .views import SolicitudViewSet

router = routers.DefaultRouter()
router.register(r'solicitud', SolicitudViewSet, basename="solicitud_facturas")

urlpatterns = [
    path('', include(router.urls)),
]