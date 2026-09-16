import os
import secrets

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Создаёт администратора Django, если пользователей ещё нет "
        "(email/пароль берутся из KC_PY_ADMIN_EMAIL/KC_PY_ADMIN_PASSWORD, "
        "иначе генерируются и печатаются в консоль)."
    )

    def handle(self, *args, **options):
        User = get_user_model()
        if User.objects.exists():
            self.stdout.write("Пользователи уже есть — пропускаю создание администратора.")
            return

        email = os.environ.get("KC_PY_ADMIN_EMAIL", "admin@kraken888.local")
        password = os.environ.get("KC_PY_ADMIN_PASSWORD") or secrets.token_urlsafe(12)

        User.objects.create_superuser(username=email, email=email, password=password)

        self.stdout.write(self.style.SUCCESS("Создан администратор Django-админки:"))
        self.stdout.write(f"  email:    {email}")
        self.stdout.write(f"  password: {password}")
        self.stdout.write("Смените пароль сразу после первого входа (/admin/password_change/).")
