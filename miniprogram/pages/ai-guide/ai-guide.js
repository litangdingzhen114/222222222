const { askGuide } = require("../../services/ai");
const { quickToast } = require("../../utils/mock");

const TYPEWRITER_INTERVAL = 22;
const TYPEWRITER_STEP = 2;

Page({
  typewriterTimer: null,

  data: {
    inputValue: "",
    lastMessageId: "msg-0",
    isSending: false,
    quickQuestions: [
      "半日路线",
      "亲子研学",
      "田鱼家宴",
      "青田石手作",
      "停车场在哪",
      "直播点位",
      "民宿推荐",
      "雨天怎么玩",
    ],
    messages: [
      {
        id: "msg-0",
        role: "assistant",
        source: "local",
        content:
          "您好，我是海林村导览助手小林，可以帮您推荐路线、美食、公共服务点、住宿和青田地域文化。",
      },
    ],
  },

  onLoad(options) {
    if (options.question) {
      setTimeout(() => {
        this.sendQuestion(decodeURIComponent(options.question));
      }, 300);
    }
  },

  onUnload() {
    this.clearTypewriter();
  },

  onInput(event) {
    this.setData({ inputValue: event.detail.value });
  },

  onQuickTap(event) {
    this.sendQuestion(event.currentTarget.dataset.question);
  },

  onSend() {
    this.sendQuestion(this.data.inputValue);
  },

  sendQuestion(rawQuestion) {
    const question = (rawQuestion || "").trim();
    if (!question) {
      quickToast("请输入问题");
      return;
    }
    if (this.data.isSending) return;

    const nextIndex = this.data.messages.length;
    const userMessage = {
      id: `msg-${nextIndex}`,
      role: "user",
      content: question,
    };
    const loadingMessage = {
      id: `msg-${nextIndex + 1}`,
      role: "assistant",
      source: "loading",
      content: "小林正在整理青田海林村导览建议...",
    };
    const messages = this.data.messages.concat(userMessage, loadingMessage);

    this.setData({
      messages,
      inputValue: "",
      isSending: true,
      lastMessageId: loadingMessage.id,
    });

    askGuide(question, this.data.messages)
      .then((result) => {
        this.playAssistantReply(loadingMessage.id, result);
      })
      .catch(() => {
        this.playAssistantReply(loadingMessage.id, {
          source: "error",
          reply:
            "小林没有连上 AI 服务。请确认小程序 request 合法域名包含 https://www.hailin.store，并且后台 Kimi Key 已保存；修好后这里会显示“Kimi 回复”。",
        });
      });
  },

  playAssistantReply(messageId, result) {
    const reply = String(result.reply || "").trim();
    const source = result.source || "backend";
    const fullText =
      reply || "小林暂时没有整理到合适内容，可以换一个更具体的问题。";
    let cursor = 0;

    this.clearTypewriter();
    this.replaceAssistantMessage(messageId, {
      source,
      content: "",
    });
    this.setData({ isSending: true });

    const tick = () => {
      cursor = Math.min(fullText.length, cursor + TYPEWRITER_STEP);
      this.replaceAssistantMessage(messageId, {
        source,
        content: fullText.slice(0, cursor),
      });
      if (cursor >= fullText.length) {
        this.clearTypewriter();
        this.setData({ isSending: false, lastMessageId: messageId });
        return;
      }
      this.typewriterTimer = setTimeout(tick, TYPEWRITER_INTERVAL);
    };

    tick();
  },

  replaceAssistantMessage(messageId, patch) {
    const updatedMessages = this.data.messages.map((message) => {
      if (message.id !== messageId) return message;
      return {
        ...message,
        ...patch,
      };
    });
    this.setData({
      messages: updatedMessages,
      lastMessageId: messageId,
    });
  },

  clearTypewriter() {
    if (!this.typewriterTimer) return;
    clearTimeout(this.typewriterTimer);
    this.typewriterTimer = null;
  },
});
