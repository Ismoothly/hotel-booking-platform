import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  NavBar,
  Swiper,
  Card,
  Tag,
  Button,
  Toast,
  Grid
} from 'antd-mobile';
import { hotelAPI } from '../services/api';
import { formatPrice, getStarRating } from '../utils/helpers';
import { useSearch } from '../contexts/SearchContext';
import dayjs from 'dayjs';
import './HotelDetail.css';

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { searchParams } = useSearch();
  
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotelDetail();
  }, [id]);

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

  const handleBooking = (room) => {
    Toast.show({
      icon: 'success',
      content: `预订 ${room.type} 成功！`
    });
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
                  <span className="price-value">{formatPrice(room.price)}</span>
                  <span className="price-unit">/晚</span>
                </div>
                <Button
                  color="primary"
                  size="small"
                  onClick={() => handleBooking(room)}
                >
                  预订
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HotelDetail;
