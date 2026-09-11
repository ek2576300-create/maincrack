from rest_framework import viewsets

from .models import Hero, Pet, PetSkill
from .serializers import HeroSerializer, PetSerializer, PetSkillSerializer


class HeroViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Hero.objects.all().order_by("hero_id")
    serializer_class = HeroSerializer
    filterset_fields = ["quality", "season", "flying"]
    search_fields = ["name", "title"]


class PetViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pet.objects.all().order_by("name")
    serializer_class = PetSerializer
    search_fields = ["name"]


class PetSkillViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PetSkill.objects.all().order_by("name")
    serializer_class = PetSkillSerializer
    search_fields = ["name"]
