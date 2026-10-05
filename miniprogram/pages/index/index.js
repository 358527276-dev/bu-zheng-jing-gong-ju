const api = require('../../utils/api');
const { CATEGORIES } = require('../../utils/tools');

// VIP工具ID（需要看广告解锁）
const VIP_TOOL_IDS = [9, 10, 17];

// 图标背景渐变色（骚气配色）
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

// 热门工具ID
const HOT_TOOL_IDS = [1, 3, 5, 8];
// 新工具ID
const NEW_TOOL_IDS = [17, 15];

Page({
  data: {
    categories: CATEGORIES,
    currentCategory: 'all',
    tools: [],
    userVip: false,
    freeUses: 0,
    dailyFreeLeft: 0,
    loading: true
  },

  onShow() {
    this.init();
  },

  async init() {
    try {
      await getApp().ensureLogin();
      await this.refresh();
    } catch (e) {
      console.error('init fail', e);
    }
    this.setData({ loading: false });
  },

  async refresh() {
    const app = getApp();
    const userId = app.globalData.userId;
    const res = await api.getTools(this.data.currentCategory, userId);
    if (res.code === 0) {
      const userInfo = app.globalData.userInfo || {};
      const vipInfo = userInfo.vipInfo || {};
      const dailyFree = vipInfo.dailyFreeUses || {};
      const todayUsed = vipInfo.todayFreeUsed || 0;
      const dailyLeft = dailyFree.unlimited ? 99 : Math.max(0, (dailyFree.count || 0) - todayUsed);

      const tools = (res.data.tools || []).map((t, idx) => {
        const isVipTool = VIP_TOOL_IDS.includes(t.id);
        return {
          ...t,
          priceText: isVipTool ? '' : '🆓 免费',
          isVipTool,
          isHot: HOT_TOOL_IDS.includes(t.id),
          isNew: NEW_TOOL_IDS.includes(t.id),
          iconBg: ICON_BGS[idx % ICON_BGS.length]
        };
      });
      this.setData({
        tools,
        userVip: res.data.userVip,
        freeUses: userInfo.freeUses || 0,
        dailyFreeLeft: dailyLeft
      });
    }
  },

  onCategoryTap(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ currentCategory: key });
    this.refresh();
  },

  onToolTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/tool/tool?id=' + id });
  },

  goWallet() {
    wx.navigateTo({ url: '/pages/wallet/wallet' });
  },

  onPullDownRefresh() {
    this.refresh().then(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    const app = getApp();
    const uid = app.globalData.userInfo || {};
    api.recordShare(app.globalData.userId, 'app', null);
    return {
      title: '不正经工具箱｜17个上头AI玩具，看广告免费玩！',
      path: '/pages/index/index?invite=' + (uid.inviteCode || '')
    };
  }
});
