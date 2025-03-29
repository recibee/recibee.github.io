# Supabase Setup Guide for Recibee

This document explains how to set up the Supabase backend for the Recibee app's upload tracking system.

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
    .or(`session_id.eq.${session_id},user_id.eq.${user_id}`)
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
  
  // Check if subscription exists for user
  let isPro = false
  if (user_id) {
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('is_active')
      .eq('user_id', user_id)
      .single()
    
    isPro = subscription?.is_active || false
  }
  
  // Determine if the upload is allowed
  const uploadAllowed = isPro || (count < 3)
  
  return new Response(
    JSON.stringify({
      allowed: uploadAllowed,
      remainingUploads: isPro ? 'unlimited' : Math.max(0, 3 - count),
      isPro,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
```

4. Deploy the function:

```bash
supabase functions deploy validate-upload
```

## Step 4: Update Configuration in Your App

Update the Supabase URL and anon key in your application:

1. Open `supabase.js` and `upload.html`
2. Replace the placeholder values with your actual Supabase URL and anon key:

```javascript
const SUPABASE_URL = 'https://your-actual-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-actual-anon-key';
```

## Step 5: Test the Integration

1. Make sure the Supabase client is correctly loaded in your HTML files
2. Test anonymous uploads and verify they're tracked in the database
3. Test user registration/login and verify uploads are associated with user accounts
4. Test the upload limit enforcement for both anonymous and logged-in users

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify Supabase credentials
3. Check network requests to ensure they're reaching Supabase
4. Review Supabase logs for any errors during requests 