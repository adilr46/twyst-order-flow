'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutProbePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionData, setSessionData] = useState<{
    sessionId: string;
    checkoutUrl: string;
    requestId?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createProbeSession = async () => {
    setIsLoading(true);
    setError(null);
    setSessionData(null);

    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({
          venueSlug: 'test-venue',
          cart: [
            {
              id: 'probe-item',
              name: 'Probe Item',
              unit_price_cents: 100, // £1.00
              qty: 1,
              notes: null
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Extract session ID from the checkout URL
      const sessionIdMatch = data.checkout_url?.match(/cs_test_[a-zA-Z0-9]+/);
      const sessionId = sessionIdMatch ? sessionIdMatch[0] : 'unknown';
      
      setSessionData({
        sessionId,
        checkoutUrl: data.checkout_url,
        requestId: data.requestId
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Text copied to clipboard',
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Checkout Probe</h1>
          <p className="text-gray-600 mt-2">
            Test Stripe session creation and verify fresh sessions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session Creation Test</CardTitle>
            <CardDescription>
              Click the button to create a new Stripe Checkout session. Each click should generate a unique session ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={createProbeSession} 
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? 'Creating Session...' : 'Create Session (probe)'}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}

            {sessionData && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800">Session Created Successfully</h3>
                  
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Session ID
                      </label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {sessionData.sessionId}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(sessionData.sessionId)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {sessionData.requestId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Request ID
                        </label>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            {sessionData.requestId}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(sessionData.requestId!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Checkout URL
                      </label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(sessionData.checkoutUrl)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(sessionData.checkoutUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Testing Instructions</h4>
                  <ul className="text-blue-700 text-sm mt-2 space-y-1">
                    <li>• Open the checkout URL exactly once in a fresh tab</li>
                    <li>• If Stripe shows "refresh" error, report the Session ID and Request ID</li>
                    <li>• Each button click should generate a different Session ID</li>
                    <li>• Session IDs should start with "cs_test_"</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
