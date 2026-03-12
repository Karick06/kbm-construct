# Sage Accounting (Cloud) Integration Setup

To integrate Sage Accounting cloud with KBM Construct, you need to:

## 1. Create Sage Developer App Credentials

1. Sign in to the Sage Developer portal for your cloud account
2. Create a new app for KBM Construct
3. Add callback URL:
   - Local: `http://localhost:3000/api/auth/sage/callback`
   - Production: `https://your-domain.com/api/auth/sage/callback`
4. Note down:
   - Business Name
   - Client ID
   - Client Secret
   - Business ID

## 2. Add Credentials in KBM Construct (Recommended)

1. Open **Settings > Sage Integration**
2. Enter:
   - Business Name
   - Client ID
   - Client Secret
   - Business ID
   - Environment (sandbox or production)
3. Click **Save Configuration**
4. Click **Connect Sage OAuth**
5. Complete Sage authorization
6. Click **Test Connection**

The app stores this configuration locally in `.sage-config.json` (ignored by git).

On Vercel/serverless, config is stored in `/tmp/.sage-config.json` because `/var/task` is read-only.
You can override this path with `SAGE_CONFIG_FILE_PATH`.

If Sage OAuth shows a generic authorize error, set `SAGE_REDIRECT_URI` explicitly so it exactly matches the callback URL registered in your Sage app.

## 3. Set Environment Variables (Alternative)

Create a `.env.local` file in the project root:

```env
# Sage Accounting OAuth Configuration
SAGE_BUSINESS_NAME=your_business_name
SAGE_CLIENT_ID=your_client_id
SAGE_CLIENT_SECRET=your_client_secret
SAGE_BUSINESS_ID=your_business_id
SAGE_ENVIRONMENT=sandbox  # or production
```

## 4. Configure in App

1. Go to Settings > Sage Integration in the app
2. Enter your credentials
3. Click "Test Connection" to verify
4. Click "Save Configuration"

## What Gets Synced

### Commercial Section
- **Invoices**: All customer invoices from Sage
- **Payments**: Payment records
- **Contracts**: Invoice details and terms

### Procurement Section
- **Suppliers**: All vendor records
- **Purchase Orders**: PO data from Sage
- **Materials**: Line items from purchase orders

### Business Development
- **Clients**: Customer records synced from Sage

### Resources
- **Staff**: Employee data if available

## API Endpoints

- `GET /api/sage/invoices` - Fetch invoices
- `GET /api/sage/customers` - Fetch customers
- `GET /api/sage/suppliers` - Fetch suppliers
- `GET /api/sage/purchase-orders` - Fetch POs
- `GET /api/sage/accounts` - Fetch chart of accounts

## Troubleshooting

**Connection fails**: Check credentials and ensure API key has required permissions
**Data not syncing**: Verify Sage environment (sandbox/production) matches your setup
**Rate limiting**: Sage has API rate limits - implement caching for high-volume integrations
