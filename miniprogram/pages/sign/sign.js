const api = require('../../utils/api');

Page({
  data: {
    signStatus: null,
    tasks: []
  },

  onShow() {
    this.init();
  },

  async init() {
    try { await getApp().ensureLogin(); } catch (e) { return; }
    const userId = getApp().globalData.userId;
    const [signRes, taskRes] = await Promise.all([
      api.getSignStatus(userId), api.getTasks(userId)
    ]);
    if (signRes.code === 0) this.setData({ signStatus: signRes.data });
    if (taskRes.code === 0) this.setData({ tasks: taskRes.data.tasks || [] });
  },

  async handleSign() {
    const res = await api.doSign(getApp().globalData.userId);
    wx.showToast({ title: res.message || '签到完成', icon: res.code === 0 ? 'success' : 'none' });
    this.init();
  },

  async handleTask(e) {
    const taskId = e.currentTarget.dataset.id;
    const res = await api.completeTask(getApp().globalData.userId, taskId, {});
    wx.showToast({ title: res.message || '操作完成', icon: res.code === 0 ? 'success' : 'none' });
    this.init();
  }
});
