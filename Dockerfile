# ============================================================
# AHMAD & CO. — Production Dockerfile
# Lightweight nginx container serving the static website
# ============================================================

# Stage 1: Build (optional — copy + optimize)
FROM nginx:1.27-alpine AS production

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Remove default nginx content and default entrypoint scripts
RUN rm -rf /usr/share/nginx/html/* /docker-entrypoint.d/*

# Copy website files
COPY . /usr/share/nginx/html/

# Remove non-web files from the container
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/docker-compose.yml \
          /usr/share/nginx/html/.dockerignore \
          /usr/share/nginx/html/.env \
          /usr/share/nginx/html/README.md

# Custom nginx config for SPA + performance
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Bypass entrypoint scripts and run nginx directly
ENTRYPOINT []
CMD ["nginx", "-g", "daemon off;"]

