import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const PriceUpdateContext = createContext();

// 开发环境优先直连后端，避免 dev server 代理对 SSE 流缓冲导致收不到推送
const getSSEUrl = () => {
  if (process.env.REACT_APP_SSE_URL) return process.env.REACT_APP_SSE_URL;
  if (process.env.NODE_ENV === 'development')
    return 'http://localhost:5000/api/events';
  return `${window.location.origin}/api/events`;
};

export const usePriceUpdate = () => {
  const context = useContext(PriceUpdateContext);
  if (!context) {
    throw new Error('usePriceUpdate must be used within PriceUpdateProvider');
  }
  return context;
};

export const PriceUpdateProvider = ({ children }) => {
  const [updatedHotelIds, setUpdatedHotelIds] = useState([]);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const addUpdatedHotelId = (hotelId) => {
    setUpdatedHotelIds((prev) =>
      prev.includes(hotelId) ? prev : [...prev, hotelId]
    );
  };

  const clearUpdatedHotelId = (hotelId) => {
    setUpdatedHotelIds((prev) => prev.filter((id) => id !== hotelId));
  };

  const clearAllUpdatedHotelIds = () => {
    setUpdatedHotelIds([]);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !window.EventSource) return;

    const connect = () => {
      const url = getSSEUrl();
      if (process.env.NODE_ENV === 'development') {
        console.log('[SSE] Connecting to', url);
      }
      try {
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onopen = () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[SSE] Connected');
          }
        };

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'hotel_price_updated' && data.hotelId) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[SSE] hotel_price_updated', data.hotelId);
              }
              setUpdatedHotelIds((prev) =>
                prev.includes(data.hotelId) ? prev : [...prev, data.hotelId]
              );
            }
          } catch (e) {
            // ignore parse error
          }
        };

        es.onerror = () => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[SSE] Connection error, reconnecting in 5s...');
          }
          es.close();
          eventSourceRef.current = null;
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };
      } catch (err) {
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const value = {
    updatedHotelIds,
    addUpdatedHotelId,
    clearUpdatedHotelId,
    clearAllUpdatedHotelIds
  };

  return (
    <PriceUpdateContext.Provider value={value}>
      {children}
    </PriceUpdateContext.Provider>
  );
};
