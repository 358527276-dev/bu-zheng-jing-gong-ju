const api = require('../../utils/api');
const ad = require('../../utils/ad');

Page({
  data: {
    user: null,
    dailyFreeTotal: 0,   // 每日免费总次数
    dailyFreeLeft: 0,    // 今日剩余免费次数
    dailyFreeUnlimited: false,
    giftFree: 0,         // 赠送的永久免费次数
    todaySigned: false,
    signDays: 0,
    adTask: null,        // 看广告任务进度 { progress, maxProgress }
    watching: false
  },

  onShow() {
    this.init();
  },

  async init() {
    try { await getApp().ensureLogin(); } catch (e) { return; }
    const app = getApp();
    const userId = app.globalData.userId;
    const [userRes, signRes, tasksRes] = await Promise.all([
      api.getUserInfo(userId),
      api.getSignStatus(userId),
      api.getTasks(userId)
    ]);

    let patch = {};
    if (userRes.code === 0) {
      const d = userRes.data;
      const vip = d.vipInfo || {};
      const total = vip.dailyFreeUses || {};
      const used = vip.todayFreeUsed || 0;
      patch = {
        user: d,
        dailyFreeUnlimited: !!total.unlimited,
        dailyFreeTotal: total.unlimited ? 0 : (total.count || 0),
        dailyFreeLeft: total.unlimited ? 0 : Math.max(0, (total.count || 0) - used),
        giftFree: d.freeUses || 0
      };
    }
    if (signRes.code === 0 && signRes.data) {
      patch.todaySigned = !!signRes.data.todaySigned;
      patch.signDays = signRes.data.signDays || 0;
    }
    if (tasksRes.code === 0) {
      const t = (tasksRes.data.tasks || []).find(x => x.id === 'watch_ad');
      patch.adTask = t || null;
    }
    this.setData(patch);
  },

  // 看广告得免费次数
  handleWatchAd() {
    if (this.data.watching) return;
    const task = this.data.adTask;
    if (task && task.maxProgress && task.progress >= task.maxProgress) {
      wx.showToast({ title: '今日看广告次数已上限啦~', icon: 'none' });
      return;
    }
    this.setData({ watching: true });
    ad.showRewardVideo({
      onSuccess: async () => {
        try {
          const r = await api.completeTask(getApp().globalData.userId, 'watch_ad');
          if (r.code === 0) {
            wx.showToast({ title: '获得 1 次免费使用~', icon: 'success' });
            await getApp().refreshUser();
          } else {
            wx.showToast({ title: r.message || '发放失败，请稍后再试', icon: 'none' });
          }
        } catch (e) {
          wx.showToast({ title: '网络异常，请稍后再试', icon: 'none' });
        }
        this.setData({ watching: false });
        this.init();
      },
      onFail: (msg) => {
        this.setData({ watching: false });
        if (msg) wx.showToast({ title: msg, icon: 'none' });
      }
    });
  },

  goSign() {
    wx.navigateTo({ url: '/pages/sign/sign' });
  },
  goInvite() {
    wx.navigateTo({ url: '/pages/invite/invite' });
  }
});
