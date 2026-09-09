import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);

  const addItem = (item, restaurant) => {
    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      if (!window.confirm('Your cart has items from another restaurant. Clear it?')) return;
      setCart([]);
    }
    setCartRestaurant(restaurant);
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem = (itemId) => {
    setCart(prev => {
      const updated = prev.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0);
      if (updated.length === 0) setCartRestaurant(null);
      return updated;
    });
  };

  const clearCart = () => { setCart([]); setCartRestaurant(null); };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = cart.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, cartRestaurant, addItem, removeItem, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
