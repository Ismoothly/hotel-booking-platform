import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { connectHotelUpdateSocket } from './services/hotelUpdateSocket'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    try {
      console.log('[App] launched, init WS')
      connectHotelUpdateSocket()
    } catch (e) {
      console.warn('[App] WS init failed, app still runs:', e)
    }
  })

  return children
}
  


export default App
