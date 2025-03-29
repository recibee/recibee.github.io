-- SQL script to create the subscriptions table for user subscription management

-- Create the subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  plan_type TEXT DEFAULT 'free' NOT NULL, -- 'free', 'premium', 'premium_plus'
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow service role to manage all subscriptions  
CREATE POLICY "Service role can manage subscriptions" 
  ON subscriptions 
  TO service_role
  USING (true);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_subscription_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscription_updated_at_column();

-- Function to automatically create a free subscription for new users
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default free subscription for new user
  INSERT INTO subscriptions (
    user_id,
    plan_type,
    is_active,
    start_date,
    trial_end_date
  )
  VALUES (
    NEW.id,
    'free',
    true,
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (user_id) 
  DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a subscription for new users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_subscription'
  ) THEN
    CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_subscription();
  END IF;
END
$$;

-- Add comment to table for documentation
COMMENT ON TABLE subscriptions IS 'Stores user subscription information, including plan type, billing status, and trial period';

-- Create uploads table for tracking user uploads
CREATE TABLE IF NOT EXISTS uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NULL,
  session_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  content_type TEXT,
  detection_results JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_session_id ON uploads(session_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);

-- Set up Row Level Security (RLS) policies for uploads
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own uploads
CREATE POLICY "Users can view their own uploads" 
  ON uploads FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Policy to allow users to insert uploads (either authenticated or with session_id)
CREATE POLICY "Users can insert uploads" 
  ON uploads FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Policy to allow users to update their own uploads
CREATE POLICY "Users can update their own uploads" 
  ON uploads FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Policy to allow service role to manage all uploads
CREATE POLICY "Service role can manage all uploads" 
  ON uploads 
  TO service_role
  USING (true);

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_uploads_updated_at
BEFORE UPDATE ON uploads
FOR EACH ROW
EXECUTE FUNCTION update_subscription_updated_at_column();

-- Add comment to table for documentation
COMMENT ON TABLE uploads IS 'Stores user uploaded files with detection results'; 