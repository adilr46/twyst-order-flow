"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { QrCode, AlertTriangle, Smartphone, ArrowRight, Nfc, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function ScanAgainContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams?.get('slug');
  const reason = searchParams?.get('reason');
  // Simplified MVP: assume QR code for now
  const isNFCDevice = false;
  const [isOnline, setIsOnline] = useState(true); // Default to true, update after mount

  // Safely check navigator.onLine after component mounts
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const getReasonMessage = (reason: string | null) => {
    switch (reason) {
      case 'no_token':
        return 'No table token found in the URL';
      case 'invalid_token':
        return 'The table token is invalid or expired';
      case 'session_expired':
        return 'Your dining session has expired';
      case 'venue_closed':
        return 'This venue is currently closed';
      case 'table_unavailable':
        return 'This table is currently unavailable';
      case 'maintenance':
        return 'The system is under maintenance';
      default:
        return 'Please scan the QR code or tap your NFC device again';
    }
  };

  const getReasonIcon = (reason: string | null) => {
    switch (reason) {
      case 'no_token':
      case 'invalid_token':
        return QrCode;
      case 'session_expired':
        return AlertTriangle;
      case 'venue_closed':
      case 'table_unavailable':
        return Smartphone;
      case 'maintenance':
        return WifiOff;
      default:
        return isNFCDevice ? Nfc : QrCode;
    }
  };

  const handleRetry = () => {
    if (slug) {
      router.push(`/d/${slug}`);
    } else {
      router.push('/');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleDevMode = () => {
    if (process.env.NODE_ENV === 'development') {
      router.push('/dev-launch');
    }
  };

  const ReasonIcon = getReasonIcon(reason || null);
  const reasonMessage = getReasonMessage(reason || null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Status Indicator */}
        <div className="flex items-center justify-center space-x-2 text-sm">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-muted-foreground">Offline</span>
            </>
          )}
        </div>

        {/* Main Card */}
        <Card className="border-2 border-dashed border-muted-foreground/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-3 rounded-full bg-muted">
              <ReasonIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-semibold">
              {isNFCDevice ? 'Tap Again' : 'Scan Again'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {reasonMessage}
              </AlertDescription>
            </Alert>

            {slug && (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Venue: <span className="font-medium">{slug}</span>
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleRetry}
                className="w-full"
                size="lg"
              >
                {isNFCDevice ? (
                  <>
                    <Nfc className="h-4 w-4 mr-2" />
                    Tap NFC Again
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan QR Code Again
                  </>
                )}
              </Button>

              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </div>

            {/* Troubleshooting */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="troubleshooting">
                <AccordionTrigger className="text-sm">
                  Need Help?
                </AccordionTrigger>
                <AccordionContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Common Solutions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Make sure you're scanning the correct QR code for your table</li>
                      <li>Check that you have a stable internet connection</li>
                      <li>Try refreshing the page and scanning again</li>
                      {isNFCDevice && (
                        <li>Ensure NFC is enabled on your device</li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Still having issues?</p>
                    <p>Please ask a staff member for assistance.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Development Mode Link */}
            {process.env.NODE_ENV === 'development' && (
              <div className="pt-4 border-t border-dashed">
                <Button
                  onClick={handleDevMode}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                >
                  Development Mode
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Powered by Twyst • Modern Dining Experience</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function ScanAgainPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ScanAgainContent />
    </Suspense>
  );
}