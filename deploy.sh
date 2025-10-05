#!/bin/bash

# Deployment script for gymleb-api
# This script pulls latest changes, installs dependencies, builds the project, and restarts PM2

set -e  # Exit on any error

echo "🚀 Starting deployment for gymleb-api..."

# Pull latest changes from git
echo "📥 Pulling latest changes from git..."
git pull

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Build the project
echo "🔨 Building the project..."
yarn build

# Restart PM2 process
echo "🔄 Restarting PM2 process..."
pm2 restart gymleb-api

echo "✅ Deployment completed successfully!"
echo "📊 PM2 status:"
pm2 status gymleb-api