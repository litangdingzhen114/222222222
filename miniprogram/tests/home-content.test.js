const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const banners = require("../data/banners");
const gridPages = require("../data/homeGrids");
const products = require("../data/products");
const recommend = require("../data/recommend");
const routes = require("../data/routes");
const spots = require("../data/spots");
const foods = require("../data/foods");
const appConfig = require("../app.json");

const pageSet = new Set(appConfig.pages.map((page) => `/${page}`));
const tabSet = new Set(
  (appConfig.tabBar.list || []).map((item) => `/${item.pagePath}`),
);
const routeIds = new Set(routes.map((item) => item.id));
const spotIds = new Set(spots.map((item) => item.id));

function assertNavigableUrl(url, label) {
  if (!url) return;
  const [page, query = ""] = url.split("?");
  assert(
    pageSet.has(page),
    `${label} target page should be registered: ${page}`,
  );
  if (query.startsWith("id=") && page.includes("/route-detail/")) {
    assert(
      routeIds.has(query.slice(3)),
      `${label} target route should exist: ${query}`,
    );
  }
  if (query.startsWith("id=") && page.includes("/spot-detail/")) {
    assert(
      spotIds.has(query.slice(3)),
      `${label} target spot should exist: ${query}`,
    );
  }
}

assert(
  banners.length >= 4,
  "home should have enough banner stories for a real first screen",
);
assert(
  banners.some((item) => item.title.includes("海口镇海林村")),
  "banners should make the location explicit",
);
assert.strictEqual(
  banners[0].id,
  "banner-chenrongkao",
  "home first banner should feature the Chenrongkao village tree",
);
assert(
  banners[0].subtitle.includes("350") &&
    banners[0].subtitle.includes("陈嵘栲") &&
    banners[0].imageUrl === "/assets/photos/ai-chenrongkao-tree.jpg",
  "Chenrongkao banner should use sourced facts and the generated tree image",
);
assert(
  recommend.hotRecommends.length >= 6,
  "home should expose richer recommendations",
);
assert(recommend.itineraries.length >= 3, "home should expose itinerary cards");
assert(
  recommend.serviceCards.length >= 4,
  "home should expose visitor service cards",
);

const priorityGridIds = gridPages[0].items.slice(0, 7).map((item) => item.id);
assert.deepStrictEqual(
  priorityGridIds,
  ["farm-order", "monitor", "xunye-cafe", "stay", "venue", "ai", "map"],
  "home first grid should prioritize farm products, monitoring, Xunye cafe, stay/venue and AI guide",
);
const gridItems = gridPages.flatMap((page) => page.items);
const gridTitles = gridItems.map((item) => item.title);
assert.strictEqual(gridPages.length, 1, "home grid should fit consolidated entries on one page");
assert.strictEqual(
  gridItems.length,
  15,
  "home grid should keep a complete 3x5 shortcut page after merging",
);
assert(
  [
    "海林故事",
    "侨乡故事",
    "青田石韵",
    "稻鱼体验",
    "出行服务",
    "交通指南",
    "海林慢直播",
    "找停车场",
    "找公厕",
    "乡心支付",
    "海口天气",
    "交通出行",
    "AI旅拍",
    "旅拍合影",
    "海林侨乡",
    "文化云",
    "非遗地图",
    "溪谷老街",
    "团建定制游",
    "行李无忧",
    "意见反馈",
    "乡宿体验",
    "非遗手作",
  ].every(
    (title) => !gridTitles.includes(title),
  ),
  "home grid should merge overlapping culture and travel entries",
);
assert(
  ["村树陈嵘栲", "AR合影", "寻野 cafe", "便民服务", "热门景点"].every((title) =>
    gridTitles.includes(title),
  ),
  "home grid should keep merged culture and travel entries",
);
const villageTreeEntry = gridItems.find((item) => item.id === "village-tree");
assert(villageTreeEntry, "village tree entry should exist");
assert.strictEqual(
  villageTreeEntry.focusMapPoint,
  "chenrongkao-tree",
  "village tree shortcut should focus the Chenrongkao map point",
);
const arPhotoEntry = gridItems.find((item) => item.id === "photo-memory");
assert(arPhotoEntry, "AR photo entry should exist");
assert.strictEqual(
  arPhotoEntry.url,
  undefined,
  "AR photo entry should not navigate to a placeholder detail page",
);
assert(
  arPhotoEntry.toast && arPhotoEntry.toast.includes("完善中"),
  "AR photo entry should explain that the feature is still being completed",
);
assert(
  fs.existsSync(
    path.join(root, "miniprogram/assets/photos/ai-xunye-cafe.jpg"),
  ),
  "Xunye cafe should use a generated cafe image asset",
);
assert(
  fs.existsSync(
    path.join(root, "miniprogram/assets/photos/ai-chenrongkao-tree.jpg"),
  ),
  "Chenrongkao village tree should use a generated tree image asset",
);
assert.strictEqual(
  new Set(gridItems.map((item) => item.id)).size,
  gridItems.length,
  "home grid ids should remain unique after merging",
);
assert(
  products.length >= 4,
  "home products should expose agricultural preorder items",
);
assert(
  products.every(
    (item) =>
      item.imageUrl && item.imageUrl.includes("/assets/photos/ai-product-"),
  ),
  "agricultural products should use generated product photos",
);
assert(
  recommend.corridor.length >= 6,
  "Hailin corridor should keep enough village and experience entries",
);
assert(
  recommend.corridor.every(
    (item) =>
      !["土鸡", "土鸡蛋", "黑猪肉", "土蜂蜜", "散养"].some((keyword) =>
        item.title.includes(keyword),
      ),
  ),
  "Hailin corridor should not mix agricultural products into the village gallery",
);

recommend.itineraries.forEach((item) => {
  assert(
    item.title && item.time && item.route,
    `${item.id} itinerary needs title, time and route`,
  );
  assert(
    Array.isArray(item.highlights) && item.highlights.length >= 2,
    `${item.id} itinerary needs highlights`,
  );
  assertNavigableUrl(item.url, item.title);
});

recommend.serviceCards.forEach((item) => {
  assert(
    item.title && item.desc && item.actionText,
    `${item.id} service card needs actionable copy`,
  );
  assertNavigableUrl(item.url, item.title);
  if (item.openType === "switchTab") {
    assert(
      tabSet.has(item.url),
      `${item.title} switchTab target should be a tab`,
    );
  }
});

gridPages
  .flatMap((page) => page.items)
  .forEach((item) => {
    assertNavigableUrl(item.url, item.title);
    if (item.openType === "switchTab") {
      assert(
        tabSet.has(item.url),
        `${item.title} switchTab target should be a tab`,
      );
    }
  });

const homeJs = fs.readFileSync(
  path.join(root, "miniprogram/pages/home/home.js"),
  "utf8",
);
const homeWxml = fs.readFileSync(
  path.join(root, "miniprogram/pages/home/home.wxml"),
  "utf8",
);
const homeWxss = fs.readFileSync(
  path.join(root, "miniprogram/pages/home/home.wxss"),
  "utf8",
);
const foodWxml = fs.readFileSync(
  path.join(root, "miniprogram/pages/food/food.wxml"),
  "utf8",
);
const foodJson = fs.readFileSync(
  path.join(root, "miniprogram/pages/food/food.json"),
  "utf8",
);
const backendServer = fs.readFileSync(
  path.join(root, "backend/server.js"),
  "utf8",
);
const homeDataSnapshot = JSON.stringify({
  banners,
  recommend,
});

assert(homeJs.includes("itineraries"), "home page should load itinerary data");
assert(
  homeJs.includes("serviceCards"),
  "home page should load service card data",
);
assert(
  homeJs.includes("navigateByDataset"),
  "home page should share navigation behavior",
);
assert(
  homeJs.includes("quickToast(toast)") && homeWxml.includes("data-toast"),
  "home grid should support non-detail placeholder prompts",
);
assert(
  homeJs.includes("hailin_pending_map_point") &&
    homeWxml.includes("data-focus-map-point"),
  "home grid should support focusing a map point after switchTab navigation",
);
assert(
  homeWxml.includes("今日这样游"),
  "home page should render itinerary section",
);
assert(
  homeWxml.includes("到村服务"),
  "home page should render service section",
);
assert(
  homeWxml.includes("海林农品预购"),
  "home page should render agricultural preorder section",
);
assert(
  homeWxml.includes("gridPages.length > 1"),
  "home grid should hide pagination dots after shortcuts are consolidated to one page",
);
assert(
  homeWxss.includes("itinerary-card"),
  "home page should style itinerary cards",
);
assert(
  homeWxss.includes("service-card"),
  "home page should style service cards",
);
assert(
  backendServer.includes("itineraries: recommend.itineraries"),
  "backend home defaults should include itineraries",
);
assert(
  backendServer.includes("serviceCards: recommend.serviceCards"),
  "backend home defaults should include service cards",
);
assert(
  !homeDataSnapshot.includes("/assets/scenes/"),
  "home cards should use photo assets instead of old scene placeholders",
);
assert(
  appConfig.tabBar.list.some((item) => item.text === "寻野 cafe"),
  "tab bar should expose Xunye cafe instead of the old food label",
);
assert(
  foodWxml.includes("寻野 cafe") &&
    foodWxml.includes("/assets/photos/ai-xunye-cafe.jpg"),
  "food page should be branded as Xunye cafe and use its generated image",
);
assert(
  foodJson.includes("寻野 cafe"),
  "food page navigation title should use Xunye cafe",
);
assert(
  foods.some(
    (item) =>
      item.name === "寻野 cafe" &&
      item.imageUrl === "/assets/photos/ai-xunye-cafe.jpg",
  ),
  "food fallback data should include Xunye cafe with generated image",
);
assert(
  foods.some(
    (item) => item.name === "溪谷民宿茶歇" && item.tags.includes("民宿"),
  ),
  "food fallback data should include a homestay tea item",
);
assert(
  !JSON.stringify(foods).includes("一村一宴") &&
    !foodWxml.includes("一村一宴") &&
    !foodWxml.includes("民俗"),
  "food page should replace the old one-village banquet entry with homestay content",
);

function loadContentServiceWithWx(wxMock) {
  const apiPath = require.resolve("../services/api");
  const contentPath = require.resolve("../services/content");
  delete require.cache[apiPath];
  delete require.cache[contentPath];
  global.wx = wxMock;
  return require("../services/content");
}

async function assertLegacyFallbackKeepsImages() {
  const calls = [];
  const wxMock = {
    getSystemInfoSync() {
      return { platform: "devtools" };
    },
    getStorageSync() {
      return "";
    },
    request(options) {
      calls.push(options.url);
      if (options.url.includes("/api/v1/home")) {
        options.fail(new Error("v1 unavailable"));
        return;
      }
      if (options.url.includes("/api/hailin/home")) {
        options.success({
          statusCode: 200,
          data: {
            banners: [
              {
                id: "legacy-banner",
                title: "旧接口 banner",
                subtitle: "旧接口回退时也必须补图",
                imageUrl: "/assets/scenes/village-gate.png",
              },
            ],
            scenicSpots: [
              {
                id: "legacy-spot",
                title: "旧接口景点",
                imageUrl: "/assets/scenes/ricefish-field.png",
                images: [],
              },
            ],
            routes: [
              {
                id: "legacy-route",
                name: "旧接口路线",
                duration: "约 2 小时",
                imageUrl: "/assets/scenes/creek-trail.png",
              },
            ],
            products: [
              {
                id: "legacy-product",
                name: "旧接口商品",
                price: 1200,
                imageUrl: "/assets/scenes/village-gate.png",
              },
            ],
            notice: "旧接口公告",
          },
        });
        return;
      }
      options.fail(new Error(`unexpected request: ${options.url}`));
    },
  };

  try {
    const content = loadContentServiceWithWx(wxMock);
    const home = await content.loadHomeData();
    assert(
      calls.some((url) => url.includes("/api/v1/home")),
      "home should try v1 API first",
    );
    assert(
      calls.some((url) => url.includes("/api/hailin/home")),
      "home should fall back to legacy API",
    );
    assert.strictEqual(
      home.banners[0].imageUrl,
      "/assets/photos/ai-village-gate.jpg",
    );
    assert(
      !JSON.stringify(home).includes("/assets/scenes/"),
      "legacy scene placeholders should be converted to photo assets",
    );
    assert(
      home.hotRecommends[0].imageUrl,
      "legacy scenic recommendations should retain an image",
    );
    assert(
      home.itineraries[0].imageUrl,
      "legacy routes should retain an image",
    );
    assert(home.products[0].imageUrl, "legacy products should retain an image");
  } finally {
    delete global.wx;
    delete require.cache[require.resolve("../services/api")];
    delete require.cache[require.resolve("../services/content")];
  }
}

(async () => {
  await assertLegacyFallbackKeepsImages();
  console.log("home content coverage ok");
})().catch((error) => {
  delete global.wx;
  console.error(error);
  process.exit(1);
});
