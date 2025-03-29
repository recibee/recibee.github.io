# Recibee Site Structure

This document outlines the site structure and navigation flow of the Recibee landing page and application.

## Page Hierarchy

```
index.html (Landing Page)
├── signup.html (Sign Up)
├── login.html (Login)
├── upload.html (Upload Ingredients) ⟶ recipes.html (Recipe List) ⟶ recipe-details.html (Recipe Details)
├── account.html (User Account)
├── privacy-policy.html (Privacy Policy)
├── terms-of-service.html (Terms of Service)
├── cookie-policy.html (Cookie Policy)
└── 404.html (Error Page)
```

## User Flow

1. **New User:**
   - User lands on `index.html`
   - User clicks "Sign Up" → `signup.html`
   - After signup, user is redirected to `account.html`
   - User clicks "Upload Ingredients" → `upload.html`
   - After upload, user is redirected to `recipes.html`
   - User clicks on a recipe → `recipe-details.html`

2. **Returning User:**
   - User lands on `index.html`
   - User clicks "Login" → `login.html`
   - After login, user is redirected to `account.html`
   - User clicks "Upload Ingredients" → `upload.html`
   - After upload, user is redirected to `recipes.html`
   - User clicks on a recipe → `recipe-details.html`

3. **Free Trial User:**
   - Limited to 3 uploads
   - After 3 uploads, user is prompted to upgrade on `account.html`
   - User can upgrade to Pro for unlimited uploads

## Navigation Structure

### Primary Navigation (All Pages)
- Logo (Links to Home)
- Features (Links to index.html#features)
- How It Works (Links to index.html#how-it-works)
- Login/Sign Up OR Account (depending on login status)

### Footer Navigation (All Pages)
- Terms of Service
- Privacy Policy
- Contact Support

### Conditional Elements
- For logged-in users: "My Account" link
- For free users: Usage count (e.g., "2/3 Uses")
- For Pro users: No usage limitations

## Page Descriptions

- **Landing Page (index.html):**
  - Overview of Recibee app
  - Features section
  - How it works section
  - Testimonials
  - Call to action buttons

- **Sign Up (signup.html):**
  - Registration form
  - Google sign-up option
  - Plan selection
  - Terms acceptance

- **Login (login.html):**
  - Login form
  - Google sign-in option
  - Password reset option

- **Upload Ingredients (upload.html):**
  - File upload interface
  - Camera access
  - Upload progress indicator
  - Usage counter for free users

- **Recipes (recipes.html):**
  - List of matched recipes
  - Ingredient match percentages
  - Recipe cards with basic info

- **Recipe Details (recipe-details.html):**
  - Detailed recipe information
  - Ingredients list
  - Cooking instructions
  - Nutritional information
  - Similar recipes

- **Account (account.html):**
  - User profile information
  - Subscription details
  - Recent activity
  - Saved recipes
  - Upgrade options

## Responsive Design

All pages are responsive with these breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

Navigation changes on mobile to a hamburger menu, and layouts adjust for optimal viewing on smaller screens. 