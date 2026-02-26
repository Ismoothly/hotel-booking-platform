/**
 * 补充上海酒店脚本
 * 再添加2个上海酒店，达到10个总数
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Hotel = require('../src/models/Hotel-mongoose');
const User = require('../src/models/User-mongoose');

// 额外的2个上海酒店
const additionalHotels = [
  {
    nameCn: '上海浦东四季酒店',
    nameEn: 'Four Seasons Hotel Shanghai Pudong',
    address: '上海市浦东新区绿城路99号',
    city: '上海',
    starRating: 5,
    openingDate: new Date('2007-10-15'),
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd'
    ],
    rooms: [
      { type: '豪华房', price: 1988, description: '55平米，浦江景观' , quantity: 45 },
      { type: '套房', price: 3688, description: '95平米，浦陆家嘴全景', quantity: 12 },
      { type: '总统套房', price: 6888, description: '150平米，顶级服务', quantity: 2 }
    ],
    facilities: ['免费WiFi', '米其林星级餐厅', 'SPA', '泳池', '管家服务', '豪华礼宾'],
    nearbyAttractions: ['陆家嘴金融中心', '东方明珠塔', '上海中心'],
    transportation: '地铁2号线陆家嘴站步行8分钟',
    nearbyShopping: ['正大广场', '环球金融中心'],
    discounts: [],
    description: '浦东滨河超五星奢华酒店，四季品质尊享',
    phone: '021-5888-8888',
    email: 'info@fourseasons-shanghai.com',
    website: 'https://www.fourseasons-shanghai.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.9,
    totalReviews: 892,
    bookingCount: 5234,
    merchantId: null // 待设置
  },
  {
    nameCn: '上海浦东新区奥源宝纳公寓酒店',
    nameEn: 'shanghai Pudong Ascott Apartment Hotel',
    address: '上海市浦东新区世纪大道100号环球金融中心',
    city: '上海',
    starRating: 4,
    openingDate: new Date('2020-11-01'),
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39'
    ],
    rooms: [
      { type: '一房公寓', price: 888, description: '55平米，厨房齐全', quantity: 28 },
      { type: '两房公寓', price: 1288, description: '85平米，家居式体验', quantity: 15 },
      { type: '三房公寓', price: 1688, description: '115平米，长住最佳选择', quantity: 8 }
    ],
    facilities: ['免费WiFi', '全厨房', '洗衣机', '24小时前台', '健身房', '自助洗衣'],
    nearbyAttractions: ['环球金融中心', '陆家嘴', '东方明珠塔'],
    transportation: '地铁2号线陆家嘴站步行2分钟',
    nearbyShopping: ['环球金融中心商场'],
    discounts: [{ type: '长住优惠', description: '连住14晚以上享8折', percentage: 20 }],
    description: '陆家嘴环球中心内的高端公寓酒店，长住首选',
    phone: '021-5047-8888',
    email: 'info@ascott-shanghai.com',
    website: 'https://www.ascott-shanghai.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.4,
    totalReviews: 267,
    bookingCount: 1543,
    merchantId: null // 待设置
  }
];

/**
 * 主函数 - 补充上海酒店
 */
async function addMoreShanghaiHotels() {
  try {
    // 1. 连接到数据库
    console.log('正在连接 MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking-dev';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✓ MongoDB 连接成功\n');
    
    // 2. 获取 merchant 用户ID
    console.log('获取商户信息...');
    const merchants = await User.find({ role: 'merchant' }).limit(2);
    
    if (merchants.length === 0) {
      console.error('✗ 错误：未找到商户用户，请先运行 seed.js 初始化数据');
      process.exit(1);
    }
    
    const merchantIds = merchants.map(m => m._id);
    console.log(`✓ 找到 ${merchants.length} 个商户\n`);
    
    // 3. 分配 merchantId 到酒店数据
    console.log('准备添加酒店数据...');
    additionalHotels.forEach((hotel, index) => {
      hotel.merchantId = merchantIds[index % merchantIds.length];
    });
    
    // 4. 添加酒店
    console.log(`添加 ${additionalHotels.length} 个上海酒店...\n`);
    const createdHotels = await Hotel.insertMany(additionalHotels, { ordered: false });
    console.log(`✓ 成功添加 ${createdHotels.length} 个上海酒店\n`);
    
    // 打印新增酒店信息
    createdHotels.forEach((hotel, index) => {
      console.log(`${index + 1}. ${hotel.nameCn}`);
      console.log(`   地址: ${hotel.address}`);
      console.log(`   星级: ${hotel.starRating}⭐ | 价格: ¥${hotel.getMinPrice()} - ¥${hotel.getMaxPrice()}`);
      console.log(`   ID: ${hotel._id}\n`);
    });
    
    // 5. 统计上海酒店总数
    const totalShanghai = await Hotel.countDocuments({ city: '上海' });
    const publishedShanghai = await Hotel.countDocuments({ city: '上海', status: 'published' });
    
    console.log('========== 最终统计信息 ==========');
    console.log(`✓ 上海酒店总数: ${totalShanghai} 家`);
    console.log(`  - 已发布: ${publishedShanghai} 家`);
    console.log(`  - 待审核: ${await Hotel.countDocuments({ city: '上海', reviewStatus: 'pending' })} 家`);
    console.log(`  - 草稿: ${await Hotel.countDocuments({ city: '上海', status: 'draft' })} 家`);
    
    // 总酒店数
    const totalHotels = await Hotel.countDocuments();
    console.log(`\n全部酒店总数: ${totalHotels} 家`);
    
    // 城市分布
    console.log('\n--- 各城市酒店分布 ---');
    const cityStats = await Hotel.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    cityStats.forEach(c => {
      const marker = c._id === '上海' ? '✓' : ' ';
      console.log(`${marker} ${c._id}: ${c.count} 家`);
    });
    
    console.log('\n==================================\n');
    
    // 6. 列出所有上海酒店
    console.log('--- 上海全部酒店列表 ---');
    const allShanghai = await Hotel.find({ city: '上海' })
      .select('nameCn starRating ')
      .sort({ starRating: -1 });
    
    allShanghai.forEach((h, i) => {
      console.log(`${i + 1}. ${h.nameCn} (${h.starRating}⭐)`);
    });
    
    console.log('\n==================================\n');
    
    // 关闭连接
    await mongoose.disconnect();
    console.log('✓ 添加完成，MongoDB 连接已关闭\n');
    
  } catch (err) {
    console.error('✗ 添加失败:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('  请确保 MongoDB 已安装并正在运行');
    }
    process.exit(1);
  }
}

// 执行添加
addMoreShanghaiHotels();
