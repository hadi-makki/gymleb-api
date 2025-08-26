# Cron Job System for Expired Members Notification

This module implements a memory-efficient cron job system that automatically notifies expired members daily at 10 AM (Lebanon timezone).

## Features

- **Memory Efficient**: Uses MongoDB cursors and streaming to process large datasets without loading everything into memory
- **Batch Processing**: Processes members in small batches (25 members per batch) to prevent memory overflow
- **Error Handling**: Continues processing even if individual members fail
- **Logging**: Comprehensive logging for monitoring and debugging
- **Manual Triggers**: API endpoints for manual execution and testing

## Cron Schedule

- **Schedule**: Every day at 10:00 AM (Asia/Beirut timezone)
- **Job Name**: `notify-expired-members`

## Memory Optimization Strategies

1. **Cursor-based Streaming**: Uses MongoDB cursors instead of loading all members at once
2. **Small Batch Sizes**: Processes only 25 members per batch
3. **Immediate Processing**: Processes batches immediately instead of collecting all batches first
4. **Memory Cleanup**: Clears batch arrays after processing
5. **Delays Between Batches**: 200ms delay between batches to prevent system overload

## API Endpoints

### Manual Trigger

```http
POST /cron/trigger-expired-members-notification
```

Manually triggers the expired members notification process.

### Get Statistics

```http
GET /cron/expired-members-stats
```

Returns statistics about members and notifications.

### Reset Notification Flags

```http
POST /cron/reset-notification-flags
```

Resets all notification flags (useful for testing).

## How It Works

1. **Gym Processing**: Iterates through all gyms one by one
2. **Member Streaming**: Uses MongoDB cursor to stream through members for each gym
3. **Expiration Check**: For each member, checks if their subscription has expired
4. **Notification**: Sends WhatsApp notification via Twilio if member is expired
5. **Flag Update**: Updates the `isNotified` flag to prevent duplicate notifications

## Configuration

The cron job is configured with:

- **Timezone**: Asia/Beirut (Lebanon)
- **Batch Size**: 25 members per batch
- **Delay Between Batches**: 200ms
- **Error Handling**: Continues on individual member failures

## Monitoring

The system provides comprehensive logging:

- Start/completion of cron job
- Processing progress for each gym
- Individual member processing errors
- Statistics and counts

## Dependencies

- `@nestjs/schedule`: For cron job functionality
- `mongoose`: For database operations
- `twilio`: For WhatsApp notifications
- `date-fns`: For date manipulation

## Installation

Make sure the following dependencies are installed:

```bash
npm install @nestjs/schedule
```

The cron module is automatically imported in the main `AppModule`.
