# Social Authentication Setup Guide for Recibee

This guide explains how to set up social authentication (Google, Facebook, X/Twitter) for the Recibee application using Supabase.

## Prerequisites

1. A Supabase project with a database
2. Admin access to the Supabase project dashboard
3. Developer accounts for each social provider you want to integrate

## Step 1: Set Up Tables in Supabase

First, run the SQL script provided in `user_profiles_table.sql` to create the necessary tables:

1. Go to your Supabase Dashboard > SQL Editor
2. Create a new query and paste the contents of `user_profiles_table.sql`
3. Run the query to create the following tables:
   - `user_profiles` - Stores additional user profile data from social providers
   - `security_device_sessions` - (Optional) For tracking user login devices

This creates tables with Row Level Security (RLS) already configured, plus triggers to automatically populate user profiles when users sign in with social providers.

## Step 2: Configure OAuth Providers in Supabase

### Google Authentication

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application" as the application type
6. Add your app's domain to "Authorized JavaScript origins" (e.g., `https://yoursite.com`)
7. Add your Supabase redirect URL to "Authorized redirect URIs":
   - Format: `https://<your-project-ref>.supabase.co/auth/v1/callback`
8. Click "Create" and note your Client ID and Client Secret

### Facebook Authentication

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (choose "Consumer" as the app type)
3. From the app dashboard, go to "Add a Product" > "Facebook Login" > "Web"
4. Under "Facebook Login" settings, add your OAuth Redirect URI:
   - Format: `https://<your-project-ref>.supabase.co/auth/v1/callback`
5. Go to "Basic" settings and note your App ID and App Secret

### X/Twitter Authentication

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new Project and App
3. Under "User authentication settings", enable OAuth 2.0
4. Set the Client Type to "Confidential"
5. Add your redirect URL:
   - Format: `https://<your-project-ref>.supabase.co/auth/v1/callback`
6. Request at least these scopes: `tweet.read`, `users.read`, `offline.access`
7. Note your Client ID and Client Secret

## Step 3: Add OAuth Credentials to Supabase

1. Go to your Supabase Dashboard > Authentication > Providers
2. For each provider (Google, Facebook, Twitter):
   - Toggle the provider to "Enabled"
   - Enter the Client ID and Client Secret from the respective developer portal
   - Save changes

## Step 4: Test Authentication

1. Test each provider using the auth-test.html page
2. Verify that user profiles are created correctly in your database

## Step 5: Advanced Configuration (Optional)

### Customizing OAuth Scopes

You can modify the scopes requested for each provider in the Supabase authentication settings. The default scopes are:

- Google: `https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile`
- Facebook: `email,public_profile`
- Twitter: `tweet.read,users.read,offline.access`

### Multi-Device Management

If you want to implement multi-device authentication tracking:

1. Use the `security_device_sessions` table to track user logins
2. Add device information during login with code like:

```javascript
async function recordDeviceLogin(userId) {
  // Get device info
  const deviceInfo = {
    device_id: generateDeviceId(), // Create a unique device identifier
    device_name: getBrowserName() + ' on ' + getOSName(),
    device_type: isMobile() ? 'mobile' : 'desktop',
    ip_address: await getClientIP(),
    browser: getBrowserName(),
    os: getOSName()
  };
  
  // Record the device login
  const { error } = await supabase
    .from('security_device_sessions')
    .upsert({
      user_id: userId,
      ...deviceInfo,
      last_active: new Date().toISOString(),
      is_active: true
    }, { onConflict: ['user_id', 'device_id'] });
    
  if (error) console.error('Error recording device login:', error);
}
```

### Token Management

The default token expiration in Supabase is 1 hour for access tokens and 60 days for refresh tokens. You can modify these in your Supabase project settings under Authentication > Settings.

## Troubleshooting

Common issues and solutions:

1. **"Popup Closed" Error**: This usually happens when the popup is blocked. Make sure pop-ups are allowed for your domain.

2. **Redirect URI Mismatch**: Double-check that the redirect URIs in your OAuth provider match exactly with what Supabase expects.

3. **Missing User Profile Data**: If user profiles aren't being created, check the database logs and ensure the trigger function is working correctly.

4. **CORS Issues**: Ensure your application's domain is properly configured in Supabase's API settings. 