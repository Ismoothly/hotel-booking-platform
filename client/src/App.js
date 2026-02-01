import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SearchProvider } from './contexts/SearchContext';

// 导入页面组件
import Home from './pages/Home';
import HotelList from './pages/HotelList';
import HotelDetail from './pages/HotelDetail';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/list" element={<HotelList />} />
            <Route path="/hotel/:id" element={<HotelDetail />} />
          </Routes>
        </div>
      </SearchProvider>
    </BrowserRouter>
  );
}

export default App;
