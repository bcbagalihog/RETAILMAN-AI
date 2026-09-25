module.exports = {
  apps: [
    {
      name: 'retailman-ai',
      script: 'server.js',
      cwd: '/home/bab/Documents/RETAILMAN AI',
      autorestart: true,
      env: {
        PORT: 3850,
        NODE_ENV: 'production'
      }
    }
  ]
};
