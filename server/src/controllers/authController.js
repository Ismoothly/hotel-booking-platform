const UserModel = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const config = require('../config');

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天（毫秒）
    path: '/api/auth'
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refresh_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    path: '/api/auth'
  });
};

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

    // 生成 access/refresh token
    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });
    await UserModel.addRefreshToken(user.id, refreshToken);
    setRefreshTokenCookie(res, refreshToken);

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
        accessToken
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

    // 生成 access/refresh token
    const accessToken = generateAccessToken({ userId: user.id });
    const refreshToken = generateRefreshToken({ userId: user.id });
    await UserModel.addRefreshToken(user.id, refreshToken);
    setRefreshTokenCookie(res, refreshToken);

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
        accessToken
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

/**
 * 刷新 access token
 */
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: '未提供刷新令牌'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    const tokenOwner = await UserModel.findByRefreshToken(refreshToken);
    if (!tokenOwner || tokenOwner.id !== user.id) {
      return res.status(401).json({
        success: false,
        message: '刷新令牌无效'
      });
    }

    // 旋转 refresh token
    const newRefreshToken = generateRefreshToken({ userId: user.id });
    await UserModel.replaceRefreshToken(user.id, refreshToken, newRefreshToken);
    setRefreshTokenCookie(res, newRefreshToken);

    const newAccessToken = generateAccessToken({ userId: user.id });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({
      success: false,
      message: error.message || '刷新失败'
    });
  }
};

/**
 * 退出登录
 */
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      const tokenOwner = await UserModel.findByRefreshToken(refreshToken);
      if (tokenOwner) {
        await UserModel.removeRefreshToken(tokenOwner.id, refreshToken);
      }
    }

    clearRefreshTokenCookie(res);

    res.json({
      success: true,
      message: '已退出登录'
    });
  } catch (error) {
    clearRefreshTokenCookie(res);
    res.status(500).json({
      success: false,
      message: error.message || '退出失败'
    });
  }
};
