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
    echo 'echo "⏳ Waiting for tunnel to establish..."' >> /start.sh && \
    echo 'for i in $(seq 1 12); do' >> /start.sh && \
    echo '  sleep 10' >> /start.sh && \
    echo '  echo "📡 Attempt $i: Checking for tunnel URL..."' >> /start.sh && \
    echo '  TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o "https://[^\"]*exp.direct" | head -1)' >> /start.sh && \
    echo '  if [ -n "$TUNNEL_URL" ]; then' >> /start.sh && \
    echo '    echo "🎉 EXPO GO TUNNEL URL: $TUNNEL_URL"' >> /start.sh && \
    echo '    echo "🎯 For Expo Go: exp://${TUNNEL_URL#https://}"' >> /start.sh && \
    echo '    echo "📱 Copy this URL to Expo Go app!"' >> /start.sh && \
    echo '    break' >> /start.sh && \
    echo '  fi' >> /start.sh && \
    echo 'done' >> /start.sh && \
    echo 'if [ -z "$TUNNEL_URL" ]; then' >> /start.sh && \
    echo '  echo "❌ Tunnel URL not found after 2 minutes"' >> /start.sh && \
    echo '  echo "📋 Checking ngrok status..."' >> /start.sh && \
    echo '  curl -s http://localhost:4040/api/tunnels 2>/dev/null || echo "Ngrok API not responding"' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    echo 'echo "📜 Expo logs:"' >> /start.sh && \
    echo 'tail -f /tmp/expo.log' >> /start.sh && \
    chmod +x /start.sh

# Start the script
CMD ["/start.sh"]