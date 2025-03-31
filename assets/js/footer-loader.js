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
                <footer class="border-t border-dark/10 py-6 bg-white">
                    <div class="container mx-auto px-4 md:px-6">
                        <div class="flex flex-col md:flex-row items-center justify-between">
                            <div class="flex items-center mb-4 md:mb-0">
                                <img src="/assets/icons/favicon.svg" alt="Recibee" class="h-6 w-auto mr-2">
                                <span class="text-dark font-medium">Recibee</span>
                            </div>
                            <div class="flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-dark/60">
                                <a href="/pages/terms-of-service.html" class="hover:text-primary transition-colors">Terms</a>
                                <a href="/pages/privacy-policy.html" class="hover:text-primary transition-colors">Privacy</a>
                                <a href="/pages/report-problem.html" class="hover:text-primary transition-colors">Support</a>
                            </div>
                            <div class="mt-4 md:mt-0 text-sm text-dark/60">
                                &copy; 2023 Recibee
                            </div>
                        </div>
                    </div>
                </footer>
            `;
        });
});