const mapCenter = {
  latitude: 28.2138,
  longitude: 120.2192
};

const categories = [
  { id: '全部', label: '全部', icon: '全' },
  { id: '景点', label: '景点', icon: '景' },
  { id: '美食', label: '美食', icon: '食' },
  { id: '住宿', label: '住宿', icon: '宿' },
  { id: '体验', label: '体验', icon: '验' },
  { id: '购物', label: '购物', icon: '购' },
  { id: '公共服务', label: '服务', icon: '服' }
];

const subTags = [
  '全部',
  '核心景区',
  '乡村景点',
  '非遗点位',
  '网红打卡点',
  '便民服务'
];

const mapTools = [
  { id: 'route', title: '路线', iconPath: '/assets/icons/routes.png' },
  { id: 'search', title: '搜索', iconPath: '/assets/icons/spots.png' },
  { id: 'location', title: '定位', iconPath: '/assets/icons/parking.png' },
  { id: 'service', title: '服务', iconPath: '/assets/icons/toilet.png' },
  { id: 'overview', title: '全览', iconPath: '/assets/icons/map-food.png' }
];

const routeSuggestions = [
  {
    id: 'half-day',
    routeId: 'half-day',
    title: '半日慢游',
    desc: '村口会客点、溪谷步道、田鱼家宴，适合首次到访。',
    duration: '约4小时',
    pointIds: [1, 3, 9]
  },
  {
    id: 'stone-day',
    routeId: 'one-day',
    title: '青田石韵',
    desc: '村情馆、稻鱼田、青田石纹手作，文化体验更完整。',
    duration: '约8小时',
    pointIds: [4, 2, 5]
  },
  {
    id: 'parent-child',
    routeId: 'parent-child',
    title: '亲子研学',
    desc: '稻鱼课堂、共富集市、自然观察任务，孩子参与感更强。',
    duration: '约6小时',
    pointIds: [6, 7, 3]
  },
  {
    id: 'service',
    routeId: 'half-day',
    title: '便民直达',
    desc: '停车场、游客中心、公共厕所，适合到村后快速定位。',
    duration: '约20分钟',
    pointIds: [12, 10, 11]
  }
];

module.exports = {
  categories,
  mapCenter,
  mapTools,
  routeSuggestions,
  subTags
};
