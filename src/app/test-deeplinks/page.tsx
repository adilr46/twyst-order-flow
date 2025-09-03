"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TableTokenData {
  venueSlug: string;
  token: string;
  tableLabel: string;
  description: string;
}

const TestDeepLinks: React.FC = () => {
  const [testTokens, setTestTokens] = useState<TableTokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOrigin, setCurrentOrigin] = useState<string>('');
  const { toast } = useToast();

  // Set current origin after component mounts to avoid SSR issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  const fetchRealTokens = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dev-table-token');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.tokens && Array.isArray(data.tokens)) {
        setTestTokens(data.tokens);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch real tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      
      // Fallback to demo tokens
      setTestTokens([
        {
          venueSlug: 'demo-cafe',
          token: 'demo123',
          tableLabel: 'Table A1',
          description: 'Demo token for Blue Door Café'
        },
        {
          venueSlug: 'demo-cafe',
          token: 'demo456',
          tableLabel: 'Table A2',
          description: 'Demo token for Blue Door Café'
        },
        {
          venueSlug: 'demo-cafe',
          token: 'demo789',
          tableLabel: 'Table B1',
          description: 'Demo token for Blue Door Café'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTokens();
  }, []);

  const handleOpenLink = (link: string) => {
    if (typeof window !== 'undefined') {
      window.open(link, '_blank');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const generateDeepLink = (item: TableTokenData) => {
    return `${currentOrigin}/d/${item.venueSlug}?t=${item.token}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading test tokens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Deep Link Testing</h1>
        <p className="text-muted-foreground">
          Test NFC/QR token-based deep links for the Twyst ordering system
        </p>
      </div>

      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                Warning
              </Badge>
              <span className="text-sm text-yellow-800">
                {error} - Using demo tokens instead.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Available Test Tokens</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRealTokens}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testTokens.map((item, index) => {
          const link = generateDeepLink(item);
          
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  {item.tableLabel}
                  <Badge variant="secondary" className="text-xs">
                    Token
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">
                    <strong>Token:</strong> <span className="font-mono">{item.token}</span>
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => handleOpenLink(link)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test Link
                </Button>

                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(link)}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono break-all">
                  {link}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open('/dev-launch', '_blank');
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Dev Launch
            </Button>
            
            <Button
              variant="outline"
              onClick={() => copyToClipboard(`${currentOrigin}/d/demo-cafe`)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Base Menu URL
            </Button>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Base URL:</strong></p>
            <code className="bg-muted px-2 py-1 rounded text-xs break-all">
              {currentOrigin}/d/demo-cafe
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (typeof window !== 'undefined' && currentOrigin) {
                  window.open(`${currentOrigin}/d/demo-cafe`, '_blank');
                }
              }}
              className="ml-2"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          <div className="bg-muted p-3 rounded-md text-sm space-y-2">
            <p className="font-medium">How to test:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Click "Test Link" to open the deep link</li>
              <li>Verify the menu loads with the correct table context</li>
              <li>Try ordering items and check the flow</li>
              <li>Test without token parameter to see redirect behavior</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestDeepLinks;

