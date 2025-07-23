FROM node:20.17.0-alpine

WORKDIR /app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy semua source code
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 3000

# Jalankan aplikasico
CMD ["node", "dist/main.js"]