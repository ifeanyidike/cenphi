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

# Stage 1: Build the React/Vite app
# FROM node:22.7.0-alpine AS builder

# WORKDIR /app

# # Install dependencies
# COPY package.json yarn.lock ./
# RUN yarn install --frozen-lockfile --ignore-platform

# # Copy source
# COPY . .

# # Build-time args for Vite envs (pass these via docker build --build-arg or docker-compose)
# ARG VITE_FIREBASE_API_KEY
# ARG VITE_FIREBASE_AUTH_DOMAIN
# ARG VITE_FIREBASE_PROJECT_ID
# ARG VITE_FIREBASE_STORAGE_BUCKET
# ARG VITE_FIREBASE_MESSAGING_SENDER_ID
# ARG VITE_FIREBASE_APP_ID
# ARG VITE_FIREBASE_MEASUREMENT_ID
# ARG VITE_API_URL
# ARG VITE_WS_URL
# ARG VITE_API_BASE
# ARG VITE_WS_BASE

# # Expose those args to the environment so Vite sees them during build
# ENV VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
# ENV VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
# ENV VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
# ENV VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
# ENV VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
# ENV VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}
# ENV VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID}
# ENV VITE_API_URL=${VITE_API_URL}
# ENV VITE_WS_URL=${VITE_WS_URL}
# ENV VITE_API_BASE=${VITE_API_BASE}
# ENV VITE_WS_BASE=${VITE_WS_BASE}

# # Build: Vite will bake import.meta.env.* from process.env into the bundle.
# RUN yarn vite build

# # Stage 2: Serve with Nginx
# FROM nginx:alpine AS production

# # Copy build output
# COPY --from=builder /app/dist /usr/share/nginx/html

# # Optional custom nginx config (if you have one)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]