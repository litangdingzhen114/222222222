const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const appConfig = require("../app.json");
const homeGrids = require("../data/homeGrids");
const products = require("../data/products");
const recommend = require("../data/recommend");

global.Page = (config) => {
  global.__productPage = config;
};
const productPage = require("../pages/product-list/product-list.js");
delete global.Page;

const wxml = fs.readFileSync(
  path.join(root, "miniprogram/pages/product-list/product-list.wxml"),
  "utf8",
);
const wxss = fs.readFileSync(
  path.join(root, "miniprogram/pages/product-list/product-list.wxss"),
  "utf8",
);

assert(
  appConfig.pages.includes("pages/product-list/product-list"),
  "product marketplace page should be registered",
);
assert(
  homeGrids[0].items.find((item) => item.id === "farm-order").url ===
    "/pages/product-list/product-list",
  "farm preorder entry should open the product marketplace",
);
assert(
  recommend.hotRecommends.find((item) => item.id === "farm-order").url ===
    "/pages/product-list/product-list",
  "home recommendation should open the product marketplace",
);
assert(
  wxml.includes("农产品预订购买") &&
    wxml.includes("product-grid") &&
    wxml.includes("cart-sheet") &&
    wxml.includes("联系人姓名") &&
    wxml.includes("联系电话") &&
    wxml.includes("date-picker"),
  "product page should render marketplace, grid, checkout sheet and buyer fields",
);
assert(
  !wxml.toLowerCase().includes("<table"),
  "product page should not fall back to a table-like layout",
);
assert(
  !wxss.includes("linear-gradient"),
  "product page should avoid obvious placeholder gradient panels",
);
assert(
  wxss.includes("detail-button-row") && wxss.includes("box-sizing: border-box"),
  "product action and form controls should be stable on narrow screens",
);

const decorated = products.map(productPage.decorateProduct);
assert(
  decorated.every((item) => item.imageUrl && item.priceText && item.stockText),
  "products should have images, price text and stock text",
);
assert(
  productPage.filterProducts(decorated, "土鸡", "all").length >= 2,
  "keyword search should match local farm products",
);
assert(
  productPage
    .filterProducts(decorated, "", "eggs")
    .some((item) => item.id === "native-eggs"),
  "category filter should expose egg products",
);

const cart = [
  productPage.normalizeCartLine(
    { ...decorated[0], productId: decorated[0].id, quantity: 2 },
    decorated,
  ),
  productPage.normalizeCartLine(
    { ...decorated[1], productId: decorated[1].id, quantity: 1 },
    decorated,
  ),
];
const summary = productPage.cartSummary(cart);
assert.strictEqual(summary.count, 3, "cart summary should count quantities");
assert(Number(summary.totalText) > 0, "cart summary should calculate amount");

const payload = productPage.buildOrderPayload(cart, {
  deliveryType: "pickup",
  contactName: "海林游客",
  contactPhone: "13800000000",
  deliveryDate: "2026-08-02",
  remark: "测试提交",
});
assert.strictEqual(payload.type, "product");
assert.strictEqual(payload.featureId, "mall");
assert.strictEqual(payload.contactName, "海林游客");
assert.strictEqual(payload.contactPhone, "13800000000");
assert.strictEqual(payload.deliveryDate, "2026-08-02");
assert(payload.pickupSite.includes("海林村"), "pickup order should keep pickup site");
assert.strictEqual(payload.products.length, 2);
assert.strictEqual(payload.products[0].productName, decorated[0].title);
assert.strictEqual(payload.products[0].quantity, 2);
assert(payload.price.startsWith("¥"), "order payload should include display price");

const contentServiceSource = fs.readFileSync(
  path.join(root, "miniprogram/services/content.js"),
  "utf8",
);
assert(
  contentServiceSource.includes('"/assets/seed/product-postcard.jpg"') &&
    contentServiceSource.includes('"/assets/photos/ai-oujiang-postcards.jpg"'),
  "legacy seed product photos should map to bundled assets",
);

console.log("product marketplace page ok");
