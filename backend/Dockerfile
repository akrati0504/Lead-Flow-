# Stage 1: Build & Composer dependencies
FROM composer:2.8 AS vendor

WORKDIR /app

# Copy composer definition files
COPY composer.json composer.lock ./

# Install production dependencies without dev packages and without running scripts
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts \
    --ignore-platform-reqs

# Stage 2: Final Production Runtime
FROM php:8.2-cli-alpine

# Set working directory
WORKDIR /var/www/html

# Install system dependencies and required PHP extensions
# (pdo_mysql for MySQL database connectivity, bcmath/mbstring/ctype/tokenizer/xml/curl are standard for Laravel)
RUN apk add --no-cache \
    curl \
    git \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    oniguruma-dev \
    icu-dev \
    linux-headers \
    && docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    mbstring \
    bcmath \
    xml \
    ctype \
    intl \
    opcache

# Copy application source code
COPY . .

# Copy vendor packages installed from composer builder stage
COPY --from=vendor /app/vendor ./vendor

# Copy entrypoint script and ensure executable permissions
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create required Laravel runtime directories and set permissions
RUN mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Render injects dynamic PORT environment variable (default fallback to 8000)
ENV PORT=8000
EXPOSE ${PORT}

# Set entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]
