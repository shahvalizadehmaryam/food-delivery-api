# Order Food Backend

REST API for the Order Food app. Built with Express, TypeScript, Prisma, and PostgreSQL. Authentication is phone-based OTP with JWT access and refresh tokens.

## Features

- Phone OTP login / verification
- JWT access & refresh tokens (Passport JWT)
- User profile (get / update)
- Admin user management (list, update, block)
- Role-based access (`USER`, `ADMIN`)
- Request validation (Joi), rate limiting, Helmet, CORS, XSS sanitization
- Swagger UI in development (`/v1/docs`)

## Tech stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Runtime      | Node.js, TypeScript                 |
| Framework    | Express 5                           |
| Database     | PostgreSQL + Prisma 7               |
| Auth         | OTP (bcrypt-hashed), JWT, Passport  |
| Validation   | Joi                                 |
| Docs         | Swagger (OpenAPI 3)                 |
| Logging      | Winston, Morgan                     |

## Project structure

```
order-food-backend/
├── prisma/
│   └── schema.prisma          # Data models (User, Otp, Token)
├── scripts/
│   └── seed-sample-user.ts    # Seed a sample user + tokens
├── src/
│   ├── config/                # Env, logger, Morgan, Passport, roles
│   ├── controllers/           # Route handlers
│   ├── docs/                  # OpenAPI / Swagger definitions
│   ├── middlewares/           # Auth, validation, errors, rate limit, XSS
│   ├── routes/v1/             # API routes
│   ├── services/              # Business logic (auth, OTP, tokens, users)
│   ├── types/                 # Shared types
│   ├── utils/                 # ApiError, catchAsync, encryption helpers
│   ├── app.ts                 # Express app setup
│   ├── client.ts              # Prisma client
│   └── index.ts               # Server entry
├── package.json
└── prisma.config.ts           # Prisma datasource config
```

## Prerequisites

- Node.js 18+
- PostgreSQL database

## Getting started

### 1. Install dependencies

```bash
npm install
```

Prisma client is generated automatically via the `postinstall` script.

### 2. Environment variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/order_food?schema=public

JWT_SECRET=your-strong-secret-key
JWT_ACCESS_EXPIRATION_MINUTES=30
JWT_REFRESH_EXPIRATION_DAYS=30
JWT_RESET_PASSWORD_EXPIRATION_MINUTES=10
JWT_VERIFY_EMAIL_EXPIRATION_MINUTES=10

# Optional (reserved for email features)
SMTP_HOST=
SMTP_PORT=
SMTP_USERNAME=
SMTP_PASSWORD=
EMAIL_FROM=
```

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `NODE_ENV` | Yes | `development`, `production`, or `test` |
| `PORT` | No | Server port (default `3000`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign JWTs |
| `JWT_*_EXPIRATION_*` | No | Token lifetimes (see defaults above) |

### 3. Database

Apply the schema to your database:

```bash
npx prisma db push
# or, if you use migrations:
npx prisma migrate dev
```

### 4. Run the server

```bash
npm run dev
```

The API listens on `http://localhost:3000` (or your configured `PORT`).

Swagger docs (development only): [http://localhost:3000/v1/docs](http://localhost:3000/v1/docs)

## API overview

All routes are prefixed with `/v1`.

### Auth — `/v1/auth`

| Method | Path | Description |
| ------ | ---- | ----------- |
| `POST` | `/send-otp` | Generate a 5-digit OTP for a phone number |
| `POST` | `/verify-otp` | Verify OTP; returns tokens if user exists, or `isRegistered: false` for new phones |
| `POST` | `/logout` | Invalidate a refresh token |

**Auth flow**

1. Client calls `POST /v1/auth/send-otp` with `{ "phone": "..." }`.
2. OTP is stored hashed (expires in 2 minutes). In development the plain code is also returned and logged to the console (SMS provider is still TODO).
3. Client calls `POST /v1/auth/verify-otp` with `{ "phone": "...", "code": "..." }`.
   - Existing user → `{ isRegistered: true, user, tokens }`
   - New phone → `{ isRegistered: false, phone, message }` (client should complete registration)
4. Protected routes use `Authorization: Bearer <accessToken>`.
5. Logout with `{ "refreshToken": "..." }`.

### Users — `/v1/users`

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET` | `/my-profile` | Required | Current user profile |
| `PATCH` | `/my-profile` | Required | Update current user profile |

### Admin — `/v1/admin/users`

Requires an `ADMIN` role and the matching right.

| Method | Path | Right | Description |
| ------ | ---- | ----- | ----------- |
| `GET` | `/` | `getUsers` | List all users |
| `PATCH` | `/:id` | `manageUsers` | Update user by ID |
| `PATCH` | `/:id/block` | `manageUsers` | Block a user (cannot block yourself) |

## Roles

| Role | Rights |
| ---- | ------ |
| `USER` | None beyond own profile |
| `ADMIN` | `getUsers`, `manageUsers` |

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start server with hot reload (`tsx watch`) |
| `npm install` | Install deps + `prisma generate` |
| `npx tsx scripts/seed-sample-user.ts` | Upsert sample user (`4155552671`) and print auth tokens |

## Notes

- Blocked users cannot log in via OTP verification.
- Auth rate limiting is enabled on `/v1/auth` in production.
- OTP SMS delivery is not wired yet; integrate a provider (e.g. Kavenegar, Twilio) in `src/services/otp.service.ts` and remove console logging of OTP codes before going to production.
