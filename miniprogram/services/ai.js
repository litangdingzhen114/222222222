const { request, serviceConfig, hasBackend } = require("./api");

function normalizedHistory(history) {
  return (Array.isArray(history) ? history : [])
    .filter((item) => item && item.role && item.content)
    .slice(-8)
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content || "").slice(0, 600),
    }));
}

function normalizeRemoteReply(result, question) {
  const reply = result && (result.answer || result.reply || result.content);
  const mode = result && result.mode;
  const source =
    mode === "official"
      ? "kimi"
      : mode === "fallback"
        ? "backend-fallback"
        : result && result.source
          ? result.source
          : "backend";
  return {
    reply: reply || buildLocalReply(question),
    source,
  };
}

function buildLocalReply(question) {
  if (question.includes("路线") || question.includes("怎么玩")) {
    return "推荐“瓯江山村半日游”：游客中心集合，先看村口导览，再走溪谷步道，中午吃田鱼家宴，下午到青田石手作体验点。";
  }
  if (
    question.includes("美食") ||
    question.includes("吃") ||
    question.includes("田鱼")
  ) {
    return "青田地域味道可以突出田鱼、山泉豆腐、时令笋蔬和农家家宴。海林村可优先看“田鱼家宴”“溪畔茶点”“侨乡小食”这几类。";
  }
  if (question.includes("直播") || question.includes("摄像头")) {
    return "慢直播建议接入村口广场、溪谷步道、稻鱼田和侨乡会客厅四类点位。当前页面支持后端返回 liveUrl 或 hlsUrl 后直接播放。";
  }
  if (question.includes("AI") || question.includes("智能")) {
    return "我会优先根据海林村现有景点、路线、餐饮和服务点信息回答，避免给出没有来源的价格和开放时间。";
  }
  if (question.includes("停车") || question.includes("导航")) {
    return "建议从“全域旅游地图”查看游客中心、停车场和公共服务点。真实上线后可由后端返回腾讯地图导航参数。";
  }
  if (question.includes("住宿") || question.includes("民宿")) {
    return "可以围绕溪谷慢住、侨乡会客和山村夜游包装民宿内容。真实预订建议接后台房态和订单系统。";
  }
  return "我是海林村导览助手小林。可以问我路线、美食、慢直播、停车、民宿和青田地域文化。";
}

function askGuide(question, history) {
  if (!hasBackend()) {
    return Promise.resolve({
      reply: buildLocalReply(question),
      source: "local",
    });
  }

  const v1Endpoint =
    serviceConfig.v1Endpoints.aiGuide || "/api/v1/ai-guide/chat";
  const legacyEndpoint =
    serviceConfig.ai.legacyFallbackEnabled !== false
      ? serviceConfig.endpoints.aiGuide
      : "";
  const payload = {
    question,
    history: normalizedHistory(history),
  };

  return request(v1Endpoint, {
    method: "POST",
    timeout: serviceConfig.ai.requestTimeout,
    data: payload,
  })
    .then((result) => normalizeRemoteReply(result, question))
    .catch((v1Error) => {
      if (!legacyEndpoint) {
        return Promise.reject(v1Error);
      }
      return request(legacyEndpoint, {
        method: "POST",
        timeout: serviceConfig.ai.requestTimeout,
        data: {
          ...payload,
          location: serviceConfig.locationText,
          context: serviceConfig.regionKeywords,
        },
      })
        .then((result) => normalizeRemoteReply(result, question))
        .catch(() => Promise.reject(v1Error));
    });
}

module.exports = {
  askGuide,
  buildLocalReply,
  normalizedHistory,
};
