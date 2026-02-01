import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchBar,
  Swiper,
  Grid,
  Button,
  DatePicker,
  Selector,
  Tag
} from 'antd-mobile';
import { useSearch } from '../contexts/SearchContext';
import dayjs from 'dayjs';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { searchParams, updateSearchParams } = useSearch();
  
  const [keyword, setKeyword] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Banner数据
  const banners = [
    {
      id: 1,
      title: '上海外滩豪华酒店',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      hotelId: '1'
    },
    {
      id: 2,
      title: '艺术家酒店',
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
      hotelId: '2'
    }
  ];

  // 星级选项
  const starOptions = [
    { label: '五星级', value: '5' },
    { label: '四星级', value: '4' },
    { label: '三星级', value: '3' }
  ];

  // 价格区间选项
  const priceOptions = [
    { label: '0-300元', value: '0-300' },
    { label: '300-600元', value: '300-600' },
    { label: '600-1000元', value: '600-1000' },
    { label: '1000元以上', value: '1000-' }
  ];

  // 快捷标签
  const quickTags = [
    '亲子酒店',
    '豪华酒店',
    '免费停车',
    '商务酒店',
    '景区周边',
    '游泳池'
  ];

  const handleSearch = () => {
    updateSearchParams({
      keyword,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut
    });
    navigate('/list');
  };

  const handleDateChange = (value) => {
    if (selectedDate === 'checkIn') {
      updateSearchParams({ checkIn: dayjs(value).format('YYYY-MM-DD') });
    } else {
      updateSearchParams({ checkOut: dayjs(value).format('YYYY-MM-DD') });
    }
    setDatePickerVisible(false);
  };

  const handleBannerClick = (hotelId) => {
    navigate(`/hotel/${hotelId}`);
  };

  const handleStarChange = (value) => {
    updateSearchParams({ starRating: value[0] || '' });
  };

  const handlePriceChange = (value) => {
    if (value[0]) {
      const [min, max] = value[0].split('-');
      updateSearchParams({ 
        minPrice: min || '', 
        maxPrice: max || '' 
      });
    } else {
      updateSearchParams({ minPrice: '', maxPrice: '' });
    }
  };

  const calculateNights = () => {
    return dayjs(searchParams.checkOut).diff(dayjs(searchParams.checkIn), 'day');
  };

  return (
    <div className="home-page">
      {/* Banner */}
      <div className="banner-section">
        <Swiper
          autoplay
          loop
          indicator={(total, current) => (
            <div className="custom-indicator">
              {current + 1} / {total}
            </div>
          )}
        >
          {banners.map(banner => (
            <Swiper.Item key={banner.id}>
              <div 
                className="banner-item"
                onClick={() => handleBannerClick(banner.hotelId)}
              >
                <img src={banner.image} alt={banner.title} />
                <div className="banner-title">{banner.title}</div>
              </div>
            </Swiper.Item>
          ))}
        </Swiper>
      </div>

      {/* 搜索区域 */}
      <div className="search-section">
        <div className="search-card">
          {/* 城市选择 */}
          <div className="search-item">
            <div className="search-label">目的地</div>
            <div className="search-value">
              <span className="location-icon">📍</span>
              {searchParams.city}
            </div>
          </div>

          {/* 日期选择 */}
          <div className="search-item" onClick={() => {
            setSelectedDate('checkIn');
            setDatePickerVisible(true);
          }}>
            <div className="search-label">入住</div>
            <div className="search-value">
              {dayjs(searchParams.checkIn).format('MM月DD日')}
            </div>
          </div>

          <div className="search-item" onClick={() => {
            setSelectedDate('checkOut');
            setDatePickerVisible(true);
          }}>
            <div className="search-label">离店</div>
            <div className="search-value">
              {dayjs(searchParams.checkOut).format('MM月DD日')}
            </div>
          </div>

          <div className="nights-info">
            共{calculateNights()}晚
          </div>

          {/* 关键字搜索 */}
          <div className="search-input-wrapper">
            <SearchBar
              placeholder="搜索酒店名称、地址"
              value={keyword}
              onChange={setKeyword}
              onSearch={handleSearch}
              style={{ '--border-radius': '20px' }}
            />
          </div>

          {/* 筛选条件 */}
          <div className="filter-section">
            <div className="filter-item">
              <div className="filter-label">星级</div>
              <Selector
                options={starOptions}
                value={searchParams.starRating ? [searchParams.starRating] : []}
                onChange={handleStarChange}
              />
            </div>

            <div className="filter-item">
              <div className="filter-label">价格</div>
              <Selector
                options={priceOptions}
                value={searchParams.minPrice || searchParams.maxPrice ? 
                  [`${searchParams.minPrice}-${searchParams.maxPrice}`] : []}
                onChange={handlePriceChange}
              />
            </div>
          </div>

          {/* 快捷标签 */}
          <div className="quick-tags">
            <div className="filter-label">快捷筛选</div>
            <div className="tags-container">
              {quickTags.map((tag, index) => (
                <Tag key={index} className="tag-item">
                  {tag}
                </Tag>
              ))}
            </div>
          </div>

          {/* 搜索按钮 */}
          <Button
            block
            color="primary"
            size="large"
            onClick={handleSearch}
            className="search-button"
          >
            搜索酒店
          </Button>
        </div>
      </div>

      {/* 日期选择器 */}
      <DatePicker
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={handleDateChange}
        min={new Date()}
        defaultValue={new Date(selectedDate === 'checkIn' ? 
          searchParams.checkIn : searchParams.checkOut)}
      />
    </div>
  );
};

export default Home;
