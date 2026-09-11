import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from catalog.models import Hero, Pet, PetSkill


class Command(BaseCommand):
    help = (
        "Импортирует героев/питомцев/навыки питомцев из public/data/*.json "
        "(heroes.json, pets.json, pet-skills.json) в базу Django."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dir",
            default=str(settings.KC_PUBLIC_DATA_DIR),
            help="Каталог с heroes.json / pets.json / pet-skills.json (по умолчанию public/data)",
        )

    def handle(self, *args, **options):
        data_dir = Path(options["dir"])

        heroes_count = self._import_heroes(data_dir / "heroes.json")
        pets_count = self._import_pets(data_dir / "pets.json")
        skills_count = self._import_pet_skills(data_dir / "pet-skills.json")

        self.stdout.write(
            self.style.SUCCESS(
                f"Готово: героев {heroes_count}, питомцев {pets_count}, навыков питомцев {skills_count}."
            )
        )

    def _load(self, path: Path):
        if not path.exists():
            self.stdout.write(self.style.WARNING(f"Файл не найден, пропускаю: {path}"))
            return None
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    def _import_heroes(self, path: Path) -> int:
        data = self._load(path)
        if data is None:
            return 0
        items = data.get("items", data) if isinstance(data, dict) else data
        objs = [
            Hero(
                hero_id=item["id"],
                name=item.get("name", ""),
                title=item.get("title") or "",
                quality=item.get("quality") or "",
                season=item.get("season"),
                flying=bool(item.get("flying", False)),
                skills=item.get("skills") or [],
            )
            for item in items
        ]
        Hero.objects.bulk_create(
            objs,
            update_conflicts=True,
            unique_fields=["hero_id"],
            update_fields=["name", "title", "quality", "season", "flying", "skills"],
        )
        return len(objs)

    def _import_pets(self, path: Path) -> int:
        data = self._load(path)
        if data is None:
            return 0
        items = data.get("items", data) if isinstance(data, dict) else data
        objs = [
            Pet(
                name=item["name"],
                type=item.get("type") or "",
                unit=item.get("unit") or "",
                max_strength=item.get("maxStrength") or 0,
                max_agility=item.get("maxAgility") or 0,
                max_intelligence=item.get("maxIntelligence") or 0,
                max_endurance=item.get("maxEndurance") or 0,
                max_spirit=item.get("maxSpirit") or 0,
                max_luck=item.get("maxLuck") or 0,
                total=item.get("total") or 0,
                portrait=item.get("portrait") or "",
            )
            for item in items
        ]
        Pet.objects.bulk_create(
            objs,
            update_conflicts=True,
            unique_fields=["name"],
            update_fields=[
                "type",
                "unit",
                "max_strength",
                "max_agility",
                "max_intelligence",
                "max_endurance",
                "max_spirit",
                "max_luck",
                "total",
                "portrait",
            ],
        )
        return len(objs)

    def _import_pet_skills(self, path: Path) -> int:
        data = self._load(path)
        if data is None:
            return 0
        items = data.get("items", data) if isinstance(data, dict) else data
        objs = [
            PetSkill(
                name=item["name"],
                attribute=item.get("attribute") or "",
                talent=bool(item.get("talent", False)),
                pet_exclusive=item.get("petExclusive") or "",
                dependency=item.get("dependency") or "",
                type=item.get("type") or "",
                category=item.get("category") or "",
                costs=item.get("costs") or [],
                values=item.get("values") or [],
                icon=item.get("icon") or "",
            )
            for item in items
        ]
        PetSkill.objects.bulk_create(
            objs,
            update_conflicts=True,
            unique_fields=["name"],
            update_fields=[
                "attribute",
                "talent",
                "pet_exclusive",
                "dependency",
                "type",
                "category",
                "costs",
                "values",
                "icon",
            ],
        )
        return len(objs)
