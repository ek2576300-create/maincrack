from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Запускает import_catalog и import_ranks подряд (заполняет всю базу)."

    def add_arguments(self, parser):
        parser.add_argument("--public-dir", default=None, help="см. import_catalog --dir")
        parser.add_argument("--raw-dir", default=None, help="см. import_ranks --dir")

    def handle(self, *args, **options):
        catalog_kwargs = {"dir": options["public_dir"]} if options["public_dir"] else {}
        raw_kwargs = {"dir": options["raw_dir"]} if options["raw_dir"] else {}
        call_command("import_catalog", **catalog_kwargs)
        call_command("import_ranks", **raw_kwargs)
