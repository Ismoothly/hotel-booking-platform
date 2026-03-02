import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { connectHotelUpdateSocket } from './services/hotelUpdateSocket'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('[App] launched, init WS')
    connectHotelUpdateSocket()
  })

  // children 是将要会渲染的页面
  return children
}
  


export default App
