module.exports = {
  apps: [
    {
      name: 'gymleb-api',
      script: 'dist/src/main.js', // Run the built NestJS project (not src/index.js!)
      instances: 1, // Default to 1; we temporarily scale during deploy
      exec_mode: 'cluster', // Keep cluster mode to support reloads when scaled
      autorestart: true,
      watch: false, // In production, no need to watch file changes
      wait_ready: true, // PM2 waits for "ready" signal from app before swapping
      listen_timeout: 15000, // Time to wait for ready
      kill_timeout: 15000, // Graceful shutdown window on reload
      shutdown_with_message: true, // Send "shutdown" message for graceful close
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
