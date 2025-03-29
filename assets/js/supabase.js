// Supabase client initialization
const SUPABASE_URL = 'https://pombxhsrmvrtzkaodmni.supabase.co'; // Replace with your actual Supabase URL from Project Settings > API
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbWJ4aHNybXZydHprYW9kbW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxODU5OTAsImV4cCI6MjA1ODc2MTk5MH0.vGl9mYqJwmz8htQHhiMDzVymZAgBHOJwBPH5IiJx2g4'; // Replace with your actual Supabase anon key from Project Settings > API

// Initialize the Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate or retrieve a session ID
function getSessionId() {
    // Check if we already have a session ID in localStorage
    let sessionId = localStorage.getItem('recibee_session_id');
    
    // If not, create a new one
    if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('recibee_session_id', sessionId);
    }
    
    return sessionId;
}

// Track an upload in Supabase
async function trackUpload() {
    const sessionId = getSessionId();
    
    try {
        // Record the upload in Supabase
        const { data, error } = await supabase
            .from('uploads')
            .insert([
                { session_id: sessionId, timestamp: new Date() }
            ]);
            
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error tracking upload:', error);
        return false;
    }
}

// Get number of uploads from Supabase
async function getUploadCount() {
    const sessionId = getSessionId();
    
    try {
        // Count uploads for this session
        const { data, error, count } = await supabase
            .from('uploads')
            .select('*', { count: 'exact' })
            .eq('session_id', sessionId);
            
        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error getting upload count:', error);
        return 0;
    }
}

// Register a user and link their uploads
async function registerUser(email, password) {
    try {
        // Sign up the user
        const { user, error } = await supabase.auth.signUp({
            email,
            password,
        });
        
        if (error) throw error;
        
        // Link existing uploads to the new user
        if (user) {
            const sessionId = getSessionId();
            const { data, error: updateError } = await supabase
                .from('uploads')
                .update({ user_id: user.id })
                .eq('session_id', sessionId);
                
            if (updateError) throw updateError;
        }
        
        return user;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
}

// Login a user
async function loginUser(email, password) {
    try {
        const { user, error } = await supabase.auth.signIn({
            email,
            password,
        });
        
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}

// Check if user is a pro subscriber
async function isProUser(userId) {
    try {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('is_active')
            .eq('user_id', userId)
            .single();
            
        if (error) throw error;
        return data?.is_active || false;
    } catch (error) {
        console.error('Error checking pro status:', error);
        return false;
    }
}

// Export the functions
export {
    getSessionId,
    trackUpload,
    getUploadCount,
    registerUser,
    loginUser,
    isProUser
}; 