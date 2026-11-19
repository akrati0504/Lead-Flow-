#!/bin/sh
set -e

# Default PORT to 8000 if not provided by Render
PORT="${PORT:-8000}"

echo "Configuring application for production on port $PORT..."

# Ensure storage directories exist
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache

# Ensure www-data ownership
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Run config and route caches if APP_KEY is provided
if [ -n "$APP_KEY" ]; then
    echo "Caching Laravel configuration and routes..."
    php artisan config:cache || echo "Config cache skipped"
    php artisan route:cache || echo "Route cache skipped"
fi

# Run database migrations automatically in production if requested
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force || echo "Migration command finished with exit code $?"
fi

echo "Starting PHP built-in server on 0.0.0.0:$PORT..."
exec php -S "0.0.0.0:$PORT" -t public
