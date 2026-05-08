#!/bin/sh
set -e

# Fix ownership/permissions for directories Laravel must write to.
# Needed on Windows bind mounts where host UIDs differ from container UIDs.
chown -R www-data:www-data \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache

chmod -R 775 \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache

exec php-fpm
