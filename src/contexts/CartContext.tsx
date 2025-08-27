"use client"
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { CartItem, CartState } from '@/types';
import { useSession } from '@/contexts/SessionContext';
import { calculateTotal, isValidPrice } from '@/utils/price';

interface CartContextType {
  cart: CartState;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
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
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
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
        updatedItems[existingItemIndex]!.quantity += action.payload.quantity;
        
        return {
          ...state,
          items: updatedItems,
          totalAmount: calculateTotal(updatedItems.map(item => ({ 
            price_cents: item.price_cents, 
            quantity: item.quantity 
          })))
        };
      }
      
      const newItems = [...state.items, action.payload];
      return {
        ...state,
        items: newItems,
        totalAmount: calculateTotal(newItems.map(item => ({ 
          price_cents: item.price_cents, 
          quantity: item.quantity 
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
          quantity: item.quantity 
        })))
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(0, action.payload.quantity) }
          : item
      ).filter(item => item.quantity > 0);
      
      return {
        ...state,
        items: updatedItems,
        totalAmount: calculateTotal(updatedItems.map(item => ({ 
          price_cents: item.price_cents, 
          quantity: item.quantity 
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
      // Validate loaded cart data
      const validatedItems = action.payload.items.filter(item => 
        isValidPrice(item.price_cents) && item.quantity > 0
      );
      
      return {
        ...action.payload,
        items: validatedItems,
        totalAmount: calculateTotal(validatedItems.map(item => ({ 
          price_cents: item.price_cents, 
          quantity: item.quantity 
        })))
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

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState);
  const { session, loading } = useSession();

  // Generate session-specific storage key using table_session_id for isolation
  const getStorageKey = () => {
    if (session?.sessionId) {
      return `twyst:cart:${session.sessionId}`; // session.sessionId is the table_session_id
    }
    return 'twyst:cart:default'; // Fallback for no session
  };

  // Validate cart state to prevent empty/invalid carts
  const isCartValid = () => {
    if (cart.items.length === 0) return false;
    
    // Check all items have valid prices and quantities
    return cart.items.every(item => 
      isValidPrice(item.price_cents) && 
      item.quantity > 0 &&
      item.id &&
      item.name
    );
  };

  // Load cart from localStorage on mount or when session changes
  useEffect(() => {
    if (loading) return; // Wait until session is resolved
    loadCartFromStorage();
  }, [loading, session?.sessionId]);

  // Save cart to localStorage whenever cart changes (but only if valid)
  useEffect(() => {
    if (cart.items.length > 0) {
      saveCartToStorage();
    }
  }, [cart]);

  const loadCartFromStorage = () => {
    try {
      const storageKey = getStorageKey();
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Ensure backward compatibility with old price format
        if (parsedCart.items) {
          parsedCart.items = parsedCart.items.map((item: any) => ({
            ...item,
            price_cents: item.price_cents || Math.round((item.price || 0) * 100)
          }));
        }
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
        console.log('Cart loaded from storage for session:', session?.sessionId);
      } else {
        // Clear cart if switching to a new session
        dispatch({ type: 'CLEAR_CART' });
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
      dispatch({ type: 'CLEAR_CART' });
    }
  };

  const saveCartToStorage = () => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(cart));
      console.log('Cart saved to storage for session:', session?.sessionId);
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  };

  const addToCart = (item: CartItem) => {
    if (!isValidPrice(item.price_cents)) {
      console.error('Cannot add item with invalid price:', item);
      return;
    }
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeFromCart = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    // Also clear from localStorage using session-specific key
    try {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
      console.log('Cart cleared from storage for session:', session?.sessionId);
    } catch (error) {
      console.error('Failed to clear cart from storage:', error);
    }
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
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
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};