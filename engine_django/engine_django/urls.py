from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('health', include('engine_django.api.urls')),
    path('v1', include('engine_django.api.urls')),
]

