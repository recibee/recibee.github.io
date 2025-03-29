// Handle 404 errors
window.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK') {
        // Resource not found
        console.log('Resource not found:', e.target.src || e.target.href);
    }
}, true);

// Handle navigation errors
window.addEventListener('unhandledrejection', function(e) {
    if (e.reason && e.reason.name === 'NavigationError') {
        // Navigation error occurred
        console.log('Navigation error:', e.reason);
    }
}); 