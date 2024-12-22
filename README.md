# AuthSafe - Identity Management Service

[![Build, push to Docker and deploy](https://github.com/anapeksha/authsafe/actions/workflows/docker-build-deploy.yml/badge.svg)](https://github.com/anapeksha/authsafe/actions/workflows/docker-build-deploy.yml)

**AuthSafe** is a highly configurable identity management system built with NestJS, Prisma, OAuth2orize, and Redis. It provides OAuth2, JWT-based authentication, two-factor authentication (2FA), and resource access control. It is designed to be integrated across various services to secure resources with flexible permission handling, similar to services like Okta.

## Features

- **OAuth2 Authorization**: Provides OAuth2 authorization endpoints (`/authorize`, `/token`, `/decision`).

- **Session Authentication**: Supports session based authentication for securing API routes.

- **2FA (Two-Factor Authentication)**: Built-in 2FA mechanism with backup codes.

- **Permission Management**: Define and manage resource permissions.

- **User & Client Management**: Supports user roles, activity tracking, and management of OAuth2 clients.

- **Rate Limiting and Throttling**: Protects against abusive requests.

- **Health Checks**: Endpoints to check the service's health.

- **Task Queues**: Supports background task processing using Bull queue.

- **Database Cleanups**: Scheduled database cleanup tasks.

## Installation

### Prerequisites

- **Node.js** (>= 18.x)

- **PostgreSQL** (>=15)

- **Redis** (for session management, rate limiting, and Bull queues)

### Steps

1\. **Clone the repository:**

```bash

git clone https://github.com/username/AuthSafe.git

cd AuthSafe

```

2\. **Install dependencies:**

```bash

npm install

```

3\. **Set up Prisma:**

```bash

npx prisma generate

npx prisma migrate dev

```

4\. **Run the application:**

```bash

npm run start

```

The server should now be running on `http://localhost:3000`.

## Environment Variables

Create a `.env` file in the root directory of your project with the following settings:

```ini

APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://testuser:testpassword@localhost:5432/testdb"
EMAIL_ID="test@mail.com"
EMAIL_FROM="abcd"
EMAIL_PASSWORD="test12345"
EMAIL_OUTGOING_SERVER="smtp.server.com"
SESSION_SECRET="my-secret"
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD="test12345"

```

## Endpoints

### OAuth2

- **GET** `/api/oauth2/authorize`

- **POST** `/api/oauth2/token`

- **POST** `/api/oauth2/decision`

### Authentication

- **POST** `/api/auth/login`

- **POST** `/api/auth/logout`

- **POST** `/api/auth/forgot-password`

- **POST** `/api/auth/reset-password`

- **GET** `/api/auth/is-authenticated`

### 2FA (Two-Factor Authentication)

- **POST** `/api/2fa/enable`

- **POST** `/api/2fa/disable`

- **POST** `/api/2fa/verify`

- **POST** `/api/2fa/backup-codes`

- **POST** `/api/2fa/verify-backup-code`

### User Management

- **GET** `/api/user`

- **POST** `/api/user/create`

- **POST** `/api/user/confirm`

- **PATCH** `/api/user/update`

- **DELETE** `/api/user/delete`

### Client Management

- **POST** `/api/client/all`

- **GET** `/api/client/:id`

- **POST** `/api/client/create`

- **PATCH** `/api/client/update/:id`

- **DELETE** `/api/client/delete/:id`

### Permission Management

- **POST** `/api/permission/create`

- **POST** `/api/permission/all`

- **GET** `/api/permission/:id`

- **PUT** `/api/permission/update/:id`

- **DELETE** `/api/permission/delete/:id`

## Health Checks

The service provides health checks at:

- **GET** `/api/health`

## Docker Setup

You can run AuthSafe using Docker for easy deployment. Here's how to build and run the Docker container.

### Build the Docker Image

1\. Build the image locally:

```bash

docker build -t authsafe:latest .

```

2\. Run the container:

```bash

docker run -p 3000:3000 --env-file .env authsafe:latest

```

### Docker Compose

Alternatively, use `docker-compose` for easier multi-service orchestration.

1\. Create a `docker-compose.yml` file:

```yaml
version: "3.8"
services:
  authsafe:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
  postgres:
    image: postgres:13
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: authsafe
    volumes:
      - ./postgres-data:/var/lib/postgresql/data
  redis:
    image: redis:6
    ports:
      - "6379:6379"
```

2\. Run `docker-compose`:

```bash

docker-compose up --build

```

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/anapeksha/authsafe/blob/main/LICENSE) file for details.
