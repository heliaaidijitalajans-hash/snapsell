# SnapSell production image
# Build: docker build -t snapsell .
# Run:   docker run -p 3006:3006 --env-file .env -v snapsell-data:/app/data snapsell

FROM node:20-alpine AS builder

WORKDIR /app

# Tüm proje (public, server, design kaynakları)
COPY . .
RUN mkdir -p public data

# Dashboard (Vite/React) build
RUN cd saas-design-extracted && npm ci && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/saas-design-extracted/dist saas-design-extracted/dist

RUN mkdir -p data

EXPOSE 3006

CMD ["node", "server.js"]
