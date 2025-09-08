"use client"

import { motion } from 'framer-motion'
import { Clock, Utensils, CheckCircle, Truck } from 'lucide-react'

export default function OrderLoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
            className="w-16 h-16 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <Clock className="w-8 h-8 text-white" />
          </motion.div>
          
          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="text-xl font-bold text-gray-900 mb-2"
          >
            Loading Your Order
          </motion.h2>
          
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-gray-600 text-sm"
          >
            Fetching the latest status
          </motion.p>
        </div>

        {/* Animated Spinner */}
        <div className="flex justify-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-gray-200 border-t-[#1e3a8a] rounded-full"
          />
        </div>

        {/* Order Status Preview */}
        <div className="space-y-4 mb-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-blue-500" />
            </div>
            <span className="text-gray-700">Connecting to order system</span>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
              <Utensils className="w-3 h-3 text-orange-500" />
            </div>
            <span className="text-gray-700">Retrieving order details</span>
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <Truck className="w-3 h-3 text-green-500" />
            </div>
            <span className="text-gray-700">Loading real-time updates</span>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 1, duration: 3, ease: "easeOut" }}
          className="h-1 bg-gray-200 rounded-full overflow-hidden mb-4"
        >
          <div className="h-full bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] rounded-full" />
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.3 }}
          className="text-xs text-gray-500 text-center"
        >
          Powered by Twyst Technology
        </motion.p>
      </motion.div>
    </div>
  )
}
