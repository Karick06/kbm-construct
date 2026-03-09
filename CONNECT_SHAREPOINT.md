# Connect to Your SharePoint - Step-by-Step Guide

Follow these steps to connect KBM Construct to your SharePoint account.

---

## Step 1: Register Azure AD Application (10 minutes)

### 1.1 Open Azure Portal
Go to: https://portal.azure.com

### 1.2 Navigate to App Registrations
- Click **Azure Active Directory** (or search for it)
- Click **App registrations** in the left sidebar
- Click **+ New registration**

### 1.3 Create Application
Fill in:
- **Name**: `KBM Construct`
- **Supported account types**: 
  - Choose: `Accounts in this organizational directory only (Single tenant)`
- **Redirect URI**:
  - Platform: `Web`
  - URL: `http://localhost:3000/api/auth/microsoft/callback` (for testing)
  
Click **Register**

### 1.4 Copy Application IDs
You'll see the Overview page. **Copy these values:**

```
Application (client) ID: [Copy this]
Directory (tenant) ID: [Copy this]
```

Keep these in a text file - you'll need them soon!

### 1.5 Create Client Secret
1. In the left sidebar, click **Certificates & secrets**
2. Click **+ New client secret**
3. Description: `KBM Construct Secret`
4. Expires: `24 months`
5. Click **Add**
6. **⚠️ IMPORTANT:** Copy the **Value** immediately (you won't see it again!)

```
Client Secret Value: [Copy this immediately!]
```

### 1.6 Add API Permissions
1. In the left sidebar, click **API permissions**
2. Click **+ Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - ✅ `User.Read`
   - ✅ `Sites.ReadWrite.All`
   - ✅ `Files.ReadWrite.All`
   - ✅ `offline_access`
6. Click **Add permissions**
7. Click **✓ Grant admin consent for [Your Organization]** (requires admin)
8. Confirm by clicking **Yes**

---

## Step 2: Get SharePoint Site ID (5 minutes)

### 2.1 Open Graph Explorer
Go to: https://developer.microsoft.com/graph/graph-explorer

### 2.2 Sign In
- Click **Sign in to Graph Explorer**
- Use your Microsoft 365 account
- Grant requested permissions

### 2.3 Find Your Site
In the query box, run:
```
GET https://graph.microsoft.com/v1.0/sites?search=YOUR_SITE_NAME
```

Replace `YOUR_SITE_NAME` with your site name (e.g., "Documents" or "KBM Projects")

Click **Run query**

### 2.4 Copy Site ID
In the response, find the `id` field:
```json
{
  "value": [
    {
      "id": "contoso.sharepoint.com,abc123...",  ← Copy this entire value
      "displayName": "Your Site Name",
      "webUrl": "https://..."
    }
  ]
}
```

### 2.5 Get Drive ID
Now run this query (replace `{site-id}` with the ID you just copied):
```
GET https://graph.microsoft.com/v1.0/sites/{site-id}/drives
```

In the response, copy the first drive's `id`:
```json
{
  "value": [
    {
      "id": "b!xyz789...",  ← Copy this
      "name": "Documents",
      "driveType": "documentLibrary"
    }
  ]
}
```

**Alternative:** Use our helper script:
```bash
cd /Users/mick/Desktop/kbm-construct
# Edit scripts/get-sharepoint-ids.js with your site name and token
node scripts/get-sharepoint-ids.js
```

---

## Step 3: Configure Environment Variables (2 minutes)

### 3.1 Create .env.local file
In your project root (`/Users/mick/Desktop/kbm-construct`), create `.env.local`:

```bash
# Authentication Mode
NEXT_PUBLIC_AUTH_MODE=microsoft

# Microsoft Azure AD
MICROSOFT_CLIENT_ID=your-application-client-id-here
MICROSOFT_CLIENT_SECRET=your-client-secret-value-here
MICROSOFT_TENANT_ID=your-directory-tenant-id-here

# SharePoint Configuration
SHAREPOINT_SITE_ID=your-sharepoint-site-id-here
SHAREPOINT_DRIVE_ID=your-document-library-drive-id-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.2 Paste Your Values
Replace each placeholder with the values you copied:

- `MICROSOFT_CLIENT_ID`: From Step 1.4
- `MICROSOFT_CLIENT_SECRET`: From Step 1.5 
- `MICROSOFT_TENANT_ID`: From Step 1.4
- `SHAREPOINT_SITE_ID`: From Step 2.4
- `SHAREPOINT_DRIVE_ID`: From Step 2.5

---

## Step 4: Test Locally (3 minutes)

### 4.1 Restart Development Server
```bash
cd /Users/mick/Desktop/kbm-construct
npm run dev
```

### 4.2 Test Microsoft Login
1. Open: http://localhost:3000/login
2. You should see a **"Sign in with Microsoft"** button
3. Click it
4. You'll be redirected to Microsoft login
5. Sign in with your Microsoft 365 account
6. Grant permissions when asked
7. You'll be redirected back to the app

### 4.3 Test Photo Upload
1. Go to **Site Diary**
2. Click **+ New Entry**
3. Click **Camera** or **Upload Photo**
4. Select/capture an image
5. Save the entry
6. Check your SharePoint site - the photo should be there!

**Location in SharePoint:**
```
Documents/
  └── Site Diary/
      └── {Project Name}/
          └── {Date}/
              └── photo.jpg
```

---

## Step 5: Deploy to Production (5 minutes)

### 5.1 Update Azure Redirect URI
1. Go back to Azure Portal > Your App Registration
2. Click **Authentication**
3. Under **Web** redirect URIs, add:
   ```
   https://your-domain.vercel.app/api/auth/microsoft/callback
   ```
4. Click **Save**

### 5.2 Add Environment Variables to Vercel
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add each variable from your `.env.local`:
   - `NEXT_PUBLIC_AUTH_MODE` = `microsoft`
   - `MICROSOFT_CLIENT_ID` = `[your value]`
   - `MICROSOFT_CLIENT_SECRET` = `[your value]`
   - `MICROSOFT_TENANT_ID` = `[your value]`
   - `SHAREPOINT_SITE_ID` = `[your value]`
   - `SHAREPOINT_DRIVE_ID` = `[your value]`
   - `NEXT_PUBLIC_APP_URL` = `https://your-domain.vercel.app`
3. Click **Save** for each

### 5.3 Deploy
```bash
git add .
git commit -m "Configure SharePoint integration"
git push origin main
```

Vercel will automatically deploy with the new environment variables.

---

## Troubleshooting

### "Login button doesn't appear"
- Check `.env.local` has `NEXT_PUBLIC_AUTH_MODE=microsoft`
- Restart dev server: `npm run dev`

### "Redirect URI mismatch"
- Ensure redirect URI in Azure matches exactly:
  - Local: `http://localhost:3000/api/auth/microsoft/callback`
  - Production: `https://your-domain.vercel.app/api/auth/microsoft/callback`

### "Upload fails silently"
- Check browser console for errors
- Verify `SHAREPOINT_SITE_ID` and `SHAREPOINT_DRIVE_ID` are correct
- Check Microsoft Graph permissions are granted

### "Permission denied"
- Ensure admin consent was granted in Azure (Step 1.6)
- Check your Microsoft account has access to the SharePoint site
- Try re-authenticating (logout then login again)

---

## What Happens Next?

Once configured:
- ✅ Users sign in with their Microsoft 365 accounts
- ✅ Photos upload to SharePoint automatically
- ✅ Files organized by project and date
- ✅ Everything accessible in SharePoint site
- ✅ Offline fallback if SharePoint unavailable

---

## Need Help?

Check the full documentation:
- [SHAREPOINT_INTEGRATION.md](SHAREPOINT_INTEGRATION.md) - Complete technical guide
- [SHAREPOINT_QUICKSTART.md](SHAREPOINT_QUICKSTART.md) - Quick reference

Or contact your IT administrator for:
- Azure AD admin access
- SharePoint site creation
- Permission troubleshooting

---

**Ready to connect? Start with Step 1! 🚀**
