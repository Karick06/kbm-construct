import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

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

export const SAGE_CONFIG_FILE = path.join(process.cwd(), '.sage-config.json');

const parseEnvironment = (value: unknown): SageConfig['environment'] => {
  return value === 'production' ? 'production' : 'sandbox';
};

const getEnvSageConfig = (): SageConfig => {
  return {
    businessName: process.env.SAGE_BUSINESS_NAME || '',
    username: process.env.SAGE_USERNAME || '',
    password: process.env.SAGE_PASSWORD || '',
    apiKey: process.env.SAGE_API_KEY || '',
    tenantId: process.env.SAGE_TENANT_ID || '',
    environment: parseEnvironment(process.env.SAGE_ENVIRONMENT),
  };
};

const getSavedSageConfig = (): Partial<SageConfig> | null => {
  if (!fs.existsSync(SAGE_CONFIG_FILE)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(SAGE_CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SageConfig>;
    return parsed;
  } catch {
    return null;
  }
};

export const getSageConfig = (): SageConfig => {
  const envConfig = getEnvSageConfig();
  const savedConfig = getSavedSageConfig();

  return {
    businessName: savedConfig?.businessName ?? envConfig.businessName,
    username: savedConfig?.username ?? envConfig.username,
    password: savedConfig?.password ?? envConfig.password,
    apiKey: savedConfig?.apiKey ?? envConfig.apiKey,
    tenantId: savedConfig?.tenantId ?? envConfig.tenantId,
    environment: parseEnvironment(savedConfig?.environment ?? envConfig.environment),
  };
};

export const hasSageCredentials = (config: SageConfig = getSageConfig()): boolean => {
  return (
    config.businessName.trim().length > 0 &&
    config.username.trim().length > 0 &&
    config.password.trim().length > 0 &&
    config.apiKey.trim().length > 0 &&
    config.tenantId.trim().length > 0
  );
};

export const getSageApiBase = (config: SageConfig = getSageConfig()): string =>
  config.environment === 'production'
    ? 'https://api.columbus.sage.com/v1'
    : 'https://api.sandbox.columbus.sage.com/v1';
