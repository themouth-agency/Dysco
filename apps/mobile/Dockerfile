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

# Create a startup script that shows actual tunnel URL
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "🚀 Starting Expo tunnel..."' >> /start.sh && \
    echo 'export CI=1' >> /start.sh && \
    echo 'echo "📋 Full Expo output will show below - look for tunnel URL!"' >> /start.sh && \
    echo 'npx expo start --tunnel --port 8081' >> /start.sh && \
    chmod +x /start.sh

# Start the script
CMD ["/start.sh"]