"""
URL configuration for drf project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf.urls.static import static
from django.urls import path, include
from django.conf import settings
from api_rendiciones.views import descargar_comprobante, export_detalle_rendiciones


urlpatterns = [
    path('admin/', admin.site.urls),
    path('rendiciones/', include('api_rendiciones.urls')),
    path('viajes/', include('viajes.urls')),
    path('facturas/', include('facturas.urls')),
    path('api/fondos/<int:fondo_id>/export_detalle_rendiciones', export_detalle_rendiciones, name='export_detalle_rendiciones'),
    path('media/descargar_comprobante/<str:nombre_comprobante>', descargar_comprobante, name='descargar_comprobante'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)