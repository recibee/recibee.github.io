// Supabase Authentication Module for Recibee
// This file manages authentication state across the application

// Initialize Supabase client
const SUPABASE_URL = 'https://pombxhsrmvrtzkaodmni.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbWJ4aHNybXZydHprYW9kbW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxODU5OTAsImV4cCI6MjA1ODc2MTk5MH0.vGl9mYqJwmz8htQHhiMDzVymZAgBHOJwBPH5IiJx2g4';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Auth class to manage user authentication state
 */
class RecibeeAuth {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        this.init();
    }

    /**
     * Initialize the auth module
     */
    async init() {
        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
            this.currentUser = session.user;
            console.log('Session found, user authenticated:', this.currentUser.id);
            
            // Check localStorage for additional user data
            const localUserData = localStorage.getItem('recibee_user');
            if (localUserData) {
                try {
                    const userData = JSON.parse(localUserData);
                    this.currentUser = { ...this.currentUser, ...userData };
                } catch (e) {
                    console.error('Error parsing local user data:', e);
                }
            }
            
            // Explicitly save user profile to Supabase
            try {
                console.log('Ensuring user profile is saved to Supabase');
                await this.ensureUserProfileSaved();
            } catch (profileError) {
                console.error('Error saving user profile during init:', profileError);
            }
            
            // Fetch subscription status - this will also save the user profile
            await this.fetchSubscriptionStatus();
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' && session) {
                console.log('User signed in:', session.user.id);
                this.currentUser = session.user;
                
                // Check localStorage for additional user data
                const localUserData = localStorage.getItem('recibee_user');
                if (localUserData) {
                    try {
                        const userData = JSON.parse(localUserData);
                        this.currentUser = { ...this.currentUser, ...userData };
                    } catch (e) {
                        console.error('Error parsing local user data:', e);
                    }
                }
                
                // Save user data to localStorage
                const userProfile = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name || 
                          'User',
                    provider: session.user.app_metadata?.provider,
                    avatarUrl: session.user.user_metadata?.avatar_url || 
                               session.user.user_metadata?.picture,
                    lastLogin: new Date().toISOString()
                };
                localStorage.setItem('recibee_user', JSON.stringify(userProfile));
                
                // Explicitly save user profile to Supabase
                try {
                    console.log('Explicitly saving user profile after sign in');
                    await this.ensureUserProfileSaved();
                } catch (profileError) {
                    console.error('Error saving user profile during sign in:', profileError);
                }
                
                // Fetch subscription status
                await this.fetchSubscriptionStatus();
                
                // Notify listeners
                this.notifyListeners();
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out');
                this.currentUser = null;
                localStorage.removeItem('recibee_user');
                localStorage.removeItem('recibee_subscription');
                
                // Notify listeners
                this.notifyListeners();
            } else if (event === 'TOKEN_REFRESHED' && session) {
                console.log('Token refreshed, updating user data');
                this.currentUser = session.user;
                
                // Save user profile after token refresh
                try {
                    await this.ensureUserProfileSaved();
                } catch (profileError) {
                    console.error('Error saving user profile during token refresh:', profileError);
                }
            }
        });
        
        // Notify listeners of initial state
        this.notifyListeners();
    }

    /**
     * Ensure the user profile is saved to Supabase
     */
    async ensureUserProfileSaved() {
        if (!this.currentUser) {
            console.log('No current user, skipping profile save');
            return;
        }
        
        try {
            console.log('Saving user profile for:', this.currentUser.id);
            
            // Extract user metadata from auth provider
            const userData = {
                user_id: this.currentUser.id,
                full_name: this.currentUser.user_metadata?.full_name || 
                           this.currentUser.user_metadata?.name || 
                           this.currentUser?.name ||
                           'User',
                avatar_url: this.currentUser.user_metadata?.avatar_url || 
                            this.currentUser.user_metadata?.picture ||
                            this.currentUser?.avatarUrl,
                provider: this.currentUser.app_metadata?.provider || 
                          this.currentUser?.provider ||
                          'email',
                email: this.currentUser.email,
                last_sign_in: new Date().toISOString()
            };
            
            console.log('User profile data to save:', JSON.stringify(userData));
            
            // Check if user profile exists
            const { data: existingProfile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('user_id', this.currentUser.id)
                .single();
                
            if (fetchError && fetchError.code !== 'PGRST116') {
                // If error is not just "no rows found", log it
                console.error('Error checking user profile:', fetchError);
            }
            
            if (existingProfile) {
                // Update existing profile
                console.log('Updating existing profile for user:', this.currentUser.id);
                const { error: updateError } = await supabase
                    .from('user_profiles')
                    .update(userData)
                    .eq('user_id', this.currentUser.id);
                
                if (updateError) {
                    console.error('Error updating user profile:', updateError);
                    throw updateError;
                }
                console.log('User profile updated successfully');
            } else {
                // Create new profile
                console.log('Creating new profile for user:', this.currentUser.id);
                const { error: insertError } = await supabase
                    .from('user_profiles')
                    .insert([userData]);
                
                if (insertError) {
                    console.error('Error creating user profile:', insertError);
                    throw insertError;
                }
                console.log('User profile created successfully');
            }
        } catch (error) {
            console.error('Error saving user profile to Supabase:', error);
            
            // Additional troubleshooting information
            console.log('Current user metadata:', this.currentUser.user_metadata);
            console.log('Current user app metadata:', this.currentUser.app_metadata);
            
            // Don't throw, just log the error to prevent breaking the auth flow
        }
    }

    /**
     * Add an auth state change listener
     * @param {Function} listener - Callback function to be called on auth state change
     */
    addAuthStateListener(listener) {
        if (typeof listener === 'function') {
            this.authStateListeners.push(listener);
            
            // Immediately notify with current state
            if (this.currentUser) {
                listener('INITIAL_STATE', this.currentUser);
            }
        }
    }

    /**
     * Remove an auth state change listener
     * @param {Function} listener - Listener to remove
     */
    removeAuthStateListener(listener) {
        this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
    }

    /**
     * Notify all listeners of auth state change
     * @param {string} event - Auth event type
     * @param {Object} user - User data
     */
    notifyListeners(event, user) {
        this.authStateListeners.forEach(listener => {
            try {
                listener(event, user);
            } catch (e) {
                console.error('Error in auth state listener:', e);
            }
        });
    }

    /**
     * Get current user
     * @returns {Object|null} Current user or null if not logged in
     */
    getUser() {
        return this.currentUser;
    }

    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in
     */
    isLoggedIn() {
        return !!this.currentUser;
    }

    /**
     * Check if user email is verified
     * @returns {boolean} True if user email is verified
     */
    isEmailVerified() {
        return this.currentUser?.isVerified || false;
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            // Clear user data
            this.currentUser = null;
            localStorage.removeItem('recibee_user');
            
            // Redirect to home page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     * @param {Object} userData - User data to update
     */
    async updateUserProfile(userData) {
        try {
            if (!this.currentUser) throw new Error('User not logged in');
            
            // Update user metadata
            const { error } = await supabase.auth.updateUser({
                data: userData
            });
            
            if (error) throw error;
            
            // Refresh user data
            await this.refreshCurrentUser();
            
            return true;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }
}

// Create global auth instance
window.recibeeAuth = new RecibeeAuth();

// Auto redirect if user is not logged in on protected pages
document.addEventListener('DOMContentLoaded', function() {
    const protectedPages = [
        'account.html',
        'recipes.html', 
        'recipe-details.html', 
        'upload.html'
    ];
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        const auth = window.recibeeAuth;
        
        // Check if user is logged in
        if (!auth.isLoggedIn()) {
            // Redirect to login page with return URL
            window.location.href = `login.html?returnUrl=${encodeURIComponent(currentPage)}`;
        }
    }
}); 