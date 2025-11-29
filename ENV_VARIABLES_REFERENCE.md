# Environment Variables Reference

## Push Notifications Configuration

### Firebase Cloud Messaging (FCM) - Optional

Required only if you want to send notifications directly via FCM (not using Expo Push Service).

```env
# Path to FCM private key JSON file (downloaded from Firebase Console)
FCM_SERVER_KEY_PATH=./config/fcm-key.json

# Your Firebase project ID/name
FCM_PROJECT_NAME=your-firebase-project-id
```

**How to get these:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings > Service Accounts
3. Generate New Private Key → Download JSON file
4. Save to `config/fcm-key.json` (add to `.gitignore`)

### Apple Push Notification Service (APNs) - Optional

Required only if you want to send notifications directly via APNs (not using Expo Push Service).

```env
# Path to APNs .p8 key file (downloaded from Apple Developer Portal)
APNS_KEY_PATH=./config/apns-key.p8

# APNs Key ID (shown when you create the key)
APNS_KEY_ID=ABC123XYZ

# Your Apple Team ID (from Apple Developer Portal > Membership)
APNS_TEAM_ID=DEF456UVW

# iOS Bundle Identifier (from app.json)
APNS_BUNDLE_ID=com.yourcompany.yourapp

# Use 'true' for production, 'false' for sandbox/development
APNS_IS_PRODUCTION=false
```

**How to get these:**

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Certificates, Identifiers & Profiles > Keys
3. Create new key with APNs enabled
4. Download `.p8` file (only downloadable once!)
5. Note the Key ID from the page
6. Get Team ID from Membership page

## Quick Setup Checklist

### For Development (Using Expo Push Service)

- ✅ No additional setup needed
- ✅ Works with Expo Go
- ✅ Tokens automatically registered

### For Production (Using Native FCM/APNs)

#### Android (FCM)

- [ ] Create Firebase project
- [ ] Download `google-services.json` → place in mobile app root
- [ ] Generate FCM server key → save to `config/fcm-key.json`
- [ ] Add `FCM_SERVER_KEY_PATH` and `FCM_PROJECT_NAME` to `.env`

#### iOS (APNs)

- [ ] Create APNs key in Apple Developer Portal
- [ ] Download `.p8` file → save to `config/apns-key.p8`
- [ ] Note Key ID and Team ID
- [ ] Add all APNs variables to `.env`

## Security Notes

⚠️ **IMPORTANT:**

- Never commit credential files to version control
- Add to `.gitignore`:
  ```
  config/*.json
  config/*.p8
  google-services.json
  ```
- Use environment variables for all paths and IDs
- Store credentials securely (use secrets manager in production)

## File Structure

```
gymleb-api/
├── config/
│   ├── fcm-key.json      # FCM private key (DO NOT COMMIT)
│   └── apns-key.p8       # APNs key (DO NOT COMMIT)
├── .env                  # Environment variables
└── .gitignore           # Should exclude credential files

gymleb-mobile/
├── google-services.json  # Firebase config (DO NOT COMMIT)
└── app.json             # Expo configuration
```

## Testing

After setting up credentials:

1. **Verify token registration:**

   ```sql
   SELECT id, name, fcmToken, devicePlatform, tokenType
   FROM members
   WHERE fcmToken IS NOT NULL;
   ```

2. **Test notification sending:**
   - Use Firebase Console for FCM testing
   - Use a tool like Pusher for APNs testing
   - Or implement test endpoints in your backend

## References

- Full setup guide: See `PUSH_NOTIFICATIONS_SETUP.md`
- Expo docs: https://docs.expo.dev/push-notifications/sending-notifications-custom/
- Firebase docs: https://firebase.google.com/docs/cloud-messaging
- Apple docs: https://developer.apple.com/documentation/usernotifications
