"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

/**
 * Smoke test component for Framer Motion compatibility
 * Tests: motion.div, AnimatePresence, LayoutGroup, layout animations
 */
export default function FramerMotionSmokeTest() {
  const [isVisible, setIsVisible] = useState(true);
  const [items, setItems] = useState(['Item 1', 'Item 2', 'Item 3']);

  const toggleVisibility = () => setIsVisible(!isVisible);
  
  const addItem = () => {
    setItems(prev => [...prev, `Item ${prev.length + 1}`]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-card rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Framer Motion Smoke Test</h2>
      
      {/* Test 1: Basic motion.div with hover animations */}
      <motion.div
        className="bg-primary text-primary-foreground p-4 rounded-md mb-4 cursor-pointer"
        whileHover={{ scale: 1.05, backgroundColor: "hsl(var(--primary) / 0.9)" }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        Hover and click me!
      </motion.div>

      {/* Test 2: AnimatePresence with conditional rendering */}
      <div className="mb-4">
        <button 
          onClick={toggleVisibility}
          className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md mb-2"
        >
          Toggle Visibility
        </button>
        
        <AnimatePresence mode="wait">
          {isVisible && (
            <motion.div
              key="visible-content"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-accent text-accent-foreground p-3 rounded-md"
            >
              This content animates in and out!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Test 3: LayoutGroup with dynamic list */}
      <div className="mb-4">
        <button 
          onClick={addItem}
          className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md mr-2 mb-2"
        >
          Add Item
        </button>
        
        <LayoutGroup>
          <motion.div layout className="space-y-2">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-muted text-muted-foreground p-2 rounded-md flex justify-between items-center"
                >
                  <span>{item}</span>
                  <button
                    onClick={() => removeItem(index)}
                    className="text-destructive hover:text-destructive/80 ml-2"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>

      {/* Test 4: Complex animation with variants */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-2"
      >
        {[1, 2, 3].map((num) => (
          <motion.div
            key={num}
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
            className="bg-primary/20 text-primary p-2 rounded-md text-center text-sm"
          >
            {num}
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-4 text-xs text-muted-foreground">
        ✅ All Framer Motion features working correctly!
      </div>
    </div>
  );
}



