# Deployment Guide for Gymleb API

This guide explains how to deploy the Gymleb API using the provided deployment scripts.

## Prerequisites

Before running the deployment scripts, ensure you have the following installed:

- **Git** - for pulling latest changes
- **Yarn** - for package management
- **PM2** - for process management
- **Node.js** - for running the application

## Deployment Scripts

### 1. Simple Deployment Script (`deploy.sh`)

The basic deployment script that performs the essential deployment steps:

```bash
./deploy.sh
```

**What it does:**

- Pulls latest changes from git
- Installs dependencies with `yarn install`
- Builds the project with `yarn build`
- Restarts the PM2 process named `gymleb-api`

### 2. Advanced Deployment Script (`deploy-advanced.sh`)

A more robust deployment script with additional features:

```bash
./deploy-advanced.sh [command]
```

**Available commands:**

- `deploy` (default) - Full deployment with backup and error handling
- `rollback` - Rollback to previous version
- `status` - Show PM2 process status
- `logs` - Show recent application logs

**Features:**

- ✅ Automatic backup before deployment
- ✅ Error handling and rollback capability
- ✅ System requirements checking
- ✅ Colored output for better readability
- ✅ PM2 process validation
- ✅ Automatic cleanup of old backups

## Using Package.json Scripts

You can also use the npm/yarn scripts defined in `package.json`:

```bash
# Simple deployment
yarn deploy

# Advanced deployment
yarn deploy:advanced

# Rollback to previous version
yarn deploy:rollback

# Check PM2 status
yarn deploy:status

# View recent logs
yarn deploy:logs
```

## PM2 Configuration

The application uses PM2 for process management with the following configuration (`ecosystem.config.js`):

```javascript
{
  name: 'gymleb-api',
  script: 'dist/main.js',
  instances: 1,
  autorestart: true,
  watch: false,
  env: {
    NODE_ENV: 'production'
  }
}
```

## Deployment Process

### Standard Deployment Flow

1. **Git Pull** - Pulls latest changes from the repository
2. **Dependencies** - Installs/updates npm packages
3. **Build** - Compiles TypeScript to JavaScript
4. **PM2 Restart** - Restarts the application process

### Advanced Deployment Flow

1. **Requirements Check** - Validates system requirements
2. **Backup Creation** - Creates backup of current build
3. **Git Pull** - Pulls latest changes
4. **Dependencies** - Installs packages
5. **Build** - Compiles the application
6. **Validation** - Checks if build was successful
7. **PM2 Restart** - Restarts the process
8. **Health Check** - Verifies the process is running
9. **Backup Update** - Updates backup with new working version

## Backup System

The advanced deployment script uses a storage-efficient backup system:

- **File**: `./backups/last_working_backup.tar.gz`
- **Retention**: Only keeps the last working version (overwrites previous backup)
- **Content**: Complete `dist/` folder
- **Storage**: Minimal - only one backup file at any time

## Troubleshooting

### Common Issues

1. **Permission Denied**

   ```bash
   chmod +x deploy.sh deploy-advanced.sh
   ```

2. **PM2 Process Not Found**

   - The script will automatically start the process if it doesn't exist
   - Make sure `ecosystem.config.js` is properly configured

3. **Build Failures**

   - Check for TypeScript compilation errors
   - Ensure all dependencies are installed
   - Verify environment variables are set

4. **Rollback Issues**
   - Ensure backup directory exists and contains valid backups
   - Check file permissions on backup files

### Manual PM2 Commands

If you need to manage PM2 manually:

```bash
# Start the application
pm2 start ecosystem.config.js

# Restart the application
pm2 restart gymleb-api

# Stop the application
pm2 stop gymleb-api

# Delete the application
pm2 delete gymleb-api

# View logs
pm2 logs gymleb-api

# Monitor processes
pm2 monit
```

## Environment Variables

Make sure your environment variables are properly configured in your `.env` file or system environment before deployment.

## Best Practices

1. **Always test locally** before deploying to production
2. **Use the advanced script** for production deployments
3. **Monitor logs** after deployment to ensure everything is working
4. **Keep backups** of important configurations
5. **Use version control** for all configuration changes

## Support

If you encounter issues during deployment:

1. Check the PM2 logs: `yarn deploy:logs`
2. Verify PM2 status: `yarn deploy:status`
3. Try rolling back: `yarn deploy:rollback`
4. Check system requirements and permissions
