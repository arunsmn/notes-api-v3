# Notes API v3

A production-grade RESTful and GraphQL API built with Node.js, Express, PostgreSQL, Prisma ORM, and Redis caching. Features JWT authentication, user-scoped data, database indexes, caching, and GraphQL alongside REST.

## Live API

```
https://notes-api-v3.vercel.app
```

## Tech Stack

- **Runtime** — Node.js v20
- **Framework** — Express 5
- **Database** — PostgreSQL (Supabase in production)
- **ORM** — Prisma 5
- **Cache** — Redis
- **GraphQL** — Apollo Server 4
- **Auth** — JWT + bcrypt

## Features

- User signup and login with bcrypt password hashing
- JWT-based authentication on all notes routes
- Full CRUD for notes (GET, POST, PUT, PATCH, DELETE)
- User-scoped data — users can only access their own notes
- Database index on `user_id` for query performance
- Redis caching with cache-aside pattern on GET /notes
- Cache invalidation on every write operation
- GraphQL endpoint alongside REST
- Global error handling and input validation

## Project Structure

```
notes-api-v3/
├── app.js                  — Express setup, middleware, Apollo Server
├── server.js               — starts the server
├── db/
│   ├── prisma.js           — Prisma client instance
│   └── redis.js            — Redis client instance
├── middleware/
│   └── auth.js             — JWT verification middleware
├── graphql/
│   ├── schema.js           — GraphQL type definitions
│   ├── resolvers.js        — GraphQL resolvers
│   └── context.js          — GraphQL auth context
├── prisma/
│   ├── schema.prisma       — data models
│   └── migrations/         — migration history
├── routes/
│   ├── auth.js             — signup, login
│   └── notes.js            — protected notes routes
└── controllers/
    ├── auth.js             — auth logic
    └── notes.js            — notes logic with Redis caching
```

## Getting Started

### Prerequisites

- Node.js v20+
- PostgreSQL
- Redis

### Setup

1. Clone the repo

```bash
git clone https://github.com/arunsmn/notes-api-v3
cd notes-api-v3
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/notes_app
JWT_SECRET=your-secret-key
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
```

4. Run migrations

```bash
npx prisma migrate dev
```

5. Start the server

```bash
node server.js
```

## API Reference

### Auth

| Method | Endpoint     | Description                 |
| ------ | ------------ | --------------------------- |
| POST   | /auth/signup | Register a new user         |
| POST   | /auth/login  | Login and receive JWT token |

### Notes (all require Authorization header)

| Method | Endpoint   | Description                                 |
| ------ | ---------- | ------------------------------------------- |
| GET    | /notes     | Get all notes — cached in Redis             |
| GET    | /notes/:id | Get a single note                           |
| POST   | /notes     | Create a note — invalidates cache           |
| PATCH  | /notes/:id | Partially update a note — invalidates cache |
| PUT    | /notes/:id | Replace a note entirely — invalidates cache |
| DELETE | /notes/:id | Delete a note — invalidates cache           |

### Authentication

All notes endpoints require a Bearer token:

```
Authorization: Bearer <token>
```

## GraphQL

GraphQL endpoint available at `/graphql` alongside REST.

### Example queries

**Signup:**

```graphql
mutation {
  signup(name: "Arun", email: "arun@example.com", password: "password123") {
    token
    user {
      id
      name
      email
    }
  }
}
```

**Get notes with author in one request:**

```graphql
{
  notes {
    id
    title
    content
    user {
      name
    }
  }
}
```

**Create a note:**

```graphql
mutation {
  createNote(title: "My note", content: "Hello world") {
    id
    title
    content
    createdAt
  }
}
```

All queries and mutations except signup and login require:

```
Authorization: Bearer <token>
```

## Caching Strategy

GET /notes uses a cache-aside pattern with Redis:

```
READ:
  1. Check Redis for cached notes
  2. Cache hit  → return immediately, no DB query
  3. Cache miss → query PostgreSQL → store in Redis (60s TTL) → return

WRITE (create/update/delete):
  1. Update PostgreSQL
  2. Delete cache key
  3. Next GET fetches fresh data
```

Cache key format: `notes:user:{userId}`

## Key Decisions

**Prisma over raw SQL** — type-safe database access, automatic migrations, handles N+1 with `include`. Raw SQL used in v2 to understand what Prisma abstracts.

**JWT over sessions** — stateless auth scales horizontally without shared session storage. Tokens expire after 7 days.

**User-scoped queries** — every notes query includes `AND user_id = $userId`. Enforced at the database level.

**Database index on user_id** — every notes query filters by `user_id`. Without an index this is a full table scan. The index makes it O(log n).

**Cache-aside over write-through** — simpler to implement, no risk of cache and DB getting out of sync on failed writes. Trade-off: first request after any write is always a cache miss.

**GraphQL alongside REST** — REST for simple operations, GraphQL for nested data requirements. Both hit the same database and use the same JWT auth.

**Delete on write cache invalidation** — cache deleted immediately on any write. Guarantees fresh data on next read. Trade-off: one cache miss after every write.
