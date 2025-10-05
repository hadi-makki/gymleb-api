#!/bin/bash

# Advanced deployment script for gymleb-api
# This script includes backup, rollback capabilities, and better error handling

set -e  # Exit on any error

# Configuration
APP_NAME="gymleb-api"
BACKUP_DIR="./backups"
BACKUP_FILE="${BACKUP_DIR}/last_working_backup.tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create backup
create_backup() {
    print_status "Creating backup of current working version..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Create backup of current dist folder (overwrites previous backup)
    if [ -d "dist" ]; then
        tar -czf "$BACKUP_FILE" dist/
        print_success "Backup created: $BACKUP_FILE"
    else
        print_warning "No dist folder found to backup"
    fi
}

# Function to rollback
rollback() {
    print_error "Deployment failed! Attempting rollback..."
    
    if [ -f "$BACKUP_FILE" ]; then
        print_status "Rolling back to last working version: $BACKUP_FILE"
        
        # Remove current dist folder
        rm -rf dist/
        
        # Extract backup
        tar -xzf "$BACKUP_FILE"
        
        # Restart PM2
        pm2 restart "$APP_NAME"
        
        print_success "Rollback completed successfully!"
    else
        print_error "No backup found for rollback!"
        exit 1
    fi
}

# Function to check if PM2 process exists
check_pm2_process() {
    if ! pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        print_warning "PM2 process '$APP_NAME' not found. Starting it..."
        pm2 start ecosystem.config.js
    fi
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed!"
        exit 1
    fi
    
    # Check if yarn is available
    if ! command -v yarn &> /dev/null; then
        print_error "Yarn is not installed!"
        exit 1
    fi
    
    # Check if pm2 is available
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 is not installed!"
        exit 1
    fi
    
    print_success "All requirements met!"
}

# Main deployment function
deploy() {
    print_status "🚀 Starting deployment for $APP_NAME..."
    
    # Check requirements
    check_requirements
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        print_error "Not in a git repository!"
        exit 1
    fi
    
    # Create backup before deployment
    create_backup
    
    # Pull latest changes from git
    print_status "📥 Pulling latest changes from git..."
    git pull
    
    # Install dependencies
    print_status "📦 Installing dependencies..."
    yarn install
    
    # Build the project
    print_status "🔨 Building the project..."
    yarn build
    
    # Check if build was successful
    if [ ! -d "dist" ]; then
        print_error "Build failed! No dist folder created."
        rollback
        exit 1
    fi
    
    # Check PM2 process
    check_pm2_process
    
    # Restart PM2 process
    print_status "🔄 Restarting PM2 process..."
    pm2 restart "$APP_NAME"
    
    # Wait a moment for the process to start
    sleep 2
    
    # Check if PM2 process is running
    if pm2 describe "$APP_NAME" | grep -q "online"; then
        print_success "✅ Deployment completed successfully!"
        print_status "📊 PM2 status:"
        pm2 status "$APP_NAME"
        
        # Update backup with the new working version
        print_status "💾 Updating backup with new working version..."
        create_backup
    else
        print_error "PM2 process failed to start!"
        rollback
        exit 1
    fi
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "status")
        pm2 status "$APP_NAME"
        ;;
    "logs")
        pm2 logs "$APP_NAME" --lines 50
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|status|logs}"
        echo "  deploy   - Deploy the application (default)"
        echo "  rollback - Rollback to previous version"
        echo "  status   - Show PM2 status"
        echo "  logs     - Show recent logs"
        exit 1
        ;;
esac
