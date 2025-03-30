/**
 * Footer Loader - Dynamically loads the shared footer into HTML pages
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create a placeholder div for the footer if it doesn't exist
    let footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) {
        footerPlaceholder = document.createElement('div');
        footerPlaceholder.id = 'footer-placeholder';
        document.body.appendChild(footerPlaceholder);
    }

    // Fetch the footer content from the includes directory
    fetch('/assets/includes/footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load footer');
            }
            return response.text();
        })
        .then(html => {
            footerPlaceholder.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading footer:', error);
            // If loading fails, show a basic fallback footer
            footerPlaceholder.innerHTML = `
                <footer class="bg-dark py-8">
                    <div class="container mx-auto px-4 md:px-6">
                        <div class="text-center">
                            <p class="text-white/70 text-sm">Copyright © Recibee</p>
                            <p class="text-white/70 text-sm mt-2">Made with Love ❤️</p>
                            <div class="mt-4">
                                <a href="terms-of-service.html" class="text-white/70 text-sm mx-2 hover:text-white">Terms of Service</a>
                                <span class="text-white/70">|</span>
                                <a href="privacy-policy.html" class="text-white/70 text-sm mx-2 hover:text-white">Privacy Policy</a>
                                <span class="text-white/70">|</span>
                                <a href="report-problem.html" class="text-white/70 text-sm mx-2 hover:text-white">Report a Problem</a>
                            </div>
                        </div>
                    </div>
                </footer>
            `;
        });
});