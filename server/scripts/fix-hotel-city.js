/**
 * 修复酒店 city 字段为空的记录
 * 从 address 字段中提取城市信息
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Hotel = require('../src/models/Hotel-mongoose');

const CITY_KEYWORDS = [
  '北京', '天津', '上海', '重庆',
  '广州', '深圳', '杭州', '成都', 
  '西安', '南京', '武汉'
];

async function fixHotelCities() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking-dev');
    console.log('✓ 数据库连接成功');

    // 查找所有 city 为空的酒店
    const emptyHotels = await Hotel.find({
      $or: [
        { city: null },
        { city: '' },
        { city: undefined }
      ]
    });

    console.log(`\n找到 ${emptyHotels.length} 条 city 为空的酒店记录\n`);

    if (emptyHotels.length === 0) {
      console.log('✓ 没有需要修复的记录');
      await mongoose.connection.close();
      return;
    }

    // 修复每条记录
    for (const hotel of emptyHotels) {
      const address = hotel.address || '';
      let foundCity = '';

      // 从地址中查找城市关键字
      for (const city of CITY_KEYWORDS) {
        if (address.includes(city)) {
          foundCity = city + '市';
          break;
        }
      }

      if (foundCity) {
        console.log(`修复: ${hotel.nameCn}`);
        console.log(`  地址: ${address}`);
        console.log(`  设置 city: ${foundCity}\n`);
        
        hotel.city = foundCity;
        await hotel.save();
      } else {
        console.log(`⚠ 无法从地址提取城市: ${hotel.nameCn}`);
        console.log(`  地址: ${address}\n`);
      }
    }

    // 显示修复结果
    const updatedHotels = await Hotel.find({
      $or: [
        { city: null },
        { city: '' },
        { city: undefined }
      ]
    });

    console.log(`\n修复完成！`);
    console.log(`仍有 ${updatedHotels.length} 条记录 city 为空\n`);

    // 显示所有酒店的城市信息
    const allHotels = await Hotel.find({}, 'nameCn address city');
    console.log('所有酒店的城市信息：');
    console.log('─'.repeat(60));
    allHotels.forEach(h => {
      console.log(`${h.nameCn}`);
      console.log(`  城市: ${h.city || '(空)'}`);
      console.log(`  地址: ${h.address}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('✓ 修复脚本完成');
  } catch (error) {
    console.error('✗ 修复失败:', error);
    process.exit(1);
  }
}

fixHotelCities();
