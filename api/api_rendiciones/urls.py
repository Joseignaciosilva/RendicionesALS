from django.urls import include, path, re_path
from rest_framework import routers
from .views import FondoViewSet, GastoViewSet, getfactura, NeteoViewSet, CentroCostosViewSet

router = routers.DefaultRouter()
router.register(r'fondo', FondoViewSet)
router.register(r'gasto', GastoViewSet)
router.register(r'neteo', NeteoViewSet)
router.register(r'centrocostos', CentroCostosViewSet)

urlpatterns = [
    path('', include(router.urls)),
    re_path('getfacturas', getfactura),
]