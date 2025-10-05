module.exports = {
  apps: [
    {
      name: 'gymleb-api',
      script: 'dist/src/main.js', // Run the built NestJS project (not src/index.js!)
      instances: 1, // Default to 1; we temporarily scale during deploy
      exec_mode: 'cluster', // Keep cluster mode to support reloads when scaled
      autorestart: true,
      watch: false, // In production, no need to watch file changes
      listen_timeout: 8000, // Allow time for app to bind ports before killing old worker
      kill_timeout: 8000, // Graceful shutdown window on reload
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
