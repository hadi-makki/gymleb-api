module.exports = {
  apps: [
    {
      name: 'saleasy-api',
      script: './dist/main.js',
      cwd: '/home/ubuntu/saleasy-api',
      watch: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
