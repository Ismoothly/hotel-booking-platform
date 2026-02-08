/**
 * 验证用户数据脚本
 * 检查数据库中的用户及密码哈希状态
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const User = require('../src/models/User-mongoose');

async function verifyUsers() {
  try {
    // 连接数据库
    console.log('正在连接 MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotel-booking-dev';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✓ MongoDB 连接成功\n');
    
    // 查询所有用户
    const users = await User.find({}).select('+password');
    
    console.log(`找到 ${users.length} 个用户:\n`);
    
    for (const user of users) {
      console.log('─────────────────────────────────────');
      console.log(`用户名: ${user.username}`);
      console.log(`角色: ${user.role}`);
      console.log(`邮箱: ${user.email}`);
      console.log(`ID: ${user._id}`);
      console.log(`密码哈希: ${user.password.substring(0, 30)}...`);
      console.log(`密码长度: ${user.password.length} 字符`);
      console.log(`是否为bcrypt格式: ${user.password.startsWith('$2a$') || user.password.startsWith('$2b$')}`);
      
      // 测试密码验证
      try {
        const testPasswords = {
          'admin': 'admin123',
          'merchant1': 'merchant123',
          'merchant2': 'merchant123',
          'customer1': 'customer123'
        };
        
        const expectedPassword = testPasswords[user.username];
        if (expectedPassword) {
          const isValid = await user.comparePassword(expectedPassword);
          console.log(`测试密码 "${expectedPassword}": ${isValid ? '✓ 正确' : '✗ 错误'}`);
        }
      } catch (err) {
        console.log(`密码验证出错: ${err.message}`);
      }
    }
    
    console.log('─────────────────────────────────────\n');
    
  } catch (error) {
    console.error('验证失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 执行验证
verifyUsers();
