const defaultProfile = {
  nickname: "微信游客",
  avatarText: "",
  avatarUrl: "/assets/tabbar/mine-active.png",
  contact: "",
  intro: "",
};

const defaultLists = {
  notes: [],
  favorites: [],
  likes: [],
};

const coupons = [];

const pointTasks = [
  {
    id: "profile",
    title: "完善个人资料",
    points: 10,
    desc: "填写昵称、联系方式和个人简介",
  },
  {
    id: "publish",
    title: "发布一篇游记",
    points: 8,
    desc: "记录一次黄湖林场游玩体验",
  },
  {
    id: "favorite",
    title: "收藏三个景点",
    points: 6,
    desc: "为下次村游准备路线清单",
  },
  {
    id: "booking",
    title: "提交一次预约",
    points: 12,
    desc: "预约讲解、场地、研学或民宿服务",
  },
];

const bookingFeatures = {
  mall: {
    id: "mall",
    type: "booking",
    title: "农品预购",
    heroTag: "黄湖林场农品",
    subtitle:
      "预订黄湖林场土鸡、土鸡蛋、黑猪肉、土蜂蜜等本地农产品，后台确认库存、提货和配送。",
    service: "黄湖林场农品预购",
    actionText: "提交预购意向",
    chips: ["土鸡预订", "土蜂蜜", "到村自提"],
    formLabels: {
      date: "提货日期",
      people: "采购份数",
      contact: "联系方式",
      remark: "采购需求",
    },
    cards: [
      {
        title: "山林散养土鸡",
        desc: "按只预订，适合家庭餐食和到村伴手礼，最终重量后台确认",
        price: "128元/只",
      },
      {
        title: "农家土鸡蛋",
        desc: "30枚组合装，适合周末自提和团队采购",
        price: "36元/盒",
      },
      {
        title: "山乡黑猪肉",
        desc: "五花、前腿等按份预订，后台确认可选部位和重量",
        price: "68元/斤",
      },
      {
        title: "黄湖林场土蜂蜜",
        desc: "山野花香，500g瓶装，可做农品礼盒搭配",
        price: "59元/瓶",
      },
    ],
  },
  ticket: {
    id: "ticket",
    type: "booking",
    title: "活动票券",
    heroTag: "票券预约",
    subtitle: "预约稻鱼体验、手作课、溪谷夜游等黄湖林场主题活动。",
    service: "黄湖林场活动票券",
    actionText: "预订票券",
    chips: ["亲子友好", "可团队", "到场核销"],
    formLabels: {
      date: "活动日期",
      people: "票券数量",
      contact: "联系方式",
      remark: "活动备注",
    },
    cards: [
      {
        title: "稻鱼田体验票",
        desc: "田埂讲解、投喂观察和农事互动",
        price: "49元/人",
      },
      {
        title: "古树文化拓印课",
        desc: "识石纹、拓印和带走文创小品",
        price: "59元/人",
      },
      {
        title: "溪谷夜游票",
        desc: "傍晚溪谷慢行、村落故事和茶点",
        price: "39元/人",
      },
    ],
  },
  tour: {
    id: "tour",
    type: "booking",
    title: "村游订单",
    heroTag: "一日村游",
    subtitle: "把景点、餐食、讲解和交通串成一次完整的黄湖林场行程。",
    service: "黄湖林场村游订单",
    actionText: "提交村游需求",
    chips: ["半日游", "一日游", "亲子研学"],
    formLabels: {
      date: "出行日期",
      people: "出行人数",
      contact: "联系方式",
      remark: "行程偏好",
    },
    cards: [
      {
        title: "稻鱼田半日线",
        desc: "村口集合、田埂讲解、农事体验和茶点",
        price: "88元/人",
      },
      {
        title: "侨乡文化一日线",
        desc: "侨乡故事、古树年轮手作、稻鱼宴和溪谷步道",
        price: "168元/人",
      },
      {
        title: "亲子研学线",
        desc: "自然观察、非遗手作和村落任务卡",
        price: "128元/人",
      },
    ],
  },
  guide: {
    id: "guide",
    type: "booking",
    title: "讲解跟拍",
    heroTag: "讲解影像",
    subtitle: "为村情馆、稻鱼田、溪谷步道和侨乡老屋预约讲解员与跟拍。",
    service: "黄湖林场讲解跟拍",
    actionText: "预约讲解跟拍",
    chips: ["村民讲解", "手机跟拍", "亲子路线"],
    formLabels: {
      date: "预约日期",
      people: "服务人数",
      contact: "联系方式",
      remark: "拍摄需求",
    },
    cards: [
      { title: "基础讲解", desc: "60分钟村落重点点位讲解", price: "99元/场" },
      {
        title: "讲解+跟拍",
        desc: "讲解员带路，摄影师记录游玩瞬间",
        price: "199元/场",
      },
      {
        title: "亲子任务卡",
        desc: "讲解、任务卡和亲子互动拍摄",
        price: "159元/场",
      },
    ],
  },
  stay: {
    id: "stay",
    type: "booking",
    title: "民宿订单",
    heroTag: "乡宿预订",
    subtitle: "预约黄湖林场及周边民宿，适合家庭、研学队伍和团建留宿。",
    service: "黄湖林场民宿订单",
    actionText: "提交住宿需求",
    chips: ["亲子房", "团队房", "早餐可配"],
    formLabels: {
      date: "入住日期",
      people: "入住人数",
      contact: "联系方式",
      remark: "房型需求",
    },
    cards: [
      {
        title: "溪畔家庭房",
        desc: "亲水步道旁，适合一家三口",
        price: "268元起",
      },
      {
        title: "侨乡院落房",
        desc: "老宅改造，适合慢游和拍照",
        price: "328元起",
      },
      {
        title: "研学团队房",
        desc: "多人床位、早餐和活动室可配",
        price: "按团询价",
      },
    ],
  },
  activity: {
    id: "activity",
    type: "booking",
    title: "研学报名",
    heroTag: "课程报名",
    subtitle: "报名稻鱼共生、古树年轮、侨乡故事和乡村治理主题研学。",
    service: "黄湖林场研学报名",
    actionText: "提交报名",
    chips: ["课程包", "讲师带队", "可开票"],
    formLabels: {
      date: "研学日期",
      people: "报名人数",
      contact: "联系方式",
      remark: "年级/主题",
    },
    cards: [
      {
        title: "稻鱼共生课",
        desc: "认识稻田生态、观察鱼群和农具体验",
        price: "78元/人",
      },
      {
        title: "古树年轮课",
        desc: "石纹观察、拓印和文创带回",
        price: "88元/人",
      },
      {
        title: "侨乡故事课",
        desc: "家书、老物件和口述史任务",
        price: "68元/人",
      },
    ],
  },
  venue: {
    id: "venue",
    type: "booking",
    title: "场地预约",
    heroTag: "空间预约",
    subtitle: "预约村口会客点、研学教室、溪谷草坪和共富集市场地。",
    service: "黄湖林场场地预约",
    actionText: "提交场地预约",
    chips: ["活动布置", "可讲解", "可餐饮"],
    formLabels: {
      date: "使用日期",
      people: "预计人数",
      contact: "联系方式",
      remark: "活动说明",
    },
    cards: [
      {
        title: "村口会客点",
        desc: "签到、集合、发布会和游客接待",
        price: "半天起订",
      },
      {
        title: "研学教室",
        desc: "投影、桌椅和手作工具可配置",
        price: "300元/半天",
      },
      {
        title: "溪谷草坪",
        desc: "户外营地、音乐会和亲子活动",
        price: "按场询价",
      },
    ],
  },
  build: {
    id: "build",
    type: "booking",
    title: "团建定制",
    heroTag: "团队方案",
    subtitle: "为企业、学校和社群定制黄湖林场团建、研学和共富交流路线。",
    service: "黄湖林场团建定制",
    actionText: "提交定制需求",
    chips: ["企业团建", "党建共建", "研学交流"],
    formLabels: {
      date: "计划日期",
      people: "团队人数",
      contact: "联系方式",
      remark: "团队目标",
    },
    cards: [
      {
        title: "共富研学团建",
        desc: "村庄参访、共富集市和团队任务",
        price: "定制报价",
      },
      {
        title: "户外轻团建",
        desc: "溪谷步道、农事互动和围炉茶点",
        price: "128元/人起",
      },
      {
        title: "党建共建路线",
        desc: "乡村治理、共富实践和交流座谈",
        price: "按团报价",
      },
    ],
  },
};

const serviceEnhancements = {
  mall: {
    highlights: [
      {
        title: "四类主推农品",
        desc: "土鸡、土鸡蛋、黑猪肉和土蜂蜜放在一期预购核心清单。",
      },
      {
        title: "库存后台确认",
        desc: "提交后由运营人员确认重量、份数、提货时间和配送方式。",
      },
      {
        title: "适合团队采购",
        desc: "团建、民宿和活动客群可提前备注预算和包装需求。",
      },
    ],
    process: [
      "提交预购意向",
      "后台确认库存、重量和价格",
      "到田铺驿站或集市摊位自提",
    ],
    notes: [
      "农品库存会随季节和当天供应变化，最终以后台确认为准。",
      "土鸡和黑猪肉建议提前 1 天备注份数、预算和提货时间。",
    ],
  },
  ticket: {
    highlights: [
      {
        title: "活动一站预约",
        desc: "稻鱼体验、石纹拓印、溪谷夜游统一提交需求。",
      },
      { title: "亲子友好", desc: "课程节奏适合家庭和研学团队，可备注年龄段。" },
      { title: "到场核销", desc: "票券预约可在游客中心或活动点核销。" },
    ],
    process: [
      "选择活动票券",
      "填写日期人数",
      "后台确认可参加场次",
      "到场出示核销信息",
    ],
    notes: [
      "户外活动会受天气影响，雨天可调整为室内手作课。",
      "研学团队可在备注里写明年级、课程目标和带队老师联系方式。",
    ],
  },
  tour: {
    highlights: [
      {
        title: "路线+餐食+讲解",
        desc: "把村口、田埂、溪谷、餐食和手作串成完整行程。",
      },
      { title: "适合首访游客", desc: "不需要自己拼点位，按半日或一日节奏走。" },
      {
        title: "可按人群调整",
        desc: "家庭、摄影、研学和团队客群可以走不同节奏。",
      },
    ],
    process: [
      "选择村游线路",
      "填写出行日期和人数",
      "后台确认餐食/讲解/点位",
      "到游客中心集合出发",
    ],
    notes: [
      "费用为参考区间，餐食、讲解和交通组合不同会影响报价。",
      "团队建议备注是否有老人、儿童、摄影或研学需求。",
    ],
  },
  guide: {
    highlights: [
      {
        title: "村民讲解",
        desc: "围绕村情馆、田鱼、古树文化和侨乡故事进行讲解。",
      },
      { title: "手机跟拍", desc: "适合家庭、团队和小红书式打卡记录。" },
      { title: "亲子任务卡", desc: "孩子可以边走边完成观察和问答任务。" },
    ],
    process: [
      "选择讲解套餐",
      "备注点位与拍摄需求",
      "后台确认讲解员时间",
      "到村口会客点集合",
    ],
    notes: [
      "建议提前 2 小时预约，旺季团队请提前 1 天。",
      "如需跟拍，请备注人数、服装风格和是否需要亲子任务卡。",
    ],
  },
  stay: {
    highlights: [
      { title: "溪谷慢住", desc: "适合把夜游、茶叙和第二天早晨慢行接起来。" },
      { title: "亲子/团队可配", desc: "可备注房型、早餐、停车和接送需求。" },
      { title: "周末友好", desc: "把黄湖林场从半日游延展成两天一晚。" },
    ],
    process: [
      "提交住宿需求",
      "后台确认房态和价格",
      "补充入住人数与到达时间",
      "到店办理入住",
    ],
    notes: [
      "房态需以后端或民宿确认结果为准。",
      "带儿童或老人建议备注楼层、床型和早餐需求。",
    ],
  },
  activity: {
    highlights: [
      { title: "稻鱼课堂", desc: "从水田生态、农具和田鱼观察切入。" },
      { title: "石纹手作", desc: "看古树年轮理，完成拓印或香囊作品。" },
      { title: "可接团队", desc: "适合学校、亲子营和研学机构定制。" },
    ],
    process: [
      "选择课程主题",
      "填写人数和年级",
      "后台确认讲师与场地",
      "到村完成课程签到",
    ],
    notes: [
      "课程会根据季节、天气和农事情况调整。",
      "学校团队建议备注年级、课程目标和是否需要发票。",
    ],
  },
  venue: {
    highlights: [
      {
        title: "空间可选",
        desc: "村口会客点、研学教室、溪谷草坪和共富集市可组合。",
      },
      { title: "活动支持", desc: "可备注桌椅、投影、讲解、餐饮和物料需求。" },
      {
        title: "适合发布/团建",
        desc: "小型发布会、共创活动和研学开营都能承接。",
      },
    ],
    process: [
      "选择场地类型",
      "填写日期人数",
      "后台确认档期和配置",
      "到场布置与核验",
    ],
    notes: [
      "户外草坪活动需关注天气和现场安全。",
      "请在备注里说明用电、搭建、餐饮和车辆情况。",
    ],
  },
  build: {
    highlights: [
      {
        title: "团队目标定制",
        desc: "党建共建、企业团建、学校研学和社群活动可分开设计。",
      },
      {
        title: "农文旅组合",
        desc: "村庄参访、田鱼体验、手作、餐食和交流座谈可拼装。",
      },
      { title: "后台跟进", desc: "提交后由后台记录需求，方便运营人员回访。" },
    ],
    process: [
      "提交团队目标",
      "后台沟通预算和时间",
      "输出线路和报价",
      "确认后执行活动",
    ],
    notes: [
      "20 人以上团队建议至少提前 3 天沟通。",
      "如有党建、研学或企业主题，请在备注里写清活动目标。",
    ],
  },
};

Object.keys(serviceEnhancements).forEach((id) => {
  bookingFeatures[id] = {
    ...bookingFeatures[id],
    ...serviceEnhancements[id],
  };
});

const featureMap = {
  notes: {
    id: "notes",
    type: "list",
    title: "我的游记",
    subtitle: "查看自己发布的黄湖林场游记，也可以继续发布新的村游记录。",
    actionText: "发布游记",
  },
  favorites: {
    id: "favorites",
    type: "list",
    title: "我的收藏",
    subtitle: "收藏过的景点、路线和体验内容会集中在这里。",
    actionText: "去地图看看",
  },
  likes: {
    id: "likes",
    type: "list",
    title: "我的点赞",
    subtitle: "看过并点赞的黄湖林场内容，方便下次继续浏览。",
    actionText: "继续发现",
  },
  ...bookingFeatures,
  gate: {
    id: "gate",
    type: "verify",
    title: "预约核销",
    heroTag: "到场核销",
    subtitle: "输入订单核销码，完成票券、讲解、场地或研学预约核销。",
    chips: ["订单码", "票券码", "到场确认"],
    codes: [],
  },
  coupon: {
    id: "coupon",
    type: "coupon",
    title: "优惠券",
    heroTag: "游客权益",
    subtitle: "领取并使用黄湖林场餐饮、手作、讲解和民宿优惠。",
    chips: ["稻鱼宴", "手作体验", "讲解抵扣"],
    coupons,
  },
  points: {
    id: "points",
    type: "points",
    title: "积分",
    heroTag: "游客成长",
    subtitle: "签到、发布游记、完善资料和预约服务都能获得黄湖林场积分。",
    chips: ["可兑换", "任务积分", "签到奖励"],
    tasks: pointTasks,
  },
  checkin: {
    id: "checkin",
    type: "checkin",
    title: "签到",
    heroTag: "每日到访",
    subtitle: "每天签到领取积分，连续到访可兑换稻鱼宴和手作体验优惠。",
    chips: ["每日一次", "+5积分", "到访记录"],
  },
  cooperation: {
    id: "cooperation",
    type: "cooperation",
    title: "招商合作",
    heroTag: "合作共创",
    subtitle: "提交共富集市摊位、研学课程、民宿餐饮、品牌联名等合作意向。",
    chips: ["运营合作", "农品共创", "研学课程"],
    types: ["共富集市入驻", "研学课程合作", "民宿餐饮合作", "品牌活动联名"],
  },
  publish: {
    id: "publish",
    type: "publish",
    title: "发布游记",
    subtitle: "写下你在黄湖林场的游玩路线、照片点位和体验建议。",
  },
};

module.exports = {
  coupons,
  defaultLists,
  defaultProfile,
  featureMap,
  pointTasks,
};
