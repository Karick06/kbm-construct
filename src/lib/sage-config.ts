/**
 * Sage 50 Integration Configuration
 * Handles API credentials and connection settings
 */

export interface SageConfig {
  businessName: string;
  username: string;
  password: string;
  apiKey: string;
  tenantId: string;
  environment: 'production' | 'sandbox';
}

// In production, these should come from environment variables
const getSageConfig = (): SageConfig => {
  return {
    businessName: process.env.SAGE_BUSINESS_NAME || '',
    username: process.env.SAGE_USERNAME || '',
    password: process.env.SAGE_PASSWORD || '',
    apiKey: process.env.SAGE_API_KEY || '',
    tenantId: process.env.SAGE_TENANT_ID || '',
    environment: (process.env.SAGE_ENVIRONMENT as 'production' | 'sandbox') || 'sandbox',
  };
};

export const sageConfig = getSageConfig();

export const SAGE_API_BASE = 
  sageConfig.environment === 'production'
    ? 'https://api.columbus.sage.com/v1'
    : 'https://api.sandbox.columbus.sage.com/v1';
