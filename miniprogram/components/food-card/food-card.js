Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },

  methods: {
    handleTap() {
      this.triggerEvent('cardtap', { id: this.data.item.id });
    }
  }
});
