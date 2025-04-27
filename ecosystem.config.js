module.exports = {
  apps: [
    {
      name: 'gym-leb',
      script: 'yarn',
      args: 'start:prod', // Start the app in production mode
      cwd: './saleasy-api', // Ensure this is the correct path to your NestJS app
      watch: false, // It's common not to watch files in production
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
