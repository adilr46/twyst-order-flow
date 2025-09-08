"use client";

import { motion } from 'framer-motion';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';

interface BasketItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface BasketPageProps {
  items: BasketItem[];
  subtotal: number;
  tax: number;
  total: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onClearBasket: () => void;
}

export default function BasketPage({
  items,
  subtotal,
  tax,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClearBasket
}: BasketPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Your Basket</h1>
            <button
              onClick={onClearBasket}
              className="text-red-600 text-sm font-medium hover:text-red-700"
            >
              Clear All
            </button>
          </div>
        </div>
      </header>

      {/* Basket Items */}
      <main className="px-4 py-6 space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Your basket is empty</h2>
            <p className="text-gray-500">Add some delicious items to get started!</p>
          </div>
        ) : (
          items.map((item) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
            >
              <div className="flex items-center gap-4">
                {/* Item Image */}
                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    £{item.price.toFixed(2)} each
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </motion.button>
                  
                  <span className="w-8 text-center font-semibold text-gray-900">
                    {item.quantity}
                  </span>
                  
                  <motion.button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </motion.button>
                </div>

                {/* Remove Button */}
                <motion.button
                  onClick={() => onRemoveItem(item.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Item Total */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-600">Item total</span>
                <span className="font-bold text-gray-900">
                  £{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </motion.article>
          ))
        )}
      </main>

      {/* Sticky Checkout Bar */}
      {items.length > 0 && (
        <footer className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="space-y-3">
            {/* Totals */}
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

            {/* Checkout Button */}
            <motion.button
              onClick={onCheckout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Proceed to Checkout
            </motion.button>
          </div>
        </footer>
      )}
    </div>
  );
}
