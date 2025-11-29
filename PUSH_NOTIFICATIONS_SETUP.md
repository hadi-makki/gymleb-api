# Push Notifications Setup Guide

This guide explains how to set up Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNs) for sending push notifications to the mobile app.

## Overview

The mobile app supports two methods for push notifications:

1. **Expo Push Notification Service** (Recommended for development)
   - Easier to set up
   - Works with Expo Go during development
   - No additional credentials needed beyond Expo account

2. **Native FCM/APNs** (Recommended for production)
   - Direct integration with Firebase and Apple
   - More control and better for production
   - Requires additional credentials

## Option 1: Using Expo Push Notification Service

### Mobile App Setup

1. **Get Expo Project ID**
   - The app automatically uses the Expo project ID from `app.json` or environment variables
   - No additional setup needed

2. **Environment Variables (Optional)**
   ```env
   EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
   ```

### Backend Setup

No additional setup needed. The backend will receive Expo push tokens and can send notifications via Expo's API.

## Option 2: Using Native FCM and APNs

### Firebase Cloud Messaging (FCM) for Android

#### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Add an Android app to your project
4. Download the `google-services.json` file

#### Step 2: Configure Android App

1. Place `google-services.json` in your Expo project root
2. Add to `app.json`:
   ```json
   {
     "expo": {
       "android": {
         "googleServicesFile": "./google-services.json"
       }
     }
   }
   ```

#### Step 3: Get FCM Server Credentials

1. In Firebase Console, go to **Project Settings** > **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON key file (this is your FCM server key)
4. Save it securely (e.g., `config/fcm-key.json`)

#### Step 4: Configure Backend Environment Variables

Add to your `.env` file:

```env
# FCM Configuration
FCM_SERVER_KEY_PATH=./config/fcm-key.json
FCM_PROJECT_NAME=your-firebase-project-id
```

**Important Security Notes:**

- Never commit the FCM key file to version control
- Add `config/fcm-key.json` to `.gitignore`
- Store the key file path in environment variables, not hardcoded

### Apple Push Notification Service (APNs) for iOS

#### Step 1: Create APNs Key

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles** > **Keys**
3. Click **+** to create a new key
4. Enable **Apple Push Notifications service (APNs)**
5. Click **Continue** and **Register**
6. Download the `.p8` key file (you can only download it once!)
7. Note the **Key ID** shown on the page

#### Step 2: Get Your Team ID

1. In Apple Developer Portal, go to **Membership**
2. Copy your **Team ID**

#### Step 3: Configure iOS App

1. Ensure your `app.json` includes the `expo-notifications` plugin:
   ```json
   {
     "expo": {
       "plugins": ["expo-notifications"],
       "ios": {
         "bundleIdentifier": "com.yourcompany.yourapp"
       }
     }
   }
   ```

#### Step 4: Configure Backend Environment Variables

Add to your `.env` file:

```env
# APNs Configuration
APNS_KEY_PATH=./config/apns-key.p8
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apple-team-id
APNS_BUNDLE_ID=com.yourcompany.yourapp
APNS_IS_PRODUCTION=false  # Use 'true' for production, 'false' for sandbox/development
```

**Important Security Notes:**

- Never commit the APNs key file to version control
- Add `config/apns-key.p8` to `.gitignore`
- Store all APNs credentials in environment variables

## Environment Variables Summary

### Backend (.env)

```env
# Required for FCM (if using native FCM)
FCM_SERVER_KEY_PATH=./config/fcm-key.json
FCM_PROJECT_NAME=your-firebase-project-id

# Required for APNs (if using native APNs)
APNS_KEY_PATH=./config/apns-key.p8
APNS_KEY_ID=ABC123XYZ
APNS_TEAM_ID=DEF456UVW
APNS_BUNDLE_ID=com.yourcompany.yourapp
APNS_IS_PRODUCTION=false
```

### Mobile App (.env or app.json)

```env
# Optional - Expo Project ID (auto-detected from app.json if not set)
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

## File Structure

```
gymleb-api/
├── config/
│   ├── fcm-key.json      # FCM private key (DO NOT COMMIT)
│   └── apns-key.p8       # APNs key file (DO NOT COMMIT)
├── .env                  # Environment variables
└── .gitignore           # Should include config/*.json and config/*.p8

gymleb-mobile/
├── google-services.json  # Firebase config for Android (DO NOT COMMIT)
├── app.json             # Expo configuration
└── .env                 # Optional environment variables
```

## Sending Notifications

### Using Expo Push Service

If you're using Expo push tokens, send notifications via Expo's API:

```typescript
// Example: Send via Expo Push API
const response = await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: expoPushToken,
    sound: 'default',
    title: 'Notification Title',
    body: 'Notification body',
    data: {
      /* custom data */
    },
  }),
});
```

### Using Native FCM/APNs

If you're using native tokens, you'll need to implement FCM v1 API or APNs HTTP/2 API in your backend. See the [Expo documentation](https://docs.expo.dev/push-notifications/sending-notifications-custom/) for implementation details.

## Testing

1. **Test Token Registration**
   - Start the mobile app
   - Log in as a member
   - Check the database to verify the token is saved in `members.fcmToken`

2. **Test Notifications**
   - Use Firebase Console to send a test notification (for FCM)
   - Use a tool like [Pusher](https://github.com/noodlewerk/NWPusher) for APNs testing
   - Or implement a test endpoint in your backend

## Troubleshooting

### Android Issues

- **Token not received**: Ensure `google-services.json` is properly configured
- **Notifications not showing**: Check notification permissions are granted
- **FCM errors**: Verify `FCM_PROJECT_NAME` matches your Firebase project ID

### iOS Issues

- **Token not received**: Ensure APNs entitlement is configured in `app.json`
- **Notifications not showing**: Check notification permissions are granted
- **APNs errors**: Verify all APNs environment variables are correct
- **Sandbox vs Production**: Use `APNS_IS_PRODUCTION=false` for development builds

## Security Best Practices

1. **Never commit credentials to version control**
   - Add credential files to `.gitignore`
   - Use environment variables for all sensitive data
   - Consider using a secrets management service for production

2. **Rotate keys regularly**
   - FCM keys can be regenerated
   - APNs keys cannot be regenerated (download once, store securely)

3. **Use different credentials for development and production**
   - Separate Firebase projects for dev/prod
   - Different APNs keys for development and production

## References

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Sending Notifications with FCM and APNs](https://docs.expo.dev/push-notifications/sending-notifications-custom/)
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Apple Push Notification Service Documentation](https://developer.apple.com/documentation/usernotifications)
