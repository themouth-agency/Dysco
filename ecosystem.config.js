module.exports = {
    apps: [{
      name: 'expo-tunnel',
      script: 'npx',
      args : 'expo start --tunnel --non-interactive --clear',
      interpreter: 'bash',
      env: {
        CI: '1',
        NGROK_AUTHTOKEN: '30xw4Ex2sKjTy0Uin58xUhhUb6V_6TTwzct4A43U8TUfR17Bq',
        EXPO_TUNNEL_SUBDOMAIN: 'dysco'
      }
    }]
  }
  