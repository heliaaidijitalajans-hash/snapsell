# SnapSell backend - Railway icin net baslangic
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY server.js start.js ./

ENV NODE_ENV=production
ENV PORT=3006
EXPOSE 3006

CMD ["node", "start.js"]
