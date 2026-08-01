const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const photoBase = "https://www.hailin.store/assets/photos";
const appConfig = require("../app.json");
const mapPoints = require("../data/mapPoints");
const spots = require("../data/spots");
const routes = require("../data/routes");
const mapFeatures = require("../data/mapFeatures");

const pageBase = path.join(root, "miniprogram/pages/map/map");
["js", "wxml", "wxss", "json"].forEach((ext) => {
  assert(fs.existsSync(`${pageBase}.${ext}`), `map.${ext} should exist`);
});

const mapJs = fs.readFileSync(`${pageBase}.js`, "utf8");
const mapWxml = fs.readFileSync(`${pageBase}.wxml`, "utf8");
const mapWxss = fs.readFileSync(`${pageBase}.wxss`, "utf8");

assert(
  !mapJs.includes("建设中"),
  "map page should not use construction placeholder toasts",
);
assert(
  !mapJs.includes("可接真实地图服务"),
  "map tools should perform real local actions",
);
assert(
  mapJs.includes("wx.openLocation"),
  "map page should open native location navigation",
);
assert(
  mapJs.includes("loadMapDirections"),
  "map page should request backend map directions",
);
assert(
  mapJs.includes("buildDirectionsPolyline"),
  "map page should render backend direction polyline",
);
assert(
  mapWxml.includes("activePoint.directionText"),
  "map sheet should show route distance and duration",
);
assert(
  mapJs.includes("wx.getLocation"),
  "map page should support user positioning",
);
assert(
  mapJs.includes("wx.createMapContext"),
  "map page should control map viewport",
);
assert(
  mapJs.includes("detailUrl(point.refId)"),
  "spot points should navigate to spot detail through the shared detail URL helper",
);
assert(
  mapJs.includes("/pages/route-detail/route-detail"),
  "route suggestions should navigate to route detail",
);
assert(
  mapPoints.some((point) =>
    String(point.targetUrl || "").startsWith(
      "/pages/mine-feature/mine-feature",
    ),
  ),
  "service points should navigate to service workflows",
);
assert(
  mapPoints.some(
    (point) =>
      point.title === "田铺驿站" &&
      point.imageUrl === `${photoBase}/ai-map-tianpu-station.jpg`,
  ),
  "map should include Tianpu station with a generated display image",
);
assert(
  mapPoints.some(
    (point) =>
      point.title === "黄湖溪谷" &&
      point.imageUrl === `${photoBase}/ai-map-hailin-creek.jpg`,
  ),
  "map should include Hailin creek valley with a generated display image",
);
assert(
  mapPoints.some(
    (point) =>
      point.id === "chenrongkao-tree" &&
      point.title === "陈嵘栲古树" &&
      point.imageUrl === `${photoBase}/ai-chenrongkao-tree.jpg` &&
      point.refId === "ancient-tree",
  ),
  "map should include the Chenrongkao village tree as a focusable scenic point",
);
assert(mapWxml.includes("search-input"), "map page should expose search input");
assert(
  mapWxml.includes("route-panel"),
  "map page should expose route recommendation panel",
);
assert(
  mapWxml.includes("quick-point-scroll"),
  "map page should expose filtered point quick list",
);
assert(
  mapWxml.includes("黄湖林场导览") && !mapWxml.includes("黄湖林场 · 黄湖林场"),
  "map overlay location label should not repeat or clip the active naming profile",
);
assert(
  mapWxml.includes("poi-image"),
  "map point sheet should show a location image",
);
assert(
  mapWxss.includes("height: 330rpx") && mapWxss.includes("height: 100%"),
  "map point sheet image should use a less compressed photo ratio",
);
assert(
  mapWxml.includes("activeSubTag === item.value") &&
    mapWxml.includes("data-tag=\"{{item.value}}\""),
  "map subtag overlay should keep compact labels mapped to full filter values",
);
assert(
  mapWxss.includes("overflow: visible") &&
    mapWxss.includes("font-size: 20rpx") &&
    mapWxss.includes("white-space: nowrap"),
  "map subtag overlay should fit all filter chips without clipping text",
);
assert(
  mapJs.includes("normalizeMapPoints"),
  "map page should normalize backend map point payloads",
);
assert(
  mapJs.includes("consumePendingFocusPoint") &&
    mapJs.includes("hailin_pending_map_point"),
  "map page should consume home shortcut requests and focus a selected point",
);
assert(
  mapJs.includes("markerIconPath") &&
    mapJs.includes("markerIcons") &&
    !mapJs.includes('iconPath: "/assets/map/poi.png"'),
  "map page should render category-specific sticker marker icons",
);
assert(
  mapJs.includes("width: isActive ? 68 : 54") &&
    mapJs.includes("height: isActive ? 80 : 64"),
  "map marker sticker icons should render large enough to show illustrated landmarks",
);

function pngSize(fileName) {
  const buffer = fs.readFileSync(path.join(root, "miniprogram/assets/map", fileName));
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

[
  "marker-scenic.png",
  "marker-station.png",
  "marker-food.png",
  "marker-stay.png",
  "marker-parking.png",
  "marker-toilet.png",
  "marker-farm.png",
  "marker-live.png",
  "marker-market.png",
  "marker-service.png",
  "marker-default.png",
].forEach((filename) => {
  assert(
    fs.existsSync(path.join(root, "miniprogram/assets/map", filename)),
    `${filename} should exist for map markers`,
  );
  assert.deepStrictEqual(
    pngSize(filename),
    { width: 112, height: 132 },
    `${filename} should use the illustrated tour-map marker canvas`,
  );
});

const categoryIds = new Set(mapFeatures.categories.map((item) => item.id));
assert(categoryIds.has("全部"), "categories should include all");
assert(
  categoryIds.has("公共服务"),
  "categories should include public services",
);
assert(
  mapFeatures.mapTools.some((item) => item.id === "route"),
  "map tools should include route planning",
);
assert(
  mapFeatures.mapTools.some((item) => item.id === "location"),
  "map tools should include location",
);
assert(
  mapFeatures.routeSuggestions.length >= 3,
  "map should provide multiple route suggestions",
);
assert(
  mapFeatures.subTags.every((tag) => tag.label && tag.value),
  "sub tag filters should expose compact labels and stable values",
);
assert(
  mapFeatures.subTags.some(
    (tag) => tag.label === "打卡点" && tag.value === "网红打卡点",
  ),
  "long map tag labels should be shortened for the native map overlay",
);

const spotIds = new Set(spots.map((item) => item.id));
const routeIds = new Set(routes.map((item) => item.id));
const appPages = new Set(appConfig.pages.map((page) => `/${page}`));

mapPoints.forEach((point) => {
  assert.strictEqual(
    typeof point.latitude,
    "number",
    `${point.title} latitude should be numeric`,
  );
  assert.strictEqual(
    typeof point.longitude,
    "number",
    `${point.title} longitude should be numeric`,
  );
  assert(
    categoryIds.has(point.type),
    `${point.title} type should be configured category`,
  );
  assert(point.openTime, `${point.title} should expose open time`);
  assert(point.tips, `${point.title} should expose travel tips`);
  assert(point.actionText, `${point.title} should expose primary action text`);
  assert(point.imageUrl, `${point.title} should expose display image`);
  assert(
    !point.imageUrl.includes("/assets/scenes/"),
    `${point.title} should use a photo asset instead of an old scene placeholder`,
  );

  if (point.refType === "spot") {
    assert(
      spotIds.has(point.refId),
      `${point.title} referenced spot should exist`,
    );
  }
  if (point.targetUrl) {
    const pagePath = point.targetUrl.split("?")[0];
    assert(
      appPages.has(pagePath),
      `${point.title} target page should be registered`,
    );
  }
});

mapFeatures.routeSuggestions.forEach((route) => {
  assert(
    routeIds.has(route.routeId),
    `${route.title} should reference a route detail`,
  );
  route.pointIds.forEach((pointId) => {
    assert(
      mapPoints.some((point) => point.id === pointId),
      `${route.title} point ${pointId} should exist`,
    );
  });
});

console.log("map page feature coverage ok");
