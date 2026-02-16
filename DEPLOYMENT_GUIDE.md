# Deployment Guide

## 🚀 Deploy to Vercel (Recommended)

### Option 1: Via Vercel Dashboard (Easiest)
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Vercel auto-detects Next.js - click "Deploy"
5. Done! Your app is live with automatic HTTPS

### Option 2: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts - it's that easy!
```

**Your app will be live at:** `https://your-project-name.vercel.app`

---

## 📱 PWA Features on Production

✅ **Service Worker** - Works automatically (requires HTTPS - Vercel provides this)
✅ **Install Prompt** - Users can "Add to Home Screen" on mobile
✅ **Offline Mode** - Your cached routes work offline
✅ **App Icons** - SVG icons display correctly

---

## ⚠️ Important: Data Storage Consideration

Your app currently uses `localStorage` for data storage. This means:

- ✅ **Development:** Data persists on your local browser
- ⚠️ **Production:** Each user's data is isolated to their browser
- ❌ **No cross-device sync:** Data doesn't sync between devices
- ❌ **Not suitable for multi-user:** Data isn't shared between users

### Recommended Next Steps for Production:

1. **Add a Database** (for persistent, shared data):
   - **Vercel Postgres** (free tier available)
   - **Supabase** (PostgreSQL + Auth)
   - **MongoDB Atlas** (NoSQL)
   - **PlanetScale** (MySQL)

2. **Add Authentication** (for user accounts):
   - **Clerk** (easiest, free tier)
   - **NextAuth.js** (open source)
   - **Supabase Auth** (included with Supabase)

---

## 🌐 Alternative Hosting Options

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```
**Features:** Free tier, automatic HTTPS, good Next.js support

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway up
```
**Features:** $5/month free credit, includes database options

### Render
- Go to [render.com](https://render.com)
- Create "New Web Service"
- Connect your Git repo
- Build command: `npm run build`
- Start command: `npm start`

**Features:** Free tier, includes database options

---

## 📋 Pre-Deployment Checklist

Before deploying, commit your changes:

```bash
# Add all files
git add .

# Commit changes
git commit -m "Add PWA features and prepare for deployment"

# Push to GitHub
git push origin main
```

### Environment Variables (if needed later)
When you add a database or external APIs, set environment variables in your hosting platform:

**Vercel:** Project Settings → Environment Variables
**Netlify:** Site Settings → Environment Variables
**Railway:** Project → Variables

---

## 🔄 Continuous Deployment

All platforms support automatic deployments:
- Push to `main` branch → Automatically deploys to production
- Push to other branches → Creates preview deployments
- Pull requests → Automatic preview URLs for testing

---

## 📊 Post-Deployment Testing

1. **Test PWA Installation:**
   - Open your production URL on mobile
   - Check for "Add to Home Screen" prompt
   - Install and test offline functionality

2. **Test All Features:**
   - Login/authentication
   - Navigation (desktop sidebar + mobile hamburger)
   - Leave management workflow
   - All module pages

3. **Check Service Worker:**
   - Open DevTools → Application → Service Workers
   - Verify it's registered and active

4. **Test Offline Mode:**
   - Open app online first
   - DevTools → Network → Offline
   - Navigate through cached pages

---

## 🆘 Troubleshooting

### Service Worker Not Working
- **Cause:** Not using HTTPS
- **Solution:** All hosting platforms provide HTTPS by default

### Build Failures
- Check build logs in your hosting platform
- Test locally: `npm run build`
- Ensure all dependencies are in `package.json`

### 404 Errors
- Ensure `output: 'standalone'` is NOT in `next.config.ts` (for Vercel)
- For other platforms, check their Next.js configuration

### Data Not Persisting
- Expected behavior with localStorage
- Implement database solution (see recommendations above)

---

## 💡 Quick Start Commands

```bash
# Commit your changes
git add .
git commit -m "Prepare for deployment"
git push origin main

# Deploy to Vercel (recommended)
npx vercel

# Or deploy to Netlify
npx netlify-cli deploy --prod
```

---

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Your PWA Guide](./PWA_MOBILE_GUIDE.md)

---

**Ready to deploy?** Run `npx vercel` in your terminal! 🚀
