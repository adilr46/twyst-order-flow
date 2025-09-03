'use client';

import { useEffect, useState } from 'react';

interface HealthStatus {
  client: 'OK' | 'ERROR';
  api: {
    status: 'OK' | 'ERROR';
    message?: string;
  };
  env: {
    STRIPE_SECRET_KEY: boolean;
    STRIPE_WEBHOOK_SECRET: boolean;
    STRIPE_CONNECT_WEBHOOK_SECRET: boolean;
    NEXT_PUBLIC_APP_URL: boolean;
    NEXT_PUBLIC_SUPABASE_URL: boolean;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
    SUPABASE_SERVICE_ROLE_KEY: boolean;
    SUPABASE_JWT_SIGNING_SECRET: boolean;
  };
}

export default function PaymentsHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Check API health
        const response = await fetch('/api/checkout/health');
        const apiHealth = await response.json();

        const healthStatus: HealthStatus = {
          client: 'OK',
          api: apiHealth,
          env: {
            STRIPE_SECRET_KEY: !!process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY || apiHealth.env?.STRIPE_SECRET_KEY || false,
            STRIPE_WEBHOOK_SECRET: apiHealth.env?.STRIPE_WEBHOOK_SECRET || false,
            STRIPE_CONNECT_WEBHOOK_SECRET: apiHealth.env?.STRIPE_CONNECT_WEBHOOK_SECRET || false,
            NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY: apiHealth.env?.SUPABASE_SERVICE_ROLE_KEY || false,
            SUPABASE_JWT_SIGNING_SECRET: apiHealth.env?.SUPABASE_JWT_SIGNING_SECRET || false,
          }
        };

        setHealth(healthStatus);
      } catch (error) {
        setHealth({
          client: 'ERROR',
          api: { status: 'ERROR', message: 'Failed to reach API' },
          env: {
            STRIPE_SECRET_KEY: false,
            STRIPE_WEBHOOK_SECRET: false,
            STRIPE_CONNECT_WEBHOOK_SECRET: false,
            NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY: false,
            SUPABASE_JWT_SIGNING_SECRET: false,
          }
        });
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  if (loading) {
    return <div className="p-8">Loading health check...</div>;
  }

  if (!health) {
    return <div className="p-8">Failed to load health status</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payments Health Check</h1>
      
      <div className="space-y-6">
        {/* Client Status */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Client Status</h2>
          <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${
            health.client === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {health.client}
          </div>
        </div>

        {/* API Status */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">API Health</h2>
          <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${
            health.api.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {health.api.status}
          </div>
          {health.api.message && (
            <p className="mt-2 text-gray-600">{health.api.message}</p>
          )}
        </div>

        {/* Environment Variables */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Environment Variables</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(health.env).map(([key, present]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="font-mono text-sm">{key}</span>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {present ? '✅ Present' : '❌ Missing'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> STRIPE_CONNECT_WEBHOOK_SECRET is expected to be missing for now (platform-only verification).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


