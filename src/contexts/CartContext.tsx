"use client"
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { CartItem, CartState } from '@/types'; 
import { calculateTotal, isValidPrice } from '@/utils/price';

interface CartContextType {
  cart: CartState;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  loadCartFromStorage: () => void;
  saveCartToStorage: () => void;
  isCartValid: () => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; qty: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Validate item has valid price
      if (!isValidPrice(action.payload.price_cents)) {
        console.error('Invalid item price:', action.payload.price_cents);
        return state;
      }

      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex]!.qty += action.payload.qty;
        
        return {
          ...state,
          items: updatedItems,
          totalAmount: calculateTotal(updatedItems.map(item => ({ 
            price_cents: item.price_cents, 
            qty: item.qty 
          })))
        };
      }
      
      const newItems = [...state.items, action.payload];
      return {
        ...state,
        items: newItems,
        totalAmount: calculateTotal(newItems.map(item => ({ 
          price_cents: item.price_cents, 
          qty: item.qty 
        })))
      };
    }
    
    case 'REMOVE_ITEM': {
      const filteredItems = state.items.filter(item => item.id !== action.payload);
      return {
        ...state,
        items: filteredItems,
        totalAmount: calculateTotal(filteredItems.map(item => ({ 
          price_cents: item.price_cents, 
          qty: item.qty 
        })))
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, qty: Math.max(0, action.payload.qty) }
          : item
      ).filter(item => item.qty > 0);
      
      return {
        ...state,
        items: updatedItems,
        totalAmount: calculateTotal(updatedItems.map(item => ({ 
          price_cents: item.price_cents, 
          qty: item.qty 
        })))
      };
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalAmount: 0
      };
    
    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen
      };
    
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload.items,
        totalAmount: action.payload.totalAmount
      };
    
    default:
      return state;
  }
};

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  isOpen: false
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState);
    const loadCartFromStorage = () => {
      try {
        if (typeof window !== 'undefined') {
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            dispatch({ type: 'LOAD_CART', payload: parsedCart });
          }
        }
      } catch (error) {
        console.error('Failed to load cart from storage:', error);
      }
    };

    const saveCartToStorage = () => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('cart', JSON.stringify({
            items: cart.items,
            totalAmount: cart.totalAmount
          }));
        }
      } catch (error) {
        console.error('Failed to save cart to storage:', error);
      }
    };

  // Load cart from localStorage on mount
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  // Debounced save to localStorage (save on every change but debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveCartToStorage();
    }, 300); // Debounce by 300ms
    
    return () => clearTimeout(timeoutId);
    }, [cart.items, cart.totalAmount]); // Only save when items or total changes

  const addToCart = (item: CartItem) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeFromCart = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const updateQuantity = (itemId: string, qty: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, qty } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };
  // ...existing code...

  const isCartValid = () => {
    return cart.items.length > 0 && cart.items.every(item => 
      item.id && 
      item.name && 
      isValidPrice(item.price_cents) && 
      item.qty > 0
    );
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleCart,
      loadCartFromStorage,
      saveCartToStorage,
      isCartValid
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}