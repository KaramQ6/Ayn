# ───────────────────────────────────────────────
# ForestGuard AI — Multi-stage Docker build
# Stage 1: Build the React client with Vite
# Stage 2: Run the Express server + serve static
# ───────────────────────────────────────────────

# --- Stage 1: Build Client ---
FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install
COPY client/ ./
RUN npm run build

# --- Stage 2: Production Server ---
FROM node:20-alpine AS production

WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && (npm install --frozen-lockfile --omit=dev 2>/dev/null || npm install --omit=dev)

# Copy server source
COPY server/ ./server/

# Copy built client into server/public for static serving
COPY --from=client-build /app/client/dist ./server/public

# Copy env example as reference
COPY .env.example ./.env.example

# SQLite database will be stored in a volume
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/forestguard.db

EXPOSE 3001

WORKDIR /app/server
CMD ["node", "src/index.js"]
