"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Nfc, QrCode, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NFCOnlyBlockerProps {
  venueName?: string;
  venueSlug?: string;
}

/**
 * NFC-ONLY Blocker Component
 * Shows when user tries to access menu without table token
 * No fallback options - strict NFC/QR only
 */
export const NFCOnlyBlocker: React.FC<NFCOnlyBlockerProps> = ({ 
  venueName, 
  venueSlug 
}) => {
  // Simplified MVP: assume QR code for now
  const isNFCDevice = false;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg mx-auto space-y-6"
      >
        {/* Main Alert */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="bg-primary/10 p-4 rounded-full">
              {isNFCDevice ? (
                <Nfc className="h-16 w-16 text-primary" />
              ) : (
                <QrCode className="h-16 w-16 text-primary" />
              )}
            </div>
          </motion.div>

          <h1 className="text-2xl font-bold text-foreground">
            {isNFCDevice ? 'Tap to Order' : 'Scan to Order'}
          </h1>
          <p className="text-muted-foreground">
            {venueName ? `Welcome to ${venueName}! ` : ''}
            {isNFCDevice 
              ? 'Please tap the NFC tag or scan the QR code at your table to view the menu.'
              : 'Please scan the QR code at your table to view the menu.'
            }
          </p>
        </div>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5" />
              How to Get Started
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex items-start gap-3"
              >
                <div className="bg-primary/10 p-2 rounded-full">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <h3 className="font-semibold">Find Your Table Tag</h3>
                  <p className="text-sm text-muted-foreground">
                    {isNFCDevice 
                      ? 'Look for the NFC tag or QR code on your table'
                      : 'Look for the QR code on your table'
                    }
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-start gap-3"
              >
                <div className="bg-accent/10 p-2 rounded-full">
                  <span className="text-sm font-bold text-accent">2</span>
                </div>
                <div>
                  <h3 className="font-semibold">
                    {isNFCDevice ? 'Tap or Scan' : 'Scan'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isNFCDevice 
                      ? 'Hold your phone near the NFC tag or use your camera to scan the QR code'
                      : 'Use your phone\'s camera to scan the QR code'
                    }
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex items-start gap-3"
              >
                <div className="bg-success/10 p-2 rounded-full">
                  <span className="text-sm font-bold text-success">3</span>
                </div>
                <div>
                  <h3 className="font-semibold">Start Ordering</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse the menu and place your order instantly
                  </p>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert className="border-primary/20 bg-primary/5">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary-foreground">
            <span className="font-medium">Secure Ordering:</span> We require table-specific access to ensure your order goes to the right place.
          </AlertDescription>
        </Alert>
      </motion.div>
    </div>
  );
};