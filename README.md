# BloxFruit Online Server v11 - Distributed Server Architecture

نظام الخوادم الموزعة للعبة Blox v11 - نظام متكامل قابل للتوسع لآلاف اللاعبين

## البنية المعمارية

```
┌─────────────────┐
│   Client (App)  │
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────────────────────────┐
│   Gateway Server (Port 3000)        │
│ - Player Registration               │
│ - Server Discovery                  │
│ - Load Balancing                    │
│ - Session Management                │
└────────┬────────────────────────────┘
         │
    ┌────┴─────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│ Game-1 │  │ Game-2 │  │ Game-3 │  │Game-N  │
│ Server │  │ Server │  │ Server │  │ Server │
│ 3001   │  │ 3002   │  │ 3003   │  │ 300X   │
└───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘
    │           │           │           │
    └───────────┼───────────┼───────────┘
                │           │
         ┌──────▼───────────▼──────┐
         │   Redis (Port 6379)    │
         │ - Cache & Coordination  │
         │ - Session Store         │
         └───────────┬─────────────┘
                     │
         ┌───────────▼──────────────┐
         │ PostgreSQL (Port 5432)  │
         │ - Player Data           │
         │ - Persistent Storage    │
         └────────────────────────┘
```

## المميزات

✅ **Gateway Server** - نقطة دخول موحدة لجميع اللاعبين
✅ **متعدد الخوادم** - تشغيل عدة Game Servers متوازية
✅ **Server Discovery** - اختيار الخادم الأقل ازدحامًا تلقائيًا
✅ **WebSocket Real-time** - اتصال فوري ثنائي الاتجاه
✅ **Health Checks** - مراقبة صحة الخوادم
✅ **Heartbeat & Ping/Pong** - الحفاظ على الاتصالات
✅ **Redis Caching** - سرعة وتنسيق بين الخوادم
✅ **PostgreSQL Database** - حفظ دائم وآمن لبيانات اللاعبين
✅ **Server Authority** - عدم الثقة بيانات العميل
✅ **Data Protection** - حفظ دوري وآمن عند الخروج
✅ **Docker & Docker Compose** - تشغيل محلي سهل
✅ **Graceful Shutdown** - إيقاف آمن

## المتطلبات

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (يمكن عبر Docker)
- Redis (يمكن عبر Docker)

## التشغيل المحلي

### الطريقة 1: استخدام Docker Compose (موصى به)

```bash
# 1. تثبيت المتطلبات
npm install

# 2. تشغيل النظام كاملًا
docker-compose up -d

# 3. تطبيق Migrations
npm run db:migrate

# 4. بدء Gateway و Game Servers
npm run start:gateway &
npm run start:game-servers

# 5. اختبار النظام
curl http://localhost:3000/health
curl http://localhost:3000/servers
```

### الطريقة 2: التشغيل اليدوي

```bash
# Terminal 1 - Redis
redis-server

# Terminal 2 - PostgreSQL
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:latest

# Terminal 3 - Gateway
npm run start:gateway

# Terminal 4 - Game Servers
npm run start:game-servers
```

## متغيرات البيئة (Environment Variables)

```env
# Gateway Configuration
GATEWAY_PORT=3000
GATEWAY_HOST=0.0.0.0
NODE_ENV=development

# Game Server Configuration
GAME_SERVER_PORT=3001
GAME_SERVER_MAX_PLAYERS=100
GAME_SERVER_HEARTBEAT_INTERVAL=5000

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=bloxfruit

# Logging
LOG_LEVEL=debug
```

## طريقة الاتصال

### 1. دخول لاعب جديد

```
Client → Gateway (HTTP/REST)
  ├─ POST /auth/login
  ├─ Authentication Check
  └─ Response: game-server-url, session-token

Client → Game Server (WebSocket)
  ├─ ws://game-server:port?token=xxx
  ├─ Player Initialization
  └─ Game State Sync
```

### 2. أثناء اللعب

```
Client ↔ Game Server (WebSocket)
  ├─ Player Movement (every 50ms)
  ├─ Actions (attacks, pickups, etc.)
  ├─ Ping/Pong (every 30s)
  └─ Server Validates ALL Critical Data

Game Server ↔ Redis
  ├─ Session Cache
  ├─ Player Location
  ├─ Temporary Data
  └─ Coordination

Game Server ↔ PostgreSQL
  ├─ Periodic Saves (every 30s)
  ├─ Player Stats
  ├─ Inventory
  └─ Progression
```

### 3. خروج اللاعب

```
Client → Game Server: disconnect
  ├─ Save Final Data
  ├─ Clear Redis Session
  ├─ Free Slot
  └─ Graceful Cleanup
```

## API Endpoints

### Gateway

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/health` | فحص صحة الـ Gateway |
| GET | `/servers` | قائمة جميع Game Servers المتاحة |
| POST | `/auth/login` | تسجيل دخول اللاعب |
| POST | `/auth/logout` | تسجيل خروج آمن |
| GET | `/player/:playerId` | بيانات اللاعب |
| WS | `/ws` | اتصال WebSocket مع الخادم |

### Game Server

| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/health` | فحص صحة Game Server |
| GET | `/status` | حالة الخادم (عدد اللاعبين، الذاكرة، إلخ) |
| GET | `/players` | قائمة اللاعبين الحاليين |
| POST | `/register` | تسجيل لاعب جديد |
| WS | `/ws` | اتصال WebSocket |

## ملفات المشروع

```
.
├── server/
│   ├── gateway/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── health.js
│   │   │   └── servers.js
│   │   └── services/
│   │       ├── discovery.js
│   │       ├── loadBalancer.js
│   │       └── sessionManager.js
│   │
│   ├── game-server/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── routes/
│   │   │   ├── health.js
│   │   │   └── status.js
│   │   ├── services/
│   │   │   ├── playerManager.js
│   │   │   ├── worldState.js
│   │   │   ├── dataSync.js
│   │   │   └── heartbeat.js
│   │   └── websocket/
│   │       ├── handler.js
│   │       ├── messageParser.js
│   │       └── messageValidator.js
│   │
│   ├── shared/
│   │   ├── database/
│   │   │   ├── connection.js
│   │   │   ├── models/
│   │   │   │   ├── player.js
│   │   │   │   ├── session.js
│   │   │   │   └── stats.js
│   │   │   └── migrations/
│   │   │       └── initial.sql
│   │   ├── redis/
│   │   │   └── client.js
│   │   ├── logging/
│   │   │   └── logger.js
│   │   ├── config/
│   │   │   └── constants.js
│   │   └── utils/
│   │       ├── validators.js
│   │       ├── encryption.js
│   │       └── helpers.js
│   │
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── .env.production
└── README.md
```

## الخطوات التالية

1. ✅ إنشاء بنية المشروع الأساسية
2. ⏳ تثبيت المتطلبات: `npm install`
3. ⏳ إنشاء قاعدة البيانات: `npm run db:migrate`
4. ⏳ اختبار النظام: `npm run test`
5. ⏳ تشغيل: `docker-compose up`

## الأمان

- ✅ Server Authority - لا تثق ببيانات العميل
- ✅ Token-based Authentication
- ✅ Encrypted Sessions
- ✅ SQL Injection Prevention (Parameterized Queries)
- ✅ XSS Protection
- ✅ Rate Limiting
- ✅ Connection Validation

## المساهمة

الرجاء اتباع معايير الكود الموضحة في `CONTRIBUTING.md`

---

**تاريخ الإنشاء**: 2026-10-05
**الإصدار**: v1.0.0
**الحالة**: 🚀 Development
