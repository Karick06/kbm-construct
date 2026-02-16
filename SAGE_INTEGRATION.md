# Sage 50 Integration Setup

To integrate Sage 50 with KBM Construct, you need to:

## 1. Get Sage API Credentials

1. Log in to your Sage 50 account at https://columbus.sage.com
2. Go to Settings > API Management
3. Create a new API application
4. Note down:
   - Business Name
   - API Key
   - Tenant ID

## 2. Set Environment Variables

Create a `.env.local` file in the project root:

```env
# Sage 50 Configuration
SAGE_BUSINESS_NAME=your_business_name
SAGE_USERNAME=your_sage_username
SAGE_PASSWORD=your_sage_password
SAGE_API_KEY=your_api_key
SAGE_TENANT_ID=your_tenant_id
SAGE_ENVIRONMENT=sandbox  # or production
```

## 3. Configure in App

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
