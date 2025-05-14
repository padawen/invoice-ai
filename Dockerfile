FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat poppler-utils
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p test/data
RUN touch test/data/05-versions-space.pdf
COPY .env.local .env.local
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
RUN grep -v '^#' .env.local | sed 's/\r$//' > /tmp/envs.sh
RUN while read -r line; do export $line; done < /tmp/envs.sh
RUN npm run build

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache poppler-utils
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN mkdir -p test/data
RUN touch test/data/05-versions-space.pdf
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/test ./test
RUN ls -la ./test/data || echo "test/data directory does not exist"
RUN ls -la ./test/data/05-versions-space.pdf || echo "PDF file does not exist"
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", ".next/standalone/server.js"]
