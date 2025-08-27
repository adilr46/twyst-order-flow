"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Utensils, Users, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FramerMotionSmokeTest from '@/components/test/FramerMotionSmokeTest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const demoVenue = 'demo-restaurant';

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-primary/5 to-background">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-center"
            >
              <div className="bg-primary/10 p-4 rounded-full">
                <Utensils className="h-16 w-16 text-primary" />
              </div>
            </motion.div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Twyst
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Modern restaurant ordering system with real-time updates, mobile-first design, and seamless FOH integration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="menu-card h-full">
                <CardHeader>
                  <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto">
                    <Utensils className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-center">Diner Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-center">
                    Browse menu, customize orders, and track status in real-time.
                  </p>
                  <Link href={`/d/${demoVenue}`} className="block">
                    <Button className="w-full cart-button animate-bounce-scale">
                      View Demo Menu
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="menu-card h-full">
                <CardHeader>
                  <div className="bg-success/10 p-3 rounded-full w-fit mx-auto">
                    <Users className="h-8 w-8 text-success" />
                  </div>
                  <CardTitle className="text-center">Order Tracking</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-center">
                    Real-time status updates with estimated preparation times.
                  </p>
                  <Link href={`/d/${demoVenue}/order`} className="block">
                    <Button variant="outline" className="w-full animate-bounce-scale">
                      View Order Status
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="menu-card h-full">
                <CardHeader>
                  <div className="bg-accent/10 p-3 rounded-full w-fit mx-auto">
                    <ChefHat className="h-8 w-8 text-accent" />
                  </div>
                  <CardTitle className="text-center">FOH Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-center">
                    Kitchen display system for managing orders and status updates.
                  </p>
                  <Link href={`/foh/${demoVenue}`} className="block">
                    <Button variant="outline" className="w-full animate-bounce-scale">
                      View Order Board
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="pt-8 space-y-4"
          >
            <Link href="/test-links">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Test Deep Links →
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mb-8">
              Built with React, TypeScript, Tailwind CSS, shadcn/ui, and Framer Motion
            </p>
            
            {/* Framer Motion Smoke Test */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8">
                <FramerMotionSmokeTest />
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
