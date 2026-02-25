import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  NavBar,
  Swiper,
  Card,
  Tag,
  Button,
  Toast,
  Grid,
  Modal
} from 'antd-mobile';
import { hotelAPI } from '../services/api';
import { formatPrice, getStarRating } from '../utils/helpers';
import { useSearch } from '../contexts/SearchContext';
import { usePriceUpdate } from '../contexts/PriceUpdateContext';
import { useCart } from '../contexts/CartContext';
import dayjs from 'dayjs';
import './HotelDetail.css';

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { searchParams } = useSearch();
  const { addToCart } = useCart();
  const { updatedHotelIds, clearUpdatedHotelId } = usePriceUpdate();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotelDetail();
  }, [id]);

  useEffect(() => {
    if (id && updatedHotelIds.includes(id)) {
      fetchHotelDetail().finally(() => clearUpdatedHotelId(id));
    }
  }, [id, updatedHotelIds]);

  const fetchHotelDetail = async () => {
    try {
      setLoading(true);
      const response = await hotelAPI.getHotelById(id);
      setHotel(response.data);
    } catch (error) {
      Toast.show({
        icon: 'fail',
        content: error.message || '获取酒店详情失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (room) => {
    const token = localStorage.getItem('token');
    if (!token) {
      Modal.confirm({
        title: '需要登录',
        content: '登录后才能加入购物车',
        okText: '去登录',
        cancelText: '取消',
        onOk() {
          navigate('/login');
        }
      });
      return;
    }

    const nights = dayjs(searchParams.checkOut).diff(dayjs(searchParams.checkIn), 'day');
    
    // 验证日期
    if (nights <= 0) {
      Toast.show({
        icon: 'fail',
        content: '请先选择入住和离店日期'
      });
      return;
    }

    try {
      // 添加到购物车（现在是异步的）
      await addToCart({
        hotelId: hotel._id,
        hotelName: hotel.nameCn,
        roomType: room.type,
        price: room.effectivePrice != null ? room.effectivePrice : room.price,
        originalPrice: room.price,
        discountPercent: hotel.activeDiscountPercent || 0,
        quantity: 1,
        checkInDate: searchParams.checkIn,
        checkOutDate: searchParams.checkOut,
        nights: nights
      });

      Toast.show({
        icon: 'success',
        content: `已添加到购物车！`
      });

      // 显示询问是否前往购物车
      Modal.confirm({
        title: '成功添加到购物车',
        content: '是否前往购物车结账?',
        okText: '前往',
        cancelText: '继续购物',
        onOk() {
          navigate('/cart');
        }
      });
    } catch (error) {
      console.error('添加购物车失败:', error);
      Toast.show({
        icon: 'fail',
        content: error.message || '添加购物车失败，请重试'
      });
    }
  };

  const calculateNights = () => {
    return dayjs(searchParams.checkOut).diff(dayjs(searchParams.checkIn), 'day');
  };

  if (loading || !hotel) {
    return null;
  }

  return (
    <div className="hotel-detail-page">
      <NavBar
        onBack={() => navigate(-1)}
        backArrow={true}
      >
        {hotel.nameCn}
      </NavBar>

      {/* 酒店图片轮播 */}
      <div className="detail-banner">
        <Swiper
          loop
          autoplay
          indicator={(total, current) => (
            <div className="custom-indicator">
              {current + 1} / {total}
            </div>
          )}
        >
          {(hotel.images || []).map((image, index) => (
            <Swiper.Item key={index}>
              <img src={image} alt={`酒店图片${index + 1}`} />
            </Swiper.Item>
          ))}
        </Swiper>
      </div>

      {/* 酒店基本信息 */}
      <Card className="hotel-info-card">
        <div className="hotel-name">{hotel.nameCn}</div>
        <div className="hotel-name-en">{hotel.nameEn}</div>
        <div className="hotel-rating">{getStarRating(hotel.starRating)}</div>
        <div className="hotel-address">
          <span className="address-icon">📍</span>
          {hotel.address}
        </div>
        <div className="hotel-opening">开业时间：{hotel.openingDate}</div>
      </Card>

      {/* 酒店设施 */}
      {hotel.facilities && hotel.facilities.length > 0 && (
        <Card className="facilities-card">
          <div className="card-title">酒店设施</div>
          <Grid columns={3} gap={8}>
            {hotel.facilities.map((facility, index) => (
              <Grid.Item key={index}>
                <Tag color="primary" fill="outline" className="facility-tag-large">
                  {facility}
                </Tag>
              </Grid.Item>
            ))}
          </Grid>
        </Card>
      )}

      {/* 周边信息 */}
      {(hotel.nearbyAttractions?.length > 0 || hotel.transportation) && (
        <Card className="nearby-card">
          <div className="card-title">周边信息</div>
          
          {hotel.nearbyAttractions?.length > 0 && (
            <div className="nearby-section">
              <div className="section-label">附近景点</div>
              <div className="section-content">
                {hotel.nearbyAttractions.join('、')}
              </div>
            </div>
          )}

          {hotel.transportation && (
            <div className="nearby-section">
              <div className="section-label">交通信息</div>
              <div className="section-content">{hotel.transportation}</div>
            </div>
          )}

          {hotel.nearbyShopping?.length > 0 && (
            <div className="nearby-section">
              <div className="section-label">附近商场</div>
              <div className="section-content">
                {hotel.nearbyShopping.join('、')}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 入住日期 */}
      <Card className="date-card">
        <div className="date-info">
          <div className="date-item">
            <div className="date-label">入住</div>
            <div className="date-value">
              {dayjs(searchParams.checkIn).format('MM月DD日')}
            </div>
          </div>
          <div className="date-divider">
            <span>共{calculateNights()}晚</span>
          </div>
          <div className="date-item">
            <div className="date-label">离店</div>
            <div className="date-value">
              {dayjs(searchParams.checkOut).format('MM月DD日')}
            </div>
          </div>
        </div>
      </Card>

      {/* 房型列表 */}
      <div className="rooms-section">
        <div className="section-title">选择房型</div>
        {hotel.rooms && hotel.rooms.map((room, index) => (
          <Card key={index} className="room-card">
            <div className="room-info">
              <div className="room-type">{room.type}</div>
              <div className="room-description">{room.description}</div>
              <div className="room-bottom">
                <div className="room-price">
                  {room.effectivePrice != null && room.effectivePrice !== room.price ? (
                    <>
                      <span style={{ color: '#999', textDecoration: 'line-through', marginRight: 8 }}>{formatPrice(room.price)}</span>
                      <span className="price-value">{formatPrice(room.effectivePrice)}</span>
                      <span className="price-unit">/晚</span>
                    </>
                  ) : (
                    <>
                      <span className="price-value">{formatPrice(room.price)}</span>
                      <span className="price-unit">/晚</span>
                    </>
                  )}
                </div>
                <Button
                  color="primary"
                  size="small"
                  onClick={() => handleAddToCart(room)}
                >
                  添加到购物车
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 底部购物车按钮 */}
      <div className="detail-footer">
        <Link to="/cart" style={{ flex: 1, textDecoration: 'none' }}>
          <Button color="primary" fill>
            查看购物车
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default HotelDetail;
