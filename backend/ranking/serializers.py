from rest_framework import serializers

from .models import (
    Alliance,
    AllianceRankEntry,
    Player,
    PlayerImmigrateEntry,
    PlayerRankEntry,
    Server,
)


class ServerSerializer(serializers.ModelSerializer):
    playersCount = serializers.IntegerField(source="players_count", read_only=True)
    alliancesCount = serializers.IntegerField(source="alliances_count", read_only=True)

    class Meta:
        model = Server
        fields = ["server_id", "display_name", "notes", "playersCount", "alliancesCount", "updated_at"]


class AllianceRankEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = AllianceRankEntry
        fields = ["rank_name", "kind", "rank", "pre_rank", "score", "captured_at"]


class AllianceListSerializer(serializers.ModelSerializer):
    serverId = serializers.IntegerField(source="server_id")

    class Meta:
        model = Alliance
        fields = ["alliance_id", "serverId", "name", "abbr", "logo", "owner_name", "updated_at"]


class AllianceDetailSerializer(AllianceListSerializer):
    rank_entries = AllianceRankEntrySerializer(many=True, read_only=True)

    class Meta(AllianceListSerializer.Meta):
        fields = AllianceListSerializer.Meta.fields + [
            "owner_id",
            "ori_server_id",
            "born_area_id",
            "rank_entries",
        ]


class PlayerRankEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = PlayerRankEntry
        fields = ["rank_name", "kind", "rank", "pre_rank", "score", "captured_at"]


class PlayerImmigrateEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = PlayerImmigrateEntry
        fields = [
            "rank_name",
            "rank",
            "pre_rank",
            "score",
            "castle_hide_time",
            "player_logout_time",
            "captured_at",
        ]


class PlayerListSerializer(serializers.ModelSerializer):
    serverId = serializers.IntegerField(source="server_id")

    class Meta:
        model = Player
        fields = ["player_id", "serverId", "name", "alliance_abbr", "alliance_name", "town_center_lvl"]


class PlayerDetailSerializer(PlayerListSerializer):
    rank_entries = PlayerRankEntrySerializer(many=True, read_only=True)
    immigrate_entries = PlayerImmigrateEntrySerializer(many=True, read_only=True)

    class Meta(PlayerListSerializer.Meta):
        fields = PlayerListSerializer.Meta.fields + ["ori_server_id", "rank_entries", "immigrate_entries"]
