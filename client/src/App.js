import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SearchProvider } from './contexts/SearchContext';
import { CartProvider } from './contexts/CartContext';
import { PriceUpdateProvider } from './contexts/PriceUpdateContext';

// 导入页面组件
import Home from './pages/Home';
import HotelList from './pages/HotelList';
import HotelDetail from './pages/HotelDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Login from './pages/Login';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <CartProvider>
          <PriceUpdateProvider>
            <div className="app">
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/list" element={<HotelList />} />
              <Route path="/hotel/:id" element={<HotelDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/login" element={<Login />} />
              </Routes>
            </div>
          </PriceUpdateProvider>
        </CartProvider>
      </SearchProvider>
    </BrowserRouter>
  );
}

export default App;
