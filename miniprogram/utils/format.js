function formatPrice(price) {
  if (price === undefined || price === null || price === '') {
    return '暂无';
  }
  return `¥${Number(price).toFixed(2)}`;
}

function padZero(value) {
  return value < 10 ? `0${value}` : `${value}`;
}

function todayText() {
  const now = new Date();
  return `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}`;
}

module.exports = {
  formatPrice,
  todayText
};
