# Stash

Personal finance tracker (iOS-first). Implements the MVP in `plan-revised.md`.

## Stack

- Mobile: React Native, Expo, TypeScript, Expo Router, TanStack Query
- API: NestJS, TypeScript, Prisma, PostgreSQL
- Local infra: Docker Compose (PostgreSQL + API)

## Setup

```bash
cp .env.example .env
```

Required in `.env`: `JWT_SECRET`. Email verification uses the console mailer by default (tokens are logged by the API). Set `MAIL_TRANSPORT=smtp` plus SMTP vars to send real mail. Leave `APPLE_CLIENT_ID` empty until Apple is configured — Sign in with Apple then fails with a clear error. Leave `AI_CLASSIFY_URL` empty to use the low-confidence classifier stub.

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

The app reads `EXPO_PUBLIC_API_URL` (see `.env.example`). On a physical device, point that URL at your machine, not localhost.
