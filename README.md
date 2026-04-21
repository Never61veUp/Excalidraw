## Excalidraw self-hosted (VPS)

Self-hosted система на базе open-source Excalidraw:

- **Frontend**: React + `@excalidraw/excalidraw`
- **Backend**: Node.js (Express) + JWT
- **DB**: PostgreSQL (хранение холстов как `jsonb`)
- **Realtime**: Yjs (`y-websocket`) — сервис называется `excalidraw-room`
- **Reverse proxy**: Traefik (edge) → nginx (routes `/`, `/api`, `/room`)

### Структура проекта

```
.
├─ backend/
│  ├─ db/init.sql
│  ├─ src/
│  │  ├─ index.ts
│  │  ├─ db.ts
│  │  ├─ env.ts
│  │  ├─ auth/jwt.ts
│  │  ├─ middleware/authRequired.ts
│  │  └─ routes/{auth.ts,boards.ts}
│  └─ Dockerfile
├─ frontend/
│  ├─ src/
│  │  ├─ lib/api.ts
│  │  └─ ui/
│  │     ├─ App.tsx
│  │     ├─ LoginPage.tsx
│  │     ├─ Workspace.tsx
│  │     └─ board/BoardEditor.tsx
│  └─ Dockerfile
├─ realtime/            # Yjs websocket server (y-websocket)
│  └─ Dockerfile
├─ nginx/nginx.conf
├─ docker-compose.yml
└─ .env.example
```

### API

Auth:

- `POST /api/auth/register` → `{ email, password }` → `{ token, user }`
- `POST /api/auth/login` → `{ email, password }` → `{ token, user }`

Boards (JWT required via `Authorization: Bearer <token>`):

- `POST /api/boards` — создать холст (хранится как JSON Excalidraw)
- `GET /api/boards` — список холстов
- `GET /api/boards/:id` — получить холст
- `PUT /api/boards/:id` — сохранить холст (JSON)

### UI

- **Sidebar**: список холстов + кнопка **Create board**
- **Переключение**: кликом по холсту
- **Открытие**: холст грузится как `initialData` в Excalidraw
- **Сохранение**: `PUT /boards/:id` по `debounce` (по умолчанию 1200ms)
- **Realtime**: Yjs-комната = `boardId` (два вкладки/браузера → мгновенная синхронизация)

### Запуск на VPS (Docker)

1) Установите Docker + docker compose plugin.

2) Скопируйте пример окружения и заполните:

```bash
cp .env.example .env
```

Минимально важно поменять:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `TRAEFIK_DOMAIN` (если будете добавлять HTTPS позже)

3) Поднимите сервисы:

```bash
docker compose up -d --build
```

4) Откройте в браузере:

- `http://<vps-ip>/` — UI

### Примечания

- Холсты хранятся в таблице `boards` как `jsonb` в колонке `data`.
- Realtime (Yjs) по умолчанию **не делает долговременную историю** на сервере — долговременное хранение обеспечивается вашим `PUT /boards/:id` автосейвом в Postgres.

