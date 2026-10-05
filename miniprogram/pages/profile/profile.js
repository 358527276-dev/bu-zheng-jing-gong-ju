const api = require('../../utils/api');

Page({
  data: {
    user: null,
    stats: null,
    levels: [],
    signDays: 0,
    inviteCount: 0
  },

  onShow() {
    this.init();
  },

  async init() {
    try {
      await getApp().ensureLogin();
    } catch (e) { return; }
    const userId = getApp().globalData.userId;
    const [userRes, statsRes, levelsRes, signRes, inviteRes] = await Promise.all([
      api.getUserInfo(userId),
      api.getStats(userId),
      api.getLevels(),
      api.getSignStatus(userId),
      api.getInviteInfo(userId)
    ]);
    if (userRes.code === 0) {
      const d = userRes.data;
      this.setData({
        user: {
          nickname: d.nickname,
          avatar: d.avatar,
          balance: (d.balance || 0).toFixed(2),
          freeUses: d.freeUses,
          totalUses: d.totalUses,
          levelInfo: d.levelInfo || {},
          vipInfo: d.vipInfo || {},
          inviteCode: d.inviteCode,
          growthPoints: d.growthPoints
        }
      });
    }
    if (statsRes.code === 0) this.setData({ stats: statsRes.data });
    if (levelsRes.code === 0) this.setData({ levels: levelsRes.data.levels || [] });
    if (signRes.code === 0 && signRes.data) {
      this.setData({ signDays: signRes.data.signDays || 0 });
    }
    if (inviteRes.code === 0 && inviteRes.data) {
      this.setData({ inviteCount: inviteRes.data.inviteCount || 0 });
    }
  },

  goSign() { wx.navigateTo({ url: '/pages/sign/sign' }); },
  goWallet() { wx.navigateTo({ url: '/pages/wallet/wallet' }); },
  goOrders() { wx.navigateTo({ url: '/pages/orders/orders' }); },
  goInvite() { wx.navigateTo({ url: '/pages/invite/invite' }); },

  onShareAppMessage() {
    const app = getApp();
    api.recordShare(app.globalData.userId, 'app', null);
    return {
      title: '不正经工具箱｜17个上头AI玩具，看广告免费玩！',
      path: '/pages/index/index?invite=' + ((this.data.user || {}).inviteCode || '')
    };
  }
});
