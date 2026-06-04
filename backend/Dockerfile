FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=backend-builder /app/node_modules ./backend/node_modules
COPY backend/ ./backend/
COPY --from=frontend-builder /app/dist ./frontend/dist
COPY backend/package*.json ./backend/
WORKDIR /app/backend
EXPOSE 5000
CMD ["node", "index.js"]