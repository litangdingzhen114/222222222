module.exports = {
  hotRecommends: [
    {
      id: 'guide',
      title: '瓯江导览',
      subtitle: '从海口镇进入海林村',
      buttonText: '了解更多',
      icon: '讲',
      imageClass: 'recommend-guide',
      imageUrl: '/assets/photos/ai-village-gate.jpg'
    },
    {
      id: 'drama',
      title: '青田石韵',
      subtitle: '石雕纹理与山村手作',
      buttonText: '了解更多',
      icon: '石',
      imageClass: 'recommend-drama',
      imageUrl: '/assets/photos/ai-stone-souvenir.jpg'
    },
    {
      id: 'family',
      title: '田鱼研学',
      subtitle: '认识稻鱼共生智慧',
      buttonText: '了解更多',
      icon: '鱼',
      imageClass: 'recommend-family',
      imageUrl: '/assets/photos/ricefish-paddy.jpg'
    },
    {
      id: 'hotel',
      title: '侨乡慢住',
      subtitle: '溪谷小院与夜游茶叙',
      buttonText: '了解更多',
      icon: '侨',
      imageClass: 'recommend-hotel',
      imageUrl: '/assets/photos/ai-overseas-cafe.jpg'
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
    { id: 'ricefish', title: '稻鱼田埂', imageClass: 'ph-ricefish', icon: '鱼', imageUrl: '/assets/photos/ricefish-paddy.jpg' },
    { id: 'creek', title: '溪谷步道', imageClass: 'ph-creek', icon: '溪', imageUrl: '/assets/photos/qingtian-tashan.jpg' },
    { id: 'yard', title: '侨乡小院', imageClass: 'ph-overseas', icon: '侨', imageUrl: '/assets/photos/ai-overseas-cafe.jpg' },
    { id: 'workshop', title: '青田石纹工坊', imageClass: 'ph-stone', icon: '石', imageUrl: '/assets/photos/ai-stone-souvenir.jpg' }
  ],

  feeds: [
    { id: 'ride', title: '沿瓯江进村，一路都是青田山色', user: '阿林慢游', imageClass: 'ph-route', icon: '骑', imageUrl: '/assets/photos/qingtian-city.jpg' },
    { id: 'style', title: '海林村新色系：石青、瓯水、田鱼朱', user: '村口摄影社', imageClass: 'ph-stone', icon: '影', imageUrl: '/assets/photos/ai-stone-souvenir.jpg' },
    { id: 'eat', title: '来海林吃一桌田鱼家宴', user: '寻味小队', imageClass: 'ph-ricefish', icon: '鱼', imageUrl: '/assets/photos/ricefish-drying.jpg' },
    { id: 'weekend', title: '住进侨乡小院，看溪谷夜色慢下来', user: '周末出逃计划', imageClass: 'ph-overseas', icon: '宿', imageUrl: '/assets/photos/ai-overseas-cafe.jpg' },
    { id: 'afternoon', title: '稻鱼田里的午后研学课', user: '稻香日记', imageClass: 'ph-rice', icon: '田', imageUrl: '/assets/photos/ricefish-terrace.jpg' },
    { id: 'tea', title: '溪边茶点和青田小食体验', user: '溪边茶客', imageClass: 'ph-creek', icon: '茶', imageUrl: '/assets/photos/qingtian-tashan.jpg' }
  ]
};
