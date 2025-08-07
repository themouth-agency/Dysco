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
    echo 'export CI=1' >> /start.sh && \
    echo 'npx expo start --tunnel --port 8081 > /tmp/expo.log 2>&1 &' >> /start.sh && \
    echo 'EXPO_PID=$!' >> /start.sh && \
    echo 'echo "⏳ Waiting for tunnel to establish..."' >> /start.sh && \
    echo 'for i in $(seq 1 30); do' >> /start.sh && \
    echo '  sleep 5' >> /start.sh && \
    echo '  echo "📡 Attempt $i: Checking expo logs for tunnel URL..."' >> /start.sh && \
    echo '  TUNNEL_URL=$(grep -o "exp://[^[:space:]]*" /tmp/expo.log 2>/dev/null | tail -1)' >> /start.sh && \
    echo '  if [ -n "$TUNNEL_URL" ]; then' >> /start.sh && \
    echo '    echo "🎉 EXPO GO TUNNEL URL FOUND: $TUNNEL_URL"' >> /start.sh && \
    echo '    echo "📱 Copy this URL to Expo Go app!"' >> /start.sh && \
    echo '    echo "🔗 Direct link: $TUNNEL_URL"' >> /start.sh && \
    echo '    break' >> /start.sh && \
    echo '  fi' >> /start.sh && \
    echo '  # Also check for https tunnel URLs' >> /start.sh && \
    echo '  HTTPS_URL=$(grep -o "https://[^[:space:]]*exp.direct" /tmp/expo.log 2>/dev/null | tail -1)' >> /start.sh && \
    echo '  if [ -n "$HTTPS_URL" ]; then' >> /start.sh && \
    echo '    EXP_URL="exp://${HTTPS_URL#https://}"' >> /start.sh && \
    echo '    echo "🎉 EXPO GO TUNNEL URL: $EXP_URL"' >> /start.sh && \
    echo '    echo "📱 Copy this URL to Expo Go app!"' >> /start.sh && \
    echo '    echo "🔗 Direct link: $EXP_URL"' >> /start.sh && \
    echo '    break' >> /start.sh && \
    echo '  fi' >> /start.sh && \
    echo 'done' >> /start.sh && \
    echo 'if [ -z "$TUNNEL_URL" ] && [ -z "$HTTPS_URL" ]; then' >> /start.sh && \
    echo '  echo "❌ Tunnel URL not found after 2.5 minutes"' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    echo 'echo "📜 Recent Expo logs:"' >> /start.sh && \
    echo 'tail -20 /tmp/expo.log' >> /start.sh && \
    echo 'echo "📜 Following live logs..."' >> /start.sh && \
    echo 'tail -f /tmp/expo.log' >> /start.sh && \
    chmod +x /start.sh

# Start the script
CMD ["/start.sh"]