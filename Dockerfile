# Сборка
FROM node:20-alpine AS build
WORKDIR /app

# при деплое передаём пустой URL — nginx будет проксировать /api на бэкенд
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Nginx — раздаём фронт + проксируем API на бэкенд
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# конфиг nginx: SPA + reverse proxy для API
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;

    # фронтенд — SPA
    location / {
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # проксируем API на бэкенд
    location ~ ^/(auth|users|supervisors|requests|projects|upload|admin|students|teams|invitations)(/|$) {
        # Если это запрос страницы браузером (например, переход на /admin или /admin/login),
        # отдаем index.html фронтенда, а не проксируем запрос на бэкенд.
        if ($http_accept ~* "text/html") {
            rewrite ^ /index.html last;
        }

        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
        client_max_body_size 25m;
    }

    # статика загруженных файлов
    location /uploads {
        proxy_pass http://backend:4000/uploads;
    }
}
EOF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
