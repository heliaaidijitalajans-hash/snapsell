# SnapSell backend - Railway icin net baslangic
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server.js start.js ./
# server.js → require("./lib/supabase") — olmadan Railway/Docker'da modül bulunamaz
COPY lib ./lib/

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "start.js"]
