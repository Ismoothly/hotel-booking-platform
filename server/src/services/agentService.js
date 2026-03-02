const config = require('../config');
const Hotel = require('../models/Hotel-mongoose');
const Order = require('../models/Order-mongoose');

const FORBIDDEN_ACTION_HINTS = [
  '创建订单',
  '修改订单',
  '删除订单',
  '扣库存',
  '改库存',
  '支付',
  '退款',
  'publish',
  'unpublish',
  'delete',
  'update',
  'cancel order',
  'deduct inventory',
  'refund'
];

function hasWriteOperationIntent(text) {
  const lower = String(text || '').toLowerCase();
  return FORBIDDEN_ACTION_HINTS.some((keyword) => lower.includes(keyword.toLowerCase()));
}

function detectToolIntent(text) {
  const message = String(text || '').toLowerCase();

  const orderKeywords = ['订单', 'order', '我的单', '待支付', '已支付', '已取消'];
  const hotelKeywords = ['酒店', 'hotel', '查房', '房型', '库存', '价格'];

  if (orderKeywords.some((k) => message.includes(k))) {
    return 'query_orders';
  }

  if (hotelKeywords.some((k) => message.includes(k))) {
    return 'query_hotels';
  }

  return 'none';
}

function parseLimit(text, fallback = 5, max = 20) {
  const match = String(text || '').match(/(\d{1,2})\s*(条|个|家|间|笔)?/);
  if (!match) return fallback;
  const num = Number(match[1]);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.min(num, max);
}

function parseCity(text) {
  const cities = ['北京', '天津', '上海', '广州', '深圳', '杭州', '嘉兴', '成都', '西安', '南京', '武汉', '重庆'];
  const message = String(text || '');
  return cities.find((city) => message.includes(city)) || null;
}

function parseOrderStatus(text) {
  const message = String(text || '').toLowerCase();
  if (message.includes('待支付') || message.includes('pending')) return 'pending';
  if (message.includes('已确认') || message.includes('confirmed')) return 'confirmed';
  if (message.includes('已支付') || message.includes('paid')) return 'paid';
  if (message.includes('已取消') || message.includes('cancelled') || message.includes('canceled')) return 'cancelled';
  return null;
}

async function queryHotelsTool(userMessage) {
  const limit = parseLimit(userMessage, 5, 20);
  const city = parseCity(userMessage);

  const filters = {
    status: 'published',
    isActive: true
  };

  if (city) {
    filters.city = city;
  }

  const hotels = await Hotel.find(filters)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('nameCn city starRating address rooms status');

  return {
    tool: 'query_hotels',
    params: { city, limit },
    result: hotels.map((hotel) => {
      const minPrice = Array.isArray(hotel.rooms) && hotel.rooms.length > 0
        ? Math.min(...hotel.rooms.map((room) => Number(room.price) || 0).filter((price) => price > 0))
        : 0;

      return {
        id: String(hotel._id),
        nameCn: hotel.nameCn,
        city: hotel.city,
        starRating: hotel.starRating,
        address: hotel.address,
        minPrice
      };
    })
  };
}

async function queryMyOrdersTool(userMessage, user) {
  const limit = parseLimit(userMessage, 5, 20);
  const status = parseOrderStatus(userMessage);

  const filters = { userId: user.id };
  if (status) {
    filters.status = status;
  }

  const orders = await Order.find(filters)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('orderId status paymentStatus totalPrice createdAt items');

  return {
    tool: 'query_orders',
    params: { status, limit, scope: 'my_orders' },
    result: orders.map((order) => ({
      orderId: order.orderId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      itemCount: Array.isArray(order.items) ? order.items.length : 0
    }))
  };
}

function formatToolReply(toolOutput) {
  if (!toolOutput || !Array.isArray(toolOutput.result)) {
    return null;
  }

  if (toolOutput.tool === 'query_hotels') {
    if (toolOutput.result.length === 0) {
      return '未查到符合条件的已发布酒店。你可以换一个城市或放宽筛选条件。';
    }

    const lines = toolOutput.result.map((hotel, index) => {
      return `${index + 1}. ${hotel.nameCn}｜${hotel.city}｜${hotel.starRating}星｜¥${hotel.minPrice || 0}起`;
    });

    return ['已为你查询到酒店：', ...lines].join('\n');
  }

  if (toolOutput.tool === 'query_orders') {
    if (toolOutput.result.length === 0) {
      return '你当前没有符合条件的订单记录。';
    }

    const lines = toolOutput.result.map((order, index) => {
      return `${index + 1}. ${order.orderId}｜状态:${order.status}｜支付:${order.paymentStatus}｜金额:¥${order.totalPrice}`;
    });

    return ['已为你查询到订单：', ...lines].join('\n');
  }

  return null;
}

function buildGuidanceReply(userMessage) {
  const message = String(userMessage || '').trim();

  if (hasWriteOperationIntent(message)) {
    return [
      '我当前是建议型 Agent（只读模式），不会直接执行订单/库存等写操作。',
      '你可以按以下流程自行执行：',
      '1) 先确认用户身份与订单状态',
      '2) 调用对应业务接口（如订单支付/取消）',
      '3) 查看返回码与库存队列状态',
      '4) 失败时走重试或补偿流程',
      '如果你愿意，我可以继续为你生成具体 API 调用清单。'
    ].join('\n');
  }

  if (message.includes('并发') || message.includes('超卖') || message.toLowerCase().includes('oversell')) {
    return [
      '防超卖建议流程：',
      '- 入口限流（订单接口）',
      '- 订单支付后异步投递库存任务（Bull）',
      '- MongoDB 原子扣减 + modifiedCount 校验',
      '- 失败自动重试（指数退避）与告警',
      '- 定期库存一致性巡检'
    ].join('\n');
  }

  if (message.includes('登录') || message.includes('鉴权') || message.toLowerCase().includes('auth')) {
    return [
      '认证授权建议流程：',
      '- Access/Refresh 双 Token',
      '- 路由前置 auth 中间件',
      '- 基于角色的 RBAC 权限校验',
      '- 高风险接口叠加限流与审计日志'
    ].join('\n');
  }

  return [
    '我可以提供后端问答与流程建议（只读模式）。',
    '可咨询示例：',
    '- 如何排查下单失败',
    '- 如何优化支付响应时间',
    '- 如何验证并发防超卖效果',
    '- 如何定位队列失败任务'
  ].join('\n');
}

async function callExternalAgent(userMessage, context) {
  if (!config.agentEnabled || !config.agentApiUrl || !config.agentApiKey) {
    return null;
  }

  if (typeof fetch !== 'function') {
    return null;
  }

  const systemPrompt = [
    '你是酒店预订平台后端的助手。',
    '你只能提供问答和流程建议，不得执行任何写操作。',
    '禁止建议直接修改库存、订单状态、支付结果。',
    '如果用户要求执行写操作，只输出安全流程与校验步骤。',
    '回复尽量简洁，使用中文。'
  ].join('\n');

  const payload = {
    model: config.agentModel,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          `用户角色: ${context.role || 'unknown'}`,
          `问题: ${userMessage}`,
          context.toolOutput
            ? `工具查询结果(JSON): ${JSON.stringify(context.toolOutput)}`
            : '工具查询结果(JSON): 无'
        ].join('\n')
      }
    ],
    temperature: 0.2
  };

  const response = await fetch(config.agentApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.agentApiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Agent API 调用失败: ${response.status} ${text}`);
  }

  const data = await response.json();
  const answer =
    data?.choices?.[0]?.message?.content ||
    data?.output_text ||
    data?.answer ||
    '';

  return String(answer).trim() || null;
}

exports.chat = async ({ message, user }) => {
  if (!user || !user.id) {
    throw new Error('用户未认证，无法使用 Agent 工具');
  }

  const safeReply = buildGuidanceReply(message);
  const toolIntent = detectToolIntent(message);

  let toolOutput = null;
  try {
    if (toolIntent === 'query_hotels') {
      toolOutput = await queryHotelsTool(message);
    } else if (toolIntent === 'query_orders') {
      toolOutput = await queryMyOrdersTool(message, user);
    }
  } catch (error) {
    console.warn('[Agent] 工具查询失败:', error.message);
  }

  const toolReply = formatToolReply(toolOutput);

  try {
    const externalReply = await callExternalAgent(message, {
      role: user?.role,
      userId: user?.id,
      toolOutput
    });

    return {
      reply: externalReply || toolReply || safeReply,
      mode: externalReply ? 'llm' : (toolReply ? 'tool' : 'fallback'),
      tool: toolOutput ? toolOutput.tool : null
    };
  } catch (error) {
    console.warn('[Agent] 外部模型不可用，使用 fallback:', error.message);
    return {
      reply: toolReply || safeReply,
      mode: toolReply ? 'tool' : 'fallback',
      tool: toolOutput ? toolOutput.tool : null
    };
  }
};
