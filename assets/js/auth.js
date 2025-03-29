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
     * Initialize the auth state
     */
    async init() {
        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session) {
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
            
            // Fetch subscription status
            await this.fetchSubscriptionStatus();
        }
        
        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
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
                
                // Fetch subscription status
                await this.fetchSubscriptionStatus();
                
                // Notify listeners
                this.notifyListeners();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                localStorage.removeItem('recibee_user');
                localStorage.removeItem('recibee_subscription');
                
                // Notify listeners
                this.notifyListeners();
            }
        });
        
        // Notify listeners of initial state
        this.notifyListeners();
    }
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    }
    
    /**
     * Get current user
     */
    getUser() {
        return this.currentUser;
    }
    
    /**
     * Get user's subscription status
     */
    async fetchSubscriptionStatus() {
        if (!this.currentUser) return null;
        
        try {
            // First check localStorage for cached subscription
            const cachedSubscription = localStorage.getItem('recibee_subscription');
            if (cachedSubscription) {
                try {
                    const subscriptionData = JSON.parse(cachedSubscription);
                    // Check if cache is still valid (less than 1 hour old)
                    const cacheTime = new Date(subscriptionData.cachedAt);
                    const now = new Date();
                    const diffHours = (now - cacheTime) / (1000 * 60 * 60);
                    
                    if (diffHours < 1) {
                        this.currentUser.subscription = subscriptionData;
                        return subscriptionData;
                    }
                } catch (e) {
                    console.error('Error parsing cached subscription data:', e);
                }
            }
            
            // If no valid cache, fetch from database
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();
                
            if (error) {
                if (error.code === 'PGRST116') { // No rows found
                    // Create a default free subscription if none exists
                    const defaultSubscription = {
                        plan_type: 'free',
                        is_active: true,
                        start_date: new Date().toISOString(),
                        trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30-day trial
                    };
                    
                    // Try to save the default subscription
                    try {
                        const { data: newSub, error: insertError } = await supabase
                            .from('subscriptions')
                            .insert([{ 
                                user_id: this.currentUser.id,
                                ...defaultSubscription
                            }])
                            .select()
                            .single();
                            
                        if (!insertError && newSub) {
                            // Cache the subscription data
                            const subscriptionWithCache = {
                                ...newSub,
                                cachedAt: new Date().toISOString()
                            };
                            localStorage.setItem('recibee_subscription', JSON.stringify(subscriptionWithCache));
                            this.currentUser.subscription = subscriptionWithCache;
                            return subscriptionWithCache;
                        } else {
                            // If we can't create it, just use the default
                            const subscriptionWithCache = {
                                ...defaultSubscription,
                                cachedAt: new Date().toISOString()
                            };
                            localStorage.setItem('recibee_subscription', JSON.stringify(subscriptionWithCache));
                            this.currentUser.subscription = subscriptionWithCache;
                            return subscriptionWithCache;
                        }
                    } catch (insertErr) {
                        console.error('Error creating subscription:', insertErr);
                        // Use the default subscription anyway
                        const subscriptionWithCache = {
                            ...defaultSubscription,
                            cachedAt: new Date().toISOString()
                        };
                        localStorage.setItem('recibee_subscription', JSON.stringify(subscriptionWithCache));
                        this.currentUser.subscription = subscriptionWithCache;
                        return subscriptionWithCache;
                    }
                } else {
                    console.error('Error fetching subscription:', error);
                    return null;
                }
            }
            
            // Cache the subscription data
            const subscriptionWithCache = {
                ...data,
                cachedAt: new Date().toISOString()
            };
            localStorage.setItem('recibee_subscription', JSON.stringify(subscriptionWithCache));
            this.currentUser.subscription = subscriptionWithCache;
            return subscriptionWithCache;
        } catch (e) {
            console.error('Error in fetchSubscriptionStatus:', e);
            return null;
        }
    }
    
    /**
     * Check if user's trial is active
     */
    isTrialActive() {
        if (!this.currentUser || !this.currentUser.subscription) return false;
        
        try {
            const sub = this.currentUser.subscription;
            
            // If it's not a free plan, return based on is_active
            if (sub.plan_type !== 'free') {
                return sub.is_active;
            }
            
            // For free plan, check trial end date
            if (sub.trial_end_date) {
                const trialEnd = new Date(sub.trial_end_date);
                const now = new Date();
                return trialEnd > now;
            }
            
            return false;
        } catch (e) {
            console.error('Error checking trial status:', e);
            return false;
        }
    }
    
    /**
     * Add auth state change listener
     */
    addAuthStateListener(listener) {
        if (typeof listener === 'function' && !this.authStateListeners.includes(listener)) {
            this.authStateListeners.push(listener);
            
            // Immediately notify the new listener of current state
            listener(this.isAuthenticated(), this.currentUser);
        }
    }
    
    /**
     * Remove auth state change listener
     */
    removeAuthStateListener(listener) {
        const index = this.authStateListeners.indexOf(listener);
        if (index !== -1) {
            this.authStateListeners.splice(index, 1);
        }
    }
    
    /**
     * Notify all listeners of auth state change
     */
    notifyListeners() {
        this.authStateListeners.forEach(listener => {
            listener(this.isAuthenticated(), this.currentUser);
        });
    }
    
    /**
     * Sign out the current user
     */
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            localStorage.removeItem('recibee_user');
            localStorage.removeItem('recibee_subscription');
            
            // Notify listeners
            this.notifyListeners();
            
            return true;
        } catch (error) {
            console.error('Error signing out:', error);
            return false;
        }
    }
    
    /**
     * Update user profile header element
     */
    updateAuthUI() {
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) return;
        
        if (this.isAuthenticated()) {
            // User is authenticated, show profile icon
            const provider = this.currentUser?.provider || 'default';
            const avatarUrl = this.currentUser?.avatarUrl;
            const userName = this.currentUser?.name || 'User';
            
            // Get provider icon
            let providerIcon = '';
            switch (provider) {
                case 'google':
                    providerIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>';
                    break;
                case 'facebook':
                    providerIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
                    break;
                case 'twitter':
                    providerIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="#1DA1F2" d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/></svg>';
                    break;
                default:
                    providerIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>';
            }
            
            // Create profile element
            const profileElement = document.createElement('div');
            profileElement.className = 'relative group';
            profileElement.innerHTML = `
                <button id="profile-button" class="flex items-center justify-center rounded-full w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md hover:shadow-lg transition duration-300">
                    ${avatarUrl ? `<img src="${avatarUrl}" alt="${userName}" class="w-9 h-9 rounded-full object-cover">` : providerIcon}
                </button>
                <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <p class="px-4 py-2 text-sm text-gray-700 border-b border-gray-100 font-medium">${userName}</p>
                    <a href="/pages/account.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50">Account</a>
                    <a href="#" id="sign-out-button" class="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50">Sign Out</a>
                </div>
            `;
            
            // Clear existing content and append profile
            authContainer.innerHTML = '';
            authContainer.appendChild(profileElement);
            
            // Add sign out event listener
            document.getElementById('sign-out-button').addEventListener('click', async (e) => {
                e.preventDefault();
                await this.signOut();
                window.location.href = '/';
            });
        } else {
            // User is not authenticated, show login and signup links
            authContainer.innerHTML = `
                <div class="flex items-center space-x-4">
                    <a href="/pages/login.html" class="text-white hover:text-orange-200 transition duration-300">Login</a>
                    <a href="/pages/signup.html" class="bg-white text-orange-500 hover:bg-orange-100 px-4 py-2 rounded-full font-medium transition duration-300">Sign Up</a>
                </div>
            `;
        }
    }
    
    /**
     * Redirect based on trial status
     */
    redirectBasedOnTrial() {
        if (!this.isAuthenticated()) {
            // Not logged in, redirect to home
            window.location.href = '/';
            return;
        }
        
        if (this.isTrialActive()) {
            // Trial is active, redirect to upload page
            window.location.href = '/pages/upload.html';
        } else {
            // Trial expired, redirect to pricing
            window.location.href = '/pages/pricing.html';
        }
    }
}

// Create a global instance
const recibeeAuth = new RecibeeAuth();

// Initialize auth UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    recibeeAuth.updateAuthUI();
    
    // Add redirection logic based on URL
    const pathname = window.location.pathname;
    if (pathname.endsWith('/account.html')) {
        // No redirection needed on account page
        return;
    }
    
    if (pathname.endsWith('/upload.html') && !recibeeAuth.isAuthenticated()) {
        // Redirect to login if trying to access upload without auth
        window.location.href = '/pages/login.html?returnUrl=' + encodeURIComponent(pathname);
        return;
    }
    
    if (pathname.endsWith('/upload.html') && recibeeAuth.isAuthenticated() && !recibeeAuth.isTrialActive()) {
        // Redirect to pricing if trial expired
        window.location.href = '/pages/pricing.html';
        return;
    }
});

// Export the auth instance
window.recibeeAuth = recibeeAuth; 