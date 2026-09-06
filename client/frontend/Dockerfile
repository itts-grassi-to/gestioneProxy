FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
# Comando per avviare Vite/React in modalità sviluppo
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]