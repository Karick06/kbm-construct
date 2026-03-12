import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Sage 50 Integration Configuration
 * Handles API credentials and connection settings
 */

export interface SageConfig {
  businessName: string;
  clientId: string;
  clientSecret: string;
  businessId: string;
  environment: 'production' | 'sandbox';
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

export const SAGE_CONFIG_FILE = process.env.SAGE_CONFIG_FILE_PATH
  ? process.env.SAGE_CONFIG_FILE_PATH
  : process.env.VERCEL
  ? '/tmp/.sage-config.json'
  : path.join(process.cwd(), '.sage-config.json');

const parseEnvironment = (value: unknown): SageConfig['environment'] => {
  return value === 'production' ? 'production' : 'sandbox';
};

const getEnvSageConfig = (): SageConfig => {
  return {
    businessName: process.env.SAGE_BUSINESS_NAME || '',
    clientId: process.env.SAGE_CLIENT_ID || '',
    clientSecret: process.env.SAGE_CLIENT_SECRET || '',
    businessId: process.env.SAGE_BUSINESS_ID || '',
    environment: parseEnvironment(process.env.SAGE_ENVIRONMENT),
    accessToken: process.env.SAGE_ACCESS_TOKEN,
    refreshToken: process.env.SAGE_REFRESH_TOKEN,
    tokenExpiry: process.env.SAGE_TOKEN_EXPIRY ? Number(process.env.SAGE_TOKEN_EXPIRY) : undefined,
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
    clientId: savedConfig?.clientId ?? envConfig.clientId,
    clientSecret: savedConfig?.clientSecret ?? envConfig.clientSecret,
    businessId: savedConfig?.businessId ?? envConfig.businessId,
    environment: parseEnvironment(savedConfig?.environment ?? envConfig.environment),
    accessToken: savedConfig?.accessToken ?? envConfig.accessToken,
    refreshToken: savedConfig?.refreshToken ?? envConfig.refreshToken,
    tokenExpiry: savedConfig?.tokenExpiry ?? envConfig.tokenExpiry,
  };
};

export const saveSageConfig = (config: SageConfig): void => {
  fs.writeFileSync(SAGE_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
};

export const updateSageConfig = (patch: Partial<SageConfig>): SageConfig => {
  const current = getSageConfig();
  const updated: SageConfig = {
    ...current,
    ...patch,
    environment: parseEnvironment(patch.environment ?? current.environment),
  };

  saveSageConfig(updated);
  return updated;
};

export const hasSageCredentials = (config: SageConfig = getSageConfig()): boolean => {
  return hasSageAppCredentials(config) && config.businessId.trim().length > 0;
};

export const hasSageAppCredentials = (config: SageConfig = getSageConfig()): boolean => {
  return (
    config.clientId.trim().length > 0 &&
    config.clientSecret.trim().length > 0
  );
};

export const hasSageOAuthTokens = (config: SageConfig = getSageConfig()): boolean => {
  return Boolean(config.accessToken && config.refreshToken && config.tokenExpiry);
};

export const getSageApiBase = (config: SageConfig = getSageConfig()): string =>
  config.environment === 'production'
    ? 'https://api.columbus.sage.com/v1'
    : 'https://api.columbus.sage.com/v1';

export const getSageAuthorizeUrl = (config: SageConfig = getSageConfig()): string =>
  config.environment === 'production'
    ? 'https://www.sageone.com/oauth2/auth/central'
    : 'https://www.sageone.com/oauth2/auth/central';

export const getSageTokenUrl = (config: SageConfig = getSageConfig()): string =>
  config.environment === 'production'
    ? 'https://oauth.accounting.sage.com/token'
    : 'https://oauth.accounting.sage.com/token';
