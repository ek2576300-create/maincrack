import csv
import datetime as dt
import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from ranking.models import (
    Alliance,
    AllianceRankEntry,
    Player,
    PlayerImmigrateEntry,
    PlayerRankEntry,
    RankSendStat,
    ScoreDetail,
    Server,
)

BATCH_SIZE = 2000
UINT32_MAX = 4294967295

RAW_FILES = {
    "server": "rank_server.csv",
    "alliance": "rank_alliance.csv",
    "player": "rank_player.csv",
    "immigrate": "rank_immigrate.csv",
    "score_detail": "rank_score_detail.csv",
    "send_stats": "rank_send_stats.csv",
}


def parse_int(value, default=None):
    if value in (None, "", "null"):
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def parse_rank(value):
    """uint32 max (4294967295) — служебное значение "не участвует/нет места"."""
    n = parse_int(value)
    if n is None or n == UINT32_MAX:
        return None
    return n


def parse_dt_str(value):
    """'2026-09-09 14:59:28' -> aware datetime (UTC)."""
    if not value:
        return None
    try:
        naive = dt.datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None
    return timezone.make_aware(naive, dt.timezone.utc)


def parse_dt_ms(value):
    n = parse_int(value)
    if not n:
        return None
    try:
        return dt.datetime.fromtimestamp(n / 1000, tz=dt.timezone.utc)
    except (OverflowError, OSError, ValueError):
        return None


def parse_json(value):
    if not value:
        return {}
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return {}


def iter_csv_rows(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        yield from csv.DictReader(f)


class Command(BaseCommand):
    help = (
        "Импортирует данные серверов/альянсов/игроков/рейтингов из CSV, "
        "распакованных из rank_packets_cpp.rar (rank_server.csv, "
        "rank_alliance.csv, rank_player.csv, rank_immigrate.csv, "
        "rank_score_detail.csv, rank_send_stats.csv)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dir",
            default=str(settings.KC_RAW_DATA_DIR),
            help="Каталог с распакованными rank_*.csv (по умолчанию backend/data_raw)",
        )

    def handle(self, *args, **options):
        raw_dir = Path(options["dir"])
        files = {key: raw_dir / name for key, name in RAW_FILES.items()}
        missing = [name for key, name in RAW_FILES.items() if not files[key].exists()]
        if missing:
            raise CommandError(
                "Не найдены файлы: "
                + ", ".join(missing)
                + f".\nРаспакуйте rank_packets_cpp.rar в {raw_dir} "
                + "(unrar x rank_packets_cpp.rar <каталог>) и запустите команду снова."
            )

        self.stdout.write("Собираю список серверов...")
        server_ids = self._collect_server_ids(files)
        self._upsert_servers(server_ids)
        self.stdout.write(self.style.SUCCESS(f"  серверов в базе: {len(server_ids)}"))

        known_alliance_ids = set()

        self.stdout.write("Импортирую альянсы (rank_alliance.csv)...")
        n_alliances, n_alliance_entries = self._import_alliances(files["alliance"], known_alliance_ids)
        self.stdout.write(self.style.SUCCESS(f"  альянсов: {n_alliances}, записей рейтинга: {n_alliance_entries}"))

        self.stdout.write("Импортирую игроков и общий рейтинг (rank_player.csv)...")
        n_players, n_player_entries = self._import_players_and_ranks(files["player"], known_alliance_ids)
        self.stdout.write(self.style.SUCCESS(f"  игроков: {n_players}, записей рейтинга: {n_player_entries}"))

        self.stdout.write("Импортирую рейтинг иммиграции (rank_immigrate.csv)...")
        n_players2, n_immigrate = self._import_immigrate(files["immigrate"], known_alliance_ids)
        self.stdout.write(self.style.SUCCESS(f"  игроков: {n_players2}, записей: {n_immigrate}"))

        self.stdout.write("Импортирую детализацию очков (rank_score_detail.csv)...")
        n_detail = self._import_score_detail(files["score_detail"])
        self.stdout.write(self.style.SUCCESS(f"  записей: {n_detail}"))

        self.stdout.write("Импортирую self-пакеты серверов (rank_server.csv)...")
        n_server_self = self._import_server_self(files["server"])
        self.stdout.write(self.style.SUCCESS(f"  записей: {n_server_self}"))

        self.stdout.write("Импортирую статистику рассылки (rank_send_stats.csv)...")
        n_stats = self._import_send_stats(files["send_stats"])
        self.stdout.write(self.style.SUCCESS(f"  записей: {n_stats}"))

        self.stdout.write(self.style.SUCCESS("Импорт рейтингов завершён."))

    # -- helpers ---------------------------------------------------------

    def _bulk_upsert(self, model, objs, unique_fields, update_fields):
        for i in range(0, len(objs), BATCH_SIZE):
            model.objects.bulk_create(
                objs[i : i + BATCH_SIZE],
                update_conflicts=True,
                unique_fields=unique_fields,
                update_fields=update_fields,
            )

    def _server_id_from_rank_name(self, rank_name):
        tail = (rank_name or "").rsplit(".", 1)[-1]
        return int(tail) if tail.isdigit() else None

    def _collect_server_ids(self, files):
        ids = set()
        for key in ("alliance", "player", "immigrate", "score_detail"):
            for row in iter_csv_rows(files[key]):
                sid = parse_int(row.get("serverId"))
                if sid:
                    ids.add(sid)
        for row in iter_csv_rows(files["server"]):
            sid = self._server_id_from_rank_name(row.get("rankName"))
            if sid:
                ids.add(sid)
        return ids

    def _upsert_servers(self, server_ids):
        existing = set(Server.objects.values_list("server_id", flat=True))
        new_objs = [Server(server_id=sid) for sid in server_ids if sid not in existing]
        for i in range(0, len(new_objs), BATCH_SIZE):
            Server.objects.bulk_create(new_objs[i : i + BATCH_SIZE], ignore_conflicts=True)

    # -- per-file importers ------------------------------------------------

    def _import_alliances(self, path, known_alliance_ids):
        alliances = {}
        entries = []
        for row in iter_csv_rows(path):
            aid = parse_int(row.get("allianceId"))
            sid = parse_int(row.get("serverId"))
            if aid is None or sid is None:
                continue
            alliances[aid] = Alliance(
                alliance_id=aid,
                server_id=sid,
                name=row.get("allianceName") or "",
                abbr=row.get("allianceAbbr") or "",
                logo=row.get("allianceLogo") or "",
                owner_name=row.get("ownerName") or "",
                owner_id=parse_int(row.get("ownerId")),
                ori_server_id=parse_int(row.get("oriServerId")),
                born_area_id=parse_int(row.get("bornAreaId")),
            )
            entries.append(
                AllianceRankEntry(
                    alliance_id=aid,
                    rank_name=row.get("rankName") or "",
                    kind=row.get("kind") or "",
                    rank=parse_rank(row.get("rank")),
                    pre_rank=parse_rank(row.get("preRank")),
                    score=parse_int(row.get("score"), 0),
                    captured_at=parse_dt_str(row.get("capturedAt")),
                )
            )

        objs = list(alliances.values())
        self._bulk_upsert(
            Alliance,
            objs,
            ["alliance_id"],
            ["server_id", "name", "abbr", "logo", "owner_name", "owner_id", "ori_server_id", "born_area_id"],
        )
        known_alliance_ids.update(alliances.keys())
        self._bulk_upsert(
            AllianceRankEntry,
            entries,
            ["alliance_id", "rank_name"],
            ["kind", "rank", "pre_rank", "score", "captured_at"],
        )
        return len(objs), len(entries)

    def _import_players_and_ranks(self, path, known_alliance_ids):
        players = {}
        entries = []
        new_alliances = {}
        for row in iter_csv_rows(path):
            pid = parse_int(row.get("playerId"))
            sid = parse_int(row.get("serverId"))
            if pid is None or not sid:
                continue
            aid = parse_int(row.get("allianceId")) or None
            if aid and aid not in known_alliance_ids:
                new_alliances[aid] = Alliance(
                    alliance_id=aid,
                    server_id=sid,
                    name=row.get("allianceName") or "",
                    abbr=row.get("allianceAbbr") or "",
                )
                known_alliance_ids.add(aid)
            players[pid] = Player(
                player_id=pid,
                server_id=sid,
                name=row.get("playerName") or "",
                alliance_id=aid,
                alliance_name=row.get("allianceName") or "",
                alliance_abbr=row.get("allianceAbbr") or "",
                town_center_lvl=parse_int(row.get("townCenterLvl")),
                ori_server_id=parse_int(row.get("oriServerId")),
            )
            entries.append(
                PlayerRankEntry(
                    player_id=pid,
                    rank_name=row.get("rankName") or "",
                    kind=row.get("kind") or "",
                    rank=parse_rank(row.get("rank")),
                    pre_rank=parse_rank(row.get("preRank")),
                    score=parse_int(row.get("score"), 0),
                    captured_at=parse_dt_str(row.get("capturedAt")),
                )
            )

        self._bulk_upsert(Alliance, list(new_alliances.values()), ["alliance_id"], ["server_id", "name", "abbr"])
        objs = list(players.values())
        self._bulk_upsert(
            Player,
            objs,
            ["player_id"],
            ["server_id", "name", "alliance_id", "alliance_name", "alliance_abbr", "town_center_lvl", "ori_server_id"],
        )
        self._bulk_upsert(
            PlayerRankEntry,
            entries,
            ["player_id", "rank_name"],
            ["kind", "rank", "pre_rank", "score", "captured_at"],
        )
        return len(objs), len(entries)

    def _import_immigrate(self, path, known_alliance_ids):
        players = {}
        entries = []
        new_alliances = {}
        for row in iter_csv_rows(path):
            pid = parse_int(row.get("playerId"))
            sid = parse_int(row.get("serverId"))
            if pid is None or not sid:
                continue
            aid = parse_int(row.get("allianceId")) or None
            if aid and aid not in known_alliance_ids:
                new_alliances[aid] = Alliance(
                    alliance_id=aid,
                    server_id=sid,
                    name=row.get("allianceName") or "",
                    abbr=row.get("allianceAbbr") or "",
                )
                known_alliance_ids.add(aid)
            players[pid] = Player(
                player_id=pid,
                server_id=sid,
                name=row.get("playerName") or "",
                alliance_id=aid,
                alliance_name=row.get("allianceName") or "",
                alliance_abbr=row.get("allianceAbbr") or "",
                town_center_lvl=parse_int(row.get("townCenterLvl")),
                ori_server_id=parse_int(row.get("oriServerId")),
            )
            entries.append(
                PlayerImmigrateEntry(
                    player_id=pid,
                    rank_name=row.get("rankName") or "",
                    rank=parse_rank(row.get("rank")),
                    pre_rank=parse_rank(row.get("preRank")),
                    score=parse_int(row.get("score"), 0),
                    castle_hide_time=parse_dt_ms(row.get("castleHideTimeMs")) or parse_dt_str(row.get("castleHideTimeUtc")),
                    player_logout_time=parse_dt_ms(row.get("playerLogoutTimeMs")) or parse_dt_str(row.get("playerLogoutTimeUtc")),
                    captured_at=parse_dt_str(row.get("capturedAt")),
                )
            )

        self._bulk_upsert(Alliance, list(new_alliances.values()), ["alliance_id"], ["server_id", "name", "abbr"])
        objs = list(players.values())
        self._bulk_upsert(
            Player,
            objs,
            ["player_id"],
            ["server_id", "name", "alliance_id", "alliance_name", "alliance_abbr", "town_center_lvl", "ori_server_id"],
        )
        self._bulk_upsert(
            PlayerImmigrateEntry,
            entries,
            ["player_id", "rank_name"],
            ["rank", "pre_rank", "score", "castle_hide_time", "player_logout_time", "captured_at"],
        )
        return len(objs), len(entries)

    def _import_score_detail(self, path):
        entries = []
        for row in iter_csv_rows(path):
            eid = parse_int(row.get("id"))
            sid = parse_int(row.get("serverId"))
            if eid is None or sid is None:
                continue
            entries.append(
                ScoreDetail(
                    entity_id=eid,
                    server_id=sid,
                    rank_name=row.get("rankName") or "",
                    kind=row.get("kind") or "",
                    rank=parse_rank(row.get("rank")),
                    score=parse_int(row.get("score"), 0),
                    castle_hide_time=parse_dt_ms(row.get("castleHideTimeMs")) or parse_dt_str(row.get("castleHideTimeUtc")),
                    player_logout_time=parse_dt_ms(row.get("playerLogoutTimeMs")) or parse_dt_str(row.get("playerLogoutTimeUtc")),
                    detail_raw=parse_json(row.get("scoreDetail_decoded")),
                    captured_at=parse_dt_str(row.get("capturedAt")),
                )
            )
        self._bulk_upsert(
            ScoreDetail,
            entries,
            ["entity_id", "rank_name"],
            ["server_id", "kind", "rank", "score", "castle_hide_time", "player_logout_time", "detail_raw", "captured_at"],
        )
        return len(entries)

    def _import_server_self(self, path):
        """rank_server.csv: 'self'-пакеты (lastSeasonPvpPoint и т.п.) —
        суффикс rankName задаёт сервер, id — сущность (аккаунт), поэтому
        складываем их в ту же таблицу детализации очков."""
        entries = []
        for row in iter_csv_rows(path):
            eid = parse_int(row.get("id"))
            sid = self._server_id_from_rank_name(row.get("rankName"))
            if eid is None or sid is None:
                continue
            entries.append(
                ScoreDetail(
                    entity_id=eid,
                    server_id=sid,
                    rank_name=row.get("rankName") or "",
                    kind=row.get("kind") or "",
                    rank=parse_rank(row.get("rank")),
                    score=parse_int(row.get("score"), 0),
                    detail_raw=parse_json(row.get("scoreDetail_decoded")),
                    captured_at=parse_dt_str(row.get("capturedAt")),
                )
            )
        self._bulk_upsert(
            ScoreDetail,
            entries,
            ["entity_id", "rank_name"],
            ["server_id", "kind", "rank", "score", "detail_raw", "captured_at"],
        )
        return len(entries)

    def _import_send_stats(self, path):
        stats = {}
        for row in iter_csv_rows(path):
            name = row.get("rankName")
            if not name:
                continue
            stats[name] = RankSendStat(
                rank_name=name,
                template_name=row.get("templateName") or "",
                send_count=parse_int(row.get("sendCount"), 0),
                last_sent_at=parse_dt_str(row.get("lastSentAt")),
                last_ack_at=parse_dt_str(row.get("lastAckAt")),
                last_rows_updated=parse_int(row.get("lastRowsUpdated"), 0),
                last_changed_rows=parse_int(row.get("lastChangedRows"), 0),
            )
        objs = list(stats.values())
        self._bulk_upsert(
            RankSendStat,
            objs,
            ["rank_name"],
            ["template_name", "send_count", "last_sent_at", "last_ack_at", "last_rows_updated", "last_changed_rows"],
        )
        return len(objs)
