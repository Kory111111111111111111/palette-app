# GitHub Pages Deployment Guide

## 🚨 Issues Fixed

Your UI was disappearing on GitHub Pages due to several critical configuration issues:

### 1. **Asset Path Problems** (CRITICAL)
- **Problem**: Generated HTML referenced assets with `/_next/` paths, but GitHub Pages serves from `/palette-app/` subdirectory
- **Solution**: Added `basePath` and `assetPrefix` configuration to Next.js config

### 2. **Node.js Version Mismatch**
- **Problem**: GitHub Actions used Node.js 18, but Next.js 15.5.3 requires Node.js 18.17+ or 20+
- **Solution**: Updated workflow to use Node.js 20

### 3. **Missing Production Environment**
- **Problem**: Build wasn't running in production mode
- **Solution**: Added `NODE_ENV=production` to build process

## 🔧 Configuration Changes Made

### `next.config.ts`
```typescript
const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/palette-app' : '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  distDir: 'out',
  basePath,           // ← FIXED: Added basePath for GitHub Pages
  assetPrefix: basePath, // ← FIXED: Added assetPrefix for GitHub Pages
  experimental: { esmExternals: false },
};
```

### `.github/workflows/github-pages.yml`
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # ← FIXED: Updated from '18' to '20'

- name: Build
  run: npm run build:gh-pages  # ← FIXED: Uses production build
```

### `package.json`
```json
{
  "scripts": {
    "build:gh-pages": "NODE_ENV=production next build"  // ← ADDED: Production build script
  }
}
```

## 🚀 Deployment Steps

### 1. **Enable GitHub Pages**
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

### 2. **Deploy Your Site**
1. Push your changes to the `main` or `master` branch
2. GitHub Actions will automatically build and deploy
3. Your site will be available at: `https://yourusername.github.io/palette-app/`

### 3. **Verify Deployment**
After deployment, check:
- [ ] Site loads without errors
- [ ] CSS styles are applied correctly
- [ ] JavaScript functionality works
- [ ] All assets load properly

## 🔍 Troubleshooting

### If UI Still Disappears:

#### 1. **Check Asset Paths**
Look at the generated `out/index.html` file. Asset paths should now include `/palette-app/`:
```html
<!-- CORRECT (after fix) -->
<link rel="stylesheet" href="/palette-app/_next/static/css/...">

<!-- WRONG (before fix) -->
<link rel="stylesheet" href="/_next/static/css/...">
```

#### 2. **Check GitHub Actions Logs**
1. Go to **Actions** tab in your repository
2. Click on the latest workflow run
3. Check the "Verify build output" step for any errors

#### 3. **Test Locally**
```bash
# Build for production
npm run build:gh-pages

# Serve locally to test
npx serve out
# Visit http://localhost:3000/palette-app
```

#### 4. **Common Issues**

**Issue**: 404 errors for assets
- **Cause**: Incorrect basePath configuration
- **Solution**: Ensure `basePath` matches your repository name

**Issue**: White screen of death
- **Cause**: JavaScript bundle not loading
- **Solution**: Check browser console for errors, verify asset paths

**Issue**: Styles not loading
- **Cause**: CSS files not found
- **Solution**: Verify `assetPrefix` configuration

## 📝 Additional Notes

### Repository Name
If your repository name is different from `palette-app`, update the `basePath` in `next.config.ts`:
```typescript
const basePath = isProd ? '/your-repo-name' : '';
```

### Custom Domain
If you're using a custom domain, remove the `basePath` and `assetPrefix`:
```typescript
const nextConfig: NextConfig = {
  // ... other config
  basePath: '',      // Remove for custom domain
  assetPrefix: '',   // Remove for custom domain
};
```

### Environment Variables
If you need environment variables for production:
1. Add them in GitHub repository settings under **Secrets and variables** → **Actions**
2. Reference them in your workflow:
```yaml
- name: Build
  run: npm run build:gh-pages
  env:
    YOUR_VAR: ${{ secrets.YOUR_SECRET }}
```

## ✅ Success Checklist

- [ ] `next.config.ts` has correct `basePath` and `assetPrefix`
- [ ] GitHub Actions workflow uses Node.js 20
- [ ] Build runs with `NODE_ENV=production`
- [ ] GitHub Pages is enabled with GitHub Actions source
- [ ] Repository name matches the `basePath` in config
- [ ] All assets load correctly in production
- [ ] UI renders properly on GitHub Pages

Your site should now work correctly on GitHub Pages! 🎉
