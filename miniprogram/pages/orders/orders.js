const api = require('../../utils/api');

Page({
  data: {
    orders: [],
    loading: true
  },

  onShow() {
    this.init();
  },

  async init() {
    try { await getApp().ensureLogin(); } catch (e) { return; }
    const res = await api.getOrderList(getApp().globalData.userId, 1, 30);
    if (res.code === 0) {
      this.setData({
        orders: (res.data.list || []).map(o => ({
          ...o,
          statusText: o.status === 1 ? '成功' : '待支付',
          payTypeText: { free: '免费次数', daily_free: '每日免费', balance: '余额支付', ad: '看广告解锁' }[o.payType] || '免费使用'
        }))
      });
    }
    this.setData({ loading: false });
  },

  onPullDownRefresh() {
    this.init().then(() => wx.stopPullDownRefresh());
  }
});
