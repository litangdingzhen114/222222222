const featuredPlaceIds = [
  "xunye-cafe",
  "ancient-tree",
  "tianpu-station",
  "creek-trail",
];

function hasFeaturedPlaceDetail(id) {
  return featuredPlaceIds.includes(String(id || ""));
}

function detailUrl(id) {
  return `/pages/spot-detail/spot-detail?id=${encodeURIComponent(id)}`;
}

module.exports = {
  featuredPlaceIds,
  hasFeaturedPlaceDetail,
  detailUrl,
};
