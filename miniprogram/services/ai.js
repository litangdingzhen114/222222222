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

const BETA_LIMIT_REPLY =
  "小林目前还是测试版，只能回答下方快捷问题和已配置的路线、美食、停车、慢直播、研学、民宿、古树等内容。这个问题暂时不能可靠回答，可以点快捷问题试试。";

function isSupportedGuideQuestion(question) {
  const text = String(question || "").trim().toLowerCase();
  if (!text) return false;
  return [
    "路线",
    "怎么玩",
    "半日",
    "一日",
    "雨",
    "美食",
    "吃",
    "田鱼",
    "家宴",
    "咖啡",
    "cafe",
    "直播",
    "摄像头",
    "监控",
    "停车",
    "导航",
    "厕所",
    "服务",
    "住宿",
    "民宿",
    "研学",
    "亲子",
    "活动",
    "讲解",
    "古树",
    "陈嵘栲",
    "村树",
    "文化",
    "海林",
    "ai",
    "智能",
    "助手",
    "你是谁",
    "能问",
    "可以问",
    "帮助",
  ].some((keyword) => text.includes(keyword));
}

function buildLocalReply(question) {
  if (question.includes("雨") || question.includes("下雨")) {
    return "雨天建议走轻量慢游：先到村口会客点确认开放信息，再去寻野村咖或田鱼家宴室内休息；溪谷步道雨后湿滑，只适合短距离观景。";
  }
  if (
    question.includes("路线") ||
    question.includes("怎么玩") ||
    question.includes("半日") ||
    question.includes("一日")
  ) {
    return "推荐“瓯江山村半日游”：游客中心集合，先看村口导览，再走溪谷步道，中午吃田鱼家宴，下午到古树年轮手作体验点。";
  }
  if (
    question.includes("美食") ||
    question.includes("吃") ||
    question.includes("田鱼") ||
    question.includes("家宴") ||
    question.includes("咖啡") ||
    question.toLowerCase().includes("cafe")
  ) {
    return "海林村地域味道可以突出田鱼、山泉豆腐、时令笋蔬和农家家宴。海林村可优先看“寻野村咖”“田鱼家宴”“溪谷民宿茶歇”这几类。";
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
  if (
    question.includes("研学") ||
    question.includes("亲子") ||
    question.includes("活动") ||
    question.includes("讲解")
  ) {
    return "亲子研学可以围绕稻鱼共生、古树年轮、村情馆讲解和溪谷自然观察安排。团队到访建议提前提交人数和时间，方便后台确认讲解资源。";
  }
  if (
    question.includes("古树") ||
    question.includes("陈嵘栲") ||
    question.includes("村树") ||
    question.includes("文化") ||
    question.includes("海林")
  ) {
    return "陈嵘栲古树是海林村很有记忆点的村树，约 350 年树龄。游览时建议只在保护范围外观看和拍照，不攀折树枝。";
  }
  return BETA_LIMIT_REPLY;
}

function askGuide(question, history) {
  if (!isSupportedGuideQuestion(question)) {
    return Promise.resolve({
      reply: BETA_LIMIT_REPLY,
      source: "beta",
    });
  }

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
  isSupportedGuideQuestion,
  BETA_LIMIT_REPLY,
  normalizedHistory,
};
