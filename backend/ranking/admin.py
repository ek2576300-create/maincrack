from django.contrib import admin
from django.db.models import Count

from .models import (
    Alliance,
    AllianceRankEntry,
    Player,
    PlayerImmigrateEntry,
    PlayerRankEntry,
    RankSendStat,
    ScoreDetail,
    Server,
)


class AllianceRankEntryInline(admin.TabularInline):
    model = AllianceRankEntry
    extra = 0
    fields = ("rank_name", "kind", "rank", "pre_rank", "score", "captured_at")
    ordering = ("rank",)


class PlayerRankEntryInline(admin.TabularInline):
    model = PlayerRankEntry
    extra = 0
    fields = ("rank_name", "kind", "rank", "pre_rank", "score", "captured_at")
    ordering = ("rank",)


class PlayerImmigrateEntryInline(admin.TabularInline):
    model = PlayerImmigrateEntry
    extra = 0
    fields = ("rank_name", "rank", "pre_rank", "score", "castle_hide_time", "player_logout_time", "captured_at")
    ordering = ("rank",)


@admin.register(Server)
class ServerAdmin(admin.ModelAdmin):
    list_display = ("server_id", "display_name", "players_count", "alliances_count", "updated_at")
    list_editable = ("display_name",)
    search_fields = ("server_id", "display_name")
    ordering = ("server_id",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(_players_count=Count("players", distinct=True), _alliances_count=Count("alliances", distinct=True))

    @admin.display(description="Игроков", ordering="_players_count")
    def players_count(self, obj):
        return obj._players_count

    @admin.display(description="Альянсов", ordering="_alliances_count")
    def alliances_count(self, obj):
        return obj._alliances_count


@admin.register(Alliance)
class AllianceAdmin(admin.ModelAdmin):
    list_display = ("alliance_id", "abbr", "name", "server", "owner_name", "members_count", "updated_at")
    list_editable = ("abbr", "name")
    list_filter = ("server",)
    search_fields = ("alliance_id", "name", "abbr", "owner_name")
    autocomplete_fields = ("server",)
    inlines = [AllianceRankEntryInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(_members_count=Count("members", distinct=True))

    @admin.display(description="Участников", ordering="_members_count")
    def members_count(self, obj):
        return obj._members_count


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ("player_id", "name", "server", "alliance_abbr", "alliance_name", "town_center_lvl", "updated_at")
    list_editable = ("name",)
    list_filter = ("server", "town_center_lvl")
    search_fields = ("player_id", "name", "alliance_name", "alliance_abbr")
    autocomplete_fields = ("server", "alliance")
    inlines = [PlayerRankEntryInline, PlayerImmigrateEntryInline]


@admin.register(AllianceRankEntry)
class AllianceRankEntryAdmin(admin.ModelAdmin):
    list_display = ("alliance", "rank_name", "kind", "rank", "pre_rank", "score", "captured_at")
    list_filter = ("rank_name", "kind")
    search_fields = ("alliance__name", "alliance__abbr", "rank_name")
    autocomplete_fields = ("alliance",)


@admin.register(PlayerRankEntry)
class PlayerRankEntryAdmin(admin.ModelAdmin):
    list_display = ("player", "rank_name", "kind", "rank", "pre_rank", "score", "captured_at")
    list_filter = ("rank_name", "kind")
    search_fields = ("player__name", "rank_name")
    autocomplete_fields = ("player",)


@admin.register(PlayerImmigrateEntry)
class PlayerImmigrateEntryAdmin(admin.ModelAdmin):
    list_display = ("player", "rank_name", "rank", "pre_rank", "score", "castle_hide_time", "captured_at")
    list_filter = ("rank_name",)
    search_fields = ("player__name", "rank_name")
    autocomplete_fields = ("player",)


@admin.register(ScoreDetail)
class ScoreDetailAdmin(admin.ModelAdmin):
    list_display = ("entity_id", "server", "rank_name", "kind", "rank", "score", "captured_at")
    list_filter = ("server", "rank_name", "kind")
    search_fields = ("entity_id", "rank_name")
    autocomplete_fields = ("server",)


@admin.register(RankSendStat)
class RankSendStatAdmin(admin.ModelAdmin):
    list_display = ("rank_name", "template_name", "send_count", "last_sent_at", "last_ack_at", "last_rows_updated", "last_changed_rows")
    list_filter = ("template_name",)
    search_fields = ("rank_name", "template_name")
