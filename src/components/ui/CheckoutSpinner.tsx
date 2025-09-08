"use client"

import { motion } from 'framer-motion'
import { CreditCard, Shield, Clock } from 'lucide-react'

export default function CheckoutSpinner() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 mx-4 max-w-sm w-full"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
            className="w-16 h-16 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <CreditCard className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="text-xl font-bold text-gray-900 mb-2"
          >
            Processing Your Order
          </motion.h2>
          
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-gray-600 text-sm"
          >
            Redirecting to secure checkout
          </motion.p>
        </div>

        {/* Animated Spinner */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-gray-200 border-t-[#1e3a8a] rounded-full"
          />
        </div>

        {/* Status Indicators */}
        <div className="space-y-3">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
            <span className="text-gray-700">Order validated</span>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-3 h-3 text-blue-500" />
            </div>
            <span className="text-gray-700">Secure payment processing</span>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-3 h-3 text-orange-500" />
            </div>
            <span className="text-gray-700">Preparing checkout session</span>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 1, duration: 2, ease: "easeOut" }}
          className="mt-6 h-1 bg-gray-200 rounded-full overflow-hidden"
        >
          <div className="h-full bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] rounded-full" />
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.3 }}
          className="text-xs text-gray-500 text-center mt-4"
        >
          Powered by Twyst Technology • Secure & encrypted
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
