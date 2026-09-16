from django.db import models


class Server(models.Model):
    """Игровой сервер. Заполняется автоматически при импорте рейтингов
    (server_id берётся из пакетов rank_*), остальные поля можно
    редактировать вручную в админке."""

    server_id = models.PositiveIntegerField("ID сервера", unique=True)
    display_name = models.CharField("Название", max_length=120, blank=True)
    notes = models.TextField("Заметки", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Сервер"
        verbose_name_plural = "Серверы"
        ordering = ["server_id"]

    def __str__(self):
        return self.display_name or f"Сервер {self.server_id}"


class Alliance(models.Model):
    """Альянс — актуальная карточка (имя/герб/лидер), из последнего
    импортированного пакета rank_alliance."""

    alliance_id = models.PositiveBigIntegerField("ID альянса", unique=True)
    server = models.ForeignKey(
        Server,
        verbose_name="Сервер",
        on_delete=models.CASCADE,
        related_name="alliances",
        to_field="server_id",
    )
    name = models.CharField("Название", max_length=120, blank=True)
    abbr = models.CharField("Тег", max_length=20, blank=True)
    logo = models.CharField("Герб (код)", max_length=60, blank=True)
    owner_name = models.CharField("Лидер", max_length=120, blank=True)
    owner_id = models.PositiveBigIntegerField("ID лидера", null=True, blank=True)
    ori_server_id = models.PositiveIntegerField("Исходный сервер", null=True, blank=True)
    born_area_id = models.PositiveIntegerField("Стартовая зона", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Альянс"
        verbose_name_plural = "Альянсы"
        ordering = ["server_id", "name"]
        indexes = [models.Index(fields=["server", "name"])]

    def __str__(self):
        return f"[{self.abbr}] {self.name}" if self.abbr else (self.name or str(self.alliance_id))


class AllianceRankEntry(models.Model):
    """Строчка рейтинга альянса по конкретному rankName (armorySeasonPoint
    и т.п.), из rank_alliance.csv."""

    alliance = models.ForeignKey(
        Alliance,
        verbose_name="Альянс",
        on_delete=models.CASCADE,
        related_name="rank_entries",
        to_field="alliance_id",
    )
    rank_name = models.CharField("Тип рейтинга", max_length=150)
    kind = models.CharField("kind", max_length=40, blank=True)
    rank = models.PositiveIntegerField("Место", null=True, blank=True)
    pre_rank = models.PositiveIntegerField("Прошлое место", null=True, blank=True)
    score = models.BigIntegerField("Очки", default=0)
    captured_at = models.DateTimeField("Снято", null=True, blank=True)

    class Meta:
        verbose_name = "Рейтинг альянса"
        verbose_name_plural = "Рейтинги альянсов"
        constraints = [
            models.UniqueConstraint(fields=["alliance", "rank_name"], name="uniq_alliance_rankname")
        ]
        indexes = [models.Index(fields=["rank_name", "rank"])]

    def __str__(self):
        return f"{self.alliance} — {self.rank_name} (#{self.rank})"


class Player(models.Model):
    """Игрок — актуальная карточка (ник/альянс/уровень ратуши)."""

    player_id = models.PositiveBigIntegerField("ID игрока", unique=True)
    server = models.ForeignKey(
        Server,
        verbose_name="Сервер",
        on_delete=models.CASCADE,
        related_name="players",
        to_field="server_id",
    )
    name = models.CharField("Ник", max_length=120, blank=True)
    alliance = models.ForeignKey(
        Alliance,
        verbose_name="Альянс",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="members",
        to_field="alliance_id",
    )
    alliance_name = models.CharField("Альянс (название)", max_length=120, blank=True)
    alliance_abbr = models.CharField("Альянс (тег)", max_length=20, blank=True)
    town_center_lvl = models.PositiveIntegerField("Ратуша, уровень", null=True, blank=True)
    ori_server_id = models.PositiveIntegerField("Исходный сервер", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Игрок"
        verbose_name_plural = "Игроки"
        ordering = ["server_id", "name"]
        indexes = [models.Index(fields=["server", "name"])]

    def __str__(self):
        return self.name or str(self.player_id)


class PlayerRankEntry(models.Model):
    """Строчка общего рейтинга игрока (RssCollect и т.п.), rank_player.csv."""

    player = models.ForeignKey(
        Player,
        verbose_name="Игрок",
        on_delete=models.CASCADE,
        related_name="rank_entries",
        to_field="player_id",
    )
    rank_name = models.CharField("Тип рейтинга", max_length=150)
    kind = models.CharField("kind", max_length=40, blank=True)
    rank = models.PositiveIntegerField("Место", null=True, blank=True)
    pre_rank = models.PositiveIntegerField("Прошлое место", null=True, blank=True)
    score = models.BigIntegerField("Очки", default=0)
    captured_at = models.DateTimeField("Снято", null=True, blank=True)

    class Meta:
        verbose_name = "Рейтинг игрока"
        verbose_name_plural = "Рейтинги игроков"
        constraints = [
            models.UniqueConstraint(fields=["player", "rank_name"], name="uniq_player_rankname")
        ]
        indexes = [models.Index(fields=["rank_name", "rank"])]

    def __str__(self):
        return f"{self.player} — {self.rank_name} (#{self.rank})"


class PlayerImmigrateEntry(models.Model):
    """Рейтинг иммиграции игрока (переезд между серверами), rank_immigrate.csv."""

    player = models.ForeignKey(
        Player,
        verbose_name="Игрок",
        on_delete=models.CASCADE,
        related_name="immigrate_entries",
        to_field="player_id",
    )
    rank_name = models.CharField("Тип рейтинга", max_length=150)
    rank = models.PositiveIntegerField("Место", null=True, blank=True)
    pre_rank = models.PositiveIntegerField("Прошлое место", null=True, blank=True)
    score = models.BigIntegerField("Очки", default=0)
    castle_hide_time = models.DateTimeField("Замок скрыт до", null=True, blank=True)
    player_logout_time = models.DateTimeField("Последний выход", null=True, blank=True)
    captured_at = models.DateTimeField("Снято", null=True, blank=True)

    class Meta:
        verbose_name = "Рейтинг иммиграции"
        verbose_name_plural = "Рейтинги иммиграции"
        constraints = [
            models.UniqueConstraint(fields=["player", "rank_name"], name="uniq_player_immigrate_rankname")
        ]

    def __str__(self):
        return f"{self.player} — {self.rank_name} (#{self.rank})"


class ScoreDetail(models.Model):
    """Общая детализация очков по сущности (rank_score_detail.csv) — не
    привязана жёстко к Player/Alliance, т.к. rankName может относиться к
    разным типам сущностей; полный decoded JSON хранится в detail_raw."""

    entity_id = models.PositiveBigIntegerField("ID сущности")
    server = models.ForeignKey(
        Server,
        verbose_name="Сервер",
        on_delete=models.CASCADE,
        related_name="score_details",
        to_field="server_id",
    )
    rank_name = models.CharField("Тип рейтинга", max_length=150)
    kind = models.CharField("kind", max_length=40, blank=True)
    rank = models.PositiveIntegerField("Место", null=True, blank=True)
    score = models.BigIntegerField("Очки", default=0)
    castle_hide_time = models.DateTimeField("Замок скрыт до", null=True, blank=True)
    player_logout_time = models.DateTimeField("Последний выход", null=True, blank=True)
    detail_raw = models.JSONField("Детали (raw JSON)", default=dict, blank=True)
    captured_at = models.DateTimeField("Снято", null=True, blank=True)

    class Meta:
        verbose_name = "Детализация очков"
        verbose_name_plural = "Детализации очков"
        constraints = [
            models.UniqueConstraint(fields=["entity_id", "rank_name"], name="uniq_entity_rankname")
        ]
        indexes = [models.Index(fields=["rank_name", "rank"])]

    def __str__(self):
        return f"{self.entity_id} — {self.rank_name}"


class RankSendStat(models.Model):
    """Статистика отправки рейтингов игровым сервером (rank_send_stats.csv)."""

    rank_name = models.CharField("Тип рейтинга", max_length=150, unique=True)
    template_name = models.CharField("Шаблон", max_length=150, blank=True)
    send_count = models.PositiveIntegerField("Отправок", default=0)
    last_sent_at = models.DateTimeField("Последняя отправка", null=True, blank=True)
    last_ack_at = models.DateTimeField("Последнее подтверждение", null=True, blank=True)
    last_rows_updated = models.PositiveIntegerField("Обновлено строк", default=0)
    last_changed_rows = models.PositiveIntegerField("Изменено строк", default=0)

    class Meta:
        verbose_name = "Статистика рассылки рейтинга"
        verbose_name_plural = "Статистика рассылки рейтингов"
        ordering = ["rank_name"]

    def __str__(self):
        return self.rank_name
