# ---------- Deps ----------

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---------- Builder ----------

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NODE_ENV=production

# Only build-time client env vars (NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

# ---------- Runner with Playwright ----------

FROM mcr.microsoft.com/playwright:v1.52.0-jammy AS runner
WORKDIR /app
ENV NODE_ENV=production

# No ENV remapping here - expect runtime injection from Render

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER pwuser
EXPOSE 3000
CMD ["sh", "-c", "PORT=${PORT:-3000} node server.js"]
