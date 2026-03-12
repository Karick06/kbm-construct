/**
 * Sage 50 API Client
 * Handles all API requests to Sage 50
 */

import { getSageApiBase, getSageConfig, hasSageAppCredentials } from './sage-config';
import { getSageTokenUrl, hasSageOAuthTokens, updateSageConfig } from './sage-config';

export interface SageCustomer {
  id: string;
  name: string;
  reference: string;
  email: string;
  creditLimit: number;
  balance: number;
}

export interface SageSupplier {
  id: string;
  name: string;
  reference: string;
  email: string;
  phone: string;
  paymentTerms: string;
}

export interface SageInvoice {
  id: string;
  reference: string;
  customerId: string;
  amount: number;
  vatAmount: number;
  dueDate: string;
  status: 'Draft' | 'Submitted' | 'Sent' | 'Viewed' | 'Overdue' | 'Paid';
  issueDate: string;
  lines: SageInvoiceLine[];
}

export interface SageInvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface SagePurchaseOrder {
  id: string;
  reference: string;
  supplierId: string;
  amount: number;
  vatAmount: number;
  status: 'Draft' | 'Submitted' | 'Sent' | 'Acknowledged' | 'Received' | 'Invoiced';
  orderDate: string;
  dueDate: string;
}

export interface SageAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
}

export interface SageBusiness {
  id: string;
  name: string;
}

class SageAPIClient {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private activeConfigSignature: string | null = null;

  private getConfigSignature() {
    const config = getSageConfig();
    return `${config.businessName}|${config.clientId}|${config.clientSecret}|${config.businessId}|${config.environment}`;
  }

  private async refreshAccessToken() {
    const config = getSageConfig();
    if (!config.refreshToken) {
      throw new Error('Sage OAuth refresh token is missing. Reconnect Sage in Settings > Sage Integration.');
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: config.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    const tokenResponse = await fetch(getSageTokenUrl(config), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      throw new Error(
        `Sage token refresh failed (${tokenResponse.status}): ${tokenError || tokenResponse.statusText}`
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    updateSageConfig({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || config.refreshToken,
      tokenExpiry: Date.now() + tokenData.expires_in * 1000,
    });

    this.accessToken = tokenData.access_token;
    this.tokenExpiry = Date.now() + tokenData.expires_in * 1000;
  }

  private async getAccessToken(): Promise<string> {
    const config = getSageConfig();
    if (!hasSageAppCredentials(config)) {
      throw new Error('Sage is not configured. Add Client ID and Client Secret in Settings > Sage Integration.');
    }

    const configSignature = this.getConfigSignature();
    if (this.activeConfigSignature !== configSignature) {
      this.accessToken = null;
      this.tokenExpiry = null;
      this.activeConfigSignature = configSignature;
    }

    if (hasSageOAuthTokens(config)) {
      this.accessToken = config.accessToken || null;
      this.tokenExpiry = config.tokenExpiry || null;
    }

    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (config.refreshToken) {
      await this.refreshAccessToken();
      if (this.accessToken) {
        return this.accessToken;
      }
    }

    throw new Error('Sage is not connected yet. Click Connect Sage OAuth in Settings > Sage Integration.');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireBusinessId = true
  ): Promise<T> {
    const config = getSageConfig();
    const token = await this.getAccessToken();

    if (requireBusinessId && !config.businessId.trim()) {
      throw new Error('Sage Business ID is missing. Use Fetch Businesses in Settings > Sage Integration.');
    }

    const response = await fetch(`${getSageApiBase(config)}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(requireBusinessId ? { 'X-Tenant-Id': config.businessId } : {}),
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Sage API request failed (${response.status}): ${errorText || response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async getBusinesses(): Promise<SageBusiness[]> {
    const data = await this.request<{ businesses?: SageBusiness[]; items?: SageBusiness[] }>(
      '/businesses',
      {},
      false
    );
    return data.businesses || data.items || [];
  }

  // Customer methods
  async getCustomers(): Promise<SageCustomer[]> {
    const data = await this.request<{ customers: SageCustomer[] }>(
      `/customers?pageSize=200`
    );
    return data.customers || [];
  }

  async getCustomer(id: string): Promise<SageCustomer> {
    return this.request<SageCustomer>(`/customers/${id}`);
  }

  // Supplier methods
  async getSuppliers(): Promise<SageSupplier[]> {
    const data = await this.request<{ suppliers: SageSupplier[] }>(
      `/suppliers?pageSize=200`
    );
    return data.suppliers || [];
  }

  async getSupplier(id: string): Promise<SageSupplier> {
    return this.request<SageSupplier>(`/suppliers/${id}`);
  }

  // Invoice methods
  async getInvoices(): Promise<SageInvoice[]> {
    const data = await this.request<{ invoices: SageInvoice[] }>(
      `/sales/invoices?pageSize=200`
    );
    return data.invoices || [];
  }

  async getInvoice(id: string): Promise<SageInvoice> {
    return this.request<SageInvoice>(`/sales/invoices/${id}`);
  }

  async createInvoice(invoice: Partial<SageInvoice>): Promise<SageInvoice> {
    return this.request<SageInvoice>('/sales/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice),
    });
  }

  // Purchase Order methods
  async getPurchaseOrders(): Promise<SagePurchaseOrder[]> {
    const data = await this.request<{ purchaseOrders: SagePurchaseOrder[] }>(
      `/purchasing/purchaseOrders?pageSize=200`
    );
    return data.purchaseOrders || [];
  }

  async getPurchaseOrder(id: string): Promise<SagePurchaseOrder> {
    return this.request<SagePurchaseOrder>(`/purchasing/purchaseOrders/${id}`);
  }

  async createPurchaseOrder(
    po: Partial<SagePurchaseOrder>
  ): Promise<SagePurchaseOrder> {
    return this.request<SagePurchaseOrder>('/purchasing/purchaseOrders', {
      method: 'POST',
      body: JSON.stringify(po),
    });
  }

  // Chart of Accounts methods
  async getAccounts(): Promise<SageAccount[]> {
    const data = await this.request<{ accounts: SageAccount[] }>(
      `/ledger/accounts?pageSize=200`
    );
    return data.accounts || [];
  }

  async getAccount(id: string): Promise<SageAccount> {
    return this.request<SageAccount>(`/ledger/accounts/${id}`);
  }
}

// Export singleton instance
export const sageAPI = new SageAPIClient();
