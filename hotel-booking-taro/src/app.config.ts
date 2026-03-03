export default {
  pages: [
    'pages/index/index',
    'pages/hotel-list/index',
    'pages/login/index',
    'pages/register/index',
    'pages/hotel-detail/index',
    'pages/cart/index',
    'pages/checkout/index',
    'pages/orders/index',
    'pages/user/index',
    'pages/settings/index',
    'pages/my-hotels/index',
    'pages/help/index'
  ],
  tabBar: {
    color: '#999',
    selectedColor: '#667eea',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车'
      },
      {
        pagePath: 'pages/orders/index',
        text: '订单'
      },
      {
        pagePath: 'pages/user/index',
        text: '我的'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '易宿酒店',
    navigationBarTextStyle: 'black'
  },
  permission: {
    'scope.userLocation': {
      desc: '您的位置信息将用于获取附近酒店推荐'
    }
  }
}

