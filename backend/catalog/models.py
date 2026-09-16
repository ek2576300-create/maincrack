from django.db import models


class Hero(models.Model):
    """Герой (public/data/heroes.json)."""

    hero_id = models.PositiveIntegerField("ID героя", unique=True)
    name = models.CharField("Имя", max_length=120)
    title = models.CharField("Титул", max_length=200, blank=True)
    quality = models.CharField("Редкость", max_length=40, blank=True)
    season = models.PositiveIntegerField("Сезон", null=True, blank=True)
    flying = models.BooleanField("Летающий", default=False)
    skills = models.JSONField(
        "Навыки",
        default=list,
        blank=True,
        help_text="Список объектов {id, name, rage_cost, description, upgrade, holistic, skill_enhanced}",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Герой"
        verbose_name_plural = "Герои"
        ordering = ["hero_id"]

    def __str__(self):
        return f"{self.name} — {self.title}" if self.title else self.name


class Pet(models.Model):
    """Питомец (public/data/pets.json)."""

    name = models.CharField("Имя", max_length=120, unique=True)
    type = models.CharField("Тип урона", max_length=40, blank=True)
    unit = models.CharField("Класс войск", max_length=40, blank=True)
    max_strength = models.PositiveIntegerField("Сила (макс.)", default=0)
    max_agility = models.PositiveIntegerField("Ловкость (макс.)", default=0)
    max_intelligence = models.PositiveIntegerField("Интеллект (макс.)", default=0)
    max_endurance = models.PositiveIntegerField("Выносливость (макс.)", default=0)
    max_spirit = models.PositiveIntegerField("Дух (макс.)", default=0)
    max_luck = models.PositiveIntegerField("Удача (макс.)", default=0)
    total = models.PositiveIntegerField("Сумма характеристик", default=0)
    portrait = models.CharField("Портрет (путь)", max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Питомец"
        verbose_name_plural = "Питомцы"
        ordering = ["name"]

    def __str__(self):
        return self.name


class PetSkill(models.Model):
    """Навык питомца (public/data/pet-skills.json)."""

    name = models.CharField("Название", max_length=120, unique=True)
    attribute = models.CharField("Характеристика", max_length=40, blank=True)
    talent = models.BooleanField("Врождённый талант", default=False)
    pet_exclusive = models.CharField("Эксклюзив питомца", max_length=120, blank=True)
    dependency = models.CharField("Зависимость (требуемый навык)", max_length=120, blank=True)
    type = models.CharField("Тип урона", max_length=40, blank=True)
    category = models.CharField("Категория", max_length=40, blank=True)
    costs = models.JSONField("Стоимость по уровням", default=list, blank=True)
    values = models.JSONField("Значения по уровням", default=list, blank=True)
    icon = models.CharField("Иконка (путь)", max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Навык питомца"
        verbose_name_plural = "Навыки питомцев"
        ordering = ["name"]

    def __str__(self):
        return self.name
