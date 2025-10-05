# Makefile for Gymleb API Deployment
# Usage: make deploy, make deploy-advanced, make rollback, etc.

.PHONY: help deploy deploy-advanced rollback status logs clean-backup install-deps build

# Default target
help:
	@echo "Available commands:"
	@echo "  make deploy          - Simple deployment (git pull, yarn install, build, pm2 restart)"
	@echo "  make deploy-advanced - Advanced deployment with backup and rollback"
	@echo "  make rollback        - Rollback to previous working version"
	@echo "  make status          - Show PM2 process status"
	@echo "  make logs            - Show recent application logs"
	@echo "  make build           - Build the project only"
	@echo "  make install-deps    - Install dependencies only"
	@echo "  make clean-backup    - Remove backup files"
	@echo "  make help            - Show this help message"

# Simple deployment
deploy:
	@echo "🚀 Starting simple deployment for gymleb-api..."
	@echo "📥 Pulling latest changes from git..."
	git pull
	@echo "📦 Installing dependencies..."
	yarn install
	@echo "🔨 Building the project..."
	yarn build
	@echo "🔄 Restarting PM2 process..."
	pm2 restart gymleb-api
	@echo "✅ Deployment completed successfully!"
	@echo "📊 PM2 status:"
	pm2 status gymleb-api

# Advanced deployment with backup and rollback
deploy-advanced:
	@echo "🚀 Starting advanced deployment for gymleb-api..."
	@echo "📥 Pulling latest changes from git..."
	git pull
	@echo "📦 Installing dependencies..."
	yarn install
	@echo "💾 Creating backup of current working version..."
	@mkdir -p ./backups
	@if [ -d "dist" ]; then \
		tar -czf ./backups/last_working_backup.tar.gz dist/; \
		echo "✅ Backup created: ./backups/last_working_backup.tar.gz"; \
	else \
		echo "⚠️  No dist folder found to backup"; \
	fi
	@echo "🔨 Building the project..."
	yarn build
	@echo "🔄 Restarting PM2 process..."
	pm2 restart gymleb-api
	@echo "⏱️  Waiting for process to start..."
	@sleep 2
	@if pm2 describe gymleb-api | grep -q "online"; then \
		echo "✅ Deployment completed successfully!"; \
		echo "📊 PM2 status:"; \
		pm2 status gymleb-api; \
		echo "💾 Updating backup with new working version..."; \
		tar -czf ./backups/last_working_backup.tar.gz dist/; \
		echo "✅ Backup updated successfully!"; \
	else \
		echo "❌ PM2 process failed to start! Attempting rollback..."; \
		$(MAKE) rollback; \
		exit 1; \
	fi

# Rollback to previous working version
rollback:
	@echo "🔄 Rolling back to previous working version..."
	@if [ -f "./backups/last_working_backup.tar.gz" ]; then \
		echo "📦 Restoring from backup..."; \
		rm -rf dist/; \
		tar -xzf ./backups/last_working_backup.tar.gz; \
		pm2 restart gymleb-api; \
		echo "✅ Rollback completed successfully!"; \
	else \
		echo "❌ No backup found for rollback!"; \
		exit 1; \
	fi

# Show PM2 status
status:
	@echo "📊 PM2 Status:"
	pm2 status gymleb-api

# Show recent logs
logs:
	@echo "📋 Recent logs:"
	pm2 logs gymleb-api --lines 50

# Build the project only
build:
	@echo "🔨 Building the project..."
	yarn build
	@echo "✅ Build completed!"

# Install dependencies only
install-deps:
	@echo "📦 Installing dependencies..."
	yarn install
	@echo "✅ Dependencies installed!"

# Clean backup files
clean-backup:
	@echo "🧹 Cleaning backup files..."
	@if [ -f "./backups/last_working_backup.tar.gz" ]; then \
		rm ./backups/last_working_backup.tar.gz; \
		echo "✅ Backup file removed!"; \
	else \
		echo "ℹ️  No backup file found to remove"; \
	fi

# Development commands
dev:
	@echo "🚀 Starting development server..."
	yarn start:dev

# Production start
start:
	@echo "🚀 Starting production server..."
	yarn start:prod

# Stop PM2 process
stop:
	@echo "🛑 Stopping PM2 process..."
	pm2 stop gymleb-api

# Delete PM2 process
delete:
	@echo "🗑️  Deleting PM2 process..."
	pm2 delete gymleb-api

# Start PM2 process
start-pm2:
	@echo "🚀 Starting PM2 process..."
	pm2 start ecosystem.config.js

# Monitor PM2 processes
monitor:
	@echo "📊 Opening PM2 monitor..."
	pm2 monit
