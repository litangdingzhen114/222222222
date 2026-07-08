const { askGuide } = require('../../services/ai');
const { quickToast } = require('../../utils/mock');

Page({
  data: {
    inputValue: '',
    lastMessageId: 'msg-0',
    isSending: false,
    quickQuestions: ['路线推荐', '田鱼美食', '慢直播怎么接', '停车场在哪'],
    messages: [
      {
        id: 'msg-0',
        role: 'assistant',
        source: 'local',
        content: '您好，我是海林村 AI 导游小林，可以帮您推荐路线、美食、直播点位、住宿和青田地域文化。配置后端后，我会切换为真实 AI 回复。'
      }
    ]
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
    const question = (rawQuestion || '').trim();
    if (!question) {
      quickToast('请输入问题');
      return;
    }
    if (this.data.isSending) return;

    const nextIndex = this.data.messages.length;
    const userMessage = {
      id: `msg-${nextIndex}`,
      role: 'user',
      content: question
    };
    const loadingMessage = {
      id: `msg-${nextIndex + 1}`,
      role: 'assistant',
      source: 'loading',
      content: '小林正在整理青田海林村导览建议...'
    };
    const messages = this.data.messages.concat(userMessage, loadingMessage);

    this.setData({
      messages,
      inputValue: '',
      isSending: true,
      lastMessageId: loadingMessage.id
    });

    askGuide(question, this.data.messages).then((result) => {
      const updatedMessages = this.data.messages.map((message) => {
        if (message.id !== loadingMessage.id) return message;
        return {
          id: loadingMessage.id,
          role: 'assistant',
          source: result.source,
          content: result.reply
        };
      });
      this.setData({
        messages: updatedMessages,
        isSending: false,
        lastMessageId: loadingMessage.id
      });
    });
  }
});
