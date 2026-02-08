/**
 * MongoDB 种子数据脚本
 * 用于初始化数据库的示例数据
 * 
 * 使用方法：
 * node scripts/seed.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const User = require('../src/models/User-mongoose');
const Hotel = require('../src/models/Hotel-mongoose');

// 示例用户数据
const usersData = [
  {
    username: 'admin',
    password: 'admin123',
    email: 'admin@hotel.com',
    role: 'admin'
  },
  {
    username: 'merchant1',
    password: 'merchant123',
    email: 'merchant1@hotel.com',
    role: 'merchant'
  },
  {
    username: 'merchant2',
    password: 'merchant123',
    email: 'merchant2@hotel.com',
    role: 'merchant'
  },
  {
    username: 'customer1',
    password: 'customer123',
    email: 'customer1@hotel.com',
    role: 'customer'
  }
];

// 示例酒店数据
const getHotelsData = (merchantIds) => [
  {
    nameCn: '上海外滩豪华酒店',
    nameEn: 'Shanghai Bund Luxury Hotel',
    address: '上海市黄浦区中山东一路100号',
    city: '上海',
    starRating: 5,
    openingDate: new Date('2020-01-15'),
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
    ],
    rooms: [
      {
        type: '豪华大床房',
        price: 888,
        description: '35平米，大床，景观房',
        quantity: 10
      },
      {
        type: '豪华双床房',
        price: 888,
        description: '35平米，双床，景观房',
        quantity: 8
      },
      {
        type: '行政套房',
        price: 1588,
        description: '60平米，大床，独立客厅',
        quantity: 5
      }
    ],
    facilities: ['免费WiFi', '健身房', '游泳池', '餐厅', '免费停车'],
    nearbyAttractions: ['外滩', '南京路步行街', '豫园'],
    transportation: '地铁2号线南京东路站步行5分钟',
    nearbyShopping: ['正大广场', '国金中心'],
    discounts: [],
    description: '上海外滩最高级的五星酒店，享受长江美景',
    phone: '021-5888-1234',
    email: 'info@shanghailuxyhotel.com',
    website: 'https://www.shanghailuxyhotel.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.8,
    totalReviews: 256,
    bookingCount: 1523,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '艺术家酒店(上海静安寺店)',
    nameEn: 'Artist Hotel (Shanghai Jing\'an Temple)',
    address: '上海市静安区南京西路1699号',
    city: '上海',
    starRating: 4,
    openingDate: new Date('2019-06-20'),
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427'
    ],
    rooms: [
      {
        type: '标准大床房',
        price: 499,
        description: '25平米，大床，城市景观',
        quantity: 15
      },
      {
        type: '标准双床房',
        price: 499,
        description: '25平米，双床，城市景观',
        quantity: 12
      },
      {
        type: '商务套房',
        price: 799,
        description: '45平米，大床，办公区',
        quantity: 6
      }
    ],
    facilities: ['免费WiFi', '健身房', '商务中心', '餐厅'],
    nearbyAttractions: ['静安寺', '人民广场', '上海博物馆'],
    transportation: '地铁2号线静安寺站步行3分钟',
    nearbyShopping: ['久光百货', '芮欧百货'],
    discounts: [
      {
        type: '早鸟优惠',
        description: '提前7天预订享9折',
        percentage: 10
      }
    ],
    description: '艺术风格的精品酒店，靠近静安寺商业区',
    phone: '021-6248-1234',
    email: 'info@artisthotel.com',
    website: 'https://www.artisthotel.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.5,
    totalReviews: 189,
    bookingCount: 987,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '浙江杭州西湖国际大酒店',
    nameEn: 'Hangzhou West Lake International Hotel',
    address: '杭州市西湖区西湖景区1号',
    city: '杭州',
    starRating: 5,
    openingDate: new Date('2018-03-10'),
    images: [
      'https://images.unsplash.com/photo-1564078516801-fdfb59762fc1',
      'https://images.unsplash.com/photo-1535707066efb7d7873849da83e4675f2'
    ],
    rooms: [
      {
        type: '景观房',
        price: 1299,
        description: '50平米，大床，西湖景观',
        quantity: 20
      },
      {
        type: '豪华套房',
        price: 2199,
        description: '80平米，大床，客厅，露台',
        quantity: 8
      }
    ],
    facilities: ['免费WiFi', '五星级早餐', '温泉', '会议室'],
    nearbyAttractions: ['西湖', '灵隐寺', '六和塔'],
    transportation: '龙翔桥地铁步行10分钟',
    nearbyShopping: ['lakeside shopping mall'],
    discounts: [],
    description: '杭州最著名的五星酒店，俯瞰西湖美景',
    phone: '0571-8888-8888',
    email: 'info@westlakehotel.com',
    website: 'https://www.westlakehotel.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.9,
    totalReviews: 412,
    bookingCount: 2156,
    merchantId: merchantIds[1]
  },
  {
    nameCn: '北京国贸CBD商务酒店',
    nameEn: 'Beijing CBD Business Hotel',
    address: '北京市朝阳区建国路1号',
    city: '北京',
    starRating: 4,
    openingDate: new Date('2021-05-15'),
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304',
      'https://images.unsplash.com/photo-1431049307264-da0ec9d70304'
    ],
    rooms: [
      {
        type: '商务客房',
        price: 699,
        description: '30平米，大床，办公桌',
        quantity: 25
      },
      {
        type: '商务套房',
        price: 1099,
        description: '55平米，分区，会议区',
        quantity: 10
      }
    ],
    facilities: ['免费WiFi', '商务中心', '会议室', '健身房', '24小时咖啡厅'],
    nearbyAttractions: ['CCTV总部', '国贸购物中心', '朝阳公园'],
    transportation: '地铁1号线国贸站步行5分钟',
    nearbyShopping: ['国贸购物中心'],
    discounts: [
      {
        type: '长住优惠',
        description: '连住5晚以上享8折',
        percentage: 20
      }
    ],
    description: '北京CBD中心商务酒店，适合商务出行',
    phone: '010-8888-1234',
    email: 'info@cbdhotel.com',
    website: 'https://www.cbdhotel.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.3,
    totalReviews: 134,
    bookingCount: 654,
    merchantId: merchantIds[1]
  }
];

/**
 * 主函数 - 执行数据导入
 */
async function seedDatabase() {
  try {
    // 1. 连接到数据库
    console.log('正在连接 MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking-dev';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✓ MongoDB 连接成功');
    
    // 2. 清空现有数据
    console.log('\n清空现有数据...');
    await User.deleteMany({});
    await Hotel.deleteMany({});
    console.log('✓ 数据已清空');
    
    // 3. 创建用户（逐个创建以触发密码加密钩子）
    console.log('\n创建用户...');
    const createdUsers = [];
    for (const userData of usersData) {
      const user = await User.createUser(userData);
      createdUsers.push(user);
    }
    console.log(`✓ 已创建 ${createdUsers.length} 个用户`);
    
    // 打印用户信息
    createdUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.username} (${user.role}) - ID: ${user._id}`);
    });
    
    // 4. 创建酒店
    console.log('\n创建酒店...');
    const merchantIds = [createdUsers[1]._id, createdUsers[2]._id]; // merchant1 和 merchant2
    const hotelsData = getHotelsData(merchantIds);
    
    const createdHotels = await Hotel.insertMany(hotelsData);
    console.log(`✓ 已创建 ${createdHotels.length} 个酒店`);
    
    // 打印酒店信息
    createdHotels.forEach((hotel, index) => {
      console.log(`  ${index + 1}. ${hotel.nameCn} (${hotel.city}) - ID: ${hotel._id}`);
      console.log(`     价格范围: ¥${hotel.getMinPrice()} - ¥${hotel.getMaxPrice()}`);
    });
    
    // 5. 统计信息
    console.log('\n========== 数据导入完成 ==========');
    console.log(`总用户数: ${await User.countDocuments()}`);
    console.log(`总酒店数: ${await Hotel.countDocuments()}`);
    console.log(`已发布酒店: ${await Hotel.countDocuments({ status: 'published' })}`);
    console.log(`待审核酒店: ${await Hotel.countDocuments({ reviewStatus: 'pending' })}`);
    console.log('==================================\n');
    
    // 6. 示例查询
    console.log('示例查询结果：');
    
    // 查询上海的酒店
    const shanghaiHotels = await Hotel.find({ city: '上海' }).select('nameCn starRating');
    console.log(`\n上海酒店 (${shanghaiHotels.length} 家)：`);
    shanghaiHotels.forEach(h => {
      console.log(`  - ${h.nameCn} (${h.starRating}★)`);
    });
    
    // 查询最高评分酒店
    const topRated = await Hotel.findOne().sort({ averageRating: -1 }).limit(1);
    if (topRated) {
      console.log(`\n最高评分酒店: ${topRated.nameCn} (${topRated.averageRating}⭐ - ${topRated.totalReviews} 条评价)`);
    }
    
    // 关闭连接
    await mongoose.disconnect();
    console.log('\n✓ 数据导入完成，MongoDB 连接已关闭');
    
  } catch (err) {
    console.error('✗ 数据导入失败:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('  请确保 MongoDB 已安装并正在运行');
      console.error('  Docker 启动: docker run -d -p 27017:27017 --name mongodb mongo:latest');
    }
    process.exit(1);
  }
}

// 执行导入
seedDatabase();
