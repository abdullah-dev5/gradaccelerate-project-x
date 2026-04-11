FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

# Native modules like better-sqlite3 and sqlite3 need build tooling on slim images.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN mkdir -p /app/database /app/tmp/uploads
RUN npm run build && npm prune --omit=dev

EXPOSE 8080

CMD ["sh", "-c", "node build/ace.js migration:run --force && node build/bin/server.js"]
