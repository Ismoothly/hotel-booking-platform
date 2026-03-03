/**
 * 酒店价格/房态 WebSocket 推送
 * 收到 hotel_update 时记录 hotelId，并立即通知已注册的监听器刷新
 */
import Taro from '@tarojs/taro'
import { getWsUrl } from './api'

const updatedHotelIds = new Set<string>()
let socketTask: Taro.SocketTask | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

/** 收到 hotel_update 时立即回调（用于列表/详情/购物车立刻刷新），支持多页面同时监听 */
type HotelUpdateListener = (hotelId: string) => void
const listeners = new Set<HotelUpdateListener>()

export function setHotelUpdateListener(fn: HotelUpdateListener | null) {
  if (fn) listeners.add(fn)
  else return
}
export function removeHotelUpdateListener(fn: HotelUpdateListener) {
  listeners.delete(fn)
}

function connect() {
  let url: string
  try {
    url = getWsUrl()
  } catch (e) {
    console.warn('[WS] getWsUrl failed:', e)
    return
  }
  console.log('[WS] connecting:', url)
  const promise = Taro.connectSocket({
    url,
    fail: (err) => {
      console.warn('[WS] connect fail:', err?.errMsg || err, ', reconnect in 5s')
      socketTask = null
      reconnectTimer = setTimeout(connect, 5000)
    }
  })
  promise.then((task) => {
    socketTask = task
    task.onOpen(() => {
      console.log('[WS] connected')
    })
    task.onMessage((res) => {
      try {
        const data = JSON.parse(res.data as string)
        if (data.type === 'hotel_update' && data.hotelId) {
          const id = String(data.hotelId)
          updatedHotelIds.add(id)
          console.log('[WS] hotel_update:', id)
          listeners.forEach((fn) => {
            try {
              fn(id)
            } catch (e) {
              console.warn('[WS] listener error:', e)
            }
          })
        }
      } catch (_) {}
    })
    task.onClose(() => {
      console.warn('[WS] closed, reconnect in 5s')
      socketTask = null
      reconnectTimer = setTimeout(connect, 5000)
    })
    task.onError((err) => {
      console.warn('[WS] error:', err?.errMsg || err)
      socketTask = null
      reconnectTimer = setTimeout(connect, 5000)
    })
  }).catch((e) => {
    console.warn('[WS] connect exception:', e)
    socketTask = null
    reconnectTimer = setTimeout(connect, 5000)
  })
}

/**
 * 启动 WebSocket 连接（在 App 启动时调用一次）
 */
export function connectHotelUpdateSocket() {
  if (socketTask) {
    console.log('[WS] already connected, skip')
    return
  }
  console.log('[WS] connectHotelUpdateSocket called')
  connect()
}

/**
 * 取回并清空当前记录的“已更新酒店 ID”
 */
export function getAndClearUpdatedHotelIds(): string[] {
  const list = Array.from(updatedHotelIds)
  updatedHotelIds.clear()
  return list
}

/**
 * 判断某酒店是否在“已更新”集合中（不清除）
 */
export function wasHotelUpdated(hotelId: string): boolean {
  return updatedHotelIds.has(String(hotelId))
}
