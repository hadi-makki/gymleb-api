# Firebase Cloud Messaging (FCM) Service

This module provides Firebase Cloud Messaging integration for sending push notifications to Android and iOS devices.

## Features

- ✅ Send push notifications via FCM v1 API
- ✅ Support for both native FCM tokens and Expo push tokens
- ✅ Automatic OAuth 2.0 token management with caching
- ✅ Bulk notification support
- ✅ Android and iOS notification configuration
- ✅ Type-safe DTOs with validation
- ✅ Swagger API documentation

## Setup

### 1. Install Dependencies

The required `google-auth-library` package is already installed.

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# FCM Configuration
FCM_SERVER_KEY_PATH=./config/fcm-key.json
FCM_PROJECT_NAME=your-firebase-project-id

# Optional: Expo project slug (for Expo tokens)
EXPO_PROJECT_SLUG=@yourusername/yourproject
```

### 3. Get FCM Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Save it to `config/fcm-key.json` (create the `config` directory if needed)
7. **Important**: Add `config/fcm-key.json` to `.gitignore`

### 4. Get Firebase Project ID

Your Firebase Project ID can be found in:

- Firebase Console > Project Settings > General
- Or in the URL: `https://console.firebase.google.com/project/YOUR_PROJECT_ID`

## Usage

### Inject the Service

```typescript
import { FirebaseService } from './firebase/firebase.service';

@Injectable()
export class YourService {
  constructor(private readonly firebaseService: FirebaseService) {}

  async sendNotification() {
    const result = await this.firebaseService.sendNotification({
      token: 'device-token-here',
      title: 'Hello',
      body: 'This is a test notification',
      data: { screen: 'home' },
    });
  }
}
```

### Send Single Notification

```typescript
const result = await firebaseService.sendNotification({
  token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  title: 'New Message',
  body: 'You have a new message',
  data: {
    screen: 'chat',
    userId: '123',
  },
  sound: 'default',
  priority: 'high',
  channelId: 'default',
});

if (result.success) {
  console.log('Notification sent:', result.messageId);
} else {
  console.error('Error:', result.error);
}
```

### Send Bulk Notifications

```typescript
const results = await firebaseService.sendBulkNotifications({
  tokens: ['token1', 'token2', 'token3'],
  title: 'Bulk Notification',
  body: 'This is sent to multiple devices',
  data: { type: 'bulk' },
});

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Notification ${index} sent:`, result.messageId);
  } else {
    console.error(`Notification ${index} failed:`, result.error);
  }
});
```

### Send to Member

```typescript
// Get member's token from database
const member = await memberRepository.findOne({ where: { id: memberId } });

if (member?.fcmToken) {
  await firebaseService.sendNotificationToMember(
    member.fcmToken,
    'Subscription Expiring',
    'Your subscription expires in 3 days',
    { type: 'subscription_reminder' },
  );
}
```

## API Endpoints

### POST `/firebase/send-notification`

Send a push notification to a single device.

**Authentication**: Required (AuthGuard)

**Request Body**:

```json
{
  "token": "device-token",
  "title": "Notification Title",
  "body": "Notification body",
  "data": { "key": "value" },
  "sound": "default",
  "priority": "high",
  "channelId": "default"
}
```

### POST `/firebase/send-bulk-notifications`

Send notifications to multiple devices.

**Authentication**: Required (ManagerAuthGuard with permissions)

**Request Body**:

```json
{
  "tokens": ["token1", "token2"],
  "title": "Bulk Notification",
  "body": "Notification body",
  "data": { "key": "value" }
}
```

### POST `/firebase/test`

Test FCM configuration.

**Authentication**: Required (ManagerAuthGuard)

**Response**:

```json
{
  "configured": true,
  "message": "FCM is properly configured"
}
```

## Token Types

The service supports two types of tokens:

1. **Native FCM Tokens**: Direct FCM device tokens
   - Format: Long alphanumeric string
   - Example: `cXyZ123...`

2. **Expo Push Tokens**: Expo push notification service tokens
   - Format: `ExponentPushToken[...]`
   - Example: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`
   - Automatically detected and handled

## Error Handling

The service returns a result object with:

- `success`: Boolean indicating if the notification was sent
- `messageId`: FCM message ID (if successful)
- `error`: Error message (if failed)

```typescript
const result = await firebaseService.sendNotification(dto);

if (!result.success) {
  // Handle error
  console.error(result.error);
}
```

## Configuration Check

Before sending notifications, check if FCM is configured:

```typescript
if (firebaseService.isConfigured()) {
  // FCM is ready to use
} else {
  // FCM credentials not configured
}
```

## Security Notes

⚠️ **Important**:

- Never commit `fcm-key.json` to version control
- Store credentials in environment variables
- Use secrets management in production
- The service automatically caches access tokens (valid for 1 hour)

## Troubleshooting

### "FCM is not configured" Error

- Verify `FCM_SERVER_KEY_PATH` and `FCM_PROJECT_NAME` are set in `.env`
- Check that the key file exists at the specified path
- Ensure the key file is valid JSON

### "Failed to obtain FCM access token" Error

- Verify the FCM key file has correct permissions
- Check that `client_email` and `private_key` are present in the key file
- Ensure the service account has FCM permissions

### Notifications Not Received

- Verify the device token is correct and not expired
- Check notification permissions on the device
- For Expo tokens, ensure `EXPO_PROJECT_SLUG` is configured
- Check FCM project settings and app configuration

## Integration with Member Service

To send notifications to members, you can integrate with the MemberService:

```typescript
// In your service
constructor(
  private readonly firebaseService: FirebaseService,
  @InjectRepository(MemberEntity)
  private readonly memberRepository: Repository<MemberEntity>,
) {}

async notifyMember(memberId: string, title: string, body: string) {
  const member = await this.memberRepository.findOne({
    where: { id: memberId },
  });

  if (!member?.fcmToken) {
    throw new NotFoundException('Member token not found');
  }

  return this.firebaseService.sendNotificationToMember(
    member.fcmToken,
    title,
    body,
  );
}
```

## References

- [FCM v1 API Documentation](https://firebase.google.com/docs/cloud-messaging/migrate-v1)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs)
