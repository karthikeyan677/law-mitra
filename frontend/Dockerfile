FROM node:20-alpine

WORKDIR /app

# Copy package manifests first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite with host binding for hot reloading inside Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
