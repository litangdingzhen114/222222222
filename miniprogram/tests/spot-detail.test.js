const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const spots = require("../data/spots");
const mapPoints = require("../data/mapPoints");
const foods = require("../data/foods");
const { featuredPlaceIds, hasFeaturedPlaceDetail } = require("../utils/placeDetails");

const detailJs = fs.readFileSync(
  path.join(root, "miniprogram/pages/spot-detail/spot-detail.js"),
  "utf8",
);
const detailWxml = fs.readFileSync(
  path.join(root, "miniprogram/pages/spot-detail/spot-detail.wxml"),
  "utf8",
);
const detailWxss = fs.readFileSync(
  path.join(root, "miniprogram/pages/spot-detail/spot-detail.wxss"),
  "utf8",
);
const mapJs = fs.readFileSync(
  path.join(root, "miniprogram/pages/map/map.js"),
  "utf8",
);
const foodJs = fs.readFileSync(
  path.join(root, "miniprogram/pages/food/food.js"),
  "utf8",
);
const spotListJs = fs.readFileSync(
  path.join(root, "miniprogram/pages/spot-list/spot-list.js"),
  "utf8",
);

const priorityIds = ["xunye-cafe", "ancient-tree", "tianpu-station", "creek-trail"];
assert.deepStrictEqual(featuredPlaceIds, priorityIds, "only priority places should open polished details");

priorityIds.forEach((id) => {
  const spot = spots.find((item) => item.id === id);
  assert(spot, `${id} should exist in fallback spot data`);
  assert(hasFeaturedPlaceDetail(id), `${id} should be allowed to open detail`);
  assert(Array.isArray(spot.story) && spot.story.length >= 2, `${id} should expose editorial story copy`);
  assert(Array.isArray(spot.experience) && spot.experience.length >= 3, `${id} should expose experience cards`);
  assert(Array.isArray(spot.itinerary) && spot.itinerary.length >= 3, `${id} should expose route rhythm`);
  assert(
    Array.isArray(spot.imageUrls) &&
      spot.imageUrls.every((url) => url.startsWith("https://www.hailin.store/assets/photos/")),
    `${id} should use deployed photo URLs instead of package-heavy local images`,
  );
});

assert(
  spots.some((item) => item.id === "creek-trail" && item.name === "海林·溪谷"),
  "creek detail should use the user-facing Hailin valley name",
);
assert(
  foods.some((item) => item.id === "xunye-cafe"),
  "food page should still list Xunye cafe",
);
assert(
  mapPoints.some((point) => point.title === "田铺驿站" && point.refId === "tianpu-station"),
  "Tianpu station map point should open its polished detail",
);
assert(
  mapPoints.some((point) => point.title === "寻野村咖" && point.refId === "xunye-cafe"),
  "Xunye cafe map point should open its polished detail",
);

assert(detailJs.includes("hasFeaturedPlaceDetail"), "detail page should gate unfinished point details");
assert(detailJs.includes("更多介绍即将更新"), "unfinished detail pages should use production-friendly update copy");
assert(detailJs.includes("mergeSpot"), "detail page should preserve local rich copy when backend data is sparse");
assert(detailWxml.includes("place-hero"), "detail page should use an image-led hero");
assert(detailWxml.includes("这里值得停下"), "detail page should render editorial story section");
assert(detailWxml.includes("亮点玩法"), "detail page should render play highlights");
assert(detailWxml.includes("detail-itinerary"), "detail page should render route rhythm instead of a table");
assert(detailWxml.includes("服务衔接"), "detail page should keep follow-up service links");
assert(!detailWxml.includes("info-row"), "detail page should not render the old table-like info rows");
assert(!detailWxml.includes(">穗<"), "detail page should not use the old grain glyph section marker");
assert(detailWxss.includes("width: 8rpx") && detailWxss.includes("height: 34rpx"), "detail section markers should use a clean accent bar");
assert(detailWxss.includes("height: 520rpx"), "detail hero should have a mature scenic-photo scale");
assert(detailWxss.includes("grid-template-columns: repeat(3, 1fr)"), "detail cards should keep stable three-column sizing");
assert(mapJs.includes("hasFeaturedPlaceDetail(point.refId)"), "map detail button should gate non-priority details");
assert(foodJs.includes("detailUrl(food.id)"), "Xunye cafe card should open its detail page");
assert(spotListJs.includes("hasFeaturedPlaceDetail(id)"), "spot list should not open unfinished details");

console.log("spot detail priority coverage ok");
