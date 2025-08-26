#!/bin/bash

echo "Installing cron job dependencies..."

# Install @nestjs/schedule for cron functionality
npm install @nestjs/schedule

echo "Dependencies installed successfully!"
echo "The cron job system is now ready to use."
echo ""
echo "The cron job will run automatically every day at 10:00 AM (Lebanon timezone)."
echo ""
echo "Available API endpoints:"
echo "- POST /cron/trigger-expired-members-notification (manual trigger)"
echo "- GET /cron/expired-members-stats (get statistics)"
echo "- POST /cron/reset-notification-flags (reset flags for testing)"
