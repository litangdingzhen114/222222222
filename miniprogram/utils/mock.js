function findById(list, id) {
  return list.find((item) => `${item.id}` === `${id}`) || list[0];
}

function featureComing(title) {
  wx.showToast({
    title: title ? `${title}服务接入中` : '服务接入中',
    icon: 'none'
  });
}

function quickToast(title) {
  wx.showToast({
    title,
    icon: 'none'
  });
}

module.exports = {
  findById,
  featureComing,
  quickToast
};
