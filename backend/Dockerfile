# Build context: repo root (e.g. `docker build -f backend/Dockerfile .`)
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend ./backend
COPY shared ./shared

WORKDIR /app/backend

EXPOSE 5000

CMD ["node", "server.js"]
