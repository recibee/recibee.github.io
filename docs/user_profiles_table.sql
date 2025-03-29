-- SQL script to create the user_profiles table for social login integration
-- This table stores additional profile information from social providers

-- Create the user_profiles table
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
  
  -- Metadata from social providers can be stored as JSON
  provider_metadata JSONB,
  
  -- Optional fields for additional user details
  locale TEXT,
  timezone TEXT,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for faster queries
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_provider ON user_profiles(provider);

-- Set up Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to see only their own profile
CREATE POLICY "Users can view their own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow authenticated users to update only their own profile
CREATE POLICY "Users can update their own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow Supabase auth hooks to create profiles
CREATE POLICY "Service role can create profiles" 
  ON user_profiles FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to handle social sign-ins and create/update profile
CREATE OR REPLACE FUNCTION handle_social_sign_in()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update the user's profile
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically handle social sign-ins
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_social_sign_in();

-- Add comment to table for documentation
COMMENT ON TABLE user_profiles IS 'Profile information for users who sign in with social providers';

-- Create a default security_device_sessions table for optional device management
CREATE TABLE security_device_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  ip_address TEXT,
  browser TEXT,
  os TEXT,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, device_id)
);

-- Create indexes for device sessions
CREATE INDEX idx_security_device_sessions_user_id ON security_device_sessions(user_id);
CREATE INDEX idx_security_device_sessions_is_active ON security_device_sessions(is_active);

-- Enable RLS on device sessions
ALTER TABLE security_device_sessions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own device sessions
CREATE POLICY "Users can view their own device sessions" 
  ON security_device_sessions FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to update their own device sessions
CREATE POLICY "Users can update their own device sessions" 
  ON security_device_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow service role to create/manage device sessions
CREATE POLICY "Service role can manage device sessions" 
  ON security_device_sessions 
  TO service_role
  USING (true);

-- Add comment to table for documentation
COMMENT ON TABLE security_device_sessions IS 'Tracks device sessions for multi-device management';
