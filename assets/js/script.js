// Error Tracking Utility
class ErrorTracker {
    static init() {
        window.addEventListener('error', this.handleError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseError.bind(this));
    }

    static handleError(event) {
        const error = {
            message: event.message,
            source: event.filename,
            lineNumber: event.lineno,
            columnNumber: event.colno,
            stack: event.error?.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        this.logError(error);
    }

    static handlePromiseError(event) {
        const error = {
            message: event.reason?.message || 'Unhandled Promise Rejection',
            stack: event.reason?.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        this.logError(error);
    }

    static logError(error) {
        // Log to console
        console.error('Error tracked:', error);

        // Send to Google Analytics
        if (window.gtag) {
            gtag('event', 'error', {
                'event_category': 'JavaScript Error',
                'event_label': error.message,
                'value': 1
            });
        }

        // You can add your custom error tracking endpoint here
        // fetch('/api/error-tracking', {
        //     method: 'POST',
        //     body: JSON.stringify(error)
        // });
    }
}

// Initialize error tracking
ErrorTracker.init();

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const successPopup = document.getElementById('successPopup');
    const popupContent = document.getElementById('popupContent');
    const closePopupButton = document.getElementById('closePopup');
    const waitlistForm = document.querySelector('#waitlistForm');
    const emailInput = document.querySelector('#email');
    const formStatus = document.querySelector('#formStatus');
    const errorMessage = document.querySelector('#errorMessage');
    const successMessage = document.querySelector('#successMessage');
    const counter = document.querySelector('#cookCounter');

    // Initialize Supabase client with direct values
    const supabase = window.supabase.createClient(
        'https://pombxhsrmvrtzkaodmni.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbWJ4aHNybXZydHprYW9kbW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxODU5OTAsImV4cCI6MjA1ODc2MTk5MH0.vGl9mYqJwmz8htQHhiMDzVymZAgBHOJwBPH5IiJx2g4',
        {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            auth: {
                persistSession: true
            }
        }
    );

    // Initialize form handling
    if (waitlistForm && emailInput) {
        const submitButton = waitlistForm.querySelector('button[type="submit"]');
        
        // Add transition classes to button
        if (submitButton) {
            submitButton.classList.add('transition-all', 'duration-300', 'ease-in-out');
        }

        // Check if user has already joined
        if (localStorage.getItem('waitlistJoined')) {
            setSuccessState(submitButton, emailInput);
        }

        // Add fallback form action for GitHub Pages
        if (window.location.hostname.includes('github.io')) {
            waitlistForm.action = "https://formspree.io/f/mbjnkpyo"; // Replace with your formspree endpoint
            waitlistForm.method = "POST";
            // Still try Supabase first, but allow form to submit naturally if that fails
            waitlistForm.onsubmit = function(event) {
                event.preventDefault();
                handleSubmit(event);
                return false;
            };
        } else {
            // Handle form submission
            waitlistForm.addEventListener('submit', handleSubmit);
            // Prevent default form submission
            waitlistForm.onsubmit = function() {
                return false;
            };
        }

        async function handleSubmit(event) {
            event.preventDefault();
            event.stopPropagation();
            
            if (!submitButton || !emailInput) return;
            
            if (localStorage.getItem('waitlistJoined')) {
                return;
            }
            
            const email = emailInput.value.trim();
            
            if (!isValidEmail(email)) {
                showError('Please enter a valid email address (e.g., user@domain.com)');
                return;
            }
            
            setLoadingState(submitButton);
            
            try {
                const { data, error } = await supabase
                    .from('waitlist')
                    .insert([{ email }]);

                if (error) {
                    console.error('Supabase error:', error);
                    if (error.code === '23505') {
                        showError('This email is already registered');
                        resetButtonState(submitButton);
                    } else if (error.code === 'PGRST301' || error.message?.includes('CORS')) {
                        console.log('CORS error detected, trying fallback...');
                        if (window.location.hostname.includes('github.io')) {
                            // Allow the form to submit naturally to formspree
                            showError('Using fallback submission method...');
                            setTimeout(() => {
                                waitlistForm.submit();
                            }, 1000);
                            return;
                        } else {
                            showError('Cross-origin error. Please try locally or contact support.');
                            resetButtonState(submitButton);
                        }
                    } else {
                        showError(`Error: ${error.message || 'Something went wrong'}`);
                        resetButtonState(submitButton);
                    }
                    return;
                }

                setSuccessState(submitButton, emailInput);
                localStorage.setItem('waitlistJoined', 'true');
                localStorage.setItem('waitlistEmail', email);

                // Update counter
                if (counter) {
                    const currentCount = parseInt(counter.textContent.replace(/,/g, ''));
                    counter.textContent = (currentCount + 1).toLocaleString();
                }

            } catch (error) {
                console.error('Error:', error);
                showError('Something went wrong. Please try again.');
                resetButtonState(submitButton);
            }
        }
    }

    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    // Show error message
    function showError(message) {
        if (errorMessage && formStatus) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('hidden');
            formStatus.classList.remove('hidden');
            setTimeout(() => {
                errorMessage.classList.add('hidden');
                formStatus.classList.add('hidden');
            }, 5000);
        }
    }

    // Function to set success state with animation
    function setSuccessState(button, input) {
        if (!button || !input) return;
        
        // Preserve button width
        const buttonWidth = button.offsetWidth;
        button.style.width = `${buttonWidth}px`;
        
        // Disable inputs immediately
        button.disabled = true;
        input.disabled = true;
        
        // Change button class and apply direct styling for color
        button.classList.remove('btn-primary');
        button.classList.add('btn-success');
        button.style.backgroundColor = '#4CAF50'; // Explicitly set green color
        button.style.borderRadius = '0.75rem'; // Ensure rounded corners (rounded-xl)
        
        // Show success message
        if (successMessage && formStatus) {
            successMessage.classList.remove('hidden');
            formStatus.classList.remove('hidden');
        }

        // Create wrapper for smooth transition
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.overflow = 'hidden';
        
        // Create text elements for transition
        const oldText = document.createElement('div');
        oldText.innerHTML = button.innerHTML;
        oldText.style.position = 'absolute';
        oldText.style.width = '100%';
        oldText.style.textAlign = 'center';
        oldText.style.transform = 'translateY(0) translateZ(0)';
        oldText.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        oldText.style.opacity = '1';

        const newText = document.createElement('div');
        newText.innerHTML = '<i class="fas fa-check"></i> You\'re Set';
        newText.style.position = 'absolute';
        newText.style.width = '100%';
        newText.style.textAlign = 'center';
        newText.style.transform = 'translateY(100%) translateZ(0)';
        newText.style.opacity = '0';
        newText.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        newText.style.fontSize = '0.95rem'; // Slightly reduce font size for small devices

        // Set up the transition
        wrapper.appendChild(oldText);
        wrapper.appendChild(newText);
        button.innerHTML = '';
        button.appendChild(wrapper);

        // Trigger the transition with slight delay
        setTimeout(() => {
            oldText.style.transform = 'translateY(-100%) translateZ(0)';
            oldText.style.opacity = '0';
            newText.style.transform = 'translateY(0) translateZ(0)';
            newText.style.opacity = '1';
        }, 50);

        // Clean up after transition
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-check"></i>&nbsp;You\'re Set';
            // Add non-breaking space and ensure the button stays green after cleanup
            button.style.backgroundColor = '#4CAF50';
            button.style.borderRadius = '0.75rem'; // Maintain rounded corners
            button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.gap = '0.25rem';
            button.style.whiteSpace = 'nowrap';
            button.style.padding = '0.5rem 1rem';
        }, 650);
    }

    // Function to set loading state with animation
    function setLoadingState(button) {
        if (!button) return;
        
        // Preserve button width
        const buttonWidth = button.offsetWidth;
        button.style.width = `${buttonWidth}px`;
        
        // Disable button immediately
        button.disabled = true;

        // Create wrapper for smooth transition
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        
        // Create text elements for transition
        const oldText = document.createElement('div');
        oldText.innerHTML = button.innerHTML;
        oldText.style.position = 'absolute';
        oldText.style.width = '100%';
        oldText.style.top = '50%';
        oldText.style.transform = 'translateY(-50%) translateZ(0)';
        oldText.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        oldText.style.opacity = '1';

        const newText = document.createElement('div');
        newText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
        newText.style.position = 'absolute';
        newText.style.width = '100%';
        newText.style.top = '50%';
        newText.style.transform = 'translateY(50%) translateZ(0)';
        newText.style.opacity = '0';
        newText.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';

        // Set up the transition
        wrapper.appendChild(oldText);
        wrapper.appendChild(newText);
        button.innerHTML = '';
        button.appendChild(wrapper);

        // Trigger the transition with slight delay
        setTimeout(() => {
            oldText.style.transform = 'translateY(-150%) translateZ(0)';
            oldText.style.opacity = '0';
            newText.style.transform = 'translateY(-50%) translateZ(0)';
            newText.style.opacity = '1';
        }, 50);

        // Clean up after transition
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';
        }, 650);
    }

    // Function to reset button state with animation
    function resetButtonState(button) {
        if (!button) return;
        
        // Create wrapper for smooth transition
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        
        // Create text elements for transition
        const oldText = document.createElement('div');
        oldText.innerHTML = button.innerHTML;
        oldText.style.position = 'absolute';
        oldText.style.width = '100%';
        oldText.style.top = '50%';
        oldText.style.transform = 'translateY(-50%) translateZ(0)';
        oldText.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        oldText.style.opacity = '1';

        const newText = document.createElement('div');
        newText.innerHTML = 'Join Waitlist';
        newText.style.position = 'absolute';
        newText.style.width = '100%';
        newText.style.top = '50%';
        newText.style.transform = 'translateY(50%) translateZ(0)';
        newText.style.opacity = '0';
        newText.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';

        // Set up the transition
        wrapper.appendChild(oldText);
        wrapper.appendChild(newText);
        button.innerHTML = '';
        button.appendChild(wrapper);

        // Trigger the transition with slight delay
        setTimeout(() => {
            oldText.style.transform = 'translateY(-150%) translateZ(0)';
            oldText.style.opacity = '0';
            newText.style.transform = 'translateY(-50%) translateZ(0)';
            newText.style.opacity = '1';
        }, 50);

        // Clean up after transition
        setTimeout(() => {
            button.innerHTML = 'Join Waitlist';
            button.classList.remove('btn-success');
            button.classList.add('btn-primary');
            button.disabled = false;
            button.style.width = ''; // Reset width
            button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }, 650);
    }

    // Counter Animation
    if (counter) {
        const firstPhaseStart = 1900;
        const firstPhaseEnd = 2000;
        const finalTarget = 2048;
        
        // First phase: 1900 to 2000 (30 seconds)
        const firstPhaseDuration = 30000;
        const firstPhaseStep = 100;
        
        // Second phase: 2000 to 2048 (5 minutes)
        const secondPhaseDuration = 300000; // 5 minutes
        const secondPhaseStep = 200;
        
        let currentNumber = firstPhaseStart;
        
        // First phase animation (faster)
        const firstPhaseInterval = setInterval(() => {
            currentNumber += (firstPhaseEnd - firstPhaseStart) / (firstPhaseDuration / firstPhaseStep);
            if (currentNumber <= firstPhaseEnd) {
                counter.textContent = Math.round(currentNumber).toLocaleString();
            } else {
                clearInterval(firstPhaseInterval);
                
                // Start second phase (slower)
                currentNumber = firstPhaseEnd;
                const secondPhaseInterval = setInterval(() => {
                    currentNumber += (finalTarget - firstPhaseEnd) / (secondPhaseDuration / secondPhaseStep);
                    if (currentNumber <= finalTarget) {
                        counter.textContent = Math.round(currentNumber).toLocaleString();
                    } else {
                        counter.textContent = finalTarget.toLocaleString();
                        clearInterval(secondPhaseInterval);
                    }
                }, secondPhaseStep);
            }
        }, firstPhaseStep);
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add animation on scroll
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.feature-card');
        
        elements.forEach(element => {
            const position = element.getBoundingClientRect();
            
            // Check if element is in viewport
            if (position.top < window.innerHeight && position.bottom >= 0) {
                element.classList.add('animate__animated', 'animate__fadeInUp');
            }
        });
    };

    // Initial check on page load
    animateOnScroll();
    
    // Check on scroll
    window.addEventListener('scroll', animateOnScroll);

    // Mobile menu toggle (if needed)
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Progress bar functionality
    const progressBar = document.getElementById('progress-bar');
    
    const updateProgressBar = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    };
    
    // Update progress bar on scroll
    window.addEventListener('scroll', updateProgressBar);
    // Initial update
    updateProgressBar();
}); 

// Add success animation styles
const style = document.createElement('style');
style.textContent = `
    .success-animation {
        transition: all 0.3s ease-in-out;
    }
    .success-animation:disabled {
        cursor: default;
    }
`;
document.head.appendChild(style); 