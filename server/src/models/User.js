const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// 内存数据库
let users = [
  {
    id: '1',
    username: 'admin',
    password: '$2a$10$8YZ0QvZ9KX.FZJ9fVq3FTOqKYNRj4xZJ0VQpz4F8XZJ9fVq3FTOqK', // admin123
    role: 'admin',
    email: 'admin@hotel.com',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    username: 'merchant',
    password: '$2a$10$8YZ0QvZ9KX.FZJ9fVq3FTOqKYNRj4xZJ0VQpz4F8XZJ9fVq3FTOqK', // merchant123
    role: 'merchant',
    email: 'merchant@hotel.com',
    createdAt: new Date().toISOString()
  }
];

class UserModel {
  static async findAll() {
    return users;
  }

  static async findById(id) {
    return users.find(user => user.id === id);
  }

  static async findByUsername(username) {
    return users.find(user => user.username === username);
  }

  static async create(userData) {
    const { username, password, role, email } = userData;
    
    // 检查用户名是否已存在
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      role: role || 'merchant',
      email,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    return newUser;
  }

  static async update(id, userData) {
    const index = users.findIndex(user => user.id === id);
    if (index === -1) {
      throw new Error('用户不存在');
    }

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    users[index] = {
      ...users[index],
      ...userData,
      updatedAt: new Date().toISOString()
    };

    return users[index];
  }

  static async delete(id) {
    const index = users.findIndex(user => user.id === id);
    if (index === -1) {
      throw new Error('用户不存在');
    }

    users.splice(index, 1);
    return true;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = UserModel;
