# Recibee Assets Directory

This document provides an overview of the assets used in the Recibee landing page project.

## CSS Files

| File | Purpose |
|------|---------|
| `assets/css/styles.css` | Global styles for the entire site |
| `assets/css/styles-pages.css` | Page-specific styles |

## JavaScript Files

| File | Purpose |
|------|---------|
| `assets/js/script.js` | Main JavaScript file for global functionality |
| `assets/js/supabase.js` | Supabase integration for authentication and data |
| `assets/js/404.js` | Scripts for the 404 error page |

## Images

| File | Purpose |
|------|---------|
| `assets/images/detailes.png` | Feature details illustration |
| `assets/images/mockup-portrait.png` | App mockup in portrait orientation |

## Icons

| File | Purpose |
|------|---------|
| `assets/icons/favicon.ico` | Favicon for browser tabs |
| `assets/icons/favicon.svg` | Vector version of favicon |
| `assets/icons/favicon-16x16.png` | 16x16 favicon for browser tabs |
| `assets/icons/favicon-32x32.png` | 32x32 favicon for browser tabs |
| `assets/icons/favicon-192x192.png` | 192x192 favicon for PWA |
| `assets/icons/favicon-512x512.png` | 512x512 favicon for PWA |
| `assets/icons/apple-touch-icon.png` | Icon for iOS home screen |
| `assets/icons/orange-icon.svg` | Orange icon for UI elements |
| `assets/icons/recibee-favicon.svg` | Recibee logo in SVG format |

## Includes

| File | Purpose |
|------|---------|
| `assets/includes/footer.html` | Shared footer component for all pages |

## Public Assets

The `public/` directory contains:
- Recipe images
- User avatars
- Other public assets that don't require organization into specific subdirectories

## Organizing and Maintaining Assets

1. **Adding new assets**:
   - Add new images to the appropriate directory
   - Use descriptive filenames that indicate the content and purpose
   - Optimize images for web before adding them to the project

2. **Asset naming conventions**:
   - Use lowercase letters and hyphens for filenames
   - Use descriptive names that indicate the content
   - For icons with multiple sizes, include the dimensions in the filename

3. **Updating assets**:
   - When replacing an asset, ensure it maintains the same dimensions
   - If changing dimensions, ensure all references to the asset are updated
   - Test changes across different device sizes

4. **Removing assets**:
   - Before removing an asset, ensure it's not referenced anywhere in the codebase
   - Use search tools to check for references in HTML, CSS, and JavaScript files 