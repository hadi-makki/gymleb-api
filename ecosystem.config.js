module.exports = {
  apps: [
    {
      name: 'gymleb-api',
      script: 'dist/main.js', // Run the built NestJS project (not src/index.js!)
      instances: 1, // Or use "max" for cluster mode
      autorestart: true,
      watch: false, // In production, no need to watch file changes
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
