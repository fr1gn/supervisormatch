FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# папка для файлов проектов
RUN mkdir -p uploads/projects

EXPOSE 4000
CMD ["npm", "start"]
