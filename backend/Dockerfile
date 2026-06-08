# ŠotoGO API — multi-stage build. Works on any container host (Render, Fly.io,
# Koyeb, …). The host injects PORT and the env vars from .env.example.

# ---- build stage: compile TypeScript ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- run stage: production deps + compiled output only ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# App binds process.env.PORT (default 3000); hosts override this.
EXPOSE 3000
CMD ["node", "dist/index.js"]
