# server/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Копируем манифесты и устанавливаем зависимости
COPY package*.json ./
RUN npm install --production

# Копируем исходники
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]