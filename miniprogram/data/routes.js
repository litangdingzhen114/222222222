const routeDetails = {
  'half-day': {
    included: ['村口集合与路线说明', '溪谷步道慢行建议', '田鱼家宴预约衔接', '停车与返程提示'],
    prepares: ['建议上午到村，午餐体验更顺。', '自驾游客先在村口确认停车点。', '如需讲解或餐食，请至少提前半天预约。'],
    bookingUrl: '/pages/mine-feature/mine-feature?id=tour'
  },
  'one-day': {
    included: ['村情馆讲解', '稻鱼田观景', '青田石纹手作', '溪畔茶歇与伴手礼'],
    prepares: ['建议穿适合步行的鞋，全天路线点位较多。', '手作课程需提前确认人数和材料。', '摄影团队可备注想要的拍摄时段。'],
    bookingUrl: '/pages/mine-feature/mine-feature?id=tour'
  },
  'parent-child': {
    included: ['稻鱼课堂任务卡', '共富集市观察', '石纹手作体验', '溪谷自然观察'],
    prepares: ['建议为孩子准备防晒帽和替换衣物。', '研学团队请提前说明年级、人数和课程目标。', '雨天可把户外观察改为村情馆和手作课。'],
    bookingUrl: '/pages/mine-feature/mine-feature?id=activity'
  },
  photo: {
    included: ['光线顺序点位建议', '溪谷与田园机位', '侨乡小院细节拍摄', '讲解跟拍可选'],
    prepares: ['建议下午出发，傍晚到稻鱼田等待柔光。', '如需人像跟拍，请提前预约摄影服务。', '雨后溪谷湿滑，设备注意防潮。'],
    bookingUrl: '/pages/mine-feature/mine-feature?id=guide'
  },
  food: {
    included: ['稻鱼生态讲解', '田鱼家宴预约', '共富集市选购', '溪畔茶点收尾'],
    prepares: ['请提前备注忌口、老人儿童人数和用餐时间。', '团队用餐建议至少提前一天确认桌数。', '伴手礼可选择到村自提或统一打包。'],
    bookingUrl: '/pages/mine-feature/mine-feature?id=mall'
  }
};

const routes = [
  {
    id: 'half-day',
    name: '瓯江山村半日游',
    subtitle: '从海口镇入村，串联会客点、溪谷步道和田鱼家宴',
    reason: '适合首次到访游客，用半天时间感受海林村的区位、山水、村落和青田乡味。',
    duration: '约 4 小时',
    audience: '家庭游客、周边自驾、朋友小聚',
    cost: '人均 80-120 元',
    imageClass: 'ph-route',
    imageUrl: '/assets/photos/ai-village-gate.jpg',
    timeline: [
      { time: '09:30', title: '游客中心集合', desc: '领取导览地图，了解当天活动提示。' },
      { time: '10:00', title: '村口会客点打卡', desc: '拍摄村牌与导览牌，了解海口镇海林村区位。' },
      { time: '11:00', title: '溪谷步道慢行', desc: '沿溪散步，经过石桥和茶歇点。' },
      { time: '12:00', title: '田鱼家宴午餐', desc: '品尝青田田鱼、山泉豆腐和时令笋蔬。' }
    ]
  },
  {
    id: 'one-day',
    name: '青田石韵一日游',
    subtitle: '村情馆、稻鱼田、青田石纹手作全体验',
    reason: '串联青田地域文化、山村风景和体验点，适合想深入了解海林村的游客。',
    duration: '约 8 小时',
    audience: '文化游客、摄影团队、研学团',
    cost: '人均 160-220 元',
    imageClass: 'ph-village',
    imageUrl: '/assets/photos/ai-stone-souvenir.jpg',
    timeline: [
      { time: '09:00', title: '村情馆参观', desc: '了解海林村服务体系和青田地域符号。' },
      { time: '10:30', title: '稻鱼田观景点', desc: '拍摄田园风光和村落全景。' },
      { time: '12:00', title: '海林田鱼家宴', desc: '体验一桌一村的青田乡味。' },
      { time: '14:00', title: '青田石纹手作', desc: '制作拓印、纪念章或香囊小物。' },
      { time: '16:30', title: '溪畔茶点休息', desc: '以茶饮和青田小食结束一天行程。' }
    ]
  },
  {
    id: 'parent-child',
    name: '亲子研学游',
    subtitle: '稻鱼课堂、自然观察和石纹手作',
    reason: '路线节奏轻松，强调孩子可参与、可观察、可带走成果。',
    duration: '约 6 小时',
    audience: '亲子家庭、学校研学',
    cost: '人均 120-180 元',
    imageClass: 'ph-orchard',
    imageUrl: '/assets/photos/ricefish-paddy.jpg',
    timeline: [
      { time: '09:30', title: '稻鱼研学区', desc: '认识稻、鱼、水田生态和四季农事。' },
      { time: '11:00', title: '共富集市体验', desc: '认识本地农产品和村庄运营摊位。' },
      { time: '13:30', title: '石纹手作课堂', desc: '制作青田石纹拓印或乡村香囊。' },
      { time: '15:30', title: '自然观察任务', desc: '在溪谷步道完成观察卡。' }
    ]
  },
  {
    id: 'photo',
    name: '摄影打卡游',
    subtitle: '黄金时段串联海林高出片点位',
    reason: '将瓯江山色、溪谷、稻鱼田和侨乡小院按光线顺序串联。',
    duration: '约 5 小时',
    audience: '摄影爱好者、旅拍团队',
    cost: '人均 100-180 元',
    imageClass: 'ph-rice',
    imageUrl: '/assets/photos/ai-overseas-cafe.jpg',
    timeline: [
      { time: '15:00', title: '侨乡小院', desc: '拍摄屋檐、庭院和手作细节。' },
      { time: '16:00', title: '溪谷步道', desc: '拍摄水边光影和石桥。' },
      { time: '17:20', title: '稻鱼田观景点', desc: '等待日落前后的金色田野。' }
    ]
  },
  {
    id: 'food',
    name: '田鱼美食游',
    subtitle: '从稻鱼田到餐桌的一日乡味路线',
    reason: '适合想吃、想买、想带走青田海林味道的游客。',
    duration: '约 6 小时',
    audience: '朋友出游、团队活动',
    cost: '人均 150-240 元',
    imageClass: 'ph-food',
    imageUrl: '/assets/photos/ricefish-drying.jpg',
    timeline: [
      { time: '10:00', title: '稻鱼研学区', desc: '认识田鱼和水田生态。' },
      { time: '12:00', title: '海林田鱼家宴', desc: '品尝青田田鱼和山村宴席。' },
      { time: '14:00', title: '共富集市文创', desc: '选购田鱼钥匙扣、青田石纹香囊和明信片。' },
      { time: '15:00', title: '溪畔茶点', desc: '以茶饮和小食收尾。' }
    ]
  }
];

module.exports = routes.map((route) => ({
  ...route,
  ...(routeDetails[route.id] || {})
}));
