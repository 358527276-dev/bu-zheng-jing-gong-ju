const api = require('../../utils/api');
const ad = require('../../utils/ad');
const { TOOLS_FORM, validateForm } = require('../../utils/tools');

// VIP工具ID（需要看广告解锁）
const VIP_TOOL_IDS = [9, 10, 17];

// 图标渐变色
const ICON_BGS = [
  'linear-gradient(135deg, #ff6b9d, #ff8e53)',
  'linear-gradient(135deg, #a855f7, #ec4899)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #8b5cf6, #d946ef)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #14b8a6, #22c55e)',
];

Page({
  data: {
    tool: null,
    formConf: null,
    formData: {},
    visibleFields: [],
    useFree: true,
    freeUses: 0,
    dailyFreeLeft: 0,
    isVipTool: false,
    iconBg: '',
    submitting: false,
    shareUnlocked: false,  // 今日是否已通过分享解锁
    loadError: ''
  },

  onLoad(options) {
    this.toolId = parseInt(options.id);
    this.loadTool();
  },

  retryLoad() {
    this.setData({ loadError: '' });
    this.loadTool();
  },

  async loadTool() {
    try {
      const app = getApp();
      await app.ensureLogin();
      const res = await api.getToolDetail(this.toolId, app.globalData.userId);
      if (res.code !== 0 || !res.data) {
        this.setData({ loadError: res.message || '工具不存在' });
        return;
      }
    const conf = TOOLS_FORM[this.toolId] || { fields: [], defaults: {} };
    const formData = { ...conf.defaults };
    conf.fields.forEach(f => { if (f.default !== undefined) formData[f.key] = f.default; });

    const userInfo = app.globalData.userInfo || {};
    const vipInfo = userInfo.vipInfo || {};
    const dailyFree = vipInfo.dailyFreeUses || {};
    const todayUsed = vipInfo.todayFreeUsed || 0;
    const dailyLeft = dailyFree.unlimited ? 99 : Math.max(0, (dailyFree.count || 0) - todayUsed);

    const isVipTool = VIP_TOOL_IDS.includes(this.toolId);
    const iconBg = ICON_BGS[(this.toolId - 1) % ICON_BGS.length];

    this.setData({
      tool: { ...res.data, priceText: isVipTool ? '看广告解锁' : '免费' },
      formConf: conf,
      formData,
      freeUses: userInfo.freeUses || 0,
      dailyFreeLeft: dailyLeft,
      isVipTool,
      iconBg,
      useFree: true
    });
    this.updateVisible();
    } catch (e) {
      console.error('loadTool error:', e);
      this.setData({ loadError: '网络错误，请重试' });
    }
  },

  updateVisible() {
    const fd = this.data.formData;
    const visible = (this.data.formConf.fields || []).filter(f => {
      if (!f.showIf) return true;
      const [k, v] = f.showIf.split('==');
      return String(fd[k]) === String(v);
    });
    this.setData({ visibleFields: visible });
  },

  onOptionTap(e) {
    const { key, value } = e.currentTarget.dataset;
    this.setData({ ['formData.' + key]: value });
    this.updateVisible();
  },

  onInputChange(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ ['formData.' + key]: e.detail.value });
  },

  goWallet() {
    wx.navigateTo({ url: '/pages/wallet/wallet' });
  },

  goInvite() {
    wx.navigateTo({ url: '/pages/invite/invite' });
  },

  async handleGenerate() {
    if (this.data.submitting) return;
    const { tool, formData, isVipTool } = this.data;
    const check = validateForm(tool.id, formData);
    if (!check.ok) {
      wx.showToast({ title: check.message, icon: 'none' });
      return;
    }

    // VIP工具：先看广告再生成
    if (isVipTool) {
      this.setData({ submitting: true });
      ad.showRewardVideo({
        onSuccess: () => {
          this.setData({ submitting: false });
          this.doGenerate();
        },
        onFail: (msg) => {
          this.setData({ submitting: false });
          if (msg) wx.showToast({ title: msg, icon: 'none' });
        }
      });
      return;
    }

    this.doGenerate();
  },

  async doGenerate() {
    const { tool, formData, useFree } = this.data;
    this.setData({ submitting: true });
    wx.showLoading({ title: 'AI 生成中...', mask: true });
    try {
      const app = getApp();
      const userId = app.globalData.userId;
      const order = await api.createOrder(userId, tool.id, formData, useFree);
      if (order.code !== 0) {
        wx.hideLoading();
        if (order.code === 1005 || order.code === 1001) {
          wx.showModal({
            title: '次数不够啦',
            content: '看个广告、签到或者邀请好友，都能白嫖次数，要不要去看看？',
            confirmText: '去白嫖',
            success: (res) => { if (res.confirm) wx.navigateTo({ url: '/pages/wallet/wallet' }); }
          });
          return;
        }
        wx.showToast({ title: order.message, icon: 'none' });
        return;
      }
      const result = await api.payOrder(userId, order.data.orderId);
      wx.hideLoading();
      if (result.code !== 0) {
        wx.showToast({ title: result.message || '生成失败', icon: 'none' });
        return;
      }
      app.refreshUser();
      getApp().globalData.lastResult = { toolId: tool.id, result: result.data.result, formData };
      this.setData({ submitting: false });
      wx.navigateTo({ url: '/pages/result/result?toolId=' + tool.id + '&toolName=' + encodeURIComponent(tool.name) });
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: '生成失败，请重试', icon: 'none' });
    }
  },

  // 分享解锁：次数不足时，分享到群/好友可白嫖1次
  async handleShareUnlock() {
    const today = new Date().toDateString();
    const lastShareDay = wx.getStorageSync('share_unlock_day');
    if (lastShareDay === today) {
      wx.showToast({ title: '今日已分享解锁过啦~', icon: 'none' });
      this.setData({ shareUnlocked: true });
      return;
    }
    // 触发分享
    wx.showModal({
      title: '🎁 分享解锁',
      content: '把工具分享到群或好友，立得1次免费使用！',
      confirmText: '去分享',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('share_unlock_day', today);
          wx.showToast({ title: '分享后回来继续~', icon: 'success' });
          this.setData({ shareUnlocked: true });
        }
      }
    });
  },

  onShareAppMessage() {
    const app = getApp();
    api.recordShare(app.globalData.userId, 'tool', this.toolId);
    // 分享解锁回调
    const today = new Date().toDateString();
    wx.setStorageSync('share_unlock_day', today);
    this.setData({ shareUnlocked: true });
    return {
      title: `我用「${this.data.tool.name}」整了个活，快来看！`,
      path: '/pages/index/index?invite=' + ((app.globalData.userInfo || {}).inviteCode || '')
    };
  }
});
