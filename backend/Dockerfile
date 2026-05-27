FROM node:20-bookworm-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
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
