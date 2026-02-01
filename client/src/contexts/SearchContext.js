import React, { createContext, useContext, useState } from 'react';
import dayjs from 'dayjs';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchParams, setSearchParams] = useState({
    city: '上海',
    checkIn: dayjs().format('YYYY-MM-DD'),
    checkOut: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    keyword: '',
    starRating: '',
    minPrice: '',
    maxPrice: '',
    sortBy: ''
  });

  const updateSearchParams = (params) => {
    setSearchParams(prev => ({ ...prev, ...params }));
  };

  return (
    <SearchContext.Provider value={{ searchParams, updateSearchParams }}>
      {children}
    </SearchContext.Provider>
  );
};
