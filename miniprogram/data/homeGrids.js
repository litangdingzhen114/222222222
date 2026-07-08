const pageOne = [
  { id: 'spots', title: '热门景点', icon: '景', iconPath: '/assets/icons/spots.png', url: '/pages/spot-list/spot-list' },
  { id: 'stone', title: '青田石韵', icon: '石', iconPath: '/assets/icons/stone.png' },
  { id: 'ricefish', title: '稻鱼体验', icon: '鱼', iconPath: '/assets/icons/ricefish.png' },
  { id: 'routes', title: '精品路线', icon: '线', iconPath: '/assets/icons/routes.png', url: '/pages/route-list/route-list' },
  { id: 'booking', title: '讲解预约', icon: '讲', iconPath: '/assets/icons/booking.png', url: '/pages/booking/booking' },
  { id: 'weather', title: '海口天气', icon: '晴', iconPath: '/assets/icons/weather.png' },
  { id: 'traffic', title: '交通指南', icon: '行', iconPath: '/assets/icons/traffic.png' },
  { id: 'photo', title: 'AI旅拍', icon: '拍', iconPath: '/assets/icons/photo.png' },
  { id: 'overseas', title: '侨乡故事', icon: '侨', iconPath: '/assets/icons/overseas.png' },
  { id: 'toilet', title: '找公厕', icon: '厕', iconPath: '/assets/icons/toilet.png', url: '/pages/map/map', openType: 'switchTab' },
  { id: 'parking', title: '找停车场', icon: '停', iconPath: '/assets/icons/parking.png', url: '/pages/map/map', openType: 'switchTab' },
  { id: 'travel', title: '出行服务', icon: '车', iconPath: '/assets/icons/travel.png' },
  { id: 'live', title: '海林慢直播', icon: '播', iconPath: '/assets/icons/live.png', url: '/pages/live-list/live-list' },
  { id: 'story', title: '海林故事', icon: '故', iconPath: '/assets/icons/story.png' },
  { id: 'commerce', title: '共富集市', icon: '市', iconPath: '/assets/icons/commerce.png' }
];

const pageTwo = [
  { id: 'pay', title: '乡心支付', icon: '付', iconPath: '/assets/icons/pay.png' },
  { id: 'culture', title: '文化云', icon: '云', iconPath: '/assets/icons/culture.png' },
  { id: 'ai', title: '智能助手', icon: '问', iconPath: '/assets/icons/ai.png', url: '/pages/ai-guide/ai-guide' },
  { id: 'heritage', title: '非遗地图', icon: '遗', iconPath: '/assets/icons/heritage.png' },
  { id: 'team', title: '团建定制游', icon: '团', iconPath: '/assets/icons/team.png' },
  { id: 'luggage', title: '行李无忧', icon: '寄', iconPath: '/assets/icons/luggage.png' },
  { id: 'ar', title: 'AR合影', icon: 'AR', iconPath: '/assets/icons/ar.png' },
  { id: 'old-street', title: '溪谷老街', icon: '街', iconPath: '/assets/icons/old-street.png' },
  { id: 'feedback', title: '意见反馈', icon: '馈', iconPath: '/assets/icons/feedback.png', url: '/pages/feedback/feedback' }
];

module.exports = [
  { id: 'grid-page-one', items: pageOne },
  { id: 'grid-page-two', items: pageTwo }
];
