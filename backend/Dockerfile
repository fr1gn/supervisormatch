FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# папка для файлов проектов
RUN mkdir -p uploads/projects

EXPOSE 4000

# при старте сначала накатываем миграции (создаём таблицы), потом запускаем сервер
CMD npx prisma migrate deploy && npm start
