import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-primary">
              Welcome to Twyst
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tap, Order, Pay, Go - The future of restaurant ordering
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/d/demo-cafe?t=demo123">
                🍽️ Demo Cafe Menu
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/dev-launch">
                🚀 Demo Launch
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/test-deeplinks">
                🔗 Test Links
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">📱 Tap to Order</h3>
              <p className="text-muted-foreground">
                Customers scan NFC tags or QR codes to instantly access your menu
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">💳 Seamless Payment</h3>
              <p className="text-muted-foreground">
                Integrated Stripe payments with real-time order tracking
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">🏃‍♂️ Quick Service</h3>
              <p className="text-muted-foreground">
                Live FOH dashboard for efficient order management
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

