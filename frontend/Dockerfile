# ─────────────────────────────────────────────
#  Stage 1 : développement (hot reload)
# ─────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

# Copie les manifestes en premier pour profiter du cache Docker
COPY package*.json ./
RUN npm ci

# Le reste du code est monté via volume en dev
EXPOSE 3000

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

CMD ["npm", "run", "dev"]

# ─────────────────────────────────────────────
#  Stage 2 : build production
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
#  Stage 3 : image production minimale
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
