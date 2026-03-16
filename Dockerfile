# Build stage
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_URL=http://localhost:3000
ARG VITE_APP_VERSION=1.0.0
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
