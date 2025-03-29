# Supabase Setup Guide for Recibee

This document explains how to set up the Supabase backend for the Recibee app's upload tracking system.

## Setting Up Supabase for Recibee

This guide explains how to set up Supabase for the Recibee application.

### Prerequisites

1. A Supabase account (https://supabase.com)
2. Admin access to your Supabase project

### Step 1: Create a New Supabase Project

1. Go to the Supabase dashboard (https://app.supabase.com)
2. Click "New Project"
3. Fill in the project details:
   - Name: Recibee
   - Database Password: (create a strong password)
   - Region: (select the region closest to your users)
4. Click "Create New Project"

### Step 2: Set Up Database Tables

You need to create several tables to support the Recibee application functionality.

#### Option 1: Use the SQL Editor (Recommended)

1. Go to your Supabase Dashboard > SQL Editor
2. Create a new query
3. Execute the following SQL scripts in this order:
   - `user_profiles_table.sql` - Sets up user profile tables and triggers
   - `subscriptions_table.sql` - Sets up subscription and uploads tables
   
These scripts are located in the `docs` folder of your project.

#### Option 2: Manual Table Creation

If you prefer to create tables manually:

1. Go to Table Editor
2. Create tables with the following structure:

##### user_profiles

```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  provider TEXT NOT NULL,
  provider_id TEXT,
  email TEXT,
  last_sign_in TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  provider_metadata JSONB,
  locale TEXT,
  timezone TEXT,
  preferences JSONB DEFAULT '{}'::jsonb
);
```

##### subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  plan_type TEXT DEFAULT 'free' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  end_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  last_billing_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  payment_method_id TEXT,
  subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### uploads

```sql
CREATE TABLE uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NULL,
  session_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  content_type TEXT,
  detection_results JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 3: Configure Authentication

1. Go to Authentication > Settings
2. Under Site URL, enter your website URL: `https://recibee.github.io`
3. Under Redirect URLs, add the following:
   - `https://recibee.github.io/pages/login.html`
   - `https://recibee.github.io/pages/signup.html`
   - `https://recibee.github.io/`

### Step 4: Enable Social Authentication Providers

Follow the instructions in the `social_auth_setup.md` file to configure:
- Google
- Facebook
- Twitter/X

### Step 5: Set Up Storage

1. Go to Storage
2. Create the following buckets:
   - `uploads` (for user-uploaded images)
   - `recipe-images` (for recipe images)
   - `profile-images` (for user profile pictures)

For each bucket:
1. Set public access to "Require token for all operations"
2. Create policies to allow users to read/write their own files

### Step 6: API Keys

1. Go to Project Settings > API
2. Note your Project URL and anon/public key
3. Update these values in your application's configuration files

### Step 7: Database Error Prevention

To fix the "Database error saving new user" issue:

1. Go to SQL Editor
2. Run the following script to ensure the user_profiles table is properly set up:

```sql
-- Check if trigger exists and recreate if needed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger function with error handling
CREATE OR REPLACE FUNCTION handle_social_sign_in()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    -- Insert or update the user's profile with error handling
    INSERT INTO user_profiles (
      user_id,
      full_name,
      avatar_url,
      provider,
      provider_id,
      email,
      provider_metadata
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_app_meta_data->>'provider',
      NEW.raw_user_meta_data->>'sub',
      NEW.email,
      NEW.raw_user_meta_data
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      provider = EXCLUDED.provider,
      provider_id = EXCLUDED.provider_id,
      email = EXCLUDED.email,
      last_sign_in = NOW(),
      provider_metadata = EXCLUDED.provider_metadata,
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the trigger
    RAISE NOTICE 'Error in handle_social_sign_in trigger: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger again
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_social_sign_in();
```

This prevents database errors from breaking the user signup/login process.

### Step 8: Verification

To ensure everything is set up correctly:

1. Check that all tables have the correct Row Level Security (RLS) policies
2. Verify that the triggers for user profile creation are working
3. Test the social login flow through the application

### Step 9: Troubleshooting Common Issues

#### Database Error Saving New User

If you encounter the "Database error saving new user" error:

1. Check that your database tables are correctly set up
2. Ensure the `user_profiles` table exists and has the correct schema
3. Verify that the trigger function for handling social sign-ins is properly created
4. Make sure the redirect URLs in your OAuth providers match exactly with what Supabase expects
5. Run the SQL script in Step 7 above to fix common trigger issues

#### Authentication Redirect Issues

If you're having issues with authentication redirects:

1. Ensure your Site URL in Supabase Authentication settings is set to `https://recibee.github.io`
2. Check that all redirect URLs are added correctly
3. Verify that the OAuth redirect URLs in your social providers match the Supabase callback URL
4. Clear browser cache and cookies if testing repeatedly

### Step 10: Next Steps

After setting up Supabase:

1. Update your frontend code with the correct Supabase project URL and anon key
2. Test the authentication flow end-to-end
3. Implement proper error handling for edge cases
4. Set up monitoring for any database or authentication issues

## Prerequisites

1. A Supabase account (create one at [https://supabase.com](https://supabase.com) if you don't have one)
2. Your Supabase project URL and anon key (found in your project's API settings)

## Step 1: Create the Uploads Table

This table will track all uploads from users and anonymous sessions:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Create a new query and paste the following SQL:

```sql
CREATE TABLE uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- You can add more fields as needed, such as:
  image_path TEXT,
  ingredients JSONB,
  status TEXT DEFAULT 'processed'
);

-- Create indexes for faster queries
CREATE INDEX idx_uploads_session_id ON uploads(session_id);
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_timestamp ON uploads(timestamp);

-- Set up Row Level Security (RLS) policies
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to see only their own uploads
CREATE POLICY "Users can view their own uploads" 
  ON uploads FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow inserting uploads as anyone (authenticated or anonymous)
CREATE POLICY "Anyone can insert uploads"
  ON uploads FOR INSERT
  WITH CHECK (true);
```

## Step 2: Create the Subscriptions Table

This table will track user subscription status:

```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  plan_type TEXT DEFAULT 'free',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  payment_status TEXT,
  
  -- You can add more fields as needed
  payment_method JSONB,
  subscription_id TEXT
);

-- Create index for faster queries
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Set up Row Level Security (RLS) policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to see only their own subscription
CREATE POLICY "Users can view their own subscription" 
  ON subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow administrators to manage subscriptions (replace with your admin role check)
CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'admin@recibee.com'));
```

## Step 3: Setup Edge Functions (Optional, for more advanced usage)

If you want to verify uploads server-side and implement more advanced logic, you can create Supabase Edge Functions:

1. Install the Supabase CLI
2. Create an edge function for validating uploads:

```bash
supabase functions new validate-upload
```

3. Implement the function (example code):

```typescript
// supabase/functions/validate-upload/index.ts
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { session_id, user_id } = await req.json()
  
  // Create a Supabase client with the project URL and service key
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
  
  // Count existing uploads for this session/user
  const { count, error } = await supabaseClient
    .from('uploads')
    .select('*', { count: 'exact' })
    .or(`