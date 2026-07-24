import bcrypt from 'bcrypt';
import {
  ActivityStatus,
  AdminRole,
  AdminStatus,
  ArticleType,
  BannerLinkType,
  CameraStatus,
  ContentStatus,
  MapPointType,
  ProductStatus,
  ReservationSlotStatus,
  ReservationType,
  ShortcutLinkType,
} from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const img = (name: string) => `/assets/seed/${name}`;

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? 'hailin-admin';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe-Only-For-Local-2026';
  const displayName = process.env.SEED_ADMIN_DISPLAY_NAME ?? '海林村超级管理员';
  if (process.env.NODE_ENV === 'production' && password === 'ChangeMe-Only-For-Local-2026') {
    throw new Error('生产环境必须通过 SEED_ADMIN_PASSWORD 配置强管理员密码');
  }

  await prisma.adminUser.upsert({
    where: { username },
    create: {
      username,
      passwordHash: await bcrypt.hash(password, 12),
      displayName,
      role: AdminRole.SUPER_ADMIN,
      status: AdminStatus.ACTIVE,
    },
    update: {
      displayName,
      role: AdminRole.SUPER_ADMIN,
      status: AdminStatus.ACTIVE,
    },
  });

  await seedHome();
  const spotIds = await seedScenicSpots();
  await seedRoutes(spotIds);
  await seedServicesAndMap(spotIds);
  await seedReservations();
  await seedActivities();
  await seedCameras();
  await seedProducts();
  await seedArticles();
}

async function seedHome() {
  await prisma.banner.upsert({
    where: { id: 'banner-hailin-spring' },
    create: {
      id: 'banner-hailin-spring',
      title: '海林村春日慢游',
      imageUrl: img('banner-spring.jpg'),
      linkType: BannerLinkType.SCENIC_SPOT,
      linkValue: 'spot-rice-field',
      sort: 1,
      status: ContentStatus.PUBLISHED,
    },
    update: { status: ContentStatus.PUBLISHED, imageUrl: img('banner-spring.jpg'), sort: 1 },
  });
  await prisma.banner.upsert({
    where: { id: 'banner-hailin-farm' },
    create: {
      id: 'banner-hailin-farm',
      title: '周末采摘预约开放',
      imageUrl: img('banner-farm.jpg'),
      linkType: BannerLinkType.ACTIVITY,
      linkValue: 'activity-harvest',
      sort: 2,
      status: ContentStatus.PUBLISHED,
    },
    update: { status: ContentStatus.PUBLISHED, imageUrl: img('banner-farm.jpg'), sort: 2 },
  });

  const shortcuts = [
    ['shortcut-map', '地图导览', 'map-pin', '/pages/map/index'],
    ['shortcut-route', '游玩路线', 'route', '/pages/routes/index'],
    ['shortcut-live', '直播看景', 'camera', '/pages/live/index'],
    ['shortcut-farm', '采摘预约', 'apple', '/pages/reservations/index'],
    ['shortcut-shop', '农特产商城', 'shopping-bag', '/pages/shop/index'],
    ['shortcut-ai', 'AI 导游', 'message-circle', '/pages/ai-guide/index'],
  ];
  for (let index = 0; index < shortcuts.length; index += 1) {
    const [id, title, icon, linkValue] = shortcuts[index];
    await prisma.homeShortcut.upsert({
      where: { id },
      create: { id, title, icon, linkType: ShortcutLinkType.PAGE, linkValue, sort: index + 1 },
      update: { title, icon, linkValue, sort: index + 1, status: ContentStatus.PUBLISHED },
    });
  }
}

async function seedScenicSpots() {
  const spots = [
    {
      id: 'spot-rice-field',
      name: '青田鱼稻田',
      subtitle: '稻浪与鱼塘相邻的村口风景',
      summary: '适合拍照、散步和亲子观察的田园片区。',
      tags: ['田园', '亲子', '摄影'],
      longitude: '120.1823000',
      latitude: '30.2678000',
      sort: 1,
    },
    {
      id: 'spot-old-bridge',
      name: '古桥溪畔',
      subtitle: '老桥、溪水和村道组成的慢行节点',
      summary: '村内传统景观节点，适合串联步行路线。',
      tags: ['溪流', '古桥'],
      longitude: '120.1841000',
      latitude: '30.2689000',
      sort: 2,
    },
    {
      id: 'spot-village-hall',
      name: '海林村文化礼堂',
      subtitle: '村史展示和游客服务的复合空间',
      summary: '了解村庄文化、公告活动和便民服务的入口。',
      tags: ['文化', '服务'],
      longitude: '120.1815000',
      latitude: '30.2669000',
      sort: 3,
    },
    {
      id: 'spot-orchard',
      name: '四季果园',
      subtitle: '采摘体验和农事课堂',
      summary: '提供时令果蔬采摘、研学课堂和农事体验。',
      tags: ['采摘', '研学'],
      longitude: '120.1862000',
      latitude: '30.2663000',
      sort: 4,
    },
    {
      id: 'spot-waterfront',
      name: '溪岸慢行道',
      subtitle: '沿溪慢走看村庄风貌',
      summary: '串联停车场、服务中心和几个主要景点的轻徒步道路。',
      tags: ['徒步', '亲水'],
      longitude: '120.1799000',
      latitude: '30.2696000',
      sort: 5,
    },
  ];
  for (const spot of spots) {
    await prisma.scenicSpot.upsert({
      where: { id: spot.id },
      create: {
        ...spot,
        coverImage: img(`${spot.id}.jpg`),
        images: [img(`${spot.id}-1.jpg`), img(`${spot.id}-2.jpg`)],
        content: `${spot.summary}\n\n建议游客预留 30-60 分钟，按现场导览和开放状态游览。`,
        address: '海林村',
        openingHours: '08:30-18:00',
        phone: '0571-00000000',
        ticketInfo: '免费开放，部分体验项目需预约',
        suggestedDuration: '30-60 分钟',
        status: ContentStatus.PUBLISHED,
        isRecommended: true,
      },
      update: {
        subtitle: spot.subtitle,
        summary: spot.summary,
        tags: spot.tags,
        sort: spot.sort,
        status: ContentStatus.PUBLISHED,
        isRecommended: true,
      },
    });
  }
  return spots.map((spot) => spot.id);
}

async function seedRoutes(spotIds: string[]) {
  const routes = [
    {
      id: 'route-half-day',
      name: '半日轻松游',
      summary: '文化礼堂、古桥溪畔、鱼稻田串联的轻量路线。',
      duration: '3 小时',
      distance: '3.2 公里',
      spots: [spotIds[2], spotIds[1], spotIds[0]],
      sort: 1,
    },
    {
      id: 'route-family',
      name: '亲子研学游',
      summary: '果园采摘、田园观察、溪岸慢行，适合家庭周末。',
      duration: '5 小时',
      distance: '5.8 公里',
      spots: [spotIds[3], spotIds[0], spotIds[4]],
      sort: 2,
    },
    {
      id: 'route-photo',
      name: '摄影打卡游',
      summary: '把村口田园、溪畔古桥和慢行道串成一条拍照路线。',
      duration: '4 小时',
      distance: '4.6 公里',
      spots: [spotIds[0], spotIds[1], spotIds[4]],
      sort: 3,
    },
  ];
  for (const route of routes) {
    await prisma.travelRoute.upsert({
      where: { id: route.id },
      create: {
        id: route.id,
        name: route.name,
        coverImage: img(`${route.id}.jpg`),
        summary: route.summary,
        content: `${route.summary}\n\n路线根据村内公共点位和开放时间设计，运营后台可继续调整排序和点位。`,
        duration: route.duration,
        distance: route.distance,
        suitableFor: '游客、亲子、研学团队',
        transportation: '步行或骑行',
        tags: ['推荐', '慢游'],
        status: ContentStatus.PUBLISHED,
        isRecommended: true,
        sort: route.sort,
      },
      update: {
        summary: route.summary,
        duration: route.duration,
        distance: route.distance,
        status: ContentStatus.PUBLISHED,
        sort: route.sort,
      },
    });
    for (let index = 0; index < route.spots.length; index += 1) {
      await prisma.travelRouteSpot.upsert({
        where: { routeId_scenicSpotId: { routeId: route.id, scenicSpotId: route.spots[index] } },
        create: {
          routeId: route.id,
          scenicSpotId: route.spots[index],
          sort: index + 1,
          stayDuration: '30 分钟',
        },
        update: { sort: index + 1, stayDuration: '30 分钟' },
      });
    }
  }
}

async function seedServicesAndMap(spotIds: string[]) {
  await prisma.homestay.upsert({
    where: { id: 'homestay-creek' },
    create: {
      id: 'homestay-creek',
      name: '溪畔小院民宿',
      coverImage: img('homestay-creek.jpg'),
      images: [img('homestay-room.jpg')],
      description: '靠近溪岸慢行道的村居民宿，适合周末家庭入住。',
      address: '海林村溪岸路 12 号',
      phone: '0571-00000011',
      businessHours: '全天入住，14:00 后办理',
      priceFrom: 28800,
      tags: ['亲子', '溪景'],
      status: ContentStatus.PUBLISHED,
    },
    update: { status: ContentStatus.PUBLISHED },
  });
  await prisma.food.upsert({
    where: { id: 'food-tea-house' },
    create: {
      id: 'food-tea-house',
      name: '海林茶点铺',
      coverImage: img('food-tea-house.jpg'),
      images: [img('food-snacks.jpg')],
      description: '供应本地茶点、米糕和农家简餐。',
      address: '海林村游客服务中心旁',
      phone: '0571-00000012',
      businessHours: '09:00-20:00',
      avgPrice: 3500,
      tags: ['茶点', '咖啡', '简餐'],
      status: ContentStatus.PUBLISHED,
    },
    update: { status: ContentStatus.PUBLISHED },
  });
  const mapPoints = [
    {
      id: 'mp-village-gate',
      name: '海林村口会客点',
      type: MapPointType.SERVICE_CENTER,
      longitude: '120.2184000',
      latitude: '28.2136000',
      address: '海口镇海林村入口',
      imageUrl: '/assets/scenes/village-gate.png',
      description: '海口镇海林村入口服务点，可承接游客咨询、路线导览和活动集合。',
      businessHours: '08:30-18:00',
      sort: 1,
    },
    {
      id: 'mp-rice-field',
      name: '稻鱼田观景点',
      type: MapPointType.SCENIC_SPOT,
      longitude: '120.2206000',
      latitude: '28.2152000',
      address: '海林村稻鱼田观景口',
      imageUrl: '/assets/scenes/ricefish-field.png',
      description: '以青田稻鱼共生为灵感的田园观景点，适合研学和亲子摄影。',
      businessHours: '08:00-18:30',
      relatedEntityType: 'SCENIC_SPOT',
      relatedEntityId: 'spot-rice-field',
      sort: 2,
    },
    {
      id: 'mp-creek-trail',
      name: '溪谷慢行步道',
      type: MapPointType.SCENIC_SPOT,
      longitude: '120.2221000',
      latitude: '28.2118000',
      address: '海林村溪谷步道入口',
      imageUrl: '/assets/scenes/creek-trail.png',
      description: '沿山溪设置的慢行步道，串联茶歇、石桥和林荫休息点。',
      businessHours: '全天开放',
      relatedEntityType: 'SCENIC_SPOT',
      relatedEntityId: 'spot-waterfront',
      sort: 3,
    },
    {
      id: 'mp-village-museum',
      name: '海林村情馆',
      type: MapPointType.SCENIC_SPOT,
      longitude: '120.2168000',
      latitude: '28.2143000',
      address: '海林村文化礼堂旁',
      imageUrl: '/assets/scenes/village-gate.png',
      description: '展示海林村区位、村情、侨乡联系和文旅服务信息的公共空间。',
      businessHours: '09:00-17:00',
      relatedEntityType: 'SCENIC_SPOT',
      relatedEntityId: 'spot-village-hall',
      sort: 4,
    },
    {
      id: 'mp-stone-workshop',
      name: '青田石纹手作点',
      type: MapPointType.FARM,
      longitude: '120.2193000',
      latitude: '28.2109000',
      address: '海林村手作体验点',
      imageUrl: '/assets/scenes/tofu-workshop.png',
      description: '以青田石色与纹理为视觉灵感的手作体验点，可对接研学课程。',
      businessHours: '09:30-16:30',
      relatedEntityType: 'ACTIVITY',
      relatedEntityId: 'activity-workshop',
      sort: 5,
    },
    {
      id: 'mp-rice-class',
      name: '稻鱼研学区',
      type: MapPointType.FARM,
      longitude: '120.2234000',
      latitude: '28.2161000',
      address: '海林村稻鱼研学田',
      imageUrl: '/assets/scenes/ricefish-field.png',
      description: '适合研学团队开展识稻、识鱼、水田生态等农事课堂。',
      businessHours: '09:00-16:30',
      relatedEntityType: 'ACTIVITY',
      relatedEntityId: 'activity-study',
      sort: 6,
    },
    {
      id: 'mp-market',
      name: '山村共富集市',
      type: MapPointType.OTHER,
      longitude: '120.2189000',
      latitude: '28.2172000',
      address: '海林村共富市集',
      imageUrl: '/assets/photos/ai-stone-souvenir.jpg',
      description: '展示海林村农产品、文创和共富摊位，可对接真实后台库存。',
      businessHours: '09:00-18:00',
      relatedEntityType: 'PRODUCT',
      sort: 7,
    },
    {
      id: 'mp-homestay-yard',
      name: '侨乡小院民宿',
      type: MapPointType.HOMESTAY,
      longitude: '120.2156000',
      latitude: '28.2126000',
      address: '海林村溪谷慢住区',
      imageUrl: '/assets/scenes/overseas-yard.png',
      description: '面向周末游客的溪谷慢住空间，后续可接真实房态和预订系统。',
      businessHours: '14:00后入住',
      sort: 8,
    },
    {
      id: 'mp-ricefish-banquet',
      name: '海林田鱼家宴',
      type: MapPointType.FOOD,
      longitude: '120.2175000',
      latitude: '28.2116000',
      address: '海林村田鱼家宴点',
      imageUrl: '/assets/scenes/ricefish-banquet.png',
      description: '提供田鱼、山泉豆腐、时令笋蔬等青田地域风味。',
      businessHours: '11:00-14:00 / 17:00-20:00',
      sort: 9,
    },
    {
      id: 'mp-service-center',
      name: '游客中心',
      type: MapPointType.SERVICE_CENTER,
      longitude: '120.2192000',
      latitude: '28.2138000',
      address: '海林村游客中心',
      imageUrl: '/assets/scenes/village-gate.png',
      description: '提供咨询、讲解预约、文创选购和便民服务，可接真实后端。',
      businessHours: '08:30-18:00',
      sort: 10,
    },
    {
      id: 'mp-toilet-center',
      name: '公共厕所',
      type: MapPointType.TOILET,
      longitude: '120.2201000',
      latitude: '28.2141000',
      address: '游客中心旁公共卫生间',
      imageUrl: '/assets/scenes/creek-trail.png',
      description: '靠近游客中心的公共卫生间，开放时间随景区服务时间。',
      businessHours: '08:00-20:00',
      sort: 11,
    },
    {
      id: 'mp-parking-east',
      name: '停车场',
      type: MapPointType.PARKING,
      longitude: '120.2182000',
      latitude: '28.2123000',
      address: '海林村口临时停车场',
      imageUrl: '/assets/scenes/village-gate.png',
      description: '村口临时停车场，节假日请按现场指引有序停放。',
      businessHours: '全天开放',
      sort: 12,
    },
    {
      id: 'mp-live-camera',
      name: '慢直播摄像头',
      type: MapPointType.CAMERA,
      longitude: '120.2198000',
      latitude: '28.2151000',
      address: '海林村田园慢直播点',
      imageUrl: '/assets/scenes/ricefish-field.png',
      description: '支持后端返回萤石云、HLS 或 live-player 地址后展示真实画面。',
      businessHours: '全天在线',
      relatedEntityType: 'CAMERA',
      relatedEntityId: 'camera-rice-field',
      sort: 13,
    },
    {
      id: 'mp-medical',
      name: '便民医疗点',
      type: MapPointType.MEDICAL,
      longitude: '120.2179000',
      latitude: '28.2149000',
      address: '村委便民服务站',
      imageUrl: '/assets/scenes/village-gate.png',
      description: '预留基础应急服务点位，可在后台维护联系电话和开放时间。',
      businessHours: '08:30-18:00',
      sort: 14,
    },
  ] as const;
  for (const point of mapPoints) {
    const configuredRelatedType =
      'relatedEntityType' in point ? point.relatedEntityType : undefined;
    const configuredRelatedId = 'relatedEntityId' in point ? point.relatedEntityId : undefined;
    const relatedEntityType =
      configuredRelatedType ??
      (point.type === MapPointType.SCENIC_SPOT ? 'SCENIC_SPOT' : undefined);
    const relatedEntityId =
      configuredRelatedId ?? (point.type === MapPointType.SCENIC_SPOT ? spotIds[0] : undefined);
    await prisma.mapPoint.upsert({
      where: { id: point.id },
      create: {
        id: point.id,
        name: point.name,
        type: point.type,
        longitude: point.longitude,
        latitude: point.latitude,
        address: point.address,
        imageUrl: point.imageUrl,
        description: point.description,
        businessHours: point.businessHours,
        status: ContentStatus.PUBLISHED,
        relatedEntityType,
        relatedEntityId,
        sort: point.sort,
      },
      update: {
        name: point.name,
        type: point.type,
        longitude: point.longitude,
        latitude: point.latitude,
        address: point.address,
        imageUrl: point.imageUrl,
        description: point.description,
        businessHours: point.businessHours,
        relatedEntityType,
        relatedEntityId,
        sort: point.sort,
        status: ContentStatus.PUBLISHED,
      },
    });
  }
}

async function seedReservations() {
  const farmIds = ['farm-strawberry', 'farm-tea', 'farm-ricefish'];
  const names = ['海林草莓园', '溪畔茶园', '鱼稻共生体验田'];
  for (let index = 0; index < farmIds.length; index += 1) {
    await prisma.farm.upsert({
      where: { id: farmIds[index] },
      create: {
        id: farmIds[index],
        name: names[index],
        coverImage: img(`${farmIds[index]}.jpg`),
        images: [img(`${farmIds[index]}-1.jpg`)],
        description: `${names[index]}提供预约制采摘和农事体验。`,
        address: '海林村农事体验区',
        phone: '0571-00000020',
        businessHours: '09:00-17:30',
        status: ContentStatus.PUBLISHED,
        sort: index + 1,
      },
      update: { status: ContentStatus.PUBLISHED, sort: index + 1 },
    });
    const itemId = `reservation-${farmIds[index]}`;
    await prisma.reservationItem.upsert({
      where: { id: itemId },
      create: {
        id: itemId,
        type: ReservationType.FARM_PICKING,
        title: `${names[index]}采摘预约`,
        coverImage: img(`${farmIds[index]}-booking.jpg`),
        farmId: farmIds[index],
        price: 6800 + index * 1000,
        unit: '人',
        capacity: 30,
        bookingNotice: '请至少提前 1 小时预约，到场后向工作人员出示预约记录。',
        refundRule: '未开始前 2 小时可取消，已核销不可退。',
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        status: ContentStatus.PUBLISHED,
        sort: index + 1,
      },
      update: { status: ContentStatus.PUBLISHED, price: 6800 + index * 1000 },
    });
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(Date.UTC(2026, 6, 23 + day));
      for (const slot of ['09:30-11:30', '14:00-16:00']) {
        const [startTime, endTime] = slot.split('-');
        await prisma.reservationSlot.upsert({
          where: {
            reservationItemId_date_startTime_endTime: {
              reservationItemId: itemId,
              date,
              startTime,
              endTime,
            },
          },
          create: {
            reservationItemId: itemId,
            date,
            startTime,
            endTime,
            capacity: 20,
            status: ReservationSlotStatus.OPEN,
          },
          update: { capacity: 20, status: ReservationSlotStatus.OPEN },
        });
      }
    }
  }
}

async function seedActivities() {
  const activities = [
    ['activity-harvest', '海林村夏日采摘节', '亲子家庭参与的时令采摘和农事课堂。', 3000],
    ['activity-night-market', '溪畔周末夜市', '本地茶点、手作和小型音乐活动。', 0],
    ['activity-study', '鱼稻共生研学课', '面向研学团队的田园观察课程。', 4800],
  ] as const;
  for (let index = 0; index < activities.length; index += 1) {
    const [id, title, summary, fee] = activities[index];
    await prisma.activity.upsert({
      where: { id },
      create: {
        id,
        title,
        coverImage: img(`${id}.jpg`),
        images: [img(`${id}-1.jpg`)],
        summary,
        content: `${summary}\n\n请通过小程序报名，名额有限，报名成功后以系统记录为准。`,
        location: '海林村游客服务中心',
        longitude: '120.1815000',
        latitude: '30.2669000',
        startAt: new Date(Date.UTC(2026, 7, 1 + index, 1, 0, 0)),
        endAt: new Date(Date.UTC(2026, 7, 1 + index, 9, 0, 0)),
        registrationStartAt: new Date(Date.UTC(2026, 6, 20, 0, 0, 0)),
        registrationEndAt: new Date(Date.UTC(2026, 7, 1 + index, 0, 0, 0)),
        capacity: 80,
        fee,
        status: ActivityStatus.PUBLISHED,
        sort: index + 1,
      },
      update: { status: ActivityStatus.PUBLISHED, fee, sort: index + 1 },
    });
  }
}

async function seedCameras() {
  const cameras = [
    ['camera-rice-field', '鱼稻田慢直播', 'DEV-RICE-FIELD', '青田鱼稻田'],
    ['camera-creek', '古桥溪畔慢直播', 'DEV-CREEK', '古桥溪畔'],
    ['camera-service', '游客中心广场直播', 'DEV-SERVICE', '游客服务中心'],
  ] as const;
  for (let index = 0; index < cameras.length; index += 1) {
    const [id, name, serial, location] = cameras[index];
    await prisma.camera.upsert({
      where: { deviceSerial_channelNo: { deviceSerial: serial, channelNo: 1 } },
      create: {
        id,
        name,
        coverImage: img(`${id}.jpg`),
        deviceSerial: serial,
        channelNo: 1,
        location,
        description: `${location}实时画面，正式上线前需配置萤石云凭证。`,
        status: CameraStatus.ONLINE,
        sort: index + 1,
      },
      update: { name, location, status: CameraStatus.ONLINE, sort: index + 1 },
    });
  }
}

async function seedProducts() {
  await prisma.freightTemplate.upsert({
    where: { id: 'freight-default' },
    create: {
      id: 'freight-default',
      name: '默认快递',
      firstFee: 800,
      additionalFee: 0,
      freeThreshold: 9900,
    },
    update: { firstFee: 800, freeThreshold: 9900 },
  });
  const categories = [
    ['cat-fresh', '时令鲜品', 'sprout'],
    ['cat-tea', '茶点饮品', 'coffee'],
    ['cat-gift', '文创伴手礼', 'gift'],
  ] as const;
  for (const [id, name, icon] of categories) {
    await prisma.productCategory.upsert({
      where: { id },
      create: { id, name, icon, status: ContentStatus.PUBLISHED },
      update: { name, icon, status: ContentStatus.PUBLISHED },
    });
  }
  const products = [
    ['product-rice', '海林村生态米', 'cat-fresh', 3900, '袋', 200],
    ['product-fish', '鱼稻共生稻花鱼礼盒', 'cat-fresh', 12800, '盒', 80],
    ['product-strawberry', '当季草莓尝鲜装', 'cat-fresh', 6800, '盒', 120],
    ['product-tea', '溪畔绿茶', 'cat-tea', 8800, '罐', 90],
    ['product-rice-cake', '手作米糕', 'cat-tea', 3600, '盒', 150],
    ['product-coffee', '海林村挂耳咖啡', 'cat-tea', 5900, '盒', 110],
    ['product-honey', '山野蜂蜜', 'cat-fresh', 7600, '瓶', 70],
    ['product-bag', '海林村帆布袋', 'cat-gift', 4500, '个', 100],
    ['product-postcard', '村景明信片套装', 'cat-gift', 2800, '套', 180],
    ['product-guide-map', '手绘导览地图', 'cat-gift', 1800, '份', 300],
  ] as const;
  for (const [id, name, categoryId, price, unit, stock] of products) {
    await prisma.product.upsert({
      where: { id },
      create: {
        id,
        name,
        subtitle: '海林村运营团队推荐',
        coverImage: img(`${id}.jpg`),
        images: [img(`${id}-1.jpg`)],
        detail: `${name}为海林村测试商品，正式销售前请在后台完善库存、规格、物流和售后说明。`,
        categoryId,
        price,
        originalPrice: price + 1000,
        stock,
        unit,
        specification: unit,
        freightTemplateId: 'freight-default',
        status: ProductStatus.ON_SALE,
      },
      update: { price, stock, unit, status: ProductStatus.ON_SALE },
    });
  }
}

async function seedArticles() {
  const articles = [
    [
      'article-intro',
      ArticleType.VILLAGE_INTRO,
      '海林村介绍',
      '了解海林村的田园风貌、公共服务和文旅资源。',
    ],
    [
      'article-notice',
      ArticleType.NOTICE,
      '暑期运营公告',
      '暑期活动、采摘预约和游客服务中心开放时间说明。',
    ],
    ['article-guide', ArticleType.GUIDE, '游客须知', '停车、厕所、咨询、预约和应急服务说明。'],
    ['article-faq', ArticleType.FAQ, '常见问题', '关于预约、退款、直播和商城配送的常见问题。'],
  ] as const;
  for (let index = 0; index < articles.length; index += 1) {
    const [id, type, title, summary] = articles[index];
    await prisma.article.upsert({
      where: { id },
      create: {
        id,
        type,
        title,
        summary,
        coverImage: img(`${id}.jpg`),
        content: `${summary}\n\n本内容由后台初始化生成，运营人员可继续完善。`,
        status: ContentStatus.PUBLISHED,
        sort: index + 1,
      },
      update: { type, title, summary, status: ContentStatus.PUBLISHED, sort: index + 1 },
    });
  }
}

main()
  .then(async () => {
    console.log('Seed completed. Admin:', process.env.SEED_ADMIN_USERNAME ?? 'hailin-admin');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
