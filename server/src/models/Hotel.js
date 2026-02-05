const { v4: uuidv4 } = require('uuid');

// 内存数据库 - 酒店数据
let hotels = [
  {
    id: '1',
    nameCn: '上海外滩豪华酒店',
    nameEn: 'Shanghai Bund Luxury Hotel',
    address: '上海市黄浦区中山东一路100号',
    starRating: 5,
    openingDate: '2020-01-15',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
    ],
    rooms: [
      { type: '豪华大床房', price: 888, description: '35平米，大床，景观房' },
      { type: '豪华双床房', price: 888, description: '35平米，双床，景观房' },
      { type: '行政套房', price: 1588, description: '60平米，大床，独立客厅' }
    ],
    facilities: ['免费WiFi', '健身房', '游泳池', '餐厅', '免费停车'],
    nearbyAttractions: ['外滩', '南京路步行街', '豫园'],
    transportation: '地铁2号线南京东路站步行5分钟',
    nearbyShopping: ['正大广场', '国金中心'],
    discounts: [],
    status: 'published', // draft, pending, approved, published, unpublished
    merchantId: '2',
    reviewStatus: 'approved',
    reviewMessage: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    nameCn: '艺术家酒店(上海静安寺店)',
    nameEn: 'Artist Hotel (Shanghai Jing\'an Temple)',
    address: '上海市静安区南京西路1699号',
    starRating: 4,
    openingDate: '2019-06-20',
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427'
    ],
    rooms: [
      { type: '标准大床房', price: 499, description: '25平米，大床，城市景观' },
      { type: '标准双床房', price: 499, description: '25平米，双床，城市景观' },
      { type: '商务套房', price: 799, description: '45平米，大床，办公区' }
    ],
    facilities: ['免费WiFi', '健身房', '商务中心', '餐厅'],
    nearbyAttractions: ['静安寺', '人民广场', '上海博物馆'],
    transportation: '地铁2号线静安寺站步行3分钟',
    nearbyShopping: ['久光百货', '芮欧百货'],
    discounts: [
      { type: '早鸟优惠', description: '提前7天预订享9折' }
    ],
    status: 'published',
    merchantId: '2',
    reviewStatus: 'approved',
    reviewMessage: '',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z'
  }
];

class HotelModel {
  static async findAll(filters = {}) {
    let result = [...hotels];

    // 过滤状态
    if (filters.status) {
      result = result.filter(hotel => hotel.status === filters.status);
    }

    // 过滤审核状态
    if (filters.reviewStatus) {
      result = result.filter(hotel => hotel.reviewStatus === filters.reviewStatus);
    }

    // 过滤商户
    if (filters.merchantId) {
      result = result.filter(hotel => hotel.merchantId === filters.merchantId);
    }

    // 过滤城市（根据地址）
    if (filters.city) {
      result = result.filter(hotel => hotel.address.includes(filters.city));
    }

    // 过滤星级
    if (filters.starRating) {
      result = result.filter(hotel => hotel.starRating === parseInt(filters.starRating));
    }

    // 价格范围过滤
    if (filters.minPrice || filters.maxPrice) {
      result = result.filter(hotel => {
        const minRoomPrice = Math.min(...hotel.rooms.map(room => room.price));
        if (filters.minPrice && minRoomPrice < parseFloat(filters.minPrice)) return false;
        if (filters.maxPrice && minRoomPrice > parseFloat(filters.maxPrice)) return false;
        return true;
      });
    }

    // 关键字搜索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      result = result.filter(hotel => 
        hotel.nameCn.toLowerCase().includes(keyword) ||
        hotel.nameEn.toLowerCase().includes(keyword) ||
        hotel.address.toLowerCase().includes(keyword)
      );
    }

    // 排序
    if (filters.sortBy) {
      result.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price_asc':
            return Math.min(...a.rooms.map(r => r.price)) - Math.min(...b.rooms.map(r => r.price));
          case 'price_desc':
            return Math.min(...b.rooms.map(r => r.price)) - Math.min(...a.rooms.map(r => r.price));
          case 'rating':
            return b.starRating - a.starRating;
          default:
            return 0;
        }
      });
    }

    return result;
  }

  static async findById(id) {
    return hotels.find(hotel => hotel.id === id);
  }

  static async create(hotelData, merchantId) {
    const newHotel = {
      id: uuidv4(),
      ...hotelData,
      merchantId,
      status: 'draft', // 新建酒店为草稿状态
      reviewStatus: 'pending', // 待管理员审核
      reviewMessage: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    hotels.push(newHotel);
    return newHotel;
  }

  static async update(id, hotelData) {
    const index = hotels.findIndex(hotel => hotel.id === id);
    if (index === -1) {
      throw new Error('酒店不存在');
    }

    hotels[index] = {
      ...hotels[index],
      ...hotelData,
      updatedAt: new Date().toISOString()
    };

    return hotels[index];
  }

  static async delete(id) {
    const index = hotels.findIndex(hotel => hotel.id === id);
    if (index === -1) {
      throw new Error('酒店不存在');
    }

    hotels.splice(index, 1);
    return true;
  }

  static async updateReviewStatus(id, reviewStatus, reviewMessage = '') {
    const hotel = await this.findById(id);
    if (!hotel) {
      throw new Error('酒店不存在');
    }

    return this.update(id, { reviewStatus, reviewMessage });
  }

  static async updateStatus(id, status) {
    const hotel = await this.findById(id);
    if (!hotel) {
      throw new Error('酒店不存在');
    }

    return this.update(id, { status });
  }
}

module.exports = HotelModel;
