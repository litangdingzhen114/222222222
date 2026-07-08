const { submitFeedback } = require('../../services/content');
const { quickToast } = require('../../utils/mock');

Page({
  data: {
    types: ['功能建议', '内容纠错', '服务投诉', '合作咨询'],
    activeType: '功能建议',
    promiseCards: [
      { title: '内容纠错', desc: '景点、路线、营业时间、图片不准确可以直接提交。' },
      { title: '服务处理', desc: '预约、讲解、票券、场地问题会同步到后台工单。' },
      { title: '合作线索', desc: '品牌活动、研学团、农产品采购可留下联系方式。' }
    ],
    examples: ['停车点找不到', '直播点位无法播放', '活动价格需要更新', '想预约团队研学'],
    content: '',
    contact: ''
  },

  onTypeTap(event) {
    this.setData({ activeType: event.currentTarget.dataset.type });
  },

  onContentInput(event) {
    this.setData({ content: event.detail.value });
  },

  onContactInput(event) {
    this.setData({ contact: event.detail.value });
  },

  onSubmit() {
    if (!this.data.content.trim()) {
      quickToast('请填写反馈内容');
      return;
    }
    submitFeedback({
      type: this.data.activeType,
      content: this.data.content,
      contact: this.data.contact
    })
      .then(() => {
        quickToast('反馈已提交至后台');
      })
      .catch(() => {
        quickToast('反馈已记录，后台未配置时本地兜底');
      });
  }
});
