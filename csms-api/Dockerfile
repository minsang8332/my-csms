# Development / Builder stage
FROM node:22-alpine AS development
RUN apk add --no-cache openssl mariadb-client
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "start:dev"]

# Production stage
FROM node:22-alpine AS production
RUN apk add --no-cache openssl mariadb-client
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate
COPY --from=development /usr/src/app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/main.js"]
