# Adaptive Learning Platform

Адаптивная образовательная платформа с AI-тьютором, SM-2 алгоритмом, RAG и ролевой системой (студент / преподаватель).

## Системные требования

- **Docker** (см. установку для своей ОС ниже)
- **Ollama** (см. установку для своей ОС ниже)
- **~6 GB свободного места** (2 GB модель, 4 GB контейнеры)
- Интернет только для первого скачивания

---

## 1. Установка Docker

### macOS
Скачай и установи [Docker Desktop](https://www.docker.com/products/docker-desktop/).
После установки открой Docker Desktop и дождись зелёного индикатора "Running".

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install docker.io docker-compose-v2 -y
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# Выйди и зайди заново (или выполни: newgrp docker)
```

Другие дистрибутивы — см. [официальную инструкцию](https://docs.docker.com/engine/install/).

### Windows
1. Скачай и установи [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. При установке выбери **WSL 2 backend** (рекомендуется)
3. После установки перезагрузи компьютер
4. Открой Docker Desktop — дождись зелёного индикатора "Running"

---

## 2. Установка Ollama

### macOS
```bash
brew install ollama
brew services start ollama
```

### Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows
Скачай установщик с [ollama.com/download](https://ollama.com/download/) и запусти.

### Скачать модель (все ОС)
```bash
ollama pull llama3.2:3b
```
Это скачает ~2 GB. Дождись завершения (может занять 5–15 минут).

Проверь, что Ollama работает:
```bash
curl http://localhost:11434/api/tags
# Должен вернуть: {"models":[{"name":"llama3.2:3b", ...}]}
# На Windows: открой PowerShell и выполни: curl.exe http://localhost:11434/api/tags
```

---

## 3. Настроить окружение

В папке `backend/` лежит файл `.env.example`. Скопируй его в `.env`:

**macOS / Linux:**
```bash
cp backend/.env.example backend/.env
```

**Windows (PowerShell):**
```powershell
Copy-Item backend/.env.example backend/.env
```

**Windows (Git Bash):**
```bash
cp backend/.env.example backend/.env
```

Содержимое `.env` уже настроено на локальную Ollama — ничего менять не нужно:

```ini
DATABASE_URL=postgresql+asyncpg://ai_platform:ai_platform_secret@localhost:5432/ai_platform
REDIS_URL=redis://localhost:6379/0
OPENAI_API_KEY=                          # ← пустой — используем локальную Ollama
OPENAI_BASE_URL=http://host.docker.internal:11434/v1
OPENAI_MODEL=llama3.2:3b
SECRET_KEY=change-this-to-a-random-secret
DEBUG=true
```

---

## 4. Запустить платформу

Из корневой папки проекта (`там, где лежит docker-compose.yml`):

```bash
docker compose up --build
```

Первый запуск занимает 2–5 минут (скачивание образов, сборка пакетов).
Последующие запуски — ~10 секунд.

Убедись, что все сервисы поднялись. В логах должно быть:
```
ai_platform_backend   | Application startup complete.
ai_platform_frontend  | Compiled successfully!
```

---

## 5. Открыть в браузере

| Что | URL |
|---|---|
| Фронтенд | http://localhost:3000 |
| Swagger-документация API | http://localhost:8000/docs |
| Проверка здоровья | http://localhost:8000/health |

---

## 6. Войти в систему

После запуска база автоматически заполняется демо-данными.

| Роль | Email | Пароль |
|---|---|---|
| **Студент** | `demo@student.com` | `demo123` |
| **Преподаватель** | `demo@teacher.com` | `teacher123` |

---

## Что есть в платформе

### Ролевая система
Платформа разделяет **студента** и **преподавателя**:

| Возможность | Студент | Преподаватель |
|---|---|---|
| Карточки (SM-2) | ✅ | ✅ |
| AI-тьютор (чат) | ✅ | ❌ |
| Сдать домашнее задание | ✅ | ❌ |
| Проверить работы студентов | ❌ | ✅ |
| Загрузить учебные материалы (RAG) | ❌ | ✅ |
| Настроить правила AI-тьютора | ❌ | ✅ |
| Управлять видео | ❌ | ✅ |

**Меню отличается в зависимости от роли** — секции подписаны и подсвечены разными цветами:
- **Студент** — синий акцент (Мои задания, ИИ-Репетитор, Видео)
- **Преподаватель** — зелёный акцент (Работы, Управление видео, Правила ИИ)

### Функции
- **Карточки для запоминания** (SM-2 интервальные повторения)
- **AI-тьютор** — отвечает на вопросы по материалу, использует Ollama (локально)
- **RAG** — поиск по учебным материалам преподавателя
- **Домашние задания** — студент сдаёт (текст + **файлы**), преподаватель проверяет, AI делает ревью
- **Прикрепление файлов к работе** — студент может прикрепить PDF, DOC, TXT, PNG, ZIP и др. (до 10 МБ)
- **Видеоматериалы** — YouTube-ссылки, привязанные к курсам
- **Тёмная тема** — переключается в шапке сайта
- **Русский / Английский** — переключается в шапке сайта

---

## Решение проблем

### Docker пишет "port already allocated"
```bash
docker compose down
docker compose up --build
```

### Ошибка подключения к БД
```bash
docker compose down -v
docker compose up --build
```

### Backend не видит Ollama
Убедись, что Ollama запущена и модель скачана:

**macOS:**
```bash
brew services start ollama
curl http://localhost:11434/api/tags
```
**Linux:**
```bash
sudo systemctl start ollama
curl http://localhost:11434/api/tags
```
**Windows:**
```powershell
# Ollama должна быть в трее (работает как служба)
curl.exe http://localhost:11434/api/tags
```

### "no such host: host.docker.internal"

**На Linux** — если `extra_hosts` из `docker-compose.yml` не сработал. Проверь версию Docker:
```bash
docker --version  # нужно 20.10+
```
Если проблема осталась — замени в `.env`:
```
OPENAI_BASE_URL=http://172.17.0.1:11434/v1
```

**На Windows / macOS** — `host.docker.internal` работает из коробки. Убедись, что Docker Desktop запущен.

### Docker Compose не найден
Если `docker compose` (без дефиса) не работает, попробуй:
```bash
docker-compose up --build
```

### "Permission denied" при запуске Docker на Linux
```bash
sudo usermod -aG docker $USER
# Выйди из сессии и зайди заново
```

### Медленный ответ AI-тьютора
Это нормально для `llama3.2:3b` на CPU. Можно использовать модель поменьше:
```bash
ollama pull llama3.2:1b
```
и поменять в `.env`: `OPENAI_MODEL=llama3.2:1b`

### Хочу очистить все данные и начать заново
```bash
docker compose down -v
docker compose up --build
```

---

## Остановка платформы

```bash
# Остановить (данные сохранятся)
docker compose down

# Полностью удалить контейнеры и volumes
docker compose down -v
```
