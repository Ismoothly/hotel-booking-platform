const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { connectDB } = require('./config/database');

// 导入路由
const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotels');
const adminRoutes = require('./routes/admin');

const app = express();

// 中间件
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/admin', adminRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(config.env === 'development' && { stack: err.stack })
  });
});

// 启动服务器
const PORT = config.port;

async function startServer() {
  try {
    // 连接到 MongoDB
    await connectDB();

    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${config.env}`);
      console.log(`API URL: http://localhost:${PORT}`);
      console.log('=================================');
    });
  } catch (err) {
    console.error('服务器启动失败:', err.message);
    process.exit(1);
  }
}

// 处理进程中断信号
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  try {
    await require('./config/database').disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('关闭时出错:', err);
    process.exit(1);
  }
});

// 启动应用
startServer();

module.exports = app;
