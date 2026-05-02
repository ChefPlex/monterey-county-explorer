# Threat Model

## Project Overview

This workspace is a pnpm/TypeScript monorepo for the Monterey County Explorer application. The production-relevant components are an Express 5 API server (`artifacts/api-server`) backed by PostgreSQL/Drizzle (`lib/db`), a React/Vite web map (`artifacts/sonoma-map`), an Expo mobile app (`artifacts/sonoma-mobile`), and server-side OpenAI integration packages (`lib/integrations-openai-ai-server`). The app exposes curated map markers and an AI chat assistant for public users; marker mutations are intended to be restricted by an `ADMIN_TOKEN` bearer token.

The `artifacts/mockup-sandbox` app and mobile build scripts are development/experimental surfaces and should be ignored in production scans unless a production deployment path is proven. In production, `NODE_ENV` is assumed to be `production`, Replit-provided TLS protects client/server traffic, and Replit manages certificate lifecycle.

## Assets

- **OpenAI integration credentials** -- `AI_INTEGRATIONS_OPENAI_API_KEY` and base URL enable calls to the managed AI service and must remain server-side.
- **Conversation data** -- chat conversation titles and message contents may include user-provided preferences or personal information; they must not be disclosed across users and should not be deletable by unrelated clients.
- **Marker data** -- names, notes, categories, coordinates, websites, and city metadata define the public map content. Unauthorized mutation would deface or remove production content.
- **Admin token** -- `ADMIN_TOKEN` authorizes marker create/update/delete operations; disclosure allows full marker tampering.
- **Database connection string** -- `DATABASE_URL` grants access to all persisted marker and conversation records.
- **Client state** -- local saved-list/onboarding state in localStorage/AsyncStorage is low sensitivity and is device-local.

## Trust Boundaries

- **Public clients to Express API** -- browsers and mobile apps call `/api/*`. Clients are untrusted; the API must validate inputs, enforce rate limits, and perform all authorization server-side.
- **Public users to admin marker operations** -- marker reads are public, while `POST`, `PUT`, and `DELETE /api/markers*` must require the configured bearer token.
- **API to PostgreSQL** -- API handlers query and mutate persisted marker/conversation data through Drizzle. Query construction must remain parameterized and records must be scoped to the authorized actor/session where applicable.
- **API to OpenAI integration** -- `/api/openai/*` accepts public prompts and sends them to the server-side OpenAI client. The API must protect service credentials, control cost/DoS risk, and avoid exposing one user's chat history to another.
- **Client to external websites/maps** -- marker websites are opened by web/mobile clients. URLs from marker records must not create script execution or unsafe deep-link behavior.
- **Development vs production** -- mockup sandbox, scripts, generated build tooling, and local-only Expo/dev-server code are out of production scope unless reachable from deployed applications.

## Scan Anchors

- Production API entry points: `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, and route files under `artifacts/api-server/src/routes/`.
- Highest-risk API surfaces: `artifacts/api-server/src/routes/openai/index.ts` for public AI chat/session handling and `artifacts/api-server/src/routes/markers.ts` for admin-gated marker mutations.
- Database schema: `lib/db/src/schema/{markers,conversations,messages}.ts` and DB client `lib/db/src/index.ts`.
- Web frontend API usage: `artifacts/sonoma-map/src/components/Map.tsx`, `artifacts/sonoma-map/src/components/SonomaChef.tsx`, and `lib/api-client-react/src/custom-fetch.ts`.
- Mobile API usage: `artifacts/sonoma-mobile/app/(tabs)/index.tsx`, `artifacts/sonoma-mobile/app/(tabs)/chef.tsx`, `artifacts/sonoma-mobile/app/_layout.tsx`, and `artifacts/sonoma-mobile/lib/api.ts`.
- Dev-only areas usually out of scope: `artifacts/mockup-sandbox`, `artifacts/sonoma-mobile/scripts`, local utility scripts, and generated files unless production code imports them.

## Threat Categories

### Spoofing

Marker mutation endpoints use a shared bearer token rather than user accounts. The API must reject marker mutation requests unless `Authorization` exactly matches the configured `ADMIN_TOKEN`, and the token must not be embedded in public client bundles or logs. OpenAI conversation/session identifiers supplied by clients must not be treated as proof of identity unless they are generated, stored, and enforced by the server.

### Tampering

Public clients can submit marker payloads only through admin-gated endpoints and chat content through public OpenAI endpoints. Marker mutations must be authorized and schema-validated. Conversation deletion and message insertion must only affect the requester's own conversation/session, not arbitrary numeric IDs.

### Information Disclosure

Public marker data is intended to be readable. Conversation titles and messages are not globally public; endpoints that list or fetch conversations and messages must scope records to the caller/session. Error responses and logs must avoid exposing secrets, stack traces, or sensitive prompt/message contents.

### Denial of Service

Public marker reads and OpenAI chat endpoints are externally reachable. Rate limiting, request body limits, input length limits, and upstream abort handling must prevent unauthenticated clients from exhausting API, database, or AI quota resources. Long-running AI streams must stop promptly when clients disconnect.

### Elevation of Privilege

A public user must not be able to create, edit, or delete marker records without the admin bearer token. SQL injection, unsafe shell execution, path traversal, and arbitrary dynamic code execution in production routes would allow escalation to database or server compromise and must be absent from production paths.