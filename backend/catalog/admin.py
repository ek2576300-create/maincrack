from django.contrib import admin

from .models import Hero, Pet, PetSkill


@admin.register(Hero)
class HeroAdmin(admin.ModelAdmin):
    list_display = ("hero_id", "name", "title", "quality", "season", "flying", "skills_count")
    list_display_links = ("hero_id", "name")
    list_editable = ("quality", "season", "flying")
    list_filter = ("quality", "season", "flying")
    search_fields = ("hero_id", "name", "title")
    ordering = ("hero_id",)

    @admin.display(description="Навыков")
    def skills_count(self, obj):
        return len(obj.skills or [])


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "type",
        "unit",
        "max_strength",
        "max_agility",
        "max_intelligence",
        "max_endurance",
        "max_spirit",
        "max_luck",
        "total",
    )
    list_editable = (
        "type",
        "unit",
        "max_strength",
        "max_agility",
        "max_intelligence",
        "max_endurance",
        "max_spirit",
        "max_luck",
        "total",
    )
    list_filter = ("type", "unit")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(PetSkill)
class PetSkillAdmin(admin.ModelAdmin):
    list_display = ("name", "attribute", "type", "category", "talent", "pet_exclusive", "dependency")
    list_editable = ("attribute", "type", "category", "talent")
    list_filter = ("attribute", "type", "category", "talent")
    search_fields = ("name", "pet_exclusive", "dependency")
    ordering = ("name",)
