/**
 * 再次补充上海酒店脚本
 * 添加4个上海酒店，达到14个总数
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Hotel = require('../src/models/Hotel-mongoose');
const User = require('../src/models/User-mongoose');

// 再增加的4个上海酒店
const moreHotels = [
  {
    nameCn: '上海浦东红管家国际公寓',
    nameEn: 'Shanghai Pudong Home Hotel International Apartment',
    address: '上海市浦东新区南京东路618号',
    city: '上海',
    starRating: 4,
    openingDate: new Date('2019-05-01'),
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39'
    ],
    rooms: [
      { type: '豪华单房间公寓', price: 798, description: '50平米，带厨房', quantity: 20 },
      { type: '两房公寓', price: 1188, description: '80平米，温馨家居', quantity: 18 },
      { type: '高级公寓', price: 1588, description: '100平米，全配套', quantity: 10 }
    ],
    facilities: ['免费WiFi', '全厨房', '洗衣机', '早餐', '健身房', '门房服务'],
    nearbyAttractions: ['南京东路', '外滩', '人民广场'],
    transportation: '地铁2号线南京东路站步行5分钟',
    nearbyShopping: ['南京东路商业街'],
    discounts: [{ type: '月租优惠', description: '连住30天享75折', percentage: 25 }],
    description: '浦东中心的高端公寓酒店，适合中长期居住',
    phone: '021-5385-8888',
    email: 'info@hongguanjia-shanghai.com',
    website: 'https://www.hongguanjia-shanghai.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.5,
    totalReviews: 234,
    bookingCount: 1456,
    merchantId: null
  },
  {
    nameCn: '上海长宁区丽笙酒店',
    nameEn: 'Radisson Shanghai Changning',
    address: '上海市长宁区虹桥路2288号',
    city: '上海',
    starRating: 4,
    openingDate: new Date('2018-09-15'),
    images: [
      'https://images.unsplash.com/photo-1564078516801-fdfb59762fc1',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd'
    ],
    rooms: [
      { type: '标准房', price: 628, description: '32平米，舒适宽敞', quantity: 32 },
      { type: '高级房', price: 728, description: '38平米，城市景观', quantity: 24 },
      { type: '套房', price: 1228, description: '65平米，分区设计', quantity: 10 }
    ],
    facilities: ['免费WiFi', '健身房', '游泳池', '餐厅', '酒廊', '会议室'],
    nearbyAttractions: ['虹桥商务区', '龙华机场', '古北水镇'],
    transportation: '地铁10号线虹桥路站步行3分钟',
    nearbyShopping: ['来福士广场', '恒隆广场'],
    discounts: [],
    description: '虹桥商务区的四星体验酒店，商务休闲兼备',
    phone: '021-6288-8888',
    email: 'info@radissonshanghai.com',
    website: 'https://www.radissonshanghai.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.4,
    totalReviews: 312,
    bookingCount: 1823,
    merchantId: null
  },
  {
    nameCn: '上海闵行区馨乐庭公寓',
    nameEn: 'Citadines Shanghai Minhang',
    address: '上海市闵行区莘庄路100号',
    city: '上海',
    starRating: 3,
    openingDate: new Date('2017-07-01'),
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461'
    ],
    rooms: [
      { type: '一房公寓', price: 488, description: '40平米，经济实惠', quantity: 26 },
      { type: '两房公寓', price: 688, description: '65平米，家庭首选', quantity: 18 },
      { type: '三房公寓', price: 988, description: '95平米，宽松生活', quantity: 8 }
    ],
    facilities: ['免费WiFi', '全厨房', '洗衣机', '便利店', '24小时前台'],
    nearbyAttractions: ['莘庄地铁站', '虹梅路', '航南路'],
    transportation: '地铁1号线莘庄站步行2分钟',
    nearbyShopping: ['莘庄龙之梦'],
    discounts: [{ type: '周末套餐', description: '周末入住享9折', percentage: 10 }],
    description: '闵行宜居的经济型公寓，长期居住最佳选择',
    phone: '021-5486-8888',
    email: 'info@citadines-minhang.com',
    website: 'https://www.citadines-minhang.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.2,
    totalReviews: 267,
    bookingCount: 1654,
    merchantId: null
  },
  {
    nameCn: '上海浦东威斯汀大酒店',
    nameEn: 'The Westin Shanghai Pudong',
    address: '上海市浦东新区浦东南路1056号',
    city: '上海',
    starRating: 5,
    openingDate: new Date('2008-01-08'),
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945'
    ],
    rooms: [
      { type: '豪华房', price: 1288, description: '48平米，浦江景观', quantity: 52 },
      { type: '套房', price: 2188, description: '80平米，分层设计', quantity: 18 },
      { type: '总统套房', price: 5588, description: '150平米，豪华享受', quantity: 3 }
    ],
    facilities: ['免费WiFi', '米其林星级餐厅', '天梦之床', '泳池', 'SPA', '24小时礼宾'],
    nearbyAttractions: ['浦东南路', '时代广场', '东方明珠塔'],
    transportation: '地铁2号线陆家嘴站步行10分钟',
    nearbyShopping: ['时代广场'],
    discounts: [],
    description: '浦东威斯汀五星旗舰酒店，卓越品质象征',
    phone: '021-5888-1888',
    email: 'info@westin-pudong.com',
    website: 'https://www.westin-pudong.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.7,
    totalReviews: 756,
    bookingCount: 4523,
    merchantId: null
  }
];

/**
 * 主函数 - 再添加4个上海酒店
 */
async function addFourMoreHotels() {
  try {
    console.log('正在连接 MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking-dev';
    
    const connectOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    
    // 如果需要认证，添加认证选项
    if (mongoUri.includes('@')) {
      connectOptions.authSource = 'admin';
    }
    
    await mongoose.connect(mongoUri, connectOptions);
    
    console.log('✓ MongoDB 连接成功\n');
    
    // 获取商户信息
    console.log('获取商户信息...');
    const merchants = await User.find({ role: 'merchant' }).limit(2);
    
    if (merchants.length === 0) {
      console.error('✗ 错误：未找到商户用户');
      process.exit(1);
    }
    
    const merchantIds = merchants.map(m => m._id);
    console.log(`✓ 找到 ${merchants.length} 个商户\n`);
    
    // 分配 merchantId
    console.log('准备添加酒店数据...');
    moreHotels.forEach((hotel, index) => {
      hotel.merchantId = merchantIds[index % merchantIds.length];
    });
    
    // 添加酒店
    console.log(`添加 ${moreHotels.length} 个上海酒店...\n`);
    const createdHotels = await Hotel.insertMany(moreHotels, { ordered: false });
    console.log(`✓ 成功添加 ${createdHotels.length} 个上海酒店\n`);
    
    // 打印新增酒店
    createdHotels.forEach((hotel, index) => {
      console.log(`${index + 1}. ${hotel.nameCn}`);
      console.log(`   星级: ${hotel.starRating}⭐ | 价格: ¥${hotel.getMinPrice()} - ¥${hotel.getMaxPrice()}`);
    });
    
    // 最终统计
    const totalShanghai = await Hotel.countDocuments({ city: '上海' });
    const totalHotels = await Hotel.countDocuments();
    
    console.log('\n========== 最终统计 ==========');
    console.log(`✓ 上海酒店总数: ${totalShanghai} 家`);
    console.log(`  - 已发布: ${await Hotel.countDocuments({ city: '上海', status: 'published' })} 家`);
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
    
    // 关闭连接
    await mongoose.disconnect();
    console.log('✓ 添加完成，MongoDB 连接已关闭\n');
    
  } catch (err) {
    console.error('✗ 添加失败:', err.message);
    process.exit(1);
  }
}

addFourMoreHotels();
