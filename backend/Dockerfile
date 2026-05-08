# ─────────────────────────────────────────────
#  Stage 1 : base PHP pour développement
# ─────────────────────────────────────────────
FROM php:8.3-fpm-bullseye AS base

# Extensions système nécessaires à Laravel + PostgreSQL
RUN apt-get update && apt-get install -y \
    bash \
    curl \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    libonig-dev \
    libicu-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    zip \
    mbstring \
    intl \
    bcmath \
    pcntl

# Install Composer from official image
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer files and install dependencies
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader

# ─────────────────────────────────────────────
#  Stage 2 : développement (hot reload, xdebug)
# ─────────────────────────────────────────────
FROM base AS development

# Xdebug pour le debug local
RUN pecl install xdebug && docker-php-ext-enable xdebug

COPY docker/php/php-dev.ini  /usr/local/etc/php/conf.d/custom.ini
COPY docker/php/www.conf     /usr/local/etc/php-fpm.d/www.conf
COPY docker/php/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["/entrypoint.sh"]
