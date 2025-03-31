# Supabase CORS Configuration for GitHub Pages

Follow these steps to properly configure CORS in Supabase to work with your GitHub Pages site:

1. Go to your Supabase dashboard: https://app.supabase.com/
2. Select your project
3. Click on "Project Settings" in the left sidebar
4. Navigate to "API" section
5. Scroll down to "CORS (Cross-Origin Resource Sharing)"
6. Under "Allowed Origins", add:
   - `https://recibee.github.io` 
   - If you have a custom domain, add that too
7. Click "Save"
8. Wait a few minutes for the changes to propagate

## Recommended Additional Settings

For more flexibility during development, you might want to add these too:
- `http://localhost:3000`
- `http://localhost:5000`
- `http://localhost:8000`
- Any other local development server you might use

## Troubleshooting

If you're still experiencing CORS issues after making these changes:
1. Clear your browser cache
2. Try an incognito/private window
3. Check your browser console for the exact error message
4. Ensure your GitHub Pages site is being served over HTTPS
5. Verify that there's no typo in the URL you added to allowed origins

Remember that CORS settings can take a few minutes to propagate after you save them. 