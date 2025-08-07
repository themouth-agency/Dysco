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

# Create a startup script to capture tunnel URL
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "🚀 Starting Expo tunnel..."' >> /start.sh && \
    echo 'npx expo start --tunnel --port 8081 --non-interactive > /tmp/expo.log 2>&1 &' >> /start.sh && \
    echo 'sleep 15' >> /start.sh && \
    echo 'echo "📱 Checking for tunnel URL..."' >> /start.sh && \
    echo 'TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o "https://[^\"]*exp.direct" | head -1)' >> /start.sh && \
    echo 'if [ -n "$TUNNEL_URL" ]; then' >> /start.sh && \
    echo '  echo "🎉 EXPO GO TUNNEL URL: $TUNNEL_URL"' >> /start.sh && \
    echo '  echo "🎯 For Expo Go: exp://${TUNNEL_URL#https://}"' >> /start.sh && \
    echo 'else' >> /start.sh && \
    echo '  echo "❌ No tunnel URL found"' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    echo 'tail -f /tmp/expo.log' >> /start.sh && \
    chmod +x /start.sh

# Start the script
CMD ["/start.sh"]