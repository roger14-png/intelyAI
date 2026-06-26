from django.urls import path
from .views import HealthView, MatchV1View

urlpatterns = [
    path('health', HealthView.as_view()),
    path('v1/match', MatchV1View.as_view()),
]

