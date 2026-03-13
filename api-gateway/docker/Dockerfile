FROM node:22-alpine
WORKDIR /app
COPY source/package*.json ./
RUN npm install
COPY source .
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
