#!/bin/bash
# Auto-update script for server deployment

echo "🔄 Updating Dysco on server..."

# SSH to server and run update commands
ssh dysco-server << 'EOF'
cd ~/Dysco

# Pull latest changes
git pull origin main

# Update dependencies (only if package.json changed)
if git diff --name-only HEAD@{1} HEAD | grep -q "package.json"; then
    echo "📦 Updating dependencies..."
    cd apps/mobile
    npm install
    cd ~/Dysco
fi

# Restart the Expo tunnel (if PM2 is set up)
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting Expo tunnel..."
    pm2 restart dysco-tunnel 2>/dev/null || echo "⚠️  PM2 process not found - will need to start manually"
fi

echo "✅ Server update complete!"
EOF

echo "✅ Remote update finished!"