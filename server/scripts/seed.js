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
      { type: '豪华大床房', price: 888, description: '35平米，大床，景观房', quantity: 10 },
      { type: '豪华双床房', price: 888, description: '35平米，双床，景观房', quantity: 8 },
      { type: '行政套房', price: 1588, description: '60平米，大床，独立客厅', quantity: 5 }
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
      { type: '标准大床房', price: 499, description: '25平米，大床，城市景观', quantity: 15 },
      { type: '标准双床房', price: 499, description: '25平米，双床，城市景观', quantity: 12 },
      { type: '商务套房', price: 799, description: '45平米，大床，办公区', quantity: 6 }
    ],
    facilities: ['免费WiFi', '健身房', '商务中心', '餐厅'],
    nearbyAttractions: ['静安寺', '人民广场', '上海博物馆'],
    transportation: '地铁2号线静安寺站步行3分钟',
    nearbyShopping: ['久光百货', '芮欧百货'],
    discounts: [{ type: '早鸟优惠', description: '提前7天预订享9折', percentage: 10 }],
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
      { type: '景观房', price: 1299, description: '50平米，大床，西湖景观', quantity: 20 },
      { type: '豪华套房', price: 2199, description: '80平米，大床，客厅，露台', quantity: 8 }
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
      { type: '商务客房', price: 699, description: '30平米，大床，办公桌', quantity: 25 },
      { type: '商务套房', price: 1099, description: '55平米，分区，会议区', quantity: 10 }
    ],
    facilities: ['免费WiFi', '商务中心', '会议室', '健身房', '24小时咖啡厅'],
    nearbyAttractions: ['CCTV总部', '国贸购物中心', '朝阳公园'],
    transportation: '地铁1号线国贸站步行5分钟',
    nearbyShopping: ['国贸购物中心'],
    discounts: [{ type: '长住优惠', description: '连住5晚以上享8折', percentage: 20 }],
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
  },
  {
    nameCn: '上海浦东机场快捷酒店',
    nameEn: 'Shanghai Pudong Airport Express Hotel',
    address: '上海市浦东新区启航路88号',
    city: '上海',
    starRating: 3,
    openingDate: new Date('2017-08-01'),
    images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791'],
    rooms: [
      { type: '经济单人间', price: 268, description: '18平米，单床', quantity: 30 },
      { type: '标准双人间', price: 328, description: '22平米，双床', quantity: 25 }
    ],
    facilities: ['免费WiFi', '24小时前台', '接送机'],
    nearbyAttractions: ['浦东机场', '迪士尼度假区'],
    transportation: '机场大巴直达，约15分钟',
    nearbyShopping: ['奥特莱斯'],
    discounts: [],
    description: '毗邻浦东机场，适合转机及早班机旅客',
    phone: '021-3847-5678',
    email: 'info@pudongexpress.com',
    website: 'https://www.pudongexpress.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.0,
    totalReviews: 523,
    bookingCount: 3200,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '北京故宫旁胡同客栈',
    nameEn: 'Beijing Hutong Inn near Forbidden City',
    address: '北京市东城区南池子大街12号',
    city: '北京',
    starRating: 3,
    openingDate: new Date('2016-04-20'),
    images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4'],
    rooms: [
      { type: '胡同大床房', price: 398, description: '20平米，大床，老北京风格', quantity: 8 },
      { type: '四合院套房', price: 698, description: '40平米，独立院落', quantity: 4 }
    ],
    facilities: ['免费WiFi', '早餐', '行李寄存'],
    nearbyAttractions: ['故宫', '天安门', '景山公园'],
    transportation: '地铁1号线天安门东站步行8分钟',
    nearbyShopping: ['王府井'],
    discounts: [],
    description: '老北京胡同里的特色客栈，步行可达故宫',
    phone: '010-6512-3456',
    email: 'info@hutonginn.com',
    website: 'https://www.hutonginn.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.6,
    totalReviews: 312,
    bookingCount: 1890,
    merchantId: merchantIds[1]
  },
  {
    nameCn: '广州珠江新城W酒店',
    nameEn: 'Guangzhou Pearl River W Hotel',
    address: '广州市天河区珠江新城华夏路1号',
    city: '广州',
    starRating: 5,
    openingDate: new Date('2019-11-01'),
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'],
    rooms: [
      { type: '奇妙大床房', price: 1288, description: '45平米，江景', quantity: 20 },
      { type: '酷角套房', price: 2288, description: '75平米，露台', quantity: 10 }
    ],
    facilities: ['免费WiFi', '泳池', '酒吧', 'SPA', '健身房'],
    nearbyAttractions: ['广州塔', '珠江夜游', '花城广场'],
    transportation: '地铁3号线珠江新城站步行2分钟',
    nearbyShopping: ['太古汇', 'K11'],
    discounts: [],
    description: '珠江新城核心地带奢华酒店，俯瞰小蛮腰',
    phone: '020-3810-8888',
    email: 'info@whotel-gz.com',
    website: 'https://www.whotel-gz.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.7,
    totalReviews: 445,
    bookingCount: 2100,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '深圳福田智选假日酒店',
    nameEn: 'Holiday Inn Express Shenzhen Futian',
    address: '深圳市福田区福华路88号',
    city: '深圳',
    starRating: 4,
    openingDate: new Date('2020-07-15'),
    images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461'],
    rooms: [
      { type: '标准房', price: 458, description: '28平米，大床/双床', quantity: 40 },
      { type: '高级房', price: 528, description: '32平米，高楼层', quantity: 25 }
    ],
    facilities: ['免费WiFi', '早餐', '健身房', '洗衣'],
    nearbyAttractions: ['会展中心', '市民中心', '莲花山'],
    transportation: '地铁1号线会展中心站B出口',
    nearbyShopping: ['皇庭广场', '中心城'],
    discounts: [{ type: '会员价', description: '官网会员享95折', percentage: 5 }],
    description: '福田CBD高性价比商务酒店',
    phone: '0755-8288-6666',
    email: 'info@hiexpress-sz.com',
    website: 'https://www.hiexpress-sz.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.2,
    totalReviews: 278,
    bookingCount: 1567,
    merchantId: merchantIds[1]
  },
  {
    nameCn: '成都宽窄巷子精品酒店',
    nameEn: 'Chengdu Kuanzhai Alley Boutique Hotel',
    address: '成都市青羊区宽窄巷子景区内',
    city: '成都',
    starRating: 4,
    openingDate: new Date('2018-05-01'),
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945'],
    rooms: [
      { type: '川西风情房', price: 588, description: '30平米，四合院风格', quantity: 12 },
      { type: '宽窄套房', price: 888, description: '50平米，露台观景', quantity: 6 }
    ],
    facilities: ['免费WiFi', '茶室', '川菜餐厅', '庭院'],
    nearbyAttractions: ['宽窄巷子', '人民公园', '锦里'],
    transportation: '地铁2号线人民公园站步行5分钟',
    nearbyShopping: ['太古里', 'IFS'],
    discounts: [],
    description: '坐落宽窄巷子景区，体验老成都慢生活',
    phone: '028-8666-8888',
    email: 'info@kuanzhaihotel.com',
    website: 'https://www.kuanzhaihotel.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.5,
    totalReviews: 389,
    bookingCount: 2340,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '西安大雁塔亚朵酒店',
    nameEn: 'Atour Hotel Xi\'an Giant Wild Goose Pagoda',
    address: '西安市雁塔区雁塔南路与雁南一路交汇处',
    city: '西安',
    starRating: 4,
    openingDate: new Date('2019-09-10'),
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd'],
    rooms: [
      { type: '几木大床房', price: 428, description: '32平米，阅读区', quantity: 25 },
      { type: '行政双床房', price: 498, description: '35平米，茶具', quantity: 15 }
    ],
    facilities: ['免费WiFi', '阅读空间', '洗衣', '夜宵'],
    nearbyAttractions: ['大雁塔', '大唐不夜城', '陕西历史博物馆'],
    transportation: '地铁3号线大雁塔站步行6分钟',
    nearbyShopping: ['大悦城', '赛格'],
    discounts: [],
    description: '人文阅读型酒店，紧邻大雁塔与不夜城',
    phone: '029-8866-1234',
    email: 'info@atour-xian.com',
    website: 'https://www.atour-xian.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.6,
    totalReviews: 567,
    bookingCount: 2890,
    merchantId: merchantIds[1]
  },
  {
    nameCn: '南京夫子庙如家商旅',
    nameEn: 'Home Inn Plus Nanjing Confucius Temple',
    address: '南京市秦淮区贡院街88号',
    city: '南京',
    starRating: 3,
    openingDate: new Date('2017-03-01'),
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427'],
    rooms: [
      { type: '标准大床房', price: 298, description: '22平米', quantity: 35 },
      { type: '家庭房', price: 368, description: '28平米，可住4人', quantity: 15 }
    ],
    facilities: ['免费WiFi', '早餐', '24小时前台'],
    nearbyAttractions: ['夫子庙', '秦淮河', '老门东'],
    transportation: '地铁3号线夫子庙站步行3分钟',
    nearbyShopping: ['水游城', '水平方'],
    discounts: [],
    description: '夫子庙景区旁经济型商旅酒店',
    phone: '025-5223-4567',
    email: 'info@homeinn-nj.com',
    website: 'https://www.homeinn-nj.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.1,
    totalReviews: 892,
    bookingCount: 4500,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '苏州园林观前街酒店',
    nameEn: 'Suzhou Garden Hotel near Guanqian Street',
    address: '苏州市姑苏区观前街1号',
    city: '苏州',
    starRating: 4,
    openingDate: new Date('2018-08-15'),
    images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791'],
    rooms: [
      { type: '园林景观房', price: 668, description: '35平米，中式装修', quantity: 18 },
      { type: '庭院套房', price: 988, description: '55平米，私家庭院', quantity: 8 }
    ],
    facilities: ['免费WiFi', '苏帮菜餐厅', '茶室', '会议室'],
    nearbyAttractions: ['拙政园', '狮子林', '观前街'],
    transportation: '地铁1号线临顿路站步行5分钟',
    nearbyShopping: ['观前街', '平江路'],
    discounts: [],
    description: '苏州老城核心，融合园林文化的精品酒店',
    phone: '0512-6520-8888',
    email: 'info@suzhougardenhotel.com',
    website: 'https://www.suzhougardenhotel.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.5,
    totalReviews: 234,
    bookingCount: 1200,
    merchantId: merchantIds[1]
  },
  {
    nameCn: '厦门鼓浪屿海景客栈',
    nameEn: 'Xiamen Gulangyu Sea View Inn',
    address: '厦门市思明区鼓浪屿龙头路168号',
    city: '厦门',
    starRating: 3,
    openingDate: new Date('2016-06-01'),
    images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9'],
    rooms: [
      { type: '海景大床房', price: 468, description: '25平米，看海', quantity: 10 },
      { type: '复式家庭房', price: 698, description: '45平米，阁楼', quantity: 5 }
    ],
    facilities: ['免费WiFi', '早餐', '露台'],
    nearbyAttractions: ['日光岩', '菽庄花园', '皓月园'],
    transportation: '轮渡至鼓浪屿码头步行8分钟',
    nearbyShopping: ['龙头路商业街'],
    discounts: [],
    description: '鼓浪屿岛上闹中取静的海景客栈',
    phone: '0592-206-8888',
    email: 'info@gulangyuinn.com',
    website: 'https://www.gulangyuinn.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.4,
    totalReviews: 678,
    bookingCount: 3100,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '三亚亚龙湾丽思卡尔顿',
    nameEn: 'The Ritz-Carlton Sanya Yalong Bay',
    address: '海南省三亚市亚龙湾国家旅游度假区',
    city: '三亚',
    starRating: 5,
    openingDate: new Date('2015-12-01'),
    images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d'],
    rooms: [
      { type: '海景房', price: 2188, description: '55平米，私人阳台', quantity: 60 },
      { type: '泳池别墅', price: 5888, description: '独立别墅，私人泳池', quantity: 12 }
    ],
    facilities: ['免费WiFi', '私人沙滩', 'SPA', '多国餐厅', '儿童俱乐部'],
    nearbyAttractions: ['亚龙湾海滩', '热带天堂森林公园'],
    transportation: '机场大巴约40分钟，酒店接送',
    nearbyShopping: ['百花谷商业街'],
    discounts: [],
    description: '亚龙湾一线海景奢华度假酒店',
    phone: '0898-8898-8888',
    email: 'info@ritzcarlton-sanya.com',
    website: 'https://www.ritzcarlton-sanya.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.9,
    totalReviews: 1203,
    bookingCount: 8900,
    merchantId: merchantIds[1]
  },
  {
    nameCn: '青岛栈桥经济型酒店',
    nameEn: 'Qingdao Zhanqiao Budget Hotel',
    address: '青岛市市南区栈桥海滨路22号',
    city: '青岛',
    starRating: 2,
    openingDate: new Date('2015-04-01'),
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945'],
    rooms: [
      { type: '单人间', price: 168, description: '15平米', quantity: 20 },
      { type: '双人间', price: 198, description: '18平米', quantity: 25 }
    ],
    facilities: ['免费WiFi', '24小时热水'],
    nearbyAttractions: ['栈桥', '天主教堂', '劈柴院'],
    transportation: '火车站步行10分钟',
    nearbyShopping: ['中山路'],
    discounts: [],
    description: '栈桥旁经济型住宿，交通便利',
    phone: '0532-8286-1234',
    email: 'info@zhanqiaohotel.com',
    website: 'https://www.zhanqiaohotel.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 3.8,
    totalReviews: 445,
    bookingCount: 2100,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '重庆解放碑威斯汀',
    nameEn: 'The Westin Chongqing Liberation Monument',
    address: '重庆市渝中区民权路66号',
    city: '重庆',
    starRating: 5,
    openingDate: new Date('2017-10-01'),
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'],
    rooms: [
      { type: '豪华房', price: 988, description: '42平米，江景', quantity: 35 },
      { type: '行政套房', price: 1688, description: '70平米，解放碑景观', quantity: 15 }
    ],
    facilities: ['免费WiFi', '天梦之床', '健身房', '中餐厅', '行政酒廊'],
    nearbyAttractions: ['解放碑', '洪崖洞', '长江索道'],
    transportation: '地铁1/2号线较场口站步行3分钟',
    nearbyShopping: ['解放碑商圈', '八一好吃街'],
    discounts: [],
    description: '解放碑核心地标五星酒店，俯瞰两江',
    phone: '023-6388-8888',
    email: 'info@westin-cq.com',
    website: 'https://www.westin-cq.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.6,
    totalReviews: 556,
    bookingCount: 3456,
    merchantId: merchantIds[1]
  },
  {
    nameCn: '杭州西溪湿地度假村',
    nameEn: 'Hangzhou Xixi Wetland Resort',
    address: '杭州市余杭区文二西路西溪国家湿地公园东侧',
    city: '杭州',
    starRating: 4,
    openingDate: new Date('2019-04-01'),
    images: ['https://images.unsplash.com/photo-1564078516801-fdfb59762fc1'],
    rooms: [
      { type: '湿地景观房', price: 798, description: '40平米，阳台', quantity: 30 },
      { type: '别墅房', price: 1598, description: '80平米，独栋', quantity: 10 }
    ],
    facilities: ['免费WiFi', '湿地游船', '自行车', '餐厅'],
    nearbyAttractions: ['西溪湿地', '蒋村慢生活街区'],
    transportation: '公交至西溪湿地东门',
    nearbyShopping: ['西溪印象城'],
    discounts: [{ type: '周末套餐', description: '含双早+湿地门票', percentage: 15 }],
    description: '西溪湿地畔生态度假酒店',
    phone: '0571-8899-1234',
    email: 'info@xixiresort.com',
    website: 'https://www.xixiresort.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.4,
    totalReviews: 267,
    bookingCount: 1450,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '北京南锣鼓巷青年旅舍',
    nameEn: 'Beijing Nanluoguxiang Youth Hostel',
    address: '北京市东城区南锣鼓巷85号',
    city: '北京',
    starRating: 2,
    openingDate: new Date('2014-01-01'),
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'],
    rooms: [
      { type: '床位(多人间)', price: 88, description: '上下铺', quantity: 40 },
      { type: '双人间', price: 258, description: '20平米', quantity: 12 }
    ],
    facilities: ['免费WiFi', '公共厨房', '行李寄存', '旅游咨询'],
    nearbyAttractions: ['南锣鼓巷', '鼓楼', '后海'],
    transportation: '地铁6/8号线南锣鼓巷站E口',
    nearbyShopping: ['南锣鼓巷'],
    discounts: [],
    description: '南锣鼓巷内的国际青年旅舍，背包客首选',
    phone: '010-6402-5678',
    email: 'info@nanluohostel.com',
    website: 'https://www.nanluohostel.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.2,
    totalReviews: 1205,
    bookingCount: 5600,
    merchantId: merchantIds[1]
  },
  {
    nameCn: '上海虹桥枢纽全季酒店',
    nameEn: 'Shanghai Hongqiao Hub Ji Hotel',
    address: '上海市闵行区申虹路666号',
    city: '上海',
    starRating: 3,
    openingDate: new Date('2020-03-01'),
    images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461'],
    rooms: [
      { type: '高级大床房', price: 358, description: '28平米', quantity: 50 },
      { type: '零压双床房', price: 398, description: '30平米，零压床垫', quantity: 30 }
    ],
    facilities: ['免费WiFi', '早餐', '健身房', '洗衣'],
    nearbyAttractions: ['虹桥商务区', '国家会展中心'],
    transportation: '虹桥机场/火车站车程约10分钟',
    nearbyShopping: ['虹桥天地', '龙湖天街'],
    discounts: [],
    description: '虹桥交通枢纽旁，差旅便捷',
    phone: '021-3479-8888',
    email: 'info@jihotel-hq.com',
    website: 'https://www.jihotel-hq.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.3,
    totalReviews: 412,
    bookingCount: 2800,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '深圳大梅沙京基喜来登',
    nameEn: 'Sheraton Dameisha Resort Shenzhen',
    address: '深圳市盐田区大梅沙盐梅路9号',
    city: '深圳',
    starRating: 5,
    openingDate: new Date('2016-07-01'),
    images: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9'],
    rooms: [
      { type: '海景房', price: 1188, description: '48平米，阳台观海', quantity: 45 },
      { type: '家庭套房', price: 1888, description: '75平米，双卫', quantity: 15 }
    ],
    facilities: ['免费WiFi', '私人沙滩', '泳池', '儿童乐园', '多餐厅'],
    nearbyAttractions: ['大梅沙海滨公园', '东部华侨城'],
    transportation: '公交M191/M196至大梅沙',
    nearbyShopping: ['奥特莱斯'],
    discounts: [],
    description: '大梅沙一线海景度假酒店',
    phone: '0755-2528-8888',
    email: 'info@sheraton-dameisha.com',
    website: 'https://www.sheraton-dameisha.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.5,
    totalReviews: 723,
    bookingCount: 4200,
    merchantId: merchantIds[1]
  },
  {
    nameCn: '成都春熙路汉庭酒店',
    nameEn: 'Hanting Hotel Chengdu Chunxi Road',
    address: '成都市锦江区春熙路北段28号',
    city: '成都',
    starRating: 2,
    openingDate: new Date('2015-11-01'),
    images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427'],
    rooms: [
      { type: '标准大床房', price: 228, description: '20平米', quantity: 40 },
      { type: '标准双床房', price: 248, description: '22平米', quantity: 35 }
    ],
    facilities: ['免费WiFi', '24小时前台', '自助洗衣'],
    nearbyAttractions: ['春熙路', '太古里', 'IFS'],
    transportation: '地铁2/3号线春熙路站C口',
    nearbyShopping: ['春熙路', '太古里'],
    discounts: [],
    description: '春熙路商圈高性价比住宿',
    phone: '028-8666-2345',
    email: 'info@hanting-cd.com',
    website: 'https://www.hanting-cd.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.0,
    totalReviews: 1567,
    bookingCount: 7800,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '西安钟楼亚朵S酒店',
    nameEn: 'Atour S Hotel Xi\'an Bell Tower',
    address: '西安市碑林区南大街1号',
    city: '西安',
    starRating: 4,
    openingDate: new Date('2021-01-15'),
    images: ['https://images.unsplash.com/photo-1582719508461-905c673771fd'],
    rooms: [
      { type: '几木房', price: 468, description: '35平米，阅读区', quantity: 28 },
      { type: '行政房', price: 568, description: '42平米', quantity: 12 }
    ],
    facilities: ['免费WiFi', '竹居', '出尘洗衣', '夜宵'],
    nearbyAttractions: ['钟楼', '鼓楼', '回民街'],
    transportation: '地铁2号线钟楼站步行2分钟',
    nearbyShopping: ['开元商城', '钟楼商圈'],
    discounts: [],
    description: '钟楼核心位置，人文生活方式酒店',
    phone: '029-8765-4321',
    email: 'info@atours-xian.com',
    website: 'https://www.atours-xian.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.7,
    totalReviews: 334,
    bookingCount: 1980,
    merchantId: merchantIds[1]
  },
  {
    nameCn: '南京新街口中心智选酒店',
    nameEn: 'Smart Hotel Nanjing Xinjiekou Center',
    address: '南京市玄武区中山路18号',
    city: '南京',
    starRating: 3,
    openingDate: new Date('2018-12-01'),
    images: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791'],
    rooms: [
      { type: '智能大床房', price: 368, description: '26平米，语音控制', quantity: 45 },
      { type: '智能双床房', price: 398, description: '28平米', quantity: 30 }
    ],
    facilities: ['免费WiFi', '智能客控', '早餐', '健身房'],
    nearbyAttractions: ['新街口', '总统府', '玄武湖'],
    transportation: '地铁1/2号线新街口站步行1分钟',
    nearbyShopping: ['德基广场', '新百'],
    discounts: [],
    description: '新街口核心智能酒店',
    phone: '025-8478-8888',
    email: 'info@smarthotel-nj.com',
    website: 'https://www.smarthotel-nj.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.2,
    totalReviews: 289,
    bookingCount: 1670,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '苏州金鸡湖凯悦酒店',
    nameEn: 'Hyatt Regency Suzhou Jinji Lake',
    address: '苏州市工业园区苏州大道东88号',
    city: '苏州',
    starRating: 5,
    openingDate: new Date('2017-06-01'),
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'],
    rooms: [
      { type: '湖景房', price: 1088, description: '45平米，金鸡湖景', quantity: 50 },
      { type: '行政湖景套房', price: 1888, description: '80平米', quantity: 15 }
    ],
    facilities: ['免费WiFi', '泳池', '健身', '中餐厅', '行政酒廊'],
    nearbyAttractions: ['金鸡湖', '诚品书店', '月光码头'],
    transportation: '地铁1号线时代广场站步行5分钟',
    nearbyShopping: ['久光百货', '圆融时代广场'],
    discounts: [],
    description: '金鸡湖畔国际五星，湖景与商务兼备',
    phone: '0512-6288-1234',
    email: 'info@hyatt-suzhou.com',
    website: 'https://www.hyatt-suzhou.com',
    status: 'published',
    reviewStatus: 'approved',
    averageRating: 4.6,
    totalReviews: 678,
    bookingCount: 3900,
    merchantId: merchantIds[1]
  },
  {
    nameCn: '待审核酒店-广州塔店',
    nameEn: 'Pending Review Hotel Canton Tower',
    address: '广州市海珠区阅江西路222号',
    city: '广州',
    starRating: 4,
    openingDate: new Date('2024-01-01'),
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945'],
    rooms: [
      { type: '标准房', price: 688, description: '35平米', quantity: 20 }
    ],
    facilities: ['免费WiFi', '健身房'],
    nearbyAttractions: ['广州塔'],
    transportation: '地铁3号线广州塔站',
    nearbyShopping: [],
    discounts: [],
    description: '近广州塔新开业酒店，待审核',
    phone: '020-8888-0000',
    email: 'pending@example.com',
    website: 'https://www.pendinghotel.com',
    status: 'pending',
    reviewStatus: 'pending',
    averageRating: 0,
    totalReviews: 0,
    bookingCount: 0,
    merchantId: merchantIds[0]
  },
  {
    nameCn: '草稿酒店-深圳科技园',
    nameEn: 'Draft Hotel Shenzhen Tech Park',
    address: '深圳市南山区科技园南路1号',
    city: '深圳',
    starRating: 4,
    openingDate: new Date('2024-06-01'),
    images: [],
    rooms: [
      { type: '商务房', price: 498, description: '30平米', quantity: 30 }
    ],
    facilities: ['免费WiFi', '会议室'],
    nearbyAttractions: ['科技园'],
    transportation: '地铁1号线高新园站',
    nearbyShopping: [],
    discounts: [],
    description: '科技园周边商务酒店（草稿状态）',
    phone: '0755-0000-0000',
    email: 'draft@example.com',
    website: '',
    status: 'draft',
    reviewStatus: 'pending',
    averageRating: 0,
    totalReviews: 0,
    bookingCount: 0,
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
    console.log(`草稿酒店: ${await Hotel.countDocuments({ status: 'draft' })}`);
    console.log('--- 按城市分布（便于筛选测试）---');
    const cityCounts = await Hotel.aggregate([{ $group: { _id: '$city', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    cityCounts.forEach(c => console.log(`  ${c._id}: ${c.count} 家`));
    console.log('--- 按星级分布 ---');
    const starCounts = await Hotel.aggregate([{ $group: { _id: '$starRating', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    starCounts.forEach(s => console.log(`  ${s._id}星: ${s.count} 家`));
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
