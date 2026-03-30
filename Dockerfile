# SnapSell backend — Railway / Docker (WORKDIR /app = proje kökü)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# server.js: require("./lib/...") ve require("./api/create-checkout.js") — klasörler /app altında olmalı
COPY server.js start.js ./
COPY lib/ ./lib/
COPY api/ ./api/

# Erken hata: api klasörü imajda yoksa veya create-checkout eksikse build kırılsın
RUN test -f /app/api/create-checkout.js

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "start.js"]
