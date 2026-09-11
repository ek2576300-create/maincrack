from rest_framework.routers import DefaultRouter

from .views import AllianceViewSet, PlayerViewSet, ServerViewSet

router = DefaultRouter()
router.register("servers", ServerViewSet, basename="server")
router.register("alliances", AllianceViewSet, basename="alliance")
router.register("players", PlayerViewSet, basename="player")

urlpatterns = router.urls
