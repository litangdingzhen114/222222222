const { request, serviceConfig, hasBackend } = require('./api');

function buildLocalReply(question) {
  if (question.includes('路线') || question.includes('怎么玩')) {
    return '推荐“瓯江山村半日游”：游客中心集合，先看村口导览，再走溪谷步道，中午吃田鱼家宴，下午到青田石手作体验点。';
  }
  if (question.includes('美食') || question.includes('吃') || question.includes('田鱼')) {
    return '青田地域味道可以突出田鱼、山泉豆腐、时令笋蔬和农家家宴。海林村可优先看“田鱼家宴”“溪畔茶点”“侨乡小食”这几类。';
  }
  if (question.includes('直播') || question.includes('摄像头')) {
    return '慢直播建议接入村口广场、溪谷步道、稻鱼田和侨乡会客厅四类点位。当前页面支持后端返回 liveUrl 或 hlsUrl 后直接播放。';
  }
  if (question.includes('AI') || question.includes('智能')) {
    return '真实 AI 建议放在后端代理：小程序把问题发给后端，后端再调用大模型，并返回导览建议、引用内容和风险提示。';
  }
  if (question.includes('停车') || question.includes('导航')) {
    return '建议从“全域旅游地图”查看游客中心、停车场和公共服务点。真实上线后可由后端返回腾讯地图导航参数。';
  }
  if (question.includes('住宿') || question.includes('民宿')) {
    return '可以围绕溪谷慢住、侨乡会客和山村夜游包装民宿内容。真实预订建议接后台房态和订单系统。';
  }
  return '我是海林村 AI 导游小林。可以问我路线、美食、慢直播、停车、民宿和青田地域文化。当前没有配置后端时，我会用本地知识兜底回复。';
}

function askGuide(question, history) {
  if (!hasBackend()) {
    return Promise.resolve({
      reply: buildLocalReply(question),
      source: 'local'
    });
  }

  return request(serviceConfig.endpoints.aiGuide, {
    method: 'POST',
    data: {
      message: question,
      history: history || [],
      location: serviceConfig.locationText,
      context: serviceConfig.regionKeywords
    }
  })
    .then((result) => ({
      reply: result.reply || result.content || buildLocalReply(question),
      source: 'backend'
    }))
    .catch(() => ({
      reply: buildLocalReply(question),
      source: 'local'
    }));
}

module.exports = {
  askGuide
};
