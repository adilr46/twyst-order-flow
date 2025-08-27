"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Rocket, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { buildDeepLink } from '@/utils/token';

const DevLaunch: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [venueSlug, setVenueSlug] = useState(searchParams?.get('slug') || '');
  const [tableLabel, setTableLabel] = useState(searchParams?.get('table') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Development only - redirect in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.replace('/');
    }
  }, [router]);

  const handleLaunch = async () => {
    if (!venueSlug || !tableLabel) {
      setError('Please enter both venue slug and table label');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the dev token generator edge function
      const { data, error: apiError } = await supabase.functions.invoke('dev-table-token', {
        body: { venueSlug, tableLabel }
      });

      if (apiError) throw apiError;

      if (!data.token) {
        throw new Error('No token returned from API');
      }

      // Build the deep link with proper token format and redirect
      const deepLink = `/d/${venueSlug}?t=${data.token}`;
      console.log('Launching dev session:', {
        venueSlug,
        tableLabel,
        token: data.token,
        table_session_id: data.table_session_id,
        deepLink
      });

      // Use window.location.href for full page navigation with token
      window.location.href = deepLink;

    } catch (err: any) {
      console.error('Launch error:', err);
      setError(err.message || 'Failed to launch dev session');
    } finally {
      setLoading(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Dev Launcher</h1>
          <p className="text-muted-foreground">
            Generate a table session and launch the ordering flow
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Rocket className="h-5 w-5 text-primary" />
              Launch Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="venue" className="text-foreground">Venue Slug</Label>
              <Input
                id="venue"
                value={venueSlug}
                onChange={(e) => setVenueSlug(e.target.value)}
                placeholder="demo-restaurant"
                className="bg-background border-border text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="table" className="text-foreground">Table Label</Label>
              <Input
                id="table"
                value={tableLabel}
                onChange={(e) => setTableLabel(e.target.value)}
                placeholder="Table 1"
                className="bg-background border-border text-foreground"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleLaunch}
              disabled={loading || !venueSlug || !tableLabel}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Launch Session
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-accent/10 border-accent/20">
          <CardHeader>
            <CardTitle className="text-sm text-accent-foreground">Quick Launch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setVenueSlug('demo-restaurant');
                  setTableLabel('Table 1');
                }}
                className="text-xs border-accent/20 text-accent-foreground hover:bg-accent/20"
              >
                Demo Restaurant - T1
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setVenueSlug('demo-cafe');
                  setTableLabel('A1');
                }}
                className="text-xs border-accent/20 text-accent-foreground hover:bg-accent/20"
              >
                Blue Door Café - A1
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click to prefill common venues
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevLaunch;