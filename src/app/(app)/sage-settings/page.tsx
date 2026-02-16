/**
 * Sage 50 Settings Page
 * Configure Sage API credentials
 */

'use client';

import { useState } from 'react';

export default function SageSettingsPage() {
  const [config, setConfig] = useState({
    businessName: '',
    username: '',
    password: '',
    apiKey: '',
    tenantId: '',
    environment: 'sandbox' as 'production' | 'sandbox',
  });

  const [testStatus, setTestStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const handleSave = async () => {
    try {
      setTestStatus({ status: 'loading', message: 'Saving configuration...' });
      
      // In production, send to secure backend endpoint
      const response = await fetch('/api/sage/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      setTestStatus({ status: 'success', message: 'Configuration saved successfully' });
    } catch (error) {
      setTestStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Configuration save failed',
      });
    }
  };

  const handleTest = async () => {
    try {
      setTestStatus({ status: 'loading', message: 'Testing Sage connection...' });
      
      const response = await fetch('/api/sage/accounts');
      
      if (!response.ok) throw new Error('Connection test failed');
      
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
      <div>
        <h1 className="text-3xl font-bold text-white">Sage 50 Integration</h1>
        <p className="mt-2 text-gray-300">Configure your Sage 50 connection</p>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-xl font-bold text-white mb-6">API Credentials</h2>

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
              placeholder="Your Sage business name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
              placeholder="Sage username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
              placeholder="Sage password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
              placeholder="Your Sage API key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tenant ID
            </label>
            <input
              type="text"
              value={config.tenantId}
              onChange={(e) => setConfig({ ...config, tenantId: e.target.value })}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none"
              placeholder="Your Sage tenant ID"
            />
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
          <li>✓ Real-time data synchronization</li>
        </ul>
      </div>
    </div>
  );
}
