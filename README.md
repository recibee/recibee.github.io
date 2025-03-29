# Recibee - Smart Recipe App Landing Page

A modern, responsive landing page for Recibee, a smart recipe app that allows users to capture ingredients they have on hand and find matching recipes with a single tap.

## Features

- **Modern UI Design**: Clean, intuitive, and visually appealing layout
- **Responsive Design**: Fully responsive for all device sizes
- **Interactive Elements**: 
  - Smooth animations and transitions
  - Interactive hover effects
  - Modern success popup notifications
  - Form validation
  - Loading states
- **User Engagement**: 
  - Dynamic counter animation
  - Feature cards with hover effects
  - Testimonial section
  - Smooth scroll navigation
- **Mobile-First**: Optimized for all screen sizes and devices
- **Performance Optimized**: Fast loading and smooth animations

## Technologies Used

- HTML5
- Tailwind CSS
- Vanilla JavaScript
- Font Awesome Icons
- Google Fonts (Inter & Choplin)

## Setup Instructions

1. Clone this repository to your local machine
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the CSS files
4. Open `pages/index.html` in your browser to view the landing page

## Project Structure

```
├── pages/                 # All HTML files
│   ├── index.html         # Main landing page
│   ├── login.html         # Login page
│   ├── signup.html        # Signup page
│   ├── upload.html        # Upload ingredients page
│   ├── recipes.html       # Recipe listing page
│   ├── recipe-details.html # Recipe details page
│   ├── account.html       # User account page
│   ├── privacy-policy.html # Privacy policy page
│   ├── terms-of-service.html # Terms of service page
│   ├── cookie-policy.html # Cookie policy page
│   └── 404.html           # Error page
├── assets/                # Static assets
│   ├── css/               # CSS files
│   ├── js/                # JavaScript files
│   ├── images/            # Image files
│   ├── icons/             # Icon files
│   └── includes/          # Reusable HTML components
├── src/                   # Source files for processing
│   └── input.css          # Input CSS for Tailwind
├── dist/                  # Distribution files
│   └── output.css         # Compiled CSS
├── docs/                  # Documentation files
├── .htaccess              # Apache rewrite rules
├── sitemap.xml            # Site map for SEO
├── robots.txt             # Robots file for SEO
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## Customization

### Colors

The main colors are defined in the Tailwind configuration:

```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#FF9500',    // Vibrant Orange
                secondary: '#2C5E2E',   // Earthy Green
                cream: '#FFF6E5',       // Soft Cream
                dark: '#1A1A1A',        // Dark Text
                light: '#FFFFFF',       // Pure White
                gray: '#F5F5F5',        // Light Gray
                accent: '#FFD166',      // Warm Yellow
            }
        }
    }
}
```

### Images

Replace the placeholder images with your actual app screenshots and recipe images:

1. Replace `https://placehold.co/400x600/1A1A1A/FFFFFF?text=App+Preview` with your app screenshot
2. Replace recipe placeholder images in the "Recipe Examples" section
3. Update user avatars in the testimonials section

## Features in Detail

### Waitlist Form
- Email validation
- Loading state indication
- Modern success popup
- Error handling with user feedback
- Smooth animations for better UX

### Navigation
- Smooth scrolling to sections
- Fixed header with transparent background
- Mobile-responsive menu

### Animations
- Feature card reveal on scroll
- Counter animation
- Hover effects on cards and buttons
- Popup transitions

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License

## Contact

For any questions or support, please contact [your-email@example.com](mailto:your-email@example.com) 