module.exports = {
  hotRecommends: [
    {
      id: 'guide',
      title: '村口会客点',
      subtitle: '领取导览、咨询停车和今日活动',
      buttonText: '去集合',
      icon: '讲',
      imageClass: 'recommend-guide',
      imageUrl: '/assets/photos/ai-village-gate.jpg',
      url: '/pages/spot-detail/spot-detail?id=ancient-tree'
    },
    {
      id: 'drama',
      title: '青田石纹工坊',
      subtitle: '识石纹、做拓印、带走文创',
      buttonText: '预约手作',
      icon: '石',
      imageClass: 'recommend-drama',
      imageUrl: '/assets/photos/ai-stone-souvenir.jpg',
      url: '/pages/spot-detail/spot-detail?id=workshop'
    },
    {
      id: 'family',
      title: '稻鱼研学区',
      subtitle: '认识水田生态和青田田鱼',
      buttonText: '报名研学',
      icon: '鱼',
      imageClass: 'recommend-family',
      imageUrl: '/assets/photos/ricefish-paddy.jpg',
      url: '/pages/spot-detail/spot-detail?id=rice-view'
    },
    {
      id: 'hotel',
      title: '侨乡小院慢住',
      subtitle: '溪谷茶叙、夜游和周末留宿',
      buttonText: '查看民宿',
      icon: '侨',
      imageClass: 'recommend-hotel',
      imageUrl: '/assets/photos/ai-overseas-cafe.jpg',
      url: '/pages/mine-feature/mine-feature?id=stay'
    },
    {
      id: 'food',
      title: '海林田鱼家宴',
      subtitle: '青田田鱼、山泉豆腐和时令笋蔬',
      buttonText: '去寻味',
      icon: '宴',
      imageClass: 'recommend-food',
      imageUrl: '/assets/photos/ricefish-drying.jpg',
      url: '/pages/food/food',
      openType: 'switchTab'
    },
    {
      id: 'live',
      title: '海林慢直播',
      subtitle: '先看村口、田埂和溪谷实时画面',
      buttonText: '看直播',
      icon: '播',
      imageClass: 'recommend-live',
      imageUrl: '/assets/photos/ai-village-gate.jpg',
      url: '/pages/live-list/live-list'
    }
  ],

  itineraries: [
    {
      id: 'half-day',
      label: '半日首访',
      title: '瓯江入村半日线',
      time: '约 4 小时',
      route: '游客中心 - 村口会客点 - 溪谷步道 - 田鱼家宴',
      highlights: ['适合首次到访', '轻松步行', '午餐可预约'],
      imageUrl: '/assets/photos/ai-village-gate.jpg',
      url: '/pages/route-detail/route-detail?id=half-day'
    },
    {
      id: 'parent-child',
      label: '亲子研学',
      title: '稻鱼田自然课堂',
      time: '约 6 小时',
      route: '稻鱼研学区 - 共富集市 - 青田石纹手作 - 自然观察',
      highlights: ['孩子可参与', '手作可带走', '团队可定制'],
      imageUrl: '/assets/photos/ricefish-paddy.jpg',
      url: '/pages/route-detail/route-detail?id=parent-child'
    },
    {
      id: 'one-day',
      label: '深度一日',
      title: '青田石韵一日游',
      time: '约 8 小时',
      route: '村情馆 - 稻鱼田 - 田鱼家宴 - 石纹工坊 - 溪畔茶点',
      highlights: ['文化体验', '摄影友好', '餐食完整'],
      imageUrl: '/assets/photos/ai-stone-souvenir.jpg',
      url: '/pages/route-detail/route-detail?id=one-day'
    }
  ],

  serviceCards: [
    {
      id: 'visitor-center',
      title: '游客中心',
      desc: '咨询路线、讲解、停车、公厕和当日活动安排。',
      status: '08:30-18:00',
      actionText: '查看地图',
      icon: '服',
      url: '/pages/map/map',
      openType: 'switchTab'
    },
    {
      id: 'booking',
      title: '预约服务',
      desc: '讲解跟拍、研学课程、团建定制和民宿需求统一提交。',
      status: '后端接入',
      actionText: '立即预约',
      icon: '约',
      url: '/pages/booking/booking'
    },
    {
      id: 'ai-guide',
      title: 'AI 导游',
      desc: '围绕青田石、田鱼、侨乡故事和海林路线即时问答。',
      status: 'Kimi 可接',
      actionText: '问一问',
      icon: 'AI',
      url: '/pages/ai-guide/ai-guide'
    },
    {
      id: 'live',
      title: '慢直播',
      desc: '先看村口、稻鱼田和溪谷画面，再决定今天怎么玩。',
      status: '实时画面',
      actionText: '进入直播',
      icon: '播',
      url: '/pages/live-list/live-list'
    }
  ],

  rankings: [
    {
      id: 'hailin',
      title: '海林村',
      tabs: ['山水', '美食', '手作'],
      items: [
        { title: '海林村口会客点', imageClass: 'ph-oujiang', icon: '瓯', imageUrl: '/assets/photos/ai-village-gate.jpg' },
        { title: '海林田鱼家宴', imageClass: 'ph-ricefish', icon: '鱼', imageUrl: '/assets/photos/ricefish-drying.jpg' },
        { title: '青田石纹手作', imageClass: 'ph-stone', icon: '石', imageUrl: '/assets/photos/ai-stone-souvenir.jpg' }
      ]
    },
    {
      id: 'field',
      title: '青田周边',
      tabs: ['瓯江', '侨乡', '村宿'],
      items: [
        { title: '瓯江山水慢游', imageClass: 'ph-creek', icon: '江', imageUrl: '/assets/photos/qingtian-city.jpg' },
        { title: '侨乡小院咖啡', imageClass: 'ph-overseas', icon: '侨', imageUrl: '/assets/photos/ai-overseas-cafe.jpg' },
        { title: '溪谷民宿院落', imageClass: 'ph-homestay', icon: '宿', imageUrl: '/assets/photos/ai-village-gate.jpg' }
      ]
    }
  ],

  corridor: [
    { id: 'gate', title: '村口会客点', imageClass: 'ph-oujiang', icon: '瓯', imageUrl: '/assets/photos/ai-village-gate.jpg' },
    { id: 'museum', title: '海林村情馆', imageClass: 'ph-village', icon: '馆', imageUrl: '/assets/scenes/village-gate.png' },
    { id: 'ricefish', title: '稻鱼田埂', imageClass: 'ph-ricefish', icon: '鱼', imageUrl: '/assets/photos/ricefish-paddy.jpg' },
    { id: 'creek', title: '溪谷步道', imageClass: 'ph-creek', icon: '溪', imageUrl: '/assets/photos/qingtian-tashan.jpg' },
    { id: 'yard', title: '侨乡小院', imageClass: 'ph-overseas', icon: '侨', imageUrl: '/assets/photos/ai-overseas-cafe.jpg' },
    { id: 'workshop', title: '青田石纹工坊', imageClass: 'ph-stone', icon: '石', imageUrl: '/assets/photos/ai-stone-souvenir.jpg' }
  ],

  feeds: [
    { id: 'ride', title: '沿瓯江进村，一路都是青田山色', user: '阿林慢游', imageClass: 'ph-route', icon: '骑', imageUrl: '/assets/photos/qingtian-city.jpg' },
    { id: 'style', title: '海林村新色系：石青、瓯水、田鱼朱', user: '村口摄影社', imageClass: 'ph-stone', icon: '影', imageUrl: '/assets/photos/ai-stone-souvenir.jpg' },
    { id: 'eat', title: '来海林吃一桌田鱼家宴，先预约人数更稳', user: '寻味小队', imageClass: 'ph-ricefish', icon: '鱼', imageUrl: '/assets/photos/ricefish-drying.jpg' },
    { id: 'weekend', title: '住进侨乡小院，看溪谷夜色慢下来', user: '周末出逃计划', imageClass: 'ph-overseas', icon: '宿', imageUrl: '/assets/photos/ai-overseas-cafe.jpg' },
    { id: 'afternoon', title: '稻鱼田里的午后研学课，孩子能带走观察卡', user: '稻香日记', imageClass: 'ph-rice', icon: '田', imageUrl: '/assets/photos/ricefish-terrace.jpg' },
    { id: 'tea', title: '溪边茶点和青田小食体验，适合行程最后一站', user: '溪边茶客', imageClass: 'ph-creek', icon: '茶', imageUrl: '/assets/photos/qingtian-tashan.jpg' },
    { id: 'stone-class', title: '青田石纹拓印课：半小时完成一份纪念小物', user: '手作老师', imageClass: 'ph-stone', icon: '拓', imageUrl: '/assets/photos/ai-stone-souvenir.jpg' },
    { id: 'service', title: '到村先看服务卡：停车、公厕、讲解和慢直播都能查', user: '海林村游客中心', imageClass: 'ph-village', icon: '服', imageUrl: '/assets/scenes/village-gate.png' }
  ]
};
