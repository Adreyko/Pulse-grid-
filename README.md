# PulseGrid

PulseGrid is a multi-tenant microservice workspace for team pulse check-ins. Each tenant represents an organization, each user belongs to exactly one tenant, and the domain service lets teams publish a daily update with mood, energy, wins, blockers, and focus.

The workspace mirrors the service-per-folder structure used in the existing project, but the stack is now TypeScript with NestJS across every backend service. There is no PHP in the runtime or service layer.

## Stack

- TypeScript
- NestJS
- TypeORM
- PostgreSQL
- class-validator and class-transformer for DTO validation
- Nest JWT for tenant-aware access tokens
- Docker Compose per service
- repository-oriented module boundaries around the persistence layer

## Runtime

- Recommended Node.js: `18.16+`
- Recommended npm: `9+`
- Nest services build from each `source` directory with `npm run build`

## Services

- `api-gateway`: edge service, tenant resolution, JWT validation, request forwarding
- `tenant-service`: tenant registry and tenant lookup
- `identity-service`: tenant-aware user management and token issuance
- `pulse-service`: the core product service for daily check-ins, streaks, and digests

## Architecture

Requests enter through the gateway at `http://localhost:4000`. The gateway resolves the tenant from `x-tenant-slug`, validates the bearer token, enriches the request with trusted tenant and user headers, and forwards it to the target service.

Each domain service is now Postgres-first. `tenant-service`, `identity-service`, and `pulse-service` each own their own database schema and use TypeORM entities plus repository services. The gateway stays stateless and does not keep its own database.

The storage split is:

- `tenant-service` -> `pulsegrid_tenants`
- `identity-service` -> `pulsegrid_identity`
- `pulse-service` -> `pulsegrid_pulses`

The service layout is:

- `api-gateway/source/src/proxy`: route resolution and forwarding
- `api-gateway/source/src/shared/middleware`: tenant and auth context enrichment
- `tenant-service/source/src/modules/tenants`: tenant creation and internal lookup
- `identity-service/source/src/modules/auth`: admin registration, login, current user, tenant-scoped user provisioning
- `pulse-service/source/src/modules/pulses`: pulse upsert, history, digest, and streak logic

## Default seed

The services bootstrap a starter tenant and admin account when their storage is empty.

- Tenant slug: `northstar-studio`
- Admin email: `owner@northstar.local`
- Admin password: `ChangeMe!123`

## Local run

```bash
make create-network
make up-dev
```

For direct service runs:

```bash
cd tenant-service/source && npm install && npm run start:dev
cd identity-service/source && npm install && npm run start:dev
cd pulse-service/source && npm install && npm run start:dev
cd api-gateway/source && npm install && npm run start:dev
```

The exposed ports are:

- `4000` gateway
- `4101` tenant-service
- `4102` identity-service
- `4103` pulse-service
- `5411` tenant postgres
- `5412` identity postgres
- `5413` pulse postgres

## Test run

```bash
make test
```

Or by service:

```bash
cd tenant-service/source && npm test
cd identity-service/source && npm test
cd pulse-service/source && npm test
cd api-gateway/source && npm test
```

## Example flow

Create a tenant:

```bash
curl -X POST http://localhost:4000/api/v1/tenants \
  -H 'content-type: application/json' \
  -d '{"name":"Studio 7","slug":"studio-7","timezone":"Europe/Kiev"}'
```

Register an admin:

```bash
curl -X POST http://localhost:4000/api/v1/auth/register-admin \
  -H 'content-type: application/json' \
  -d '{"tenantSlug":"studio-7","name":"Ava Miles","email":"ava@studio7.test","password":"StrongPass!123"}'
```

Create a pulse:

```bash
curl -X POST http://localhost:4000/api/v1/pulses \
  -H 'content-type: application/json' \
  -H 'x-tenant-slug: studio-7' \
  -H "authorization: Bearer <token>" \
  -d '{"mood":"focused","energy":4,"wins":["Closed sprint planning"],"blockers":["Waiting on client assets"],"focus":"Finish dashboard QA"}'
```

Read a digest:

```bash
curl 'http://localhost:4000/api/v1/pulses/digest?date=2026-03-13' \
  -H 'x-tenant-slug: studio-7' \
  -H "authorization: Bearer <token>"
```

## Operational notes

- Gateway public routes: `POST /api/v1/tenants`, `POST /api/v1/auth/register-admin`, `POST /api/v1/auth/login`
- Protected routes require `Authorization: Bearer <token>` and `x-tenant-slug`
- Admin-only routes: `POST /api/v1/auth/users`, `GET /api/v1/pulses/digest`
- `docker-compose.local.yml.example` files run each service with bind mounts and `npm run start:dev`
- `docker-compose.dev.yml` files include a dedicated Postgres container for each domain service
- `tenant-service` seeds the default tenant on bootstrap if it does not exist
- `identity-service` seeds the default admin on bootstrap if it does not exist
- `tenant-service` and `pulse-service` were verified locally with `npm test` and `npm run build`
- `identity-service` and `api-gateway` were rewritten to the same Nest structure but not dependency-verified in this session because dependency installation for those two services was declined
