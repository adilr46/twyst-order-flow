"use client";

import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';

interface CheckoutPageProps {
  email: string;
  tableNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  onApplePay: () => void;
  onGooglePay: () => void;
  onCardPayment: (cardData: any) => void;
  onBack: () => void;
}

export default function CheckoutPage({
  email,
  tableNumber,
  subtotal,
  tax,
  total,
  onApplePay,
  onGooglePay,
  onCardPayment,
  onBack
}: CheckoutPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1e3a8a] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] opacity-90"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full -translate-y-16 translate-x-16 opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500 rounded-full translate-y-12 translate-x-12 opacity-20"></div>
        
        <div className="relative px-4 py-6">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <h1 className="text-2xl font-bold text-white">Checkout</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Order Info */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">{email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Table number</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{tableNumber}</span>
                <button className="text-blue-600 text-sm font-medium">Edit</button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Discount</span>
              <button className="text-blue-600 text-sm font-medium">Add discount</button>
            </div>
          </div>
        </section>

        {/* Payment Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Section Header */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Payment details</h2>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Apple Pay Button */}
            <motion.button
              onClick={onApplePay}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded-sm"></div>
              </div>
              <span>Pay</span>
            </motion.button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or pay with card</span>
              </div>
            </div>

            {/* Card Form */}
            <div className="space-y-4">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="1234 1234 1234 1234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <div className="w-6 h-4 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">V</div>
                    <div className="w-6 h-4 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">M</div>
                    <div className="w-6 h-4 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">A</div>
                  </div>
                </div>
              </div>

              {/* Expiry and CVC */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry date
                  </label>
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="CVC"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Order Summary */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">£{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">VAT (20%)</span>
              <span className="text-gray-900">£{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">£{total.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Security Notice */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Lock className="w-4 h-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </main>
    </div>
  );
}
