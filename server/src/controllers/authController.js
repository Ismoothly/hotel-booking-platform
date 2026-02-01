const UserModel = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * 用户注册
 */
exports.register = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 验证角色
    if (role && !['merchant', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '角色只能是merchant或admin'
      });
    }

    // 创建用户
    const user = await UserModel.create({
      username,
      password,
      email,
      role: role || 'merchant'
    });

    // 生成token
    const token = generateToken({ userId: user.id });

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || '注册失败'
    });
  }
};

/**
 * 用户登录
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查找用户
    const user = await UserModel.findByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await UserModel.comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成token
    const token = generateToken({ userId: user.id });

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '登录失败'
    });
  }
};

/**
 * 获取当前用户信息
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || '获取用户信息失败'
    });
  }
};
