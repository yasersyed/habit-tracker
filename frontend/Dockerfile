# Build context: repo root (e.g. `docker build -f frontend/Dockerfile .`)
FROM node:20-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend ./frontend
COPY shared ./shared

WORKDIR /app/frontend
RUN npm run build

FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/frontend/dist /usr/share/nginx/html

ENV NGINX_PORT=80 \
    BACKEND_HOST=backend-service \
    BACKEND_PORT=5000

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
