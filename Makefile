# Makefile for Gymleb API Deployment
# Usage: make deploy, make deploy-advanced, make rollback, etc.

.PHONY: help deploy deploy-advanced rollback status logs clean-backup install-deps build dev start stop delete start-pm2 monitor

# ===============================
# Help
# ===============================
help:
	@echo "\n================ Gymleb API - Make Commands ================\n"
	@echo "Targets:"
	@echo "  • make deploy           - Simple deployment (pull, install, build, zero-downtime reload)"
	@echo "  • make deploy-advanced  - Deployment with backup + rollback"
	@echo "  • make rollback         - Rollback to previous working build"
	@echo "  • make status           - Show PM2 process status"
	@echo "  • make logs             - Show recent application logs"
	@echo "  • make build            - Build the project only"
	@echo "  • make install-deps     - Install dependencies only"
	@echo "  • make clean-backup     - Remove backup files"
	@echo "  • make dev              - Start dev server"
	@echo "  • make start            - Start production server (Nest)"
	@echo "  • make stop             - Stop PM2 process"
	@echo "  • make delete           - Delete PM2 process"
	@echo "  • make start-pm2        - Start PM2 using ecosystem file"
	@echo "  • make monitor          - PM2 monitor"
	@echo "\n===========================================================\n"

# ===============================
# Simple deployment (zero-downtime)
# ===============================
deploy:
	@echo "\n🚀 Starting simple deployment for gymleb-api"
	@echo "-----------------------------------------------------------"
	@echo "📥 Pulling latest changes from git..." && git pull && echo ""
	@echo "📦 Installing dependencies..." && yarn install && echo ""
	@echo "🔨 Building the project..." && yarn build && echo ""
	@echo "🔄 Zero-downtime reload via PM2 (wait-ready)..."
	@if pm2 describe gymleb-api > /dev/null 2>&1; then \
		echo "  ↪️  Reloading with updated env (wait-ready)..."; \
		pm2 reload gymleb-api --update-env --wait-ready; \
	else \
		echo "  ➕ Starting new PM2 process from ecosystem file..."; \
		pm2 start ecosystem.config.js; \
	fi
	@echo ""
	@echo "✅ Deployment completed successfully!\n"
	@echo "📊 PM2 status:" && pm2 status gymleb-api && echo ""

# ===============================
# Advanced deployment (backup + rollback + zero-downtime)
# ===============================
deploy-advanced:
	@echo "\n🚀 Starting advanced deployment for gymleb-api"
	@echo "-----------------------------------------------------------"
	@echo "📥 Pulling latest changes from git..." && git pull && echo ""
	@echo "📦 Installing dependencies..." && yarn install && echo ""
	@echo "💾 Creating backup of current working version..."
	@mkdir -p ./backups
	@if [ -d "dist" ]; then \
		tar -czf ./backups/last_working_backup.tar.gz dist/ && \
		echo "  ✅ Backup created: ./backups/last_working_backup.tar.gz"; \
	else \
		echo "  ⚠️  No dist folder found to backup"; \
	fi
	@echo ""
	@echo "🔨 Building the project..." && yarn build && echo ""
	@echo "🔄 Zero-downtime reload via PM2 (wait-ready)..."
	@if pm2 describe gymleb-api > /dev/null 2>&1; then \
		echo "  ↪️  Reloading with updated env (wait-ready)..."; \
		pm2 reload gymleb-api --update-env --wait-ready; \
	else \
		echo "  ➕ Starting new PM2 process from ecosystem file..."; \
		pm2 start ecosystem.config.js; \
	fi
	@echo ""
	@echo "⏱️  Waiting for process to stabilize..." && sleep 2 && echo ""
	@if pm2 describe gymleb-api | grep -q "online"; then \
		echo "✅ Deployment completed successfully!"; \
		echo "\n📊 PM2 status:"; \
		pm2 status gymleb-api; \
		echo "\n💾 Updating backup with new working version..."; \
		tar -czf ./backups/last_working_backup.tar.gz dist/ && \
		echo "  ✅ Backup updated successfully!"; \
	else \
		echo "❌ PM2 failed to start! Attempting rollback..."; \
		$(MAKE) rollback; \
		exit 1; \
	fi
	@echo ""

# ===============================
# Rollback
# ===============================
rollback:
	@echo "\n🔄 Rolling back to previous working version"
	@echo "-----------------------------------------------------------"
	@if [ -f "./backups/last_working_backup.tar.gz" ]; then \
		echo "📦 Restoring from backup..."; \
		rm -rf dist/; \
		tar -xzf ./backups/last_working_backup.tar.gz; \
		echo "🔄 Reloading PM2 (or starting if missing)..."; \
		pm2 reload gymleb-api --update-env --wait-ready || pm2 start ecosystem.config.js; \
		echo "✅ Rollback completed successfully!"; \
	else \
		echo "❌ No backup found for rollback!"; \
		exit 1; \
	fi
	@echo ""

# ===============================
# Utilities
# ===============================
status:
	@echo "\n📊 PM2 Status" && echo "-----------------------------------------------------------"
	@pm2 status gymleb-api && echo ""

logs:
	@echo "\n📋 Recent logs" && echo "-----------------------------------------------------------"
	@pm2 logs gymleb-api --lines 50

build:
	@echo "\n🔨 Building the project" && echo "-----------------------------------------------------------"
	@yarn build && echo "✅ Build completed!\n"

install-deps:
	@echo "\n📦 Installing dependencies" && echo "-----------------------------------------------------------"
	@yarn install && echo "✅ Dependencies installed!\n"

clean-backup:
	@echo "\n🧹 Cleaning backup files" && echo "-----------------------------------------------------------"
	@if [ -f "./backups/last_working_backup.tar.gz" ]; then \
		rm ./backups/last_working_backup.tar.gz && \
		echo "✅ Backup file removed!"; \
	else \
		echo "ℹ️  No backup file found to remove"; \
	fi
	@echo ""

# ===============================
# Dev / PM2 helpers
# ===============================
dev:
	@echo "\n🚀 Starting development server" && echo "-----------------------------------------------------------"
	@yarn start:dev

start:
	@echo "\n🚀 Starting production server (Nest)" && echo "-----------------------------------------------------------"
	@yarn start:prod

stop:
	@echo "\n🛑 Stopping PM2 process" && echo "-----------------------------------------------------------"
	@pm2 stop gymleb-api

delete:
	@echo "\n🗑️  Deleting PM2 process" && echo "-----------------------------------------------------------"
	@pm2 delete gymleb-api

start-pm2:
	@echo "\n🚀 Starting PM2 process from ecosystem file" && echo "-----------------------------------------------------------"
	@pm2 start ecosystem.config.js

monitor:
	@echo "\n📊 Opening PM2 monitor" && echo "-----------------------------------------------------------"
	@pm2 monit