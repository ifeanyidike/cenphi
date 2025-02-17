# Stage 1: Build the React app
FROM node:22.7.0-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
# RUN yarn install --frozen-lockfile
RUN yarn install --frozen-lockfile --ignore-platform

# Copy all source files and build production assets
COPY . .
RUN yarn vite build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the production build from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# (Optional) Replace default nginx configuration if needed
# COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
