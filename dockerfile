# Build app
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /app/dist
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8082
CMD ["nginx", "-g", "daemon off;"]