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
        // Check if user is already logged in
        await this.refreshCurrentUser();

        // Set up auth state change listener
        supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await this.refreshCurrentUser();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                localStorage.removeItem('recibee_user');
            }
            
            // Notify listeners of auth state change
            this.notifyListeners(event, this.currentUser);
        });
    }

    /**
     * Refresh current user data
     */
    async refreshCurrentUser() {
        try {
            // Get current session
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            if (!session) return;

            // Get user details
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) throw userError;
            if (!user) return;

            // Get user profile data from subscriptions
            const { data: subscription, error: subError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            // Create user profile object
            this.currentUser = {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || 'User',
                isVerified: user.email_confirmed_at ? true : false,
                plan: subscription?.plan_type || 'free',
                isPro: subscription?.is_active || false,
                lastLogin: new Date().toISOString()
            };

            // Save to localStorage for persistence
            localStorage.setItem('recibee_user', JSON.stringify(this.currentUser));
        } catch (error) {
            console.error('Error refreshing user data:', error);
            this.currentUser = null;
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