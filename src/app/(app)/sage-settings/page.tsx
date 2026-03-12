/**
 * Sage Accounting Settings Page
 * Configure OAuth credentials and connect Sage cloud account
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type SageBusiness = {
  id: string;
  name: string;
};

export default function SageSettingsPage() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState({
    businessName: '',
    clientId: '',
    clientSecret: '',
    businessId: '',
    environment: 'sandbox' as 'production' | 'sandbox',
  });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [connected, setConnected] = useState(false);
  const [businesses, setBusinesses] = useState<SageBusiness[]>([]);

  const [testStatus, setTestStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/sage/config');
        if (!response.ok) {
          throw new Error('Failed to load Sage configuration');
        }

        const result = await response.json();
        if (result?.data) {
          setConfig({
            businessName: result.data.businessName || '',
            clientId: result.data.clientId || '',
            clientSecret: result.data.clientSecret || '',
            businessId: result.data.businessId || '',
            environment: result.data.environment || 'sandbox',
          });
          setConnected(Boolean(result.data.connected));
        }
      } catch {
        setTestStatus({
          status: 'error',
          message: 'Unable to load saved Sage configuration',
        });
      } finally {
        setLoadingConfig(false);
      }
    };

    void loadConfig();
  }, []);

  useEffect(() => {
    if (searchParams.get('sage_connected') === '1') {
      setConnected(true);
      setTestStatus({
        status: 'success',
        message: 'Sage OAuth connected successfully.',
      });
    }

    const callbackError = searchParams.get('sage_error');
    if (callbackError) {
      setTestStatus({
        status: 'error',
        message: `Sage OAuth failed: ${callbackError}`,
      });
    }
  }, [searchParams]);

  const handleSave = async () => {
    try {
      setTestStatus({ status: 'loading', message: 'Saving configuration...' });
      
      // In production, send to secure backend endpoint
      const response = await fetch('/api/sage/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Failed to save configuration');
      }

      setTestStatus({ status: 'success', message: 'Configuration saved successfully' });
    } catch (error) {
      setTestStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Configuration save failed',
      });
    }
  };

  const handleConnectOAuth = async () => {
    try {
      setTestStatus({ status: 'loading', message: 'Opening Sage OAuth...' });
      const response = await fetch('/api/auth/sage/login');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Failed to start Sage OAuth');
      }

      const data = await response.json();
      if (!data?.authUrl) {
        throw new Error('Sage OAuth URL was not returned');
      }

      window.location.href = data.authUrl;
    } catch (error) {
      setTestStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to start OAuth connection',
      });
    }
  };

  const handleFetchBusinesses = async () => {
    try {
      setTestStatus({ status: 'loading', message: 'Fetching Sage businesses...' });
      const response = await fetch('/api/sage/businesses');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Failed to fetch Sage businesses');
      }

      const result = await response.json();
      const list: SageBusiness[] = result?.data || [];
      setBusinesses(list);

      if (list.length === 0) {
        setTestStatus({
          status: 'error',
          message: 'No businesses found. Ensure your Sage account has at least one connected company.',
        });
        return;
      }

      if (!config.businessId) {
        setConfig((prev) => ({ ...prev, businessId: list[0].id }));
      }

      setTestStatus({
        status: 'success',
        message: `Found ${list.length} business${list.length > 1 ? 'es' : ''}. Select one and click Save Configuration.`,
      });
    } catch (error) {
      setTestStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch businesses',
      });
    }
  };

  const handleTest = async () => {
    try {
      setTestStatus({ status: 'loading', message: 'Testing Sage connection...' });
      
      const response = await fetch('/api/sage/accounts');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || 'Connection test failed');
      }
      
      const data = await response.json();
      setTestStatus({
        status: 'success',
        message: `Connection successful! Found ${data.count} accounts`,
      });
    } catch (error) {
      setTestStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Sage Accounting OAuth</h2>

        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${connected ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'}`}>
          {connected ? 'Connected to Sage OAuth' : 'Not connected. Save credentials, then click Connect Sage OAuth.'}
        </div>

        {loadingConfig && (
          <div className="mb-4 rounded-lg bg-blue-900 px-4 py-3 text-sm text-blue-200">
            Loading saved Sage configuration...
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={config.businessName}
              onChange={(e) =>
                setConfig({ ...config, businessName: e.target.value })
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
              placeholder="Your company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Client ID
            </label>
            <input
              type="text"
              value={config.clientId}
              onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
              placeholder="Sage app client ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Client Secret
            </label>
            <input
              type="password"
              value={config.clientSecret}
              onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
              placeholder="Sage app client secret"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Business ID
            </label>
            {businesses.length > 0 ? (
              <select
                value={config.businessId}
                onChange={(e) => setConfig({ ...config, businessId: e.target.value })}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select Sage business</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name} ({business.id})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={config.businessId}
                onChange={(e) => setConfig({ ...config, businessId: e.target.value })}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
                placeholder="Click Fetch Businesses after OAuth"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Environment
            </label>
            <select
              value={config.environment}
              onChange={(e) =>
                setConfig({
                  ...config,
                  environment: e.target.value as 'production' | 'sandbox',
                })
              }
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleFetchBusinesses}
            className="rounded-lg border border-blue-500 px-6 py-2 font-semibold text-blue-400 hover:bg-blue-500 hover:text-white transition"
          >
            Fetch Businesses
          </button>
          <button
            onClick={handleConnectOAuth}
            className="rounded-lg border border-green-500 px-6 py-2 font-semibold text-green-400 hover:bg-green-500 hover:text-white transition"
          >
            Connect Sage OAuth
          </button>
          <button
            onClick={handleTest}
            className="rounded-lg border border-orange-500 px-6 py-2 font-semibold text-orange-500 hover:bg-orange-500 hover:text-white transition"
          >
            Test Connection
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600"
          >
            Save Configuration
          </button>
        </div>

        {testStatus.status !== 'idle' && (
          <div
            className={`mt-4 rounded-lg p-4 ${
              testStatus.status === 'success'
                ? 'bg-green-900 text-green-200'
                : testStatus.status === 'error'
                ? 'bg-red-900 text-red-200'
                : 'bg-blue-900 text-blue-200'
            }`}
          >
            {testStatus.message}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Integration Features</h2>
        <ul className="space-y-2 text-gray-300">
          <li>✓ Sync invoices to Commercial section</li>
          <li>✓ Sync purchase orders to Procurement section</li>
          <li>✓ Sync customers to Business Development</li>
          <li>✓ Sync suppliers to Procurement</li>
          <li>✓ Sync chart of accounts across all sections</li>
          <li>✓ OAuth token refresh for persistent connectivity</li>
        </ul>
      </div>
    </div>
  );
}
