# Dockerfile for Expo Tunnel on Railway
FROM node:18-alpine

# Install expo-cli globally
RUN npm install -g @expo/cli@latest

# Set working directory
WORKDIR /app

# Copy package files (since root directory is /apps/mobile)
COPY package*.json ./

# Install dependencies
RUN npm install

# Install ngrok for tunneling
RUN npm install @expo/ngrok@^4.1.0

# Copy the entire mobile app
COPY . .

# Expose the port
EXPOSE 8081

# Start the Expo tunnel
CMD ["npx", "expo", "start", "--tunnel", "--port", "8081", "--non-interactive"]