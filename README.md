# Stash

Personal finance tracker (iOS-first). This repository is the Phase 1 foundation from `plan-revised.md`.

## Stack

- Mobile: React Native, Expo, TypeScript, Expo Router, TanStack Query
- API: NestJS, TypeScript, Prisma, PostgreSQL
- Local infra: Docker Compose (PostgreSQL + API)

## Setup

```bash
cp .env.example .env
```

Start Postgres and the API:

```bash
docker compose up --build
```

Or run only the database and start the API locally:

```bash
docker compose up postgres
cd api
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Health check: `GET http://localhost:3000/api/health`

Mobile:

```bash
cd mobile
npm ci
npx expo start
```

The app reads `EXPO_PUBLIC_API_URL` (see `.env.example`).
