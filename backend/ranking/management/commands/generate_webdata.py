import json
import shutil
from collections import defaultdict
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Count, Q
from django.utils import timezone

from ranking.models import Alliance, AllianceRankEntry, Player, PlayerImmigrateEntry, PlayerRankEntry, Server

# Хвост rankName после последней точки — id сервера, всё что до него — тип
# метрики ('gs.player.RssCollect.100' -> 'gs.player.RssCollect').
PLAYER_METRIC_PREFIXES = {
    "gs.player.RssCollect": "resourcesGathered",
    "gs.player.power": "power",
    "gs.player.litepve": "scenarioPoints",
    "gs.player.honourkill": "honorKills",
}
ALLIANCE_METRIC_PREFIXES = {
    "gs.as.power": "power",
    "gs.as.flag": "flags",
    "gs.as.armorySeasonPoint": "armorySeasonPoints",
}
# Только те метрики, по которым у нас реально есть данные (фронтенд просто
# не покажет плашку "место", если ключа нет в ranksByMetric).
PLAYER_RANK_METRICS = ["power", "resourcesGathered", "scenarioPoints", "townCenterLvl", "immigrationScore"]
ALLIANCE_RANK_METRICS = ["power", "flags", "armorySeasonPoints"]


def metric_prefix(rank_name):
    return rank_name.rsplit(".", 1)[0] if "." in rank_name else rank_name


def fmt_dt(dt):
    return dt.strftime("%Y-%m-%d %H:%M:%S") if dt else ""


def humanize_delta(dt, now):
    """'in 36d 12h 0m' / '8d 21h 9m ago' — как в исходных CSV, но посчитано
    относительно момента генерации (сами тексты из выгрузки не хранятся)."""
    if not dt:
        return ""
    delta = dt - now
    future = delta.total_seconds() > 0
    secs = abs(delta.total_seconds())
    days = int(secs // 86400)
    hours = int((secs % 86400) // 3600)
    mins = int((secs % 3600) // 60)
    parts = f"{days}d {hours}h {mins}m"
    return f"in {parts}" if future else f"{parts} ago"


def compute_ranks(items, metric_keys):
    """items: список dict с ключом 'id'. Возвращает {id: {metric: место}}."""
    result = {item["id"]: {} for item in items}
    for metric in metric_keys:
        ordered = sorted(items, key=lambda it: it.get(metric, 0), reverse=True)
        for idx, it in enumerate(ordered):
            result[it["id"]][metric] = idx + 1
    return result


def dump_json(path: Path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))


class Command(BaseCommand):
    help = (
        "Перегенерирует public/data/webdata/manifest.json и public/data/webdata/servers/* "
        "из базы Django (заполненной import_ranks), чтобы сайт показывал все серверы "
        "из выгрузки rank_packets_cpp, а не только старые тестовые 2."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--out",
            default=str(settings.KC_PUBLIC_DATA_DIR / "webdata"),
            help="Куда писать manifest.json и servers/ (по умолчанию public/data/webdata)",
        )
        parser.add_argument(
            "--min-players",
            type=int,
            default=0,
            help="Пропускать серверы, где и игроков, и альянсов меньше этого числа",
        )

    def handle(self, *args, **options):
        out_dir = Path(options["out"])
        min_players = options["min_players"]
        now = timezone.now()
        now_str = fmt_dt(now)
        now_ms = int(now.timestamp() * 1000)

        self.stdout.write("Загружаю рейтинги игроков...")
        player_metrics = defaultdict(dict)
        player_captured = defaultdict(str)
        for row in PlayerRankEntry.objects.values("player_id", "rank_name", "score", "captured_at"):
            key = PLAYER_METRIC_PREFIXES.get(metric_prefix(row["rank_name"]))
            if key:
                player_metrics[row["player_id"]][key] = row["score"]
            if row["captured_at"]:
                s = fmt_dt(row["captured_at"])
                if s > player_captured[row["player_id"]]:
                    player_captured[row["player_id"]] = s

        self.stdout.write("Загружаю рейтинги иммиграции...")
        player_immigrate = {}
        for row in PlayerImmigrateEntry.objects.values(
            "player_id", "score", "castle_hide_time", "player_logout_time", "captured_at"
        ):
            player_immigrate[row["player_id"]] = row
            if row["captured_at"]:
                s = fmt_dt(row["captured_at"])
                if s > player_captured[row["player_id"]]:
                    player_captured[row["player_id"]] = s

        self.stdout.write("Загружаю рейтинги альянсов...")
        alliance_metrics = defaultdict(dict)
        alliance_captured = defaultdict(str)
        for row in AllianceRankEntry.objects.values("alliance_id", "rank_name", "score", "captured_at"):
            key = ALLIANCE_METRIC_PREFIXES.get(metric_prefix(row["rank_name"]))
            if key:
                alliance_metrics[row["alliance_id"]][key] = row["score"]
            if row["captured_at"]:
                s = fmt_dt(row["captured_at"])
                if s > alliance_captured[row["alliance_id"]]:
                    alliance_captured[row["alliance_id"]] = s

        servers = (
            Server.objects.annotate(
                pc=Count("players", distinct=True),
                ac=Count("alliances", distinct=True),
            )
            .filter(Q(pc__gt=0) | Q(ac__gt=0))
            .filter(Q(pc__gte=min_players) | Q(ac__gte=min_players))
            .order_by("server_id")
        )

        # Полная перегенерация: старые servers/* могли относиться к серверам,
        # которых в новой выгрузке уже нет (например, старый тестовый 888).
        servers_dir = out_dir / "servers"
        if servers_dir.exists():
            shutil.rmtree(servers_dir)

        manifest_servers = []
        totals = {"players": 0, "alliances": 0, "totalPower": 0}

        for server in servers:
            sid = str(server.server_id)

            alliance_items = []
            for a in Alliance.objects.filter(server=server):
                m = alliance_metrics.get(a.alliance_id, {})
                alliance_items.append(
                    {
                        "id": a.alliance_id,
                        "allianceId": str(a.alliance_id),
                        "allianceName": a.name,
                        "allianceAbbr": a.abbr,
                        "ownerName": a.owner_name,
                        "ownerId": str(a.owner_id) if a.owner_id else "",
                        "serverId": sid,
                        "bornAreaId": str(a.born_area_id) if a.born_area_id is not None else "",
                        "allianceLogo": a.logo,
                        "power": m.get("power", 0),
                        "merits": 0,
                        "flags": m.get("flags", 0),
                        "armorySeasonPoints": m.get("armorySeasonPoints", 0),
                        "kills": 0,
                        "capturedAt": alliance_captured.get(a.alliance_id) or now_str,
                    }
                )
            a_ranks = compute_ranks(alliance_items, ALLIANCE_RANK_METRICS)
            for item in alliance_items:
                item["ranksByMetric"] = a_ranks[item["id"]]
                del item["id"]

            player_items = []
            immigrant_player_ids = set()
            for p in Player.objects.filter(server=server):
                m = player_metrics.get(p.player_id, {})
                imm = player_immigrate.get(p.player_id)
                if imm:
                    immigrant_player_ids.add(p.player_id)
                player_items.append(
                    {
                        "id": p.player_id,
                        "playerId": str(p.player_id),
                        "playerName": p.name,
                        "serverId": sid,
                        "allianceId": str(p.alliance_id) if p.alliance_id else "0",
                        "allianceName": p.alliance_name,
                        "allianceAbbr": p.alliance_abbr,
                        "townCenterLvl": p.town_center_lvl or 0,
                        "power": m.get("power", 0),
                        "merits": 0,
                        "resourcesGathered": m.get("resourcesGathered", 0),
                        "scenarioPoints": m.get("scenarioPoints", 0),
                        "immigrationScore": imm["score"] if imm else 0,
                        "honorKills": m.get("honorKills", 0),
                        "capturedAt": player_captured.get(p.player_id) or now_str,
                        "castleHideTimeHuman": humanize_delta(imm["castle_hide_time"], now) if imm else "",
                        "playerLogoutTimeUtc": fmt_dt(imm["player_logout_time"]) if imm else "",
                        "playerOfflineFor": humanize_delta(imm["player_logout_time"], now) if imm else "",
                    }
                )
            p_ranks = compute_ranks(player_items, PLAYER_RANK_METRICS)
            for item in player_items:
                item["ranksByMetric"] = p_ranks[item["id"]]
                del item["id"]

            immigration_items = [it for it in player_items if int(it["playerId"]) in immigrant_player_ids]

            total_power = sum(it["power"] for it in player_items)
            top_player = max(player_items, key=lambda it: it["power"], default=None)
            top_alliance = max(alliance_items, key=lambda it: it["power"], default=None)

            dump_json(
                servers_dir / sid / "players.json",
                {"serverId": sid, "generatedAt": now_str, "version": now_ms, "count": len(player_items), "items": player_items},
            )
            dump_json(
                servers_dir / sid / "alliances.json",
                {"serverId": sid, "generatedAt": now_str, "version": now_ms, "count": len(alliance_items), "items": alliance_items},
            )
            dump_json(
                servers_dir / sid / "immigration.json",
                {"serverId": sid, "generatedAt": now_str, "version": now_ms, "count": len(immigration_items), "items": immigration_items},
            )
            summary = {
                "serverId": sid,
                "generatedAt": now_str,
                "version": now_ms,
                "players": len(player_items),
                "alliances": len(alliance_items),
                "immigrants": len(immigration_items),
                "totalPower": total_power,
                "topPlayerName": top_player["playerName"] if top_player else "",
                "topAllianceName": top_alliance["allianceName"] if top_alliance else "",
            }
            dump_json(servers_dir / sid / "summary.json", summary)

            manifest_servers.append({**{k: summary[k] for k in ("players", "alliances", "immigrants", "totalPower", "topPlayerName", "topAllianceName")}, "serverId": sid, "updatedAt": now_str})
            totals["players"] += len(player_items)
            totals["alliances"] += len(alliance_items)
            totals["totalPower"] += total_power

            self.stdout.write(f"  сервер {sid}: игроков {len(player_items)}, альянсов {len(alliance_items)}, иммигрантов {len(immigration_items)}")

        manifest = {
            "generatedAt": now_str,
            "version": now_ms,
            "format": "tamaris-webdata-v1",
            "totals": {"servers": len(manifest_servers), **totals},
            "servers": manifest_servers,
        }
        dump_json(out_dir / "manifest.json", manifest)

        self.stdout.write(
            self.style.SUCCESS(
                f"Готово: серверов {len(manifest_servers)}, игроков {totals['players']}, "
                f"альянсов {totals['alliances']}. Записано в {out_dir}"
            )
        )
