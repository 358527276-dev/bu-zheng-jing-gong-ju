const api = require('../../utils/api');

Page({
  data: {
    inviteInfo: null,
    inviteList: []
  },

  onShow() {
    this.init();
  },

  async init() {
    try { await getApp().ensureLogin(); } catch (e) { return; }
    const userId = getApp().globalData.userId;
    const [infoRes, listRes] = await Promise.all([
      api.getInviteInfo(userId), api.getInviteList(userId)
    ]);
    if (infoRes.code === 0) this.setData({ inviteInfo: infoRes.data });
    if (listRes.code === 0) this.setData({ inviteList: listRes.data.list || [] });
  },

  onCopyCode() {
    const info = this.data.inviteInfo;
    if (!info) return;
    wx.setClipboardData({ data: info.inviteCode });
  }
});
