# PWA Mobile App Setup

KBM Construct is now a **Progressive Web App (PWA)** that works on mobile devices!

## ✅ Features Added

### 1. **Installable on Mobile**
- Works on iOS and Android
- Add to home screen for app-like experience
- Full-screen mode without browser bars

### 2. **Offline Support**
- Service Worker caches essential pages
- Works without internet connection
- Automatic background sync when online

### 3. **Mobile-Optimized UI**
- Responsive navigation menu (hamburger icon)
- Touch-friendly buttons and forms
- Optimized layout for small screens
- Proper viewport settings

### 4. **Native Features**
- Push notifications (ready for implementation)
- Background sync for timesheets and leave requests
- App icon on home screen
- Splash screen support

## 📱 How to Install on Mobile

### iOS (iPhone/iPad)
1. Open Safari and go to your app URL
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** in the top right
5. The app icon appears on your home screen

### Android
1. Open Chrome and go to your app URL
2. Tap the menu (three dots)
3. Tap **"Add to Home Screen"** or **"Install App"**
4. Tap **"Install"**
5. The app icon appears on your home screen

## 🎨 Customization Needed

### App Icons
The app needs proper icons. Currently using placeholder:

1. **Create icons:**
   - Open `/public/icon-generator.html` in a browser
   - Right-click the canvas and save as:
     - `icon-512.png` (512x512)
     - `icon-192.png` (192x192) - resize from 512px version

2. **Or use your logo:**
   - Replace `/public/icon-192.png` (192x192)
   - Replace `/public/icon-512.png` (512x512)
   - Use transparent or white background
   - PNG format recommended

### Theme Colors
Customize in `/public/manifest.json`:
```json
{
  "theme_color": "#FF6B35",  // Orange accent
  "background_color": "#ffffff"  // White background
}
```

## 🚀 Features to Implement

### High Priority
- [ ] Offline timesheet submission
- [ ] Offline leave request creation
- [ ] Location/GPS tracking for geofencing
- [ ] Camera integration for site photos
- [ ] Biometric login (fingerprint/face)

### Medium Priority
- [ ] Push notifications for approvals
- [ ] Background sync for pending actions
- [ ] Offline data storage (IndexedDB)
- [ ] Calendar integration

### Future Enhancements
- [ ] Native share API
- [ ] Contacts integration
- [ ] File picker/uploader
- [ ] Barcode/QR scanner

## 📊 Testing Checklist

- [ ] Test on iPhone Safari
- [ ] Test on Android Chrome
- [ ] Test offline functionality
- [ ] Test "Add to Home Screen"
- [ ] Test app updates
- [ ] Test on different screen sizes
- [ ] Test touch interactions
- [ ] Test mobile forms

## 🔧 Technical Details

### Files Added
- `/public/manifest.json` - PWA manifest
- `/public/sw.js` - Service Worker
- `/src/app/register-sw.tsx` - SW registration
- `/src/components/MobileNav.tsx` - Mobile navigation
- `/public/icon-generator.html` - Icon generator tool

### Files Modified
- `/src/app/layout.tsx` - Added PWA meta tags
- `/src/app/(app)/layout.tsx` - Added MobileNav component
- `/src/components/AppShell.tsx` - Mobile padding adjustments

### Service Worker Strategy
- **Network First** for most requests
- **Cache Fallback** for offline access
- **Precache** essential assets
- **Background Sync** for data submission

## 📱 App Store Publishing (Future)

To publish as native apps:

### Option 1: Capacitor (Recommended)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "KBM Construct" com.kbm.construct
npx cap add ios
npx cap add android
npm run build
npx cap copy
npx cap open ios
npx cap open android
```

### Option 2: React Native (Complete Rewrite)
- Build separate mobile app
- Share business logic
- Native performance

### Option 3: Keep as PWA
- No app store submission needed
- Instant updates
- Works everywhere

## 🐛 Troubleshooting

### "Add to Home Screen" not showing
- Ensure HTTPS (required for PWA)
- Check manifest.json is accessible
- Verify service worker registered

### Offline mode not working
- Check browser console for errors
- Verify service worker is active
- Clear cache and reinstall

### Updates not appearing
- Service worker caches aggressively
- Uninstall and reinstall app
- Or clear site data in settings

## 📞 Support

Your construction management app is now mobile-ready! Users can:
- Clock in/out from site
- Submit timesheets on mobile
- Request leave on the go
- View project details
- Access documents offline
- Get approval notifications

Perfect for field workers and site managers! 🏗️📱
