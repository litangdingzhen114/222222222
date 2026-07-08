const { publishNote } = require('../../utils/userCenter');
const { quickToast } = require('../../utils/mock');

Page({
  data: {
    title: '',
    content: '',
    imagePath: '',
    topics: ['稻鱼体验', '青田石韵', '溪谷漫步', '侨乡故事', '共富集市'],
    topicIndex: 0
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [field]: event.detail.value });
  },

  onTopicChange(event) {
    this.setData({ topicIndex: Number(event.detail.value) });
  },

  onChooseImage() {
    const done = (path) => {
      if (path) this.setData({ imagePath: path });
    };

    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success(result) {
          const file = result.tempFiles && result.tempFiles[0];
          done(file && file.tempFilePath);
        }
      });
      return;
    }

    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success(result) {
        done(result.tempFilePaths && result.tempFilePaths[0]);
      }
    });
  },

  onSubmit() {
    const title = this.data.title.trim();
    const content = this.data.content.trim();

    if (!title) {
      quickToast('请填写游记标题');
      return;
    }
    if (content.length < 10) {
      quickToast('正文至少写10个字');
      return;
    }

    publishNote({
      title,
      content,
      imagePath: this.data.imagePath,
      topic: this.data.topics[this.data.topicIndex]
    });
    quickToast('游记已发布，积分+8');
    setTimeout(() => wx.navigateBack({ delta: 1 }), 500);
  }
});
