# SnapSell backend — Railway / Docker (WORKDIR /app = proje kökü)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# server.js: require("./lib/..."); api/ = Vercel webhook vb. (Railway’de yalnızca server.js çalışır)
COPY server.js start.js ./
COPY lib/ ./lib/
COPY api/ ./api/
# Expo Go Google OAuth bridge (served by Express at /auth and /api/auth)
COPY deploy/auth/ ./deploy/auth/

RUN test -d /app/api && test -f /app/lib/lemonsqueezy.js \
  && test -f /app/deploy/auth/expo-bridge.html

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "start.js"]
