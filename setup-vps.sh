#!/bin/bash
# VPS Setup Script for Expo Tunnel

echo "🚀 Setting up Expo tunnel on VPS..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2 @expo/cli@latest

# Clone your project
git clone https://github.com/themouth-agency/Dysco.git
cd Dysco/apps/mobile

# Install dependencies
npm install

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'dysco-tunnel',
    script: 'npx',
    args: 'expo start --tunnel --port 8081',
    cwd: '~/Dysco/apps/mobile',
    env: {
      CI: '1'
    },
    log_file: '~/dysco-tunnel.log',
    error_file: '~/dysco-tunnel-error.log',
    out_file: '~/dysco-tunnel-out.log',
    time: true
  }]
}
EOF

# Start the tunnel
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Expo tunnel started!"
echo "📜 Check logs with: pm2 logs dysco-tunnel"
echo "🔗 Tunnel URL will appear in logs"