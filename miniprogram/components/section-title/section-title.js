Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    moreText: {
      type: String,
      value: ''
    }
  },

  methods: {
    onMoreTap() {
      this.triggerEvent('moretap');
    }
  }
});
