# SharePoint Integration Guide

This guide explains how to configure KBM Construct to use **Microsoft SharePoint** instead of Supabase for authentication and file storage.

## Overview

The SharePoint integration provides:
- **Microsoft Entra ID (Azure AD)** authentication via OAuth 2.0
- **SharePoint Document Library** for file storage (photos, documents)
- **Microsoft Graph API** for programmatic access
- **Automatic folder organization** by project and date
- **Fallback to base64 storage** if SharePoint is unavailable

---

## Prerequisites

1. **Microsoft 365 account** with SharePoint access
2. **Azure AD admin access** to register applications
3. **SharePoint site** for your construction projects
4. **Node.js 18+** and npm installed

---

## Step 1: Register Azure AD Application

### 1.1 Create App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Configure:
   - **Name**: `KBM Construct`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: 
     - Platform: `Web`
     - URI: `https://your-domain.com/api/auth/microsoft/callback`
     - (For local dev: `http://localhost:3000/api/auth/microsoft/callback`)
5. Click **Register**

### 1.2 Create Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Description: `KBM Construct Secret`
4. Expires: `24 months` (recommended)
5. Click **Add**
6. **Copy the secret value immediately** (you won't see it again)

### 1.3 Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph** > **Delegated permissions**
4. Add these permissions:
   - ✅ `User.Read` - Read user profile
   - ✅ `Sites.ReadWrite.All` - Read/write SharePoint sites
   - ✅ `Files.ReadWrite.All` - Read/write files
   - ✅ `offline_access` - Refresh tokens
5. Click **Add permissions**
6. Click **Grant admin consent for [Your Organization]** (requires admin)

### 1.4 Note Your IDs

From the app registration **Overview** page, copy:
- **Application (client) ID**: `12345678-1234-1234-1234-123456789abc`
- **Directory (tenant) ID**: `87654321-4321-4321-4321-cba987654321`

---

## Step 2: Configure SharePoint Site

### 2.1 Create SharePoint Site

1. Go to [SharePoint](https://yourorg.sharepoint.com)
2. Click **Create site** > **Team site**
3. Site name: `KBM Construction Projects`
4. Description: `File storage for construction management`
5. Click **Finish**

### 2.2 Get Site and Drive IDs

You'll need to find your SharePoint site ID and document library (drive) ID.

#### Option A: Using Graph Explorer (Recommended)

1. Go to [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer)
2. Sign in with your Microsoft account
3. Run these queries:

**Find Site ID:**
```
GET https://graph.microsoft.com/v1.0/sites?search=KBM Construction Projects
```
Copy the `id` field from the response.

**Find Drive ID:**
```
GET https://graph.microsoft.com/v1.0/sites/{site-id}/drives
```
Replace `{site-id}` with the ID from above. Copy the `id` field of the default document library.

#### Option B: Using the Setup Script

Alternatively, create a Node.js script to fetch these automatically (after completing Step 3).

---

## Step 3: Configure Environment Variables

Create or update `.env.local` in your project root:

```bash
# Authentication Mode
NEXT_PUBLIC_AUTH_MODE=microsoft

# Microsoft Azure AD
MICROSOFT_CLIENT_ID=your-application-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret-value
MICROSOFT_TENANT_ID=your-directory-tenant-id

# SharePoint Configuration
SHAREPOINT_SITE_ID=your-sharepoint-site-id
SHAREPOINT_DRIVE_ID=your-document-library-drive-id

# Application URL (update for production)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production: https://your-domain.com
```

### Production Environment Variables (Vercel)

If deploying to Vercel:

1. Go to Vercel project **Settings** > **Environment Variables**
2. Add all variables above
3. Set **NEXT_PUBLIC_APP_URL** to your production domain
4. In Azure AD app registration, add production callback URL:
   ```
   https://your-domain.vercel.app/api/auth/microsoft/callback
   ```

---

## Step 4: Install Dependencies

Dependencies are already installed if you ran `npm install` after pulling this code:

```bash
npm install
```

Key packages:
- `@azure/msal-node` - Microsoft authentication
- `@microsoft/microsoft-graph-client` - SharePoint API client
- `@azure/identity` - Azure authentication helpers
- `isomorphic-fetch` - Fetch polyfill for Graph client

---

## Step 5: Test the Integration

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Test Login Flow

1. Navigate to `http://localhost:3000`
2. You should see a **"Sign in with Microsoft"** button
3. Click it and authenticate with your Microsoft account
4. After successful auth, you'll be redirected back to the app
5. Check browser cookies for `ms_access_token` and `user_email`

### 5.3 Test File Upload

1. Go to **Site Diary** page
2. Create a new diary entry
3. Click **Camera** or **Upload Photo**
4. Capture or select an image
5. Save the entry
6. Check your SharePoint document library:
   - Path: `Site Diary/{Project Name}/{Date}/`
   - File should be uploaded there

---

## File Organization

SharePoint files are organized automatically:

```
📁 Documents (SharePoint Drive Root)
├── 📁 Site Diary
│   ├── 📁 Project Alpha
│   │   ├── 📁 2026-03-09
│   │   │   ├── site-photo-2026-03-09-1234567890.jpg
│   │   │   └── site-photo-2026-03-09-1234567891.jpg
│   │   └── 📁 2026-03-10
│   └── 📁 Project Beta
├── 📁 Quality Inspections
├── 📁 Health & Safety
└── 📁 Compliance Documents
```

---

## Code Architecture

### Key Files Created

| File | Purpose |
|------|---------|
| `src/lib/microsoft-auth.ts` | Azure AD OAuth flow |
| `src/lib/sharepoint-client.ts` | SharePoint upload/download via Graph API |
| `src/lib/use-sharepoint-upload.ts` | React hook for file uploads |
| `src/app/api/auth/microsoft/login/route.ts` | Initiate OAuth login |
| `src/app/api/auth/microsoft/callback/route.ts` | Handle OAuth callback |
| `src/app/api/auth/microsoft/logout/route.ts` | Clear session |
| `src/app/api/auth/microsoft/me/route.ts` | Get current user |
| `src/app/api/sharepoint/upload/route.ts` | Upload file to SharePoint |

### Updated Files

| File | Changes |
|------|---------|
| `src/lib/auth-context.tsx` | Added `loginWithMicrosoft()`, Microsoft session handling |
| `src/app/(app)/site-diary/page.tsx` | Updated to upload photos to SharePoint |

---

## Fallback Behavior

The system gracefully falls back to base64 storage if:
- `NEXT_PUBLIC_AUTH_MODE` is not set to `"microsoft"`
- SharePoint upload fails (network issues, permissions)
- User is not authenticated

This ensures the app works **offline** and during **SharePoint outages**.

---

## Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env.local` to Git
- ✅ Use Vercel/platform secrets for production
- ✅ Rotate client secrets every 12-24 months

### 2. Access Tokens
- ✅ Stored in HTTP-only cookies (not accessible to JavaScript)
- ✅ Short expiry (1 hour) with automatic refresh
- ✅ Cleared on logout

### 3. SharePoint Permissions
- ✅ Use least-privilege access (Files.ReadWrite.All, not Files.ReadWrite.AppFolder)
- ✅ Consider restricting to specific sites if needed
- ✅ Review app permissions quarterly

### 4. OAuth Redirect URIs
- ✅ Only whitelist your production domains
- ✅ Use HTTPS in production
- ✅ Validate state parameter (CSRF protection built into MSAL)

---

## Troubleshooting

### "Microsoft auth environment variables not configured"

**Solution**: Check that `.env.local` contains all three Microsoft variables:
```bash
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=...
```

Restart the dev server after updating `.env.local`.

---

### "Failed to authenticate with Microsoft"

**Causes**:
1. Incorrect client secret
2. Redirect URI mismatch
3. Missing API permissions

**Solution**:
1. Verify client secret is correct (regenerate if needed)
2. Check Azure app registration **Redirect URIs** match exactly
3. Ensure admin consent granted for Graph API permissions

---

### "SharePoint not configured"

**Solution**: Add SharePoint IDs to `.env.local`:
```bash
SHAREPOINT_SITE_ID=your-site-id
SHAREPOINT_DRIVE_ID=your-drive-id
```

Use Graph Explorer to find these IDs (see Step 2.2).

---

### "Upload failed" - Photos not appearing in SharePoint

**Debug steps**:
1. Check browser console for errors
2. Verify `ms_access_token` cookie exists
3. Check Azure app has `Sites.ReadWrite.All` permission
4. Ensure folder path doesn't contain invalid characters
5. Check SharePoint site is accessible to the logged-in user

**Temporary workaround**: Photos will still be stored as base64 in the diary entry, just not in SharePoint.

---

### Files not visible in SharePoint site

**Check**:
1. Navigate to SharePoint site
2. Click **Documents** library
3. Look for `Site Diary` folder
4. Check inside date folders

**Permissions**: Ensure your Microsoft account has **Edit** access to the SharePoint site.

---

## Migration from Supabase

If you're migrating from Supabase:

### Authentication

1. **Update `.env.local`**:
   ```bash
   # Change from:
   NEXT_PUBLIC_AUTH_MODE=supabase
   
   # To:
   NEXT_PUBLIC_AUTH_MODE=microsoft
   ```

2. **User Migration Options**:
   - **Option A**: Re-invite users to sign in with Microsoft
   - **Option B**: Manually map Supabase users to Microsoft accounts
   - **Option C**: Run dual auth (keep Supabase for legacy data)

### File Migration

Currently, photos are stored as base64 in localStorage/data. To migrate:

1. Export existing diary entries with photos
2. Upload photos to SharePoint using the bulk upload script
3. Update diary entries to reference SharePoint URLs

*Migration script coming soon - contact dev team if urgent.*

---

## Advanced Configuration

### Custom Folder Structure

Edit `src/app/(app)/site-diary/page.tsx`:

```typescript
// Current structure: Site Diary/{project}/{date}
const folderPath = `Site Diary/${currentEntry.project}/${currentEntry.date}`;

// Custom: Projects/{project}/Photos/{year}/{month}
const [year, month] = currentEntry.date.split('-');
const folderPath = `Projects/${currentEntry.project}/Photos/${year}/${month}`;
```

### File Size Limits

SharePoint has a 250 GB file size limit per file. For photos, compression is recommended:

```typescript
// Add image compression before upload
import { compressImage } from '@/lib/image-utils';
const compressed = await compressImage(imageDataUrl, 0.8); // 80% quality
```

### Metadata and Tagging

Enhance file metadata:

```typescript
// In sharepoint-client.ts, add metadata to uploads
const fileData = {
  name: fileName,
  file: fileContent,
  '@microsoft.graph.conflictBehavior': 'rename',
  // Custom metadata
  listItem: {
    fields: {
      Project: 'Alpha',
      Date: '2026-03-09',
      UploadedBy: userEmail,
    }
  }
};
```

---

## Support

For issues or questions:
- **Documentation**: This file and inline code comments
- **Microsoft Graph Docs**: https://learn.microsoft.com/graph/
- **Azure AD Docs**: https://learn.microsoft.com/azure/active-directory/

---

## Next Steps

Once SharePoint is working:

1. ✅ **Test file uploads** in Site Diary
2. ✅ **Configure production** environment variables in Vercel
3. ✅ **Train team** on Microsoft sign-in flow
4. ⬜ **Extend to other modules** (Quality Inspections, Compliance)
5. ⬜ **Set up SharePoint retention** policies
6. ⬜ **Configure backup** procedures

---

**Last Updated**: March 9, 2026  
**Version**: 1.0.0
