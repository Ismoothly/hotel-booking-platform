const { verifyToken } = require('../utils/jwt');
const UserModel = require('../models/User');

/**
 * 验证用户是否已登录
 */
exports.auth = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 验证token
    const decoded = verifyToken(token);

    // 获取用户信息
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || '认证失败'
    });
  }
};

/**
 * 验证用户角色
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
};
