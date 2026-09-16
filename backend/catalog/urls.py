from rest_framework.routers import DefaultRouter

from .views import HeroViewSet, PetSkillViewSet, PetViewSet

router = DefaultRouter()
router.register("heroes", HeroViewSet, basename="hero")
router.register("pets", PetViewSet, basename="pet")
router.register("pet-skills", PetSkillViewSet, basename="pet-skill")

urlpatterns = router.urls
