const spotDetails = {
  'ancient-tree': {
    highlights: [
      '作为海林村游线的集合点，适合领取导览、确认停车和活动签到。',
      '村牌、导览牌与山水背景同框，适合做第一张到村打卡照。',
      '可衔接村情馆、溪谷步道和田鱼家宴，适合团队统一出发。'
    ],
    visitTips: [
      '自驾游客建议先在这里确认停车位置，再步行进入核心点位。',
      '团队活动可提前 10 分钟到达，便于讲解员清点人数。',
      '雨天可把集合点改到村情馆门口，行程更稳。'
    ],
    services: [
      { title: '预约讲解', desc: '安排村民讲解员带队进入村情馆和田鱼田。', url: '/pages/mine-feature/mine-feature?id=guide' },
      { title: '村游订单', desc: '把集合、餐食、讲解和体验打包成半日或一日行程。', url: '/pages/mine-feature/mine-feature?id=tour' },
      { title: '导航地图', desc: '查看停车、卫生间、步道和直播点位。', url: '/pages/map/map', openType: 'switchTab' }
    ]
  },
  'rice-view': {
    highlights: [
      '围绕青田稻鱼共生做生态讲解，适合亲子研学和摄影拍摄。',
      '傍晚光线柔和，田埂、鱼群和村落背景更容易出片。',
      '可接农事体验、投喂观察、田鱼家宴等内容。'
    ],
    visitTips: [
      '田埂边请勿追跑，下雨后建议穿防滑鞋。',
      '亲子团队可提前预约任务卡和讲解老师。',
      '拍摄鱼群建议选择上午 9 点前后或傍晚。'
    ],
    services: [
      { title: '研学报名', desc: '报名稻鱼共生课程，配套观察任务卡。', url: '/pages/mine-feature/mine-feature?id=activity' },
      { title: '讲解跟拍', desc: '讲解员带路，跟拍记录田园体验瞬间。', url: '/pages/mine-feature/mine-feature?id=guide' },
      { title: '直播看景', desc: '查看稻鱼田实时视频和周边推荐。', url: '/pages/live-list/live-list' }
    ]
  },
  'creek-trail': {
    highlights: [
      '沿溪慢行，串联石桥、林荫休息点和茶歇空间。',
      '适合家庭散步、轻徒步、露营小活动和慢直播点位展示。',
      '夏季亲水感强，傍晚适合把步道作为行程收尾。'
    ],
    visitTips: [
      '雨后石面可能湿滑，老人和孩子建议放慢速度。',
      '建议预留 45-60 分钟，不必赶路。',
      '夜游活动需要提前确认照明、集合点和返程安排。'
    ],
    services: [
      { title: '场地预约', desc: '预约溪谷草坪、茶歇点或小型活动空间。', url: '/pages/mine-feature/mine-feature?id=venue' },
      { title: '路线推荐', desc: '查看半日游、亲子游和摄影打卡路线。', url: '/pages/route-list/route-list' },
      { title: '意见反馈', desc: '反馈步道设施、卫生或安全提示。', url: '/pages/feedback/feedback' }
    ]
  },
  museum: {
    highlights: [
      '集中展示海林村区位、侨乡联系、村庄治理和农文旅业态。',
      '适合作为研学开场，先建立对海口镇海林村的整体认识。',
      '后续可接后台公告、活动预约和村庄动态内容。'
    ],
    visitTips: [
      '团队参观建议提前预约讲解，避免与其他团队撞时段。',
      '适合安排在行程第一站，后续再去田鱼田或手作点。',
      '可在馆内确认当天活动、餐食和直播点位。'
    ],
    services: [
      { title: '预约讲解', desc: '预约村情馆讲解与侨乡故事导览。', url: '/pages/mine-feature/mine-feature?id=guide' },
      { title: '招商合作', desc: '提交农文旅、研学、品牌活动合作意向。', url: '/pages/mine-feature/mine-feature?id=cooperation' },
      { title: 'AI 导游', desc: '让小林根据人数和时间生成游玩建议。', url: '/pages/ai-guide/ai-guide' }
    ]
  },
  workshop: {
    highlights: [
      '以青田石纹、印章文化和村游纪念章为核心体验。',
      '课程成果可带走，适合亲子、研学和企业团建。',
      '可联动共富集市售卖香囊、拓印、钥匙扣和明信片。'
    ],
    visitTips: [
      '手作课程建议提前预约，便于准备材料和老师。',
      '小朋友参与时建议选择 60-90 分钟的轻量课程。',
      '团队可把作品打包成伴手礼或研学成果。'
    ],
    services: [
      { title: '活动票券', desc: '预约青田石纹拓印、香囊和纪念章课程。', url: '/pages/mine-feature/mine-feature?id=ticket' },
      { title: '研学报名', desc: '报名非遗手作与乡村观察组合课程。', url: '/pages/mine-feature/mine-feature?id=activity' },
      { title: '共富集市', desc: '预订村游文创、农品和伴手礼。', url: '/pages/mine-feature/mine-feature?id=mall' }
    ]
  }
};

const spots = [
  {
    id: 'ancient-tree',
    name: '海林村口会客点',
    category: '自然风光',
    tags: ['自然风光', '拍照打卡', '免费'],
    openTime: '全天开放',
    duration: '约 20 分钟',
    distance: '0.2公里',
    desc: '这里是游客进入海口镇海林村后的第一处服务节点，适合做集合、咨询、导览领取和第一张打卡照。真实上线后可接后台公告与实时客流。',
    images: ['ph-oujiang', 'ph-village', 'ph-creek'],
    coverUrl: '/assets/photos/ai-village-gate.jpg',
    imageUrls: ['/assets/photos/ai-village-gate.jpg', '/assets/photos/qingtian-city.jpg', '/assets/photos/qingtian-tashan.jpg'],
    icon: '瓯'
  },
  {
    id: 'rice-view',
    name: '稻鱼田观景点',
    category: '自然风光',
    tags: ['自然风光', '拍照打卡', '免费'],
    openTime: '08:00-18:30',
    duration: '约 40 分钟',
    distance: '0.5公里',
    desc: '青田以田鱼和稻鱼共生闻名，海林村的田园内容可围绕“看得见的生态课堂”展开。晴天傍晚光线柔和，适合亲子研学和摄影团队。',
    images: ['ph-ricefish', 'ph-rice', 'ph-route'],
    coverUrl: '/assets/photos/ricefish-terrace.jpg',
    imageUrls: ['/assets/photos/ricefish-terrace.jpg', '/assets/photos/ricefish-paddy.jpg', '/assets/photos/ricefish-harvest.jpg'],
    icon: '鱼'
  },
  {
    id: 'creek-trail',
    name: '溪谷慢行步道',
    category: '自然风光',
    tags: ['自然风光', '亲子体验', '免费'],
    openTime: '全天开放',
    duration: '约 1 小时',
    distance: '0.7公里',
    desc: '步道沿山溪铺设，串联石桥、茶歇和林荫休息点。路线平缓，适合家庭散步、轻徒步和慢直播点位展示。',
    images: ['ph-creek', 'ph-homestay', 'ph-village'],
    coverUrl: '/assets/photos/qingtian-tashan.jpg',
    imageUrls: ['/assets/photos/qingtian-tashan.jpg', '/assets/photos/qingtian-city.jpg', '/assets/photos/ai-village-gate.jpg'],
    icon: '溪'
  },
  {
    id: 'museum',
    name: '海林村情馆',
    category: '人文历史',
    tags: ['人文历史', '研学', '免费'],
    openTime: '09:00-17:00',
    duration: '约 45 分钟',
    distance: '0.4公里',
    desc: '村情馆用于展示海林村区位、村庄治理、侨乡联系、农文旅业态和活动公告，是后续接真实后台内容的核心入口。',
    images: ['ph-museum', 'ph-stone', 'ph-homestay'],
    coverUrl: '/assets/photos/ai-village-gate.jpg',
    imageUrls: ['/assets/photos/ai-village-gate.jpg', '/assets/photos/ai-stone-souvenir.jpg', '/assets/photos/ai-overseas-cafe.jpg'],
    icon: '馆'
  },
  {
    id: 'workshop',
    name: '青田石纹手作点',
    category: '亲子体验',
    tags: ['非遗体验', '亲子体验', '预约'],
    openTime: '09:30-16:30',
    duration: '约 1.5 小时',
    distance: '0.9公里',
    desc: '手作点以青田石的青灰、纹理和印章文化为视觉灵感，提供拓印、香囊、村游纪念章等体验，适合亲子、研学和团建预约。',
    images: ['ph-stone', 'ph-product-stone', 'ph-workshop'],
    coverUrl: '/assets/photos/ai-stone-souvenir.jpg',
    imageUrls: ['/assets/photos/ai-stone-souvenir.jpg', '/assets/photos/ai-fish-keychain.jpg', '/assets/photos/ai-oujiang-postcards.jpg'],
    icon: '石'
  }
];

module.exports = spots.map((spot) => ({
  ...spot,
  ...(spotDetails[spot.id] || {})
}));
