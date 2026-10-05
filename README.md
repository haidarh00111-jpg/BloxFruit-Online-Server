# BloxFruit Online Server

This repository contains a distributed game server stack for a mobile-only Blox V11 game. It keeps the current game's logic untouched and adds a scalable server architecture around it.

## Architecture

- Gateway Server: entry point, server discovery, and player assignment.
- Game Server: handles player world logic and server-authoritative validation.
- WebSocket: real-time communication layer between gameplay and the client.
- Redis: cache, temp session coordination, and heartbeat tracking.
- PostgreSQL: persistent player data storage.

## Local startup

1. Install dependencies:

```bash
npm install
```

2. Create or edit environment values:

```bash
cp .env.example .env
```

3. Start database services and the app:

```bash
npm run db:migrate
npm run start:gateway
npm run start:game-servers
```

Or with Docker Compose:

```bash
docker-compose up --build -d
```

## Endpoints

- Gateway: `GET /health`, `GET /servers`, `POST /auth/login`, `POST /register-server`, `POST /heartbeat`
- Game Server: `GET /health`, `GET /status`, `GET /players`, `POST /save-player`, `WebSocket /ws`

## Required environment variables

See `.env.example`.

## Cloud deployment

A cloud-friendly Kubernetes manifest is included at `cloud/deployment.yaml`.

## Notes

- No paid services are required.
- No secrets are stored in GitHub.
- Cloud-only secrets must be supplied through platform environment variables.
