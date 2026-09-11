# Python-бэкенд (Django) — база данных и админка

Второй бэкенд сайта, на Python/Django. Он не трогает существующий Node.js-сервер
(`server/`, работает как раньше на 8888-м порту, там своя SQLite с
пользователями/сессиями/поддержкой) — это отдельный сервис со своей базой,
в которой хранятся **все игровые данные**: серверы, альянсы, игроки и их
рейтинги (из выгрузки `rank_packets_cpp`), а также герои/питомцы/навыки
питомцев (те же данные, что и в `public/data/*.json`). Главная цель —
**удобная админка** (стандартная Django-админка) для редактирования всего
этого без ручной правки JSON/CSV.

---

## Установка

Нужен Python 3.11+.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Первый запуск

```bash
python manage.py migrate
python manage.py bootstrap_admin      # создаст администратора, логин/пароль напечатает в консоль
python manage.py import_catalog       # герои/питомцы/навыки — из public/data/*.json
python manage.py runserver 0.0.0.0:8000
```

Откройте `http://localhost:8000/admin/`.

По умолчанию `bootstrap_admin` создаёт администратора
`admin@kraken888.local` / `kraken888` (как и Node-бэкенд) — **смените пароль
сразу после входа**, либо задайте свои значения ещё до первого запуска:

```bash
KC_PY_ADMIN_EMAIL=you@example.com KC_PY_ADMIN_PASSWORD='ваш-пароль' python manage.py bootstrap_admin
```

## Импорт рейтингов серверов (rank_packets_cpp)

Данные серверов/альянсов/игроков/рейтингов берутся из выгрузки
`rank_packets_cpp` — это шесть CSV с декодированными игровыми пакетами:
`rank_server.csv`, `rank_alliance.csv`, `rank_player.csv`,
`rank_immigrate.csv`, `rank_score_detail.csv`, `rank_send_stats.csv`.

1. Распакуйте `rank_packets_cpp.rar` в `backend/data_raw/` (создайте
   каталог, если его нет) — в git этот каталог не попадает:

   ```bash
   mkdir -p backend/data_raw
   unrar x rank_packets_cpp.rar backend/data_raw/
   ```

2. Запустите импорт:

   ```bash
   python manage.py import_ranks
   ```

   Путь к CSV можно переопределить: `python manage.py import_ranks --dir /путь/к/csv`.

Команда идемпотентна — её можно перезапускать на новой выгрузке, записи
обновляются по уникальным ключам (`server_id`, `alliance_id`, `player_id` +
`rank_name` и т.д.), а не дублируются. Импорт ~420 тысяч строк занимает
около минуты.

`python manage.py import_all` запускает `import_catalog` и `import_ranks`
подряд.

### Что именно импортируется

| Файл | Во что превращается |
|---|---|
| `rank_alliance.csv` | `Alliance` (карточка альянса) + `AllianceRankEntry` (место в рейтинге по каждому `rankName`) |
| `rank_player.csv` | `Player` (карточка игрока) + `PlayerRankEntry` (общий рейтинг: сила, сбор ресурсов и т.д.) |
| `rank_immigrate.csv` | `Player` + `PlayerImmigrateEntry` (рейтинг «открытости» для переезда, время последнего входа) |
| `rank_score_detail.csv` | `ScoreDetail` (детализация очков по сущности; сырой decoded-JSON сохраняется целиком в `detail_raw`) |
| `rank_server.csv` | тоже `ScoreDetail` — это «self»-пакеты (аккаунт смотрит рейтинг чужого сервера), сервер берётся из хвоста `rankName` |
| `rank_send_stats.csv` | `RankSendStat` — техническая статистика рассылки рейтингов игровым сервером |

Строки с `serverId=0` (кроме `kind=self`, где сервер и так неизвестен) не
импортируются — это служебные «пустые» записи игры, а не реальные игроки.
`rank=4294967295` (uint32 максимум) означает «нет места» и превращается в
`NULL`.

`Server` (список серверов) заполняется автоматически на основе всех
встреченных `serverId`, поле «Название» можно дозаполнить вручную в
админке.

---

## Админка

`http://localhost:8000/admin/` — всё редактируется прямо там:

- **Каталог** → Герои, Питомцы, Навыки питомцев — те же данные, что видит
  сайт (`public/data/heroes.json` и т.д.), но с поиском, фильтрами и
  редактированием in-place прямо в списке (без открытия карточки).
- **Ranking** → Серверы, Альянсы, Игроки, Рейтинги альянсов/игроков,
  Рейтинги иммиграции, Детализации очков, Статистика рассылки. У серверов
  в списке сразу видно число игроков/альянсов, у альянсов — число
  участников. Карточка игрока и альянса показывает все его рейтинговые
  записи прямо внутри (inline-таблицы), без переходов.
- Everywhere есть поиск и фильтры (`list_filter`), а часто редактируемые
  поля можно менять прямо в списке (`list_editable`) — не нужно открывать
  каждую запись отдельно.

## REST API

Read-only API для фронтенда, под `/api/py/v1/`:

| Путь | Что отдаёт |
|---|---|
| `GET /api/py/v1/heroes/` | список героев (`?search=`, `?quality=`, `?season=`, `?flying=`) |
| `GET /api/py/v1/pets/` | список питомцев |
| `GET /api/py/v1/pet-skills/` | список навыков питомцев |
| `GET /api/py/v1/servers/` | список серверов со счётчиками игроков/альянсов |
| `GET /api/py/v1/alliances/` | список альянсов (`?server_id=`, `?search=`) |
| `GET /api/py/v1/alliances/{alliance_id}/` | карточка альянса + все его рейтинги |
| `GET /api/py/v1/players/` | список игроков (`?server_id=`, `?alliance_id=`, `?search=`) |
| `GET /api/py/v1/players/{player_id}/` | карточка игрока + все его рейтинги |

Ответы пагинированы (`?page=`), поля героев/питомцев/навыков названы так
же, как в существующих `public/data/*.json` — при желании фронтенд можно
переключить с статических файлов на этот API без изменения структуры
данных.

---

## Переменные окружения

| Переменная | По умолчанию | Что делает |
|---|---|---|
| `KC_DJANGO_DEBUG` | `1` | `0` — выключить debug-режим (обязательно в бою) |
| `KC_DJANGO_SECRET_KEY` | (тестовый) | Секретный ключ Django — задайте свой в бою |
| `KC_DJANGO_ALLOWED_HOSTS` | `*` | Через запятую, список разрешённых хостов |
| `KC_PY_DATA_DIR` | `backend/data` | Где лежит SQLite (`db.sqlite3`), в git не попадает |
| `KC_PY_RAW_DATA_DIR` | `backend/data_raw` | Где `import_ranks` ищет CSV по умолчанию |
| `KC_PY_PUBLIC_DATA_DIR` | `public/data` | Где `import_catalog` ищет heroes/pets/pet-skills JSON |
| `KC_PY_ADMIN_EMAIL` / `KC_PY_ADMIN_PASSWORD` | `admin@kraken888.local` / генерируется | Учётка администратора для `bootstrap_admin` |

## Боевой запуск

Development-сервер (`runserver`) не для продакшена. Пример с gunicorn за
nginx/Caddy:

```bash
pip install gunicorn
KC_DJANGO_DEBUG=0 KC_DJANGO_SECRET_KEY='сгенерируйте-случайную-строку' \
KC_DJANGO_ALLOWED_HOSTS=ваш-домен.ru \
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

Node-сайт (порт 8888) и Django (порт 8000, `/admin/` + `/api/py/v1/`)
работают параллельно — на общем домене их разводит nginx/Caddy по префиксу
пути.
