/**
 * 修复酒店图片链接脚本
 * 更新上海长宁区丽笙酒店和上海大宁国际中心凯悦酒店的图片URL
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Hotel = require('../src/models/Hotel-mongoose');

// 要更新的酒店信息
const hotelsToUpdate = [
  {
    nameCn: '上海长宁区丽笙酒店',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'
    ]
  },
  {
    nameCn: '上海大宁国际中心凯悦酒店',
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'
    ]
  }
];

/**
 * 主函数 - 修复酒店图片
 */
async function fixHotelImages() {
  try {
    console.log('正在连接 MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking-dev';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✓ MongoDB 连接成功\n');
    
    // 更新酒店
    console.log('更新酒店图片...\n');
    let updatedCount = 0;
    
    for (const hotelInfo of hotelsToUpdate) {
      const result = await Hotel.findOneAndUpdate(
        { nameCn: hotelInfo.nameCn },
        { images: hotelInfo.images },
        { new: true }
      );
      
      if (result) {
        console.log(`✓ ${hotelInfo.nameCn}`);
        console.log(`  已更新 ${result.images.length} 张图片\n`);
        updatedCount++;
      } else {
        console.log(`✗ 找不到酒店: ${hotelInfo.nameCn}\n`);
      }
    }
    
    // 统计信息
    console.log('========== 更新完成 ==========');
    console.log(`成功更新: ${updatedCount} 家酒店`);
    console.log(`\n上海总酒店数: ${await Hotel.countDocuments({ city: '上海' })} 家`);
    console.log('==================================\n');
    
    // 关闭连接
    await mongoose.disconnect();
    console.log('✓ MongoDB 连接已关闭\n');
    
  } catch (err) {
    console.error('✗ 操作失败:', err.message);
    process.exit(1);
  }
}

fixHotelImages();
