/**
 * 增加上海酒店脚本
 * 添加6个新的上海酒店，使总数达到10个
 * 
 * 使用方法：
 * node scripts/add-shanghai-hotels.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Hotel = require('../src/models/Hotel-mongoose');
const User = require('../src/models/User-mongoose');

// 新增的上海酒店数据
const shanghaiHotels = [
  {
    nameCn: '上海南京路希尔顿逸林酒店',
    nameEn: 'DoubleTree by Hilton Shanghai Nanjing Road',
    address: '上海市黄浦区南京东路500号',
    city: '上海',
    starRating: 5,
    openingDate: new Date('2021-03-15'),
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
    ],
    rooms: [
      { type: '豪华房', price: 968, description: '38平米，城市景观，高层房间', quantity: 25 },
      { type: '套房', price: 1588, description: '65平米，大床，独立客厅', quantity: 8 }
    ],
    facilities: ['免费WiFi', '健身房', '游泳池', '米其林星级餐厅', '商务中心', '免费停车'],
    nearbyAttractions: ['南京路步行街', '人民广场', '外滩'],
    transportation: '地铁1号线人民广场站步行2分钟',
    nearbyShopping: ['新世界城', '第一百货'],
    discounts: [{ type: '会员优惠', description: '希尔顿荣誉客会会员享8折', percentage: 20 }],
    description: '南京路商业中心的五星奢华酒店，购物餐饮便利',
    phone: '021-6328-8888',
    email: 'info@doubletreeshanghai.com',
    website: 'https://www.doubletreeshanghai.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.7,
    totalReviews: 324,
    bookingCount: 1876,
    merchantId: null // 待设置
  },
  {
    nameCn: '上海徐家汇美利亚酒店',
    nameEn: 'Meliá Shanghai Xujiahui',
    address: '上海市徐汇区漕溪北路18号',
    city: '上海',
    starRating: 4,
    openingDate: new Date('2019-08-20'),
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427'
    ],
    rooms: [
      { type: '标准房', price: 588, description: '30平米，现代设计', quantity: 30 },
      { type: '高级房', price: 688, description: '35平米，景观房', quantity: 18 },
      { type: '套房', price: 1088, description: '55平米，分层设计', quantity: 6 }
    ],
    facilities: ['免费WiFi', '健身房', '餐厅', '会议室', '酒吧'],
    nearbyAttractions: ['徐家汇商业区', '徐家汇天主堂', '美罗城'],
    transportation: '地铁1/9/11号线徐家汇站B出口',
    nearbyShopping: ['美罗城', '太平洋百货', '东方商厦'],
    discounts: [{ type: '长住优惠', description: '连住7晚以上享85折', percentage: 15 }],
    description: '徐家汇商圈的国际品牌酒店，交通便利',
    phone: '021-3407-8888',
    email: 'info@meliashanghai.com',
    website: 'https://www.meliashanghai.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.5,
    totalReviews: 267,
    bookingCount: 1543,
    merchantId: null // 待设置
  },
  {
    nameCn: '上海浦西和平饭店',
    nameEn: 'The Peace Hotel Shanghai',
    address: '上海市黄浦区南京东路20号',
    city: '上海',
    starRating: 5,
    openingDate: new Date('2010-10-10'),
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      'https://images.unsplash.com/photo-1584622181563-430f63602d4b'
    ],
    rooms: [
      { type: '经典房', price: 1288, description: '50平米，复古奢华风格', quantity: 20 },
      { type: '套房', price: 2588, description: '90平米，江景套房', quantity: 5 }
    ],
    facilities: ['免费WiFi', '米其林星级餐厅', '爵士酒吧', '历史博物馆', '礼宾服务'],
    nearbyAttractions: ['外滩', '南京路', '浦东陆家嘴'],
    transportation: '地铁2号线南京东路站步行3分钟',
    nearbyShopping: ['南京路步行街'],
    discounts: [],
    description: '上海滩传奇五星酒店，百年历史地标，感受摩登上海',
    phone: '021-6138-8888',
    email: 'info@thephotel.com',
    website: 'https://www.thepeacehotel.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.8,
    totalReviews: 568,
    bookingCount: 3456,
    merchantId: null // 待设置
  },
  {
    nameCn: '上海大宁国际中心凯悦酒店',
    nameEn: 'Hyatt Regency Shanghai Daning International',
    address: '上海市静安区共和新路3500号',
    city: '上海',
    starRating: 4,
    openingDate: new Date('2018-06-01'),
    images: [
      'https://images.unsplash.com/photo-1568234631123-b93e8298ba88',
      'https://images.unsplash.com/photo-1574158622682-e40e69881006'
    ],
    rooms: [
      { type: '城景房', price: 658, description: '42平米，落地窗', quantity: 35 },
      { type: '行政房', price: 798, description: '48平米，行政酒廊使用权', quantity: 15 },
      { type: 'Hyatt套房', price: 1388, description: '75平米，分区套房', quantity: 8 }
    ],
    facilities: ['免费WiFi', '健身中心', '泳池', '多餐厅', '会议设施', '行政酒廊'],
    nearbyAttractions: ['大宁商业广场', '静安公园', 'M50艺术园区'],
    transportation: '地铁1/7号线阳曲路站步行5分钟',
    nearbyShopping: ['大宁国际商业广场'],
    discounts: [{ type: '周末套餐', description: '含双早+酒廊使用', percentage: 20 }],
    description: '大宁商务中心的四星凯悦，彰显品质生活',
    phone: '021-6115-8888',
    email: 'info@hyattshanghai.com',
    website: 'https://www.hyattshanghai.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.6,
    totalReviews: 445,
    bookingCount: 2234,
    merchantId: null // 待设置
  },
  {
    nameCn: '上海陆家嘴金茂大厦君悦酒店',
    nameEn: 'Grand Hyatt Shanghai Jinmao Tower',
    address: '上海市浦东新区世纪大道88号金茂大厦',
    city: '上海',
    starRating: 5,
    openingDate: new Date('1998-08-28'),
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
    ],
    rooms: [
      { type: '景观房', price: 1688, description: '50平米，超高层陆家嘴景观', quantity: 60 },
      { type: '行政套房', price: 2888, description: '80平米，顶层江景', quantity: 15 },
      { type: '复式别墅', price: 5888, description: '200平米，一房一厅', quantity: 3 }
    ],
    facilities: ['免费WiFi', 'SPA', '泳池', '米其林星级餐厅', '健身房', '24小时礼宾'],
    nearbyAttractions: ['东方明珠塔', '陆家嘴金融中心', '正大广场'],
    transportation: '地铁2号线陆家嘴站步行1分钟',
    nearbyShopping: ['正大广场', '环球金融中心'],
    discounts: [],
    description: '陆家嘴地标建筑内的超五星酒店，俯瞰浦江全景',
    phone: '021-5047-1234',
    email: 'info@grandhyattshanghai.com',
    website: 'https://www.grandhyattshanghai.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.9,
    totalReviews: 1203,
    bookingCount: 8934,
    merchantId: null // 待设置
  },
  {
    nameCn: '上海虹口万豪酒店',
    nameEn: 'Shanghai Marriott Hotel Hongkou',
    address: '上海市虹口区东大名路501号',
    city: '上海',
    starRating: 4,
    openingDate: new Date('2020-09-01'),
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd'
    ],
    rooms: [
      { type: '标准房', price: 698, description: '35平米，苏州河景观', quantity: 40 },
      { type: '高级房', price: 798, description: '40平米，城市景观', quantity: 25 },
      { type: '套房', price: 1288, description: '65平米，分区套房', quantity: 8 }
    ],
    facilities: ['免费WiFi', '健身房', '泳池', '餐厅', '酒廊', '会议中心'],
    nearbyAttractions: ['苏州河', '四川北路', '虹口足球场'],
    transportation: '地铁8号线东大名路站步行3分钟',
    nearbyShopping: ['四川北路商业街'],
    discounts: [{ type: '高级会员价', description: '万豪银卡以上享8折', percentage: 20 }],
    description: '虹口滨河新地标，苏州河畔的高档商务酒店',
    phone: '021-6308-8888',
    email: 'info@marriottshanghai.com',
    website: 'https://www.marriottshanghai.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.5,
    totalReviews: 389,
    bookingCount: 2156,
    merchantId: null // 待设置
  }
];

/**
 * 主函数 - 添加上海酒店
 */
async function addShanghaiHotels() {
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
    console.log(`✓ 找到 ${merchants.length} 个商户`);
    merchants.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.username} (${m._id})`);
    });
    
    // 3. 分配 merchantId 到酒店数据
    console.log('\n准备添加酒店数据...');
    shanghaiHotels.forEach((hotel, index) => {
      hotel.merchantId = merchantIds[index % merchantIds.length];
    });
    
    // 4. 添加酒店
    console.log(`\n添加 ${shanghaiHotels.length} 个上海酒店...\n`);
    const createdHotels = await Hotel.insertMany(shanghaiHotels, { ordered: false });
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
    
    console.log('========== 统计信息 ==========');
    console.log(`上海酒店总数: ${totalShanghai} 家`);
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
    
    // 关闭连接
    await mongoose.disconnect();
    console.log('✓ 添加完成，MongoDB 连接已关闭\n');
    
  } catch (err) {
    console.error('✗ 添加失败:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('  请确保 MongoDB 已安装并正在运行');
      console.error('  Docker 启动: docker run -d -p 27017:27017 --name mongodb mongo:latest');
    }
    process.exit(1);
  }
}

// 执行添加
addShanghaiHotels();
