# Build stage – Debian (glibc) so Vite 8 / Rolldown native bindings install cleanly.
# Requires Node >= 22.12 (Vite 8), so don't use Coolify's Nixpacks build pack (it ships Node 22.11).
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev --include=optional
COPY . .
RUN npm run build

# Serve stage – static files only, no backend
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
