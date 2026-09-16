from rest_framework import serializers

from .models import Hero, Pet, PetSkill


class HeroSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="hero_id")

    class Meta:
        model = Hero
        fields = ["id", "name", "title", "quality", "season", "flying", "skills"]


class PetSerializer(serializers.ModelSerializer):
    maxStrength = serializers.IntegerField(source="max_strength")
    maxAgility = serializers.IntegerField(source="max_agility")
    maxIntelligence = serializers.IntegerField(source="max_intelligence")
    maxEndurance = serializers.IntegerField(source="max_endurance")
    maxSpirit = serializers.IntegerField(source="max_spirit")
    maxLuck = serializers.IntegerField(source="max_luck")

    class Meta:
        model = Pet
        fields = [
            "name",
            "type",
            "unit",
            "maxStrength",
            "maxAgility",
            "maxIntelligence",
            "maxEndurance",
            "maxSpirit",
            "maxLuck",
            "total",
            "portrait",
        ]


class PetSkillSerializer(serializers.ModelSerializer):
    petExclusive = serializers.CharField(source="pet_exclusive")

    class Meta:
        model = PetSkill
        fields = [
            "name",
            "attribute",
            "talent",
            "petExclusive",
            "dependency",
            "type",
            "category",
            "costs",
            "values",
            "icon",
        ]
