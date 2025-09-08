"use client";

import { motion } from 'framer-motion';
import { CheckCircle, Clock, ChefHat, Truck, ArrowLeft, Info } from 'lucide-react';

interface OrderStatusPageProps {
  orderId: string;
  status: 'created' | 'paid' | 'in_prep' | 'ready' | 'served';
  tableNumber: string;
  estimatedTime?: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  onBack: () => void;
  onViewFullMenu: () => void;
}

const statusConfig = {
  created: { 
    label: 'Order Placed', 
    icon: Clock, 
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    description: 'We\'ve received your order and are preparing it'
  },
  paid: { 
    label: 'Payment Confirmed', 
    icon: CheckCircle, 
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Payment successful! Your order is being prepared'
  },
  in_prep: { 
    label: 'In Preparation', 
    icon: ChefHat, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    description: 'Our chefs are preparing your delicious meal'
  },
  ready: { 
    label: 'Ready for Collection', 
    icon: Truck, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Your order is ready! We\'ll bring it to your table'
  },
  served: { 
    label: 'Order Complete', 
    icon: CheckCircle, 
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Enjoy your meal! Thank you for dining with us'
  }
};

export default function OrderStatusPage({
  orderId,
  status,
  tableNumber,
  estimatedTime,
  items,
  total,
  onBack,
  onViewFullMenu
}: OrderStatusPageProps) {
  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  const steps = [
    { key: 'created', label: 'Order Placed' },
    { key: 'paid', label: 'Payment Confirmed' },
    { key: 'in_prep', label: 'In Preparation' },
    { key: 'ready', label: 'Ready' },
    { key: 'served', label: 'Served' }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === status);

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
            <h1 className="text-2xl font-bold text-white">Order Status</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Order Confirmation */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className={`w-16 h-16 ${currentStatus.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            <StatusIcon className={`w-8 h-8 ${currentStatus.color}`} />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            We've got your order!
          </h2>
          <p className="text-gray-600 mb-4">
            We'll bring your food to table {tableNumber}
          </p>
          
          {estimatedTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-blue-800 font-medium">
                Estimated time: {estimatedTime} minutes
              </p>
            </div>
          )}
        </section>

        {/* Status Timeline */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Progress</h3>
          
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const stepConfig = statusConfig[step.key as keyof typeof statusConfig];
              const StepIcon = stepConfig.icon;

              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted ? stepConfig.bgColor : 'bg-gray-100'
                  }`}>
                    <StepIcon className={`w-5 h-5 ${
                      isCompleted ? stepConfig.color : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <p className={`font-medium ${
                      isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-sm text-gray-600">
                        {stepConfig.description}
                      </p>
                    )}
                  </div>
                  
                  {isCompleted && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Order Details */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
            <button className="text-blue-600 text-sm font-medium flex items-center gap-1">
              <Info className="w-4 h-4" />
              View details
            </button>
          </div>
          
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                    {item.quantity}
                  </span>
                  <span className="text-gray-900">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">
                  £{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Forgot Something Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'cursive' }}>
            Forgot something?
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Sides */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center hover:border-gray-300 transition-colors"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <img src="/placeholder.jpg" alt="Sides" className="w-full h-full object-cover rounded-lg" />
              </div>
              <span className="text-sm font-medium text-gray-900">Sides</span>
            </motion.button>

            {/* Desserts */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center hover:border-gray-300 transition-colors"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <img src="/placeholder.jpg" alt="Desserts" className="w-full h-full object-cover rounded-lg" />
              </div>
              <span className="text-sm font-medium text-gray-900">Desserts</span>
            </motion.button>

            {/* Drinks */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center hover:border-gray-300 transition-colors"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <img src="/placeholder.jpg" alt="Drinks" className="w-full h-full object-cover rounded-lg" />
              </div>
              <span className="text-sm font-medium text-gray-900">Drinks</span>
            </motion.button>
          </div>

          <motion.button
            onClick={onViewFullMenu}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl relative"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-blue-400"></div>
            VIEW FULL MENU
          </motion.button>
        </section>
      </main>
    </div>
  );
}
