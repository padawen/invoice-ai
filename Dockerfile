# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

########################### deps
FROM base AS deps
RUN apk add --no-cache libc6-compat poppler-utils
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

########################### builder
FROM base AS builder
WORKDIR /app

# Accept env vars during build
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Expose them to the build (important for embedding into the browser bundle)
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN echo "🏗 SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
RUN npm run build

########################### runner
FROM base AS runner
WORKDIR /app
RUN apk add --no-cache poppler-utils

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# ✅ Expose Supabase env vars to the runtime container
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Security best practices
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000

CMD ["npm", "start"]
