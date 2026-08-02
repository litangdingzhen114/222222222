Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    iconPath: {
      type: String,
      value: ''
    },
    moreText: {
      type: String,
      value: ''
    },
    subtitle: {
      type: String,
      value: ''
    }
  },

  data: {
    resolvedIcon: '/assets/section/default.png'
  },

  observers: {
    'title, iconPath': function(title, iconPath) {
      this.setData({
        resolvedIcon: iconPath || resolveSectionIcon(title)
      });
    }
  },

  methods: {
    onMoreTap() {
      this.triggerEvent('moretap');
    }
  }
});

function resolveSectionIcon(title = '') {
  const text = String(title || '');
  if (/路线|这样游|行程/.test(text)) return '/assets/section/route.png';
  if (/服务|预约|到村/.test(text)) return '/assets/section/service.png';
  if (/农|产品|预购|好物/.test(text)) return '/assets/section/farm.png';
  if (/热门|推荐|榜/.test(text)) return '/assets/section/hot.png';
  if (/长廊|村咖|溪谷|村树|故事/.test(text)) return '/assets/section/corridor.png';
  if (/精彩|文创|须知/.test(text)) return '/assets/section/story.png';
  return '/assets/section/default.png';
}
