from django.db.models import Count
from rest_framework import viewsets

from .models import Alliance, Player, Server
from .serializers import (
    AllianceDetailSerializer,
    AllianceListSerializer,
    PlayerDetailSerializer,
    PlayerListSerializer,
    ServerSerializer,
)


class ServerViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ServerSerializer
    lookup_field = "server_id"
    search_fields = ["server_id", "display_name"]

    def get_queryset(self):
        return Server.objects.annotate(
            players_count=Count("players", distinct=True),
            alliances_count=Count("alliances", distinct=True),
        ).order_by("server_id")


class AllianceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Alliance.objects.all().order_by("server_id", "name")
    lookup_field = "alliance_id"
    filterset_fields = ["server_id"]
    search_fields = ["name", "abbr", "owner_name"]

    def get_serializer_class(self):
        return AllianceDetailSerializer if self.action == "retrieve" else AllianceListSerializer


class PlayerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Player.objects.all().order_by("server_id", "name")
    lookup_field = "player_id"
    filterset_fields = ["server_id", "alliance_id"]
    search_fields = ["name"]

    def get_serializer_class(self):
        return PlayerDetailSerializer if self.action == "retrieve" else PlayerListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "retrieve":
            qs = qs.prefetch_related("rank_entries", "immigrate_entries")
        return qs
