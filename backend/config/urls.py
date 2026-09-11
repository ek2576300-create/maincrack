from django.contrib import admin
from django.urls import include, path

admin.site.site_header = "Хроники Кракена 888 — админка"
admin.site.site_title = "Kraken Chronicles 888"
admin.site.index_title = "Управление данными сайта"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/py/v1/", include("catalog.urls")),
    path("api/py/v1/", include("ranking.urls")),
]
