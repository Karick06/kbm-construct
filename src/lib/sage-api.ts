/**
 * Sage 50 API Client
 * Handles all API requests to Sage 50
 */

import { getSageApiBase, getSageConfig, hasSageCredentials } from './sage-config';

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

class SageAPIClient {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;
  private activeConfigSignature: string | null = null;

  private getConfigSignature() {
    const config = getSageConfig();
    return `${config.businessName}|${config.username}|${config.apiKey}|${config.tenantId}|${config.environment}`;
  }

  private async getAccessToken(): Promise<string> {
    const config = getSageConfig();
    if (!hasSageCredentials(config)) {
      throw new Error('Sage is not configured. Add credentials in Settings > Sage Integration.');
    }

    const configSignature = this.getConfigSignature();
    if (this.activeConfigSignature !== configSignature) {
      this.accessToken = null;
      this.tokenExpiry = null;
      this.activeConfigSignature = configSignature;
    }

    // Check if token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Authenticate with Sage
    const authResponse = await fetch(`${getSageApiBase(config)}/oauth/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: config.businessName,
        username: config.username,
        password: config.password,
        apiKey: config.apiKey,
        tenantId: config.tenantId,
      }),
    });

    if (!authResponse.ok) {
      throw new Error(`Sage authentication failed: ${authResponse.statusText}`);
    }

    const { access_token, expires_in } = await authResponse.json();
    this.accessToken = access_token;
    this.tokenExpiry = Date.now() + (expires_in * 1000);

    return access_token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const config = getSageConfig();
    const token = await this.getAccessToken();

    const response = await fetch(`${getSageApiBase(config)}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Id': config.tenantId,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Sage API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as Promise<T>;
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
