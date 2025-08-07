#!/bin/bash
# Digital Ocean Expo Tunnel Setup Script

echo "🚀 Setting up Digital Ocean droplet for Expo tunnel hosting..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install global packages
echo "📦 Installing Expo CLI and PM2..."
sudo npm install -g @expo/cli@latest pm2

# Clone your project
echo "📥 Cloning Dysco project..."
git clone https://github.com/themouth-agency/Dysco.git
cd Dysco/apps/mobile

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Create tunnel startup script
echo "🔧 Creating tunnel startup script..."
cat > ~/start-expo-tunnel.sh << 'EOF'
#!/bin/bash
cd ~/Dysco/apps/mobile
echo "🚀 Starting Expo tunnel on Digital Ocean..."
npx expo start --tunnel --port 8081
EOF

chmod +x ~/start-expo-tunnel.sh

# Setup PM2 to run it
echo "🔄 Setting up PM2 for persistent tunnel..."
pm2 start ~/start-expo-tunnel.sh --name "dysco-tunnel"
pm2 save
pm2 startup

echo "✅ Setup complete!"
echo ""
echo "🎯 To see tunnel URL:"
echo "   pm2 logs dysco-tunnel"
echo ""
echo "🔄 To restart tunnel:"
echo "   pm2 restart dysco-tunnel"
echo ""
echo "📱 Look for: exp://[random]-8081.exp.direct in the logs!"