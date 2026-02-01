import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NavBar,
  SearchBar,
  Selector,
  Card,
  InfiniteScroll,
  Tag,
  Empty,
  Toast
} from 'antd-mobile';
import { useSearch } from '../contexts/SearchContext';
import { hotelAPI } from '../services/api';
import { formatPrice, getStarRating } from '../utils/helpers';
import dayjs from 'dayjs';
import './HotelList.css';

const HotelList = () => {
  const navigate = useNavigate();
  const { searchParams, updateSearchParams } = useSearch();
  
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const sortOptions = [
    { label: '综合排序', value: '' },
    { label: '价格从低到高', value: 'price_asc' },
    { label: '价格从高到低', value: 'price_desc' },
    { label: '星级优先', value: 'rating' }
  ];

  useEffect(() => {
    fetchHotels();
  }, [searchParams]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await hotelAPI.getHotels(searchParams);
      setHotels(response.data || []);
      setHasMore(false); // 简化处理，不实现分页
    } catch (error) {
      Toast.show({
        icon: 'fail',
        content: error.message || '获取酒店列表失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHotelClick = (id) => {
    navigate(`/hotel/${id}`);
  };

  const handleSortChange = (value) => {
    updateSearchParams({ sortBy: value[0] || '' });
  };

  const getMinPrice = (rooms) => {
    if (!rooms || rooms.length === 0) return 0;
    return Math.min(...rooms.map(room => room.price));
  };

  const calculateNights = () => {
    return dayjs(searchParams.checkOut).diff(dayjs(searchParams.checkIn), 'day');
  };

  return (
    <div className="hotel-list-page">
      <NavBar
        onBack={() => navigate('/')}
        backArrow={true}
      >
        酒店列表
      </NavBar>

      {/* 搜索头部 */}
      <div className="list-header">
        <div className="search-info">
          <span className="city">{searchParams.city}</span>
          <span className="date">
            {dayjs(searchParams.checkIn).format('MM-DD')} 至 
            {dayjs(searchParams.checkOut).format('MM-DD')}
            （{calculateNights()}晚）
          </span>
        </div>
        
        <div className="filter-bar">
          <Selector
            options={sortOptions}
            value={[searchParams.sortBy]}
            onChange={handleSortChange}
          />
        </div>
      </div>

      {/* 酒店列表 */}
      <div className="hotel-list-content">
        {hotels.length === 0 && !loading ? (
          <Empty description="暂无酒店数据" />
        ) : (
          <>
            {hotels.map(hotel => (
              <Card
                key={hotel.id}
                className="hotel-card"
                onClick={() => handleHotelClick(hotel.id)}
              >
                <div className="hotel-card-content">
                  <div className="hotel-image">
                    <img 
                      src={hotel.images?.[0] || 'https://via.placeholder.com/200'} 
                      alt={hotel.nameCn} 
                    />
                  </div>
                  
                  <div className="hotel-info">
                    <div className="hotel-name">{hotel.nameCn}</div>
                    <div className="hotel-rating">
                      {getStarRating(hotel.starRating)}
                    </div>
                    <div className="hotel-address">{hotel.address}</div>
                    
                    <div className="hotel-facilities">
                      {hotel.facilities?.slice(0, 3).map((facility, index) => (
                        <Tag key={index} color="primary" fill="outline" className="facility-tag">
                          {facility}
                        </Tag>
                      ))}
                    </div>
                    
                    <div className="hotel-price">
                      <span className="price-label">最低价</span>
                      <span className="price-value">
                        {formatPrice(getMinPrice(hotel.rooms))}
                      </span>
                      <span className="price-unit">/晚起</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            <InfiniteScroll loadMore={async () => {}} hasMore={hasMore} />
          </>
        )}
      </div>
    </div>
  );
};

export default HotelList;
