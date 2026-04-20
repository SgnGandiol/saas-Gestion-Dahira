FROM mcr.microsoft.com/playwright:v1.51.0-noble

WORKDIR /app

# Installe uniquement les dépendances (node_modules exclu du contexte via .dockerignore)
COPY package*.json ./
RUN npm ci && npx playwright install chromium --with-deps

# Copie le code source sans node_modules
COPY . .

ENV BASE_URL=http://frontend:3000
ENV CI=true

CMD ["npx", "playwright", "test", "--reporter=list"]
