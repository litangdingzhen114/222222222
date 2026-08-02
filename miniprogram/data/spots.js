const spotDetails = {
  "ancient-tree": {
    kicker: "村树记忆",
    lead: "海林村的老树不是一个拍照背景，而是一段村庄记忆的坐标。",
    mood: "在树荫下停一会儿，听讲解员把古树、村路和村庄变化串起来。",
    stats: [
      { label: "树龄", value: "约350年" },
      { label: "树高", value: "约20米" },
      { label: "适合", value: "自然教育" },
    ],
    story: [
      "陈嵘栲古树被海林村视作“村树”，公开资料中提到其树龄约 350 年，胸围约 310 厘米、胸径近 1 米。",
      "它适合作为到村后的第一段自然讲解：从一棵树讲到山水生态、村庄迁居、村民生活和古树保护。",
    ],
    experience: [
      { title: "古树合影", desc: "以树冠和村道为背景，适合拍一张到村纪念照。" },
      { title: "自然课堂", desc: "讲解古树保护、乡土树种和村庄生态。" },
      { title: "慢游起点", desc: "从古树继续走向田铺驿站和海林·溪谷。" },
    ],
    itinerary: [
      { time: "10分钟", title: "看树冠", desc: "先观察树形、冠幅和周边环境。" },
      { time: "15分钟", title: "听故事", desc: "听村庄记忆、古树保护和乡土生态。" },
      { time: "5分钟", title: "拍合影", desc: "用广角收进树冠、山景和村道。" },
    ],
    highlights: [
      "陈嵘栲古树约 350 年树龄，被海林村视作村树与村庄记忆的标志。",
      "公开报道中提到它胸围约 310 厘米、胸径近 1 米、树高约 20 米、冠幅约 18 米。",
      "它是已知较大的陈嵘栲个体，适合作为自然教育、古树保护和村庄故事讲解点。",
    ],
    visitTips: [
      "古树属于保护对象，请不要攀爬、刻画或进入围栏范围。",
      "拍摄建议使用广角，把树冠、石径和村庄山景一起收入画面。",
      "具体位置和开放提示以后以村里现场导览牌与后台公告为准。",
    ],
    services: [
      {
        title: "预约讲解",
        desc: "安排村民讲解员讲述古树、村庄生态和海林村故事。",
        url: "/pages/mine-feature/mine-feature?id=guide",
      },
      {
        title: "查看地图",
        desc: "在全域地图上查看古树、驿站、溪谷和公共服务点。",
        url: "/pages/map/map",
        openType: "switchTab",
      },
      {
        title: "路线推荐",
        desc: "把古树打卡、田铺驿站和海林·溪谷串成半日慢游。",
        url: "/pages/route-list/route-list",
      },
    ],
  },
  "xunye-cafe": {
    kicker: "溪谷村咖",
    lead: "把一杯咖啡放进山水之间，作为海林村慢游的中途停靠。",
    mood: "适合走完溪谷后坐下来，喝咖啡、吃米糕，翻看当天拍到的山水照片。",
    stats: [
      { label: "人均", value: "约35元" },
      { label: "营业", value: "10:00-20:00" },
      { label: "适合", value: "茶歇慢坐" },
    ],
    story: [
      "寻野村咖是海林村咖啡与乡野轻食的展示点，内容围绕溪谷、田埂、米糕和村内休闲空间展开。",
      "它不只是“美食列表”里的一个条目，而是路线里的休息节点：游客可以在这里等人、点单、看风景，也能继续衔接民宿和溪谷活动。",
    ],
    experience: [
      { title: "咖啡茶歇", desc: "咖啡、米糕和当季轻食，适合路线中途补给。" },
      { title: "窗边看山", desc: "用村咖空间承接溪谷和田园慢游的节奏。" },
      { title: "民宿联动", desc: "可与溪谷民宿、场地预约和团建茶歇一起组合。" },
    ],
    itinerary: [
      { time: "到店", title: "先点一杯", desc: "咖啡、米糕或乡野轻食按当天供应为准。" },
      { time: "20分钟", title: "窗边慢坐", desc: "休息、拍照、整理下一段路线。" },
      { time: "离店", title: "顺路去溪谷", desc: "继续去海林·溪谷或田铺驿站集合。" },
    ],
    highlights: [
      "村咖适合作为半日游的休息点，把餐饮、茶歇和村内慢游连起来。",
      "菜单可后续接后台配置，展示咖啡、米糕、轻食和团体茶歇。",
      "与民宿和场地预约联动，方便团队安排下午茶或小型活动。",
    ],
    visitTips: [
      "实际营业时间和菜单以后台发布和现场公示为准。",
      "周末团队建议提前备注人数、座位和茶歇需求。",
      "如需团队接待或费用说明，可在游客服务中提交需求。",
    ],
    services: [
      {
        title: "查看菜单",
        desc: "浏览村咖、轻食、田鱼和民宿茶歇内容。",
        url: "/pages/food/food",
        openType: "switchTab",
      },
      {
        title: "场地预约",
        desc: "提交团体茶歇、围炉、团建和活动空间需求。",
        url: "/pages/mine-feature/mine-feature?id=venue",
      },
      {
        title: "问问小林",
        desc: "让智能助手帮你把村咖放进行程里。",
        url: "/pages/ai-guide/ai-guide",
      },
    ],
  },
  "tianpu-station": {
    kicker: "会客驿站",
    lead: "田铺驿站是到村后的集合点、休息点，也是海林村活动的日常中枢。",
    mood: "白墙、木平台和溪谷休闲区形成一处更精美的乡村会客空间。",
    stats: [
      { label: "距离", value: "0.3公里" },
      { label: "功能", value: "集合补给" },
      { label: "适合", value: "团队到访" },
    ],
    story: [
      "田铺驿站承担游客集合、休息、咨询、农品自提和活动签到等复合功能，是海林村把公共服务做得更友好的一个节点。",
      "页面素材以精美房子和休闲平台为主，不把它做成普通服务表，而是呈现“先到这里，再进入村庄体验”的第一站感受。",
    ],
    experience: [
      { title: "集合签到", desc: "团队到达后可在这里确认讲解、路线和活动安排。" },
      { title: "休闲停靠", desc: "露台、坐席和溪谷视野适合短暂停留。" },
      { title: "农品自提", desc: "预订农品后可作为到村领取和核销点。" },
    ],
    itinerary: [
      { time: "抵达", title: "驿站集合", desc: "确认停车、讲解和当天活动。" },
      { time: "15分钟", title: "露台休息", desc: "拍照、补水、等齐团队。" },
      { time: "出发", title: "走向溪谷", desc: "从驿站进入溪谷、村咖或研学路线。" },
    ],
    highlights: [
      "田铺驿站可作为游客到村的第一处会客点，承接咨询、签到和休息。",
      "适合和讲解预约、场地预约、农品自提、慢直播素材拍摄组合使用。",
      "视觉上突出精美房子、露台和溪谷休闲感，避免做成单纯服务点。",
    ],
    visitTips: [
      "团队到访建议把田铺驿站设置为集合点。",
      "如需场地、茶歇或农品提货，请提前在预约页备注。",
      "营业和开放安排以村里运营公告为准。",
    ],
    services: [
      {
        title: "场地预约",
        desc: "预约驿站会客、露台茶歇和团队签到空间。",
        url: "/pages/mine-feature/mine-feature?id=venue",
      },
      {
        title: "讲解预约",
        desc: "从驿站出发，串联村树、溪谷和村咖。",
        url: "/pages/mine-feature/mine-feature?id=guide",
      },
      {
        title: "导航到达",
        desc: "在地图上定位田铺驿站。",
        url: "/pages/map/map",
        openType: "switchTab",
      },
    ],
  },
  "rice-view": {
    highlights: [
      "围绕海林田鱼文化做生态讲解，适合亲子研学和摄影拍摄。",
      "傍晚光线柔和，田埂、鱼群和村落背景更容易出片。",
      "可接农事体验、投喂观察、田鱼家宴等内容。",
    ],
    visitTips: [
      "田埂边请勿追跑，下雨后建议穿防滑鞋。",
      "亲子团队可提前预约任务卡和讲解老师。",
      "拍摄鱼群建议选择上午 9 点前后或傍晚。",
    ],
    services: [
      {
        title: "研学报名",
        desc: "报名稻鱼共生课程，配套观察任务卡。",
        url: "/pages/mine-feature/mine-feature?id=activity",
      },
      {
        title: "讲解跟拍",
        desc: "讲解员带路，跟拍记录田园体验瞬间。",
        url: "/pages/mine-feature/mine-feature?id=guide",
      },
      {
        title: "直播看景",
        desc: "查看稻鱼田实时视频和周边推荐。",
        url: "/pages/live-list/live-list",
      },
    ],
  },
  "creek-trail": {
    kicker: "溪谷慢行",
    lead: "海林·溪谷适合把亲水、散步、茶歇和小型活动放在同一条慢游线里。",
    mood: "不赶景点，沿着水声慢慢走，才是这里最舒服的打开方式。",
    stats: [
      { label: "建议", value: "45-60分钟" },
      { label: "场景", value: "亲水慢行" },
      { label: "适合", value: "家庭团建" },
    ],
    story: [
      "海林·溪谷把溪流、石桥、竹林和休闲平台串在一起，适合亲子、轻徒步、茶歇和小型户外活动。",
      "它更像村庄里的慢生活段落：可以作为路线的中段散步，也可以作为民宿入住后的傍晚活动。",
    ],
    experience: [
      { title: "溪边慢走", desc: "沿溪看水声、竹影和石桥，适合放慢节奏。" },
      { title: "户外茶歇", desc: "配合村咖、民宿和场地预约做轻活动。" },
      { title: "亲子观察", desc: "观察植物、水流和乡村公共空间。" },
    ],
    itinerary: [
      { time: "10分钟", title: "入口集合", desc: "确认天气、路面和返程方向。" },
      { time: "30分钟", title: "沿溪慢行", desc: "经过石桥、竹林和亲水空间。" },
      { time: "15分钟", title: "茶歇收尾", desc: "回到村咖或驿站休息。" },
    ],
    highlights: [
      "沿溪慢行，串联石桥、林荫休息点和茶歇空间。",
      "适合家庭散步、轻徒步、露营小活动和慢直播点位展示。",
      "夏季亲水感强，傍晚适合把步道作为行程收尾。",
    ],
    visitTips: [
      "雨后石面可能湿滑，老人和孩子建议放慢速度。",
      "建议预留 45-60 分钟，不必赶路。",
      "夜游活动需要提前确认照明、集合点和返程安排。",
    ],
    services: [
      {
        title: "场地预约",
        desc: "预约溪谷草坪、茶歇点或小型活动空间。",
        url: "/pages/mine-feature/mine-feature?id=venue",
      },
      {
        title: "路线推荐",
        desc: "查看半日游、亲子游和摄影打卡路线。",
        url: "/pages/route-list/route-list",
      },
      {
        title: "意见反馈",
        desc: "反馈步道设施、卫生或安全提示。",
        url: "/pages/feedback/feedback",
      },
    ],
  },
  museum: {
    highlights: [
      "集中展示海林村区位、侨乡联系、村庄治理和农文旅业态。",
      "适合作为研学开场，先建立对海林村的整体认识。",
      "后续可接后台公告、活动预约和村庄动态内容。",
    ],
    visitTips: [
      "团队参观建议提前预约讲解，避免与其他团队撞时段。",
      "适合安排在行程第一站，后续再去田鱼田或手作点。",
      "可在馆内确认当天活动、餐食和直播点位。",
    ],
    services: [
      {
        title: "预约讲解",
        desc: "预约村情馆讲解与侨乡故事导览。",
        url: "/pages/mine-feature/mine-feature?id=guide",
      },
      {
        title: "招商合作",
        desc: "提交农文旅、研学、品牌活动合作意向。",
        url: "/pages/mine-feature/mine-feature?id=cooperation",
      },
      {
        title: "智能导游",
        desc: "让小林根据人数和时间生成游玩建议。",
        url: "/pages/ai-guide/ai-guide",
      },
    ],
  },
  workshop: {
    highlights: [
      "以古树年轮、印章文化和村游纪念章为核心体验。",
      "课程成果可带走，适合亲子、研学和企业团建。",
      "可联动共富集市售卖手作体验、土蜂蜜、土鸡蛋和农品礼盒。",
    ],
    visitTips: [
      "手作课程建议提前预约，便于准备材料和老师。",
      "小朋友参与时建议选择 60-90 分钟的轻量课程。",
      "团队可把作品打包成伴手礼或研学成果。",
    ],
    services: [
      {
        title: "活动票券",
        desc: "预约古树年轮拓印、香囊和纪念章课程。",
        url: "/pages/mine-feature/mine-feature?id=ticket",
      },
      {
        title: "研学报名",
        desc: "报名古树年轮观察与乡村自然课堂。",
        url: "/pages/mine-feature/mine-feature?id=activity",
      },
      {
        title: "农品预购",
        desc: "预订土鸡、土鸡蛋、黑猪肉和土蜂蜜。",
        url: "/pages/mine-feature/mine-feature?id=mall",
      },
    ],
  },
};

const spots = [
  {
    id: "ancient-tree",
    name: "陈嵘栲古树",
    category: "自然风光",
    tags: ["古树名木", "自然风光", "拍照打卡"],
    openTime: "全天开放",
    duration: "约 20 分钟",
    distance: "0.3公里",
    desc: "陈嵘栲古树是海林村的村树，公开报道显示树龄约 350 年，胸围约 310 厘米、胸径近 1 米、树高约 20 米、冠幅约 18 米。它适合作为到村后的自然教育与古树保护讲解点。",
    images: ["ph-oujiang", "ph-village", "ph-creek"],
    coverUrl: "https://www.hailin.store/assets/photos/ai-chenrongkao-tree.jpg",
    imageUrls: [
      "https://www.hailin.store/assets/photos/ai-chenrongkao-tree.jpg",
      "/assets/scenes/hailin-creek-waterfall.jpg",
      "/assets/scenes/hailin-creek-ripple.jpg",
    ],
    icon: "树",
  },
  {
    id: "tianpu-station",
    name: "田铺驿站",
    category: "公共服务",
    tags: ["会客驿站", "集合点", "场地预约"],
    openTime: "08:30-18:30",
    duration: "约 30 分钟",
    distance: "0.3公里",
    desc: "田铺驿站是海林村到访集合、休息补给、农品自提和活动签到的会客空间，适合作为进村后的第一站。",
    images: ["ph-homestay", "ph-creek", "ph-village"],
    coverUrl: "https://www.hailin.store/assets/photos/ai-map-tianpu-station.jpg",
    imageUrls: [
      "https://www.hailin.store/assets/photos/ai-map-tianpu-station.jpg",
      "https://www.hailin.store/assets/photos/ai-overseas-cafe.jpg",
      "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
    ],
    icon: "驿",
  },
  {
    id: "xunye-cafe",
    name: "寻野村咖",
    category: "美食",
    tags: ["村咖", "咖啡", "乡野轻食"],
    openTime: "10:00-20:00",
    duration: "约 40 分钟",
    distance: "0.6公里",
    desc: "溪谷边的乡野咖啡、米糕轻食和农家简餐，是海林村慢游路线里的茶歇停靠点。",
    images: ["ph-xunye", "ph-homestay", "ph-creek"],
    coverUrl: "https://www.hailin.store/assets/photos/ai-xunye-cafe.jpg",
    imageUrls: [
      "https://www.hailin.store/assets/photos/ai-xunye-cafe.jpg",
      "https://www.hailin.store/assets/photos/ai-overseas-cafe.jpg",
      "https://www.hailin.store/assets/photos/ai-map-hailin-creek.jpg",
    ],
    icon: "咖",
  },
  {
    id: "rice-view",
    name: "稻鱼田观景点",
    category: "自然风光",
    tags: ["自然风光", "拍照打卡", "免费"],
    openTime: "08:00-18:30",
    duration: "约 40 分钟",
    distance: "0.5公里",
    desc: "海林村以田鱼和稻鱼共生闻名，海林村的田园内容可围绕“看得见的生态课堂”展开。晴天傍晚光线柔和，适合亲子研学和摄影团队。",
    images: ["ph-ricefish", "ph-rice", "ph-route"],
    coverUrl: "https://www.hailin.store/assets/photos/ricefish-terrace.jpg",
    imageUrls: [
      "https://www.hailin.store/assets/photos/ricefish-terrace.jpg",
      "https://www.hailin.store/assets/photos/ricefish-paddy.jpg",
      "https://www.hailin.store/assets/photos/ricefish-harvest.jpg",
    ],
    icon: "鱼",
  },
  {
    id: "creek-trail",
    name: "海林·溪谷",
    category: "自然风光",
    tags: ["自然风光", "亲子体验", "免费"],
    openTime: "全天开放",
    duration: "约 1 小时",
    distance: "0.7公里",
    desc: "步道沿山溪铺设，串联石桥、茶歇和林荫休息点。路线平缓，适合家庭散步、轻徒步和慢直播点位展示。",
    images: ["ph-creek", "ph-homestay", "ph-village"],
    coverUrl: "/assets/scenes/hailin-creek-waterfall.jpg",
    imageUrls: [
      "/assets/scenes/hailin-creek-waterfall.jpg",
      "/assets/scenes/hailin-creek-ripple.jpg",
      "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
    ],
    icon: "溪",
  },
  {
    id: "museum",
    name: "海林村展陈馆",
    category: "人文历史",
    tags: ["人文历史", "研学", "免费"],
    openTime: "09:00-17:00",
    duration: "约 45 分钟",
    distance: "0.4公里",
    desc: "村情馆用于展示海林村区位、村庄治理、侨乡联系、农文旅业态和活动公告，是后续接真实后台内容的核心入口。",
    images: ["ph-museum", "ph-stone", "ph-homestay"],
    coverUrl: "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
    imageUrls: [
      "https://www.hailin.store/assets/photos/ai-village-gate.jpg",
      "https://www.hailin.store/assets/photos/ai-stone-souvenir.jpg",
      "https://www.hailin.store/assets/photos/ai-overseas-cafe.jpg",
    ],
    icon: "馆",
  },
  {
    id: "workshop",
    name: "古树年轮拓印点",
    category: "亲子体验",
    tags: ["非遗体验", "亲子体验", "预约"],
    openTime: "09:30-16:30",
    duration: "约 1.5 小时",
    distance: "0.9公里",
    desc: "手作点以古树文化的青灰、纹理和印章文化为视觉灵感，提供拓印、香囊、村游纪念章等体验，适合亲子、研学和团建预约。",
    images: ["ph-stone", "ph-product-stone", "ph-workshop"],
    coverUrl: "https://www.hailin.store/assets/photos/ai-stone-souvenir.jpg",
    imageUrls: [
      "https://www.hailin.store/assets/photos/ai-stone-souvenir.jpg",
      "https://www.hailin.store/assets/photos/ai-fish-keychain.jpg",
      "https://www.hailin.store/assets/photos/ai-oujiang-postcards.jpg",
    ],
    icon: "石",
  },
];

module.exports = spots.map((spot) => ({
  ...spot,
  ...(spotDetails[spot.id] || {}),
}));
