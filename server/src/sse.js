/**
 * Server-Sent Events: 广播酒店价格更新，供客户端实时刷新
 */
const clients = new Set();

function send(res, event) {
  try {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  } catch (err) {
    console.error('[SSE] send error:', err.message);
  }
}

/**
 * 广播：某酒店房型价格已更新
 * @param {string} hotelId - 酒店 ID
 */
function broadcastHotelPriceUpdate(hotelId) {
  const event = { type: 'hotel_price_updated', hotelId: String(hotelId) };
  clients.forEach((res) => send(res, event));
  console.log(`[SSE] broadcast hotel_price_updated: ${hotelId}, clients=${clients.size}`);
}

/**
 * SSE 路由处理器：GET /api/events
 */
function handleSSE(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  send(res, { type: 'connected', ts: Date.now() });
  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
}

module.exports = {
  handleSSE,
  broadcastHotelPriceUpdate
};
