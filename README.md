# Notes API v3

A RESTful notes API built with Node.js, Express, PostgreSQL, and Prisma ORM. Features JWT authentication, user-scoped data, and database indexes for query performance.

## Tech Stack

- **Runtime** — Node.js v20
- **Framework** — Express 5
- **Database** — PostgreSQL
- **ORM** — Prisma 5
- **Auth** — JWT + bcrypt

## Features

- User signup and login with bcrypt password hashing
- JWT-based authentication on all notes routes
- Full CRUD for notes (GET, POST, PUT, PATCH, DELETE)
- User-scoped data — users can only access their own notes
- Database index on `user_id` for query performance
- Global error handling and input validation

## Project Structure

```
notes-api-v3/
├── app.js              — Express setup, middleware, error handlers
├── server.js           — starts the server
├── db/
│   ├── prisma.js       — Prisma client instance
│   └── schema.sql      — original schema reference
├── middleware/
│   └── auth.js         — JWT verification middleware
├── prisma/
│   ├── schema.prisma   — data models
│   └── migrations/     — migration history
├── routes/
│   ├── auth.js         — signup, login
│   └── notes.js        — protected notes routes
└── controllers/
    ├── auth.js         — auth logic
    └── notes.js        — notes logic
```

## Getting Started

### Prerequisites

- Node.js v20+
- PostgreSQL

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

| Method | Endpoint   | Description                      |
| ------ | ---------- | -------------------------------- |
| GET    | /notes     | Get all notes for logged in user |
| GET    | /notes/:id | Get a single note                |
| POST   | /notes     | Create a note                    |
| PATCH  | /notes/:id | Partially update a note          |
| PUT    | /notes/:id | Replace a note entirely          |
| DELETE | /notes/:id | Delete a note                    |

### Authentication

All notes endpoints require a Bearer token in the Authorization header:
Authorization: Bearer <token>

## Key Decisions

**Prisma over raw SQL** — Prisma provides type-safe database access, automatic migrations, and handles the N+1 problem cleanly with `include`. Raw SQL was used in v2 to understand what Prisma abstracts away.

**JWT over sessions** — stateless auth scales horizontally without shared session storage. Tokens expire after 7 days.

**User-scoped queries** — every notes query includes `AND user_id = $userId` to prevent users accessing each other's data. Enforced at the database level, not just application level.

**Database index on user_id** — every notes query filters by `user_id`. Without an index this is a full table scan. The index makes it O(log n) regardless of table size.
