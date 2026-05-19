# Stage 1: Install dependencies (cached layer)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Development — source mounted via volume, hot reload
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
ENV NODE_ENV=development
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Stage 3: Build production bundle
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 4: Production runner — minimal image
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs \
 && mkdir -p /app/public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public
COPY --chown=nextjs:nodejs server-https.js                     ./

USER nextjs

ENV NODE_ENV=production
ENV PORT=4000
ENV HOSTNAME=0.0.0.0
ENV CERTS_DIR=/app/certs

EXPOSE 4000
CMD ["node", "server-https.js"]
