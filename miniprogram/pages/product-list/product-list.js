const fallbackProducts = require("../../data/products");
const { loadProducts, submitOrder } = require("../../services/content");
const { todayText } = require("../../utils/format");
const { quickToast } = require("../../utils/mock");
const {
  addOrder,
  getClientId,
  loadUserCenter,
  updateOrder,
} = require("../../utils/userCenter");

const CART_STORAGE_KEY = "hailin-product-cart-v1";
const DEFAULT_PRODUCT_IMAGE = "/assets/photos/ai-product-honey.jpg";
const PICKUP_SITE = "海林村游客中心 / 共富集市";
let memoryCart = [];

const PRODUCT_CATEGORIES = [
  { id: "all", name: "全部" },
  { id: "fresh", name: "土鸡黑猪" },
  { id: "eggs", name: "土鸡蛋" },
  { id: "honey", name: "土蜂蜜" },
];

const DELIVERY_OPTIONS = [
  {
    id: "pickup",
    name: "到村自提",
    desc: "游客中心或共富集市取货",
  },
  {
    id: "express",
    name: "同城配送",
    desc: "后台确认库存与运费",
  },
];

function numberValue(value, fallback = 0) {
  const number = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(number) ? number : fallback;
}

function priceText(value) {
  return numberValue(value).toFixed(2);
}

function dateTextAfter(days = 1) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function inferCategory(product) {
  const text = `${product.title || product.name || ""} ${product.subtitle || ""}`;
  if (text.includes("蛋")) return "eggs";
  if (text.includes("蜂") || text.includes("蜜")) return "honey";
  if (
    text.includes("鸡") ||
    text.includes("猪") ||
    text.includes("肉")
  ) {
    return "fresh";
  }
  return "other";
}

function decorateProduct(product, index = 0) {
  const stock = Math.max(0, Math.floor(numberValue(product.stock, 0)));
  const price = numberValue(product.price, 0);
  const categoryKey = inferCategory(product);
  const title = product.title || product.name || "海林村农品";
  const tags = [
    product.specification || "农户直供",
    product.unit ? `按${product.unit}预订` : "到村可取",
  ].filter(Boolean);

  return {
    ...product,
    id: product.id || product.productId || `product-${index}`,
    title,
    subtitle: product.subtitle || "海林村农户当季供应",
    imageUrl: product.imageUrl || product.coverImage || DEFAULT_PRODUCT_IMAGE,
    priceNumber: price,
    priceText: price.toFixed(2),
    categoryKey,
    categoryName:
      PRODUCT_CATEGORIES.find((item) => item.id === categoryKey)?.name ||
      "村里好物",
    stock,
    stockText: stock > 10 ? "库存充足" : stock > 0 ? `仅余 ${stock}` : "暂时售罄",
    soldOut: stock <= 0,
    unit: product.unit || "件",
    specification: product.specification || "规格以后台确认为准",
    tags,
  };
}

function filterProducts(products, keyword = "", category = "all") {
  const cleanKeyword = String(keyword || "").trim().toLowerCase();
  return products.filter((product) => {
    const categoryMatched =
      category === "all" || product.categoryKey === category;
    if (!categoryMatched) return false;
    if (!cleanKeyword) return true;
    return [
      product.title,
      product.subtitle,
      product.specification,
      product.categoryName,
    ]
      .join(" ")
      .toLowerCase()
      .includes(cleanKeyword);
  });
}

function normalizeCartLine(line, products = []) {
  const product =
    products.find((item) => item.id === line.productId || item.id === line.id) ||
    line;
  const decorated = decorateProduct(product);
  const quantity = Math.max(
    1,
    Math.min(
      Math.floor(numberValue(line.quantity, 1)),
      decorated.stock || 1,
    ),
  );
  return {
    productId: decorated.id,
    title: decorated.title,
    imageUrl: decorated.imageUrl,
    specification: decorated.specification,
    unit: decorated.unit,
    stock: decorated.stock,
    priceNumber: decorated.priceNumber,
    priceText: decorated.priceText,
    quantity,
    lineTotalText: (decorated.priceNumber * quantity).toFixed(2),
  };
}

function cartSummary(cart) {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce(
    (sum, item) => sum + item.priceNumber * item.quantity,
    0,
  );
  return {
    count,
    total,
    totalText: total.toFixed(2),
  };
}

function readCart(products = []) {
  let stored = memoryCart;
  try {
    if (typeof wx !== "undefined" && wx.getStorageSync) {
      stored = wx.getStorageSync(CART_STORAGE_KEY) || [];
    }
  } catch (error) {
    stored = memoryCart;
  }
  return (Array.isArray(stored) ? stored : [])
    .map((line) => normalizeCartLine(line, products))
    .filter((line) => line.stock > 0);
}

function writeCart(cart) {
  memoryCart = cart.map((item) => ({ ...item }));
  try {
    if (typeof wx !== "undefined" && wx.setStorageSync) {
      wx.setStorageSync(CART_STORAGE_KEY, memoryCart);
    }
  } catch (error) {
    // The current page state remains usable if device storage is unavailable.
  }
  return memoryCart;
}

function buildOrderPayload(cart, form) {
  const summary = cartSummary(cart);
  const first = cart[0] || {};
  const item =
    cart.length === 1
      ? first.title
      : `${first.title || "海林村农品"}等 ${cart.length} 款农品`;
  const delivery =
    DELIVERY_OPTIONS.find((option) => option.id === form.deliveryType) ||
    DELIVERY_OPTIONS[0];

  return {
    featureId: "mall",
    type: "product",
    orderType: "product",
    service: "海林村农产品预订",
    item,
    date: form.deliveryDate || todayText(),
    people: summary.count,
    quantity: summary.count,
    contactName: String(form.contactName || "").trim(),
    contactPhone: String(form.contactPhone || "").trim(),
    contact: [form.contactName, form.contactPhone]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" "),
    remark: String(form.remark || "").trim(),
    price: `¥${summary.totalText}`,
    deliveryType: delivery.id,
    deliveryText: delivery.name,
    deliveryDate: form.deliveryDate || todayText(),
    pickupSite: delivery.id === "pickup" ? PICKUP_SITE : "",
    address:
      delivery.id === "express" ? String(form.address || "").trim() : "",
    productId: cart.length === 1 ? first.productId : "",
    productImage: first.imageUrl || DEFAULT_PRODUCT_IMAGE,
    specification:
      cart.length === 1 ? first.specification || "" : `${cart.length} 款组合`,
    products: cart.map((line) => ({
      productId: line.productId,
      productName: line.title,
      productImage: line.imageUrl,
      specification: line.specification,
      unitPrice: Math.round(line.priceNumber * 100),
      quantity: line.quantity,
      totalAmount: Math.round(line.priceNumber * line.quantity * 100),
    })),
  };
}

const pageConfig = {
  data: {
    categories: PRODUCT_CATEGORIES,
    deliveryOptions: DELIVERY_OPTIONS,
    activeCategory: "all",
    activeCategoryName: "全部",
    keyword: "",
    products: [],
    filteredProducts: [],
    featuredProduct: null,
    loading: true,
    loadError: false,
    detailVisible: false,
    selectedProduct: null,
    selectedQuantity: 1,
    selectedTotalText: "0.00",
    cart: [],
    cartVisible: false,
    cartCount: 0,
    cartTotalText: "0.00",
    deliveryType: "pickup",
    pickupSite: PICKUP_SITE,
    minDeliveryDate: dateTextAfter(1),
    deliveryDate: dateTextAfter(1),
    contactName: "",
    contactPhone: "",
    address: "",
    remark: "",
    submitting: false,
  },

  onLoad(options = {}) {
    const profile = loadUserCenter().profile || {};
    const cart = readCart();
    this.setData({
      contactName: profile.nickname && profile.nickname !== "微信游客" ? profile.nickname : "",
      contactPhone: profile.contact || "",
    });
    this.applyCart(cart);
    this.loadPage(options);
  },

  onPullDownRefresh() {
    this.loadPage().then(() => {
      if (typeof wx !== "undefined" && wx.stopPullDownRefresh) {
        wx.stopPullDownRefresh();
      }
    });
  },

  loadPage(options = {}) {
    this.setData({ loading: true, loadError: false });
    return loadProducts()
      .catch(() => {
        this.setData({ loadError: true });
        return fallbackProducts;
      })
      .then((items) => {
        const source = Array.isArray(items) && items.length ? items : fallbackProducts;
        const products = source.map(decorateProduct);
        const cart = readCart(products);
        const keyword = options.keyword
          ? decodeURIComponent(options.keyword)
          : this.data.keyword;
        this.setData({
          products,
          featuredProduct: products.find((item) => !item.soldOut) || products[0],
          keyword,
          loading: false,
        });
        this.applyCart(cart);
        this.applyFilter(products, keyword, this.data.activeCategory);
        if (options.id) this.openProductById(decodeURIComponent(options.id));
      });
  },

  applyFilter(
    source = this.data.products,
    keyword = this.data.keyword,
    category = this.data.activeCategory,
  ) {
    this.setData({
      keyword,
      activeCategory: category,
      activeCategoryName:
        PRODUCT_CATEGORIES.find((item) => item.id === category)?.name || "全部",
      filteredProducts: filterProducts(source, keyword, category),
    });
  },

  onSearchInput(event) {
    this.applyFilter(
      this.data.products,
      event.detail.value || "",
      this.data.activeCategory,
    );
  },

  onClearSearch() {
    this.applyFilter(this.data.products, "", this.data.activeCategory);
  },

  onCategoryTap(event) {
    this.applyFilter(
      this.data.products,
      this.data.keyword,
      event.currentTarget.dataset.id || "all",
    );
  },

  onProductTap(event) {
    this.openProductById(event.currentTarget.dataset.id);
  },

  openProductById(id) {
    const product = this.data.products.find((item) => item.id === id);
    if (!product) return;
    this.setData({
      selectedProduct: product,
      selectedQuantity: 1,
      selectedTotalText: product.priceText,
      detailVisible: true,
      cartVisible: false,
    });
  },

  onCloseDetail() {
    this.setData({ detailVisible: false });
  },

  noop() {},

  onSelectedMinus() {
    this.setSelectedQuantity(this.data.selectedQuantity - 1);
  },

  onSelectedPlus() {
    this.setSelectedQuantity(this.data.selectedQuantity + 1);
  },

  setSelectedQuantity(value) {
    const product = this.data.selectedProduct;
    if (!product) return;
    const quantity = Math.max(
      1,
      Math.min(Math.floor(numberValue(value, 1)), product.stock || 1),
    );
    this.setData({
      selectedQuantity: quantity,
      selectedTotalText: (product.priceNumber * quantity).toFixed(2),
    });
  },

  onCardAdd(event) {
    const product = this.data.products.find(
      (item) => item.id === event.currentTarget.dataset.id,
    );
    if (!product) return;
    this.addProductToCart(product, 1);
  },

  onDetailAdd() {
    if (!this.data.selectedProduct) return;
    this.addProductToCart(
      this.data.selectedProduct,
      this.data.selectedQuantity,
    );
    this.setData({ detailVisible: false });
  },

  onBuyNow() {
    if (!this.data.selectedProduct) return;
    this.addProductToCart(
      this.data.selectedProduct,
      this.data.selectedQuantity,
      false,
    );
    this.setData({ detailVisible: false, cartVisible: true });
  },

  addProductToCart(product, quantity, showMessage = true) {
    if (product.soldOut) {
      quickToast("该商品暂时售罄");
      return;
    }
    const cart = this.data.cart.map((item) => ({ ...item }));
    const index = cart.findIndex((item) => item.productId === product.id);
    if (index >= 0) {
      cart[index].quantity = Math.min(
        cart[index].quantity + quantity,
        product.stock,
      );
      cart[index].lineTotalText = (
        cart[index].priceNumber * cart[index].quantity
      ).toFixed(2);
    } else {
      cart.push(
        normalizeCartLine(
          { ...product, productId: product.id, quantity },
          this.data.products,
        ),
      );
    }
    this.applyCart(writeCart(cart));
    if (showMessage) quickToast("已加入购物车");
  },

  applyCart(cart) {
    const normalized = cart.map((item) =>
      normalizeCartLine(item, this.data.products),
    );
    const summary = cartSummary(normalized);
    this.setData({
      cart: normalized,
      cartCount: summary.count,
      cartTotalText: summary.totalText,
    });
  },

  onOpenCart() {
    if (!this.data.cart.length) {
      quickToast("购物车还是空的");
      return;
    }
    this.setData({ cartVisible: true, detailVisible: false });
  },

  onCloseCart() {
    this.setData({ cartVisible: false });
  },

  onCartMinus(event) {
    this.changeCartQuantity(event.currentTarget.dataset.id, -1);
  },

  onCartPlus(event) {
    this.changeCartQuantity(event.currentTarget.dataset.id, 1);
  },

  changeCartQuantity(id, delta) {
    const cart = this.data.cart.map((item) => ({ ...item }));
    const line = cart.find((item) => item.productId === id);
    if (!line) return;
    line.quantity = Math.max(
      1,
      Math.min(line.quantity + delta, line.stock || 1),
    );
    line.lineTotalText = (line.priceNumber * line.quantity).toFixed(2);
    this.applyCart(writeCart(cart));
  },

  onCartRemove(event) {
    const id = event.currentTarget.dataset.id;
    const cart = this.data.cart.filter((item) => item.productId !== id);
    this.applyCart(writeCart(cart));
    if (!cart.length) this.setData({ cartVisible: false });
  },

  onDeliveryTap(event) {
    this.setData({ deliveryType: event.currentTarget.dataset.id || "pickup" });
  },

  onContactNameInput(event) {
    this.setData({ contactName: event.detail.value || "" });
  },

  onContactPhoneInput(event) {
    this.setData({ contactPhone: event.detail.value || "" });
  },

  onDeliveryDateChange(event) {
    this.setData({ deliveryDate: event.detail.value || this.data.minDeliveryDate });
  },

  onAddressInput(event) {
    this.setData({ address: event.detail.value || "" });
  },

  onRemarkInput(event) {
    this.setData({ remark: event.detail.value || "" });
  },

  onViewOrders() {
    wx.navigateTo({ url: "/pages/order-list/order-list" });
  },

  onSubmitOrder() {
    if (!this.data.cart.length || this.data.submitting) return;
    const contactName = String(this.data.contactName || "").trim();
    const contactPhone = String(this.data.contactPhone || "").trim();
    const address = String(this.data.address || "").trim();
    const deliveryDate = String(this.data.deliveryDate || "").trim();
    if (!contactName) {
      quickToast("请填写收货人姓名");
      return;
    }
    if (!contactPhone) {
      quickToast("请填写联系电话");
      return;
    }
    if (!deliveryDate) {
      quickToast("请选择取货或配送日期");
      return;
    }
    if (this.data.deliveryType === "express" && !address) {
      quickToast("请填写配送地址");
      return;
    }

    const payload = buildOrderPayload(this.data.cart, {
      deliveryType: this.data.deliveryType,
      contactName,
      contactPhone,
      deliveryDate,
      address,
      remark: this.data.remark,
    });
    const localOrder = addOrder("mall", payload);
    const clientId = getClientId();
    this.setData({ submitting: true });

    submitOrder({
      ...payload,
      clientId,
      orderId: localOrder.id,
      idempotencyKey: `${clientId}-${localOrder.id}`,
      source: "product-list",
    })
      .then((remoteOrder) => {
        updateOrder(localOrder.id, {
          remoteId: remoteOrder.id,
          orderNo: remoteOrder.orderNo,
          remoteStatus: remoteOrder.status,
          backendSynced: true,
        });
        this.finishOrder("预订已提交", "后台已收到订单，可在我的订单查看进度。");
      })
      .catch(() => {
        updateOrder(localOrder.id, { backendSynced: false });
        this.finishOrder(
          "订单已保存",
          "网络暂时不可用，订单已保存在本机，请稍后在我的订单查看。",
        );
      });
  },

  finishOrder(title, content) {
    this.applyCart(writeCart([]));
    this.setData({
      submitting: false,
      cartVisible: false,
      remark: "",
      address: this.data.deliveryType === "express" ? "" : this.data.address,
    });
    wx.showModal({
      title,
      content,
      cancelText: "继续逛",
      confirmText: "查看订单",
      confirmColor: "#0F6B67",
      success: (result) => {
        if (result.confirm) this.onViewOrders();
      },
    });
  },

  onProductImageError(event) {
    const id = event.currentTarget.dataset.id;
    const products = this.data.products.map((item) =>
      item.id === id ? { ...item, imageUrl: DEFAULT_PRODUCT_IMAGE } : item,
    );
    this.setData({
      products,
      filteredProducts: filterProducts(
        products,
        this.data.keyword,
        this.data.activeCategory,
      ),
      featuredProduct:
        this.data.featuredProduct && this.data.featuredProduct.id === id
          ? { ...this.data.featuredProduct, imageUrl: DEFAULT_PRODUCT_IMAGE }
          : this.data.featuredProduct,
      selectedProduct:
        this.data.selectedProduct && this.data.selectedProduct.id === id
          ? { ...this.data.selectedProduct, imageUrl: DEFAULT_PRODUCT_IMAGE }
          : this.data.selectedProduct,
    });
  },
};

if (typeof Page === "function") Page(pageConfig);

if (typeof module !== "undefined") {
  module.exports = {
    PRODUCT_CATEGORIES,
    DELIVERY_OPTIONS,
    buildOrderPayload,
    cartSummary,
    decorateProduct,
    filterProducts,
    normalizeCartLine,
    pageConfig,
  };
}
