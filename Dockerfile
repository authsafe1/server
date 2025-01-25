FROM node:22 AS base

FROM base AS builder

WORKDIR /app

ENV NODE_ENV=development

COPY . .

RUN npm install
RUN npx prisma generate

ENV NODE_ENV=production

RUN npm run build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system authsafe-group && adduser --system --ingroup authsafe-group authsafe-user

COPY --from=builder --chown=authsafe-user:authsafe-group /app/package*.json ./
COPY --from=builder --chown=authsafe-user:authsafe-group /app/ecosystem.config.json ./
COPY --from=builder --chown=authsafe-user:authsafe-group /app/dist ./dist
COPY --from=builder --chown=authsafe-user:authsafe-group /app/prisma ./prisma
COPY --from=builder --chown=authsafe-user:authsafe-group /app/README.md ./
COPY --from=builder --chown=authsafe-user:authsafe-group /app/LICENSE ./

RUN npm ci

USER authsafe-user

EXPOSE 3000

HEALTHCHECK --interval=1m --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f $APP_URL/api/health || exit 1

CMD ["npm", "run", "start:container"]
