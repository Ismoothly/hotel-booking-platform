/**
 * WebSocket 服务：推送酒店价格/房态变更，供小程序端、客户端实时刷新
 * 消息格式: { type: 'hotel_update', hotelId, version }
 */
const WebSocket = require('ws');

let wss = null;

function attach(server) {
  if (wss) return wss;
  wss = new WebSocket.Server({ server, path: '/ws' });
  wss.on('connection', (ws, req) => {
    console.log('[WS] client connected');
    ws.on('close', () => {});
    ws.on('error', () => {});
    ws.send(JSON.stringify({ type: 'connected', ts: Date.now() }));
  });
  console.log('[WS] server attached');
  return wss;
}

function broadcast(payload) {
  if (!wss) return;
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
      } catch (e) {
        // ignore
      }
    }
  });
}

/**
 * 广播酒店更新（价格或房态变更后调用）
 */
function broadcastHotelUpdate(hotelId, version) {
  const payload = {
    type: 'hotel_update',
    hotelId: String(hotelId),
    version: Number(version),
  };
  broadcast(payload);
  console.log('[WS] broadcast hotel_update:', hotelId, 'version:', version);
}

function getWss() {
  return wss;
}

module.exports = {
  attach,
  broadcast,
  broadcastHotelUpdate,
  getWss,
};
