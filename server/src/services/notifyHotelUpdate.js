/**
 * 统一推送：酒店价格/房态变更时通知所有端（SSE + WebSocket）
 */
const sse = require('../sse');
const ws = require('../websocket');

function notifyHotelUpdate(hotelId, version) {
  const id = String(hotelId);
  const v = Number(version);
  sse.broadcastHotelPriceUpdate(id, v);
  try {
    if (ws.getWss()) ws.broadcastHotelUpdate(id, v);
  } catch (e) {
    // WS might not be attached
  }
}

module.exports = { notifyHotelUpdate };
