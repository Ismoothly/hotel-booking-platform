import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  SearchBar,
  Swiper,
  Button,
  DatePicker,
  Selector,
  Tag,
  Toast
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
  const [cityPickerVisible, setCityPickerVisible] = useState(false);

  // 城市选项
  const cityOptions = [
    { label: '北京', value: '北京' },
    { label: '天津', value: '天津' },
    { label: '上海', value: '上海' },
    { label: '广州', value: '广州' },
    { label: '深圳', value: '深圳' },
    { label: '杭州', value: '杭州' },
    { label: '嘉兴', value: '嘉兴' },
    { label: '成都', value: '成都' },
    { label: '西安', value: '西安' },
    { label: '南京', value: '南京' },
    { label: '武汉', value: '武汉' },
    { label: '重庆', value: '重庆' }
  ];

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

  const handleCityChange = (value) => {
    if (value[0]) {
      updateSearchParams({ city: value[0] });
    }
  };

  // 获取用户定位
  const handleGetLocation = () => {
    // 检查浏览器是否支持定位
    if (!navigator.geolocation) {
      Toast.show({
        icon: 'fail',
        content: '您的浏览器不支持定位功能'
      });
      return;
    }

    // 检查是否为HTTPS或localhost
    const isSecureContext = window.isSecureContext || 
                          window.location.protocol === 'https:' || 
                          window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1';
    
    if (!isSecureContext) {
      Toast.show({
        icon: 'fail',
        content: '定位功能需要在HTTPS环境下使用'
      });
      return;
    }

    Toast.show({
      icon: 'loading',
      content: '正在定位...',
      duration: 0
    });

    // 先尝试获取权限状态（如果浏览器支持）
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('定位权限状态:', result.state);
        if (result.state === 'denied') {
          Toast.clear();
          // 权限被拒绝，尝试IP定位
          tryIPLocation();
          return;
        }
        performGeolocation();
      }).catch(() => {
        // 不支持权限查询，直接尝试定位
        performGeolocation();
      });
    } else {
      performGeolocation();
    }
  };

  // 执行GPS定位
  const performGeolocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        Toast.clear();
        const { latitude, longitude, accuracy } = position.coords;
        
        console.log('GPS定位成功:', {
          纬度: latitude,
          经度: longitude,
          精度: accuracy + '米'
        });
        
        const city = getCityFromCoordinates(latitude, longitude);
        
        if (city) {
          updateSearchParams({ city });
          Toast.show({
            icon: 'success',
            content: `已定位到${city}`,
            duration: 2000
          });
        } else {
          // GPS定位成功但未匹配到城市，尝试IP定位
          console.warn('GPS未匹配到城市，尝试IP定位');
          tryIPLocation();
        }
      },
      (error) => {
        console.error('GPS定位失败:', error.code, error.message);
        // GPS定位失败，自动尝试IP定位
        tryIPLocation();
      },
      {
        enableHighAccuracy: false,  // 改为false可以更快获取位置（使用Wi-Fi/IP定位）
        timeout: 10000,              // 10秒超时
        maximumAge: 300000          // 允许使用5分钟内的缓存位置
      }
    );
  };

  // IP定位（备选方案）
  const tryIPLocation = async () => {
    try {
      console.log('尝试IP定位...');
      
      // 使用免费的IP定位API
      const response = await fetch('https://ipapi.co/json/', {
        timeout: 5000
      });
      
      if (!response.ok) {
        throw new Error('IP定位服务不可用');
      }
      
      const data = await response.json();
      console.log('IP定位结果:', data);
      
      Toast.clear();
      
      // 尝试匹配城市名称
      let matchedCity = null;
      const cityName = data.city || data.region || '';
      
      // 城市名称映射
      const cityMap = {
        'Beijing': '北京',
        'Tianjin': '天津',
        'Shanghai': '上海',
        'Guangzhou': '广州',
        'Shenzhen': '深圳',
        'Hangzhou': '杭州',
        'Jiaxing': '嘉兴',
        'Chengdu': '成都',
        "Xi'an": '西安',
        'Xian': '西安',
        'Nanjing': '南京',
        'Wuhan': '武汉',
        'Chongqing': '重庆'
      };
      
      // 检查英文城市名
      if (cityMap[cityName]) {
        matchedCity = cityMap[cityName];
      }
      
      // 检查中文城市名
      const supportedCities = ['北京', '天津', '上海', '广州', '深圳', '杭州', '嘉兴', '成都', '西安', '南京', '武汉', '重庆'];
      if (supportedCities.some(city => cityName.includes(city))) {
        matchedCity = supportedCities.find(city => cityName.includes(city));
      }
      
      if (matchedCity) {
        updateSearchParams({ city: matchedCity });
        Toast.show({
          icon: 'success',
          content: `已通过网络定位到${matchedCity}`,
          duration: 2000
        });
      } else {
        Toast.show({
          icon: 'fail',
          content: `定位到${data.city || data.country_name}，但暂不支持该地区\n请手动选择城市`,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('IP定位失败:', error);
      Toast.clear();
      Toast.show({
        icon: 'fail',
        content: '定位失败，请手动选择城市\n提示：\n• 检查设备定位服务是否开启\n• 确保网络连接正常\n• 尝试移至室外或窗边',
        duration: 4000
      });
    }
  };

  // 根据经纬度判断城市（简化版）
  const getCityFromCoordinates = (lat, lng) => {
    // 主要城市的大致经纬度范围（扩大范围以提高匹配率）
    const cityRanges = [
      { name: '北京', lat: [39.4, 41.6], lng: [115.4, 117.5] },
      { name: '天津', lat: [38.7, 40.3], lng: [116.7, 118.1] },
      { name: '嘉兴', lat: [30.3, 31.1], lng: [120.2, 121.3] },
      { name: '上海', lat: [30.7, 31.9], lng: [120.8, 122.2] },
      { name: '广州', lat: [22.5, 24.0], lng: [112.9, 114.5] },
      { name: '深圳', lat: [22.4, 22.9], lng: [113.7, 114.7] },
      { name: '杭州', lat: [29.2, 30.6], lng: [118.3, 120.9] },
      { name: '成都', lat: [30.1, 31.4], lng: [102.9, 104.9] },
      { name: '西安', lat: [33.7, 34.8], lng: [107.8, 109.8] },
      { name: '南京', lat: [31.2, 32.6], lng: [118.4, 119.2] },
      { name: '武汉', lat: [29.9, 31.4], lng: [113.7, 115.1] },
      { name: '重庆', lat: [28.1, 32.2], lng: [105.3, 110.2] }
    ];

    console.log('尝试匹配城市，当前坐标:', { lat, lng });

    for (const city of cityRanges) {
      if (lat >= city.lat[0] && lat <= city.lat[1] &&
          lng >= city.lng[0] && lng <= city.lng[1]) {
        console.log('匹配到城市:', city.name);
        return city.name;
      }
    }

    console.log('未匹配到任何城市');
    return null;
  };

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
      {/* 快速导航栏 */}
      <div style={{
        backgroundColor: '#fff',
        padding: '12px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        borderBottom: '1px solid #eee'
      }}>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <Button size="small" color="primary" fill>
            🔐 登录
          </Button>
        </Link>
        <Link to="/cart" style={{ textDecoration: 'none' }}>
          <Button size="small" color="default" fill>
            🛒 购物车
          </Button>
        </Link>
        <Link to="/orders" style={{ textDecoration: 'none' }}>
          <Button size="small" color="primary" fill>
            📋 我的订单
          </Button>
        </Link>
      </div>

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
            <div className="search-label-with-location">
              <span className="search-label">目的地</span>
              <Button
                size="small"
                fill="none"
                onClick={handleGetLocation}
                className="location-button"
              >
                📍 定位
              </Button>
            </div>
            <Selector
              options={cityOptions}
              value={[searchParams.city]}
              onChange={handleCityChange}
              columns={5}
            />
          </div>

          {/* 日期选择 */}
          <div className="search-item search-item-row" onClick={() => {
            setSelectedDate('checkIn');
            setDatePickerVisible(true);
          }}>
            <div className="search-label">入住</div>
            <div className="search-value">
              {dayjs(searchParams.checkIn).format('MM月DD日')}
            </div>
          </div>

          <div className="search-item search-item-row" onClick={() => {
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
