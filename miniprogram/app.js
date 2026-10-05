// ===== 全局状态与登录 =====
const api = require('./utils/api');
const config = require('./utils/config');

App({
  globalData: {
    userId: null,
    userInfo: null,
    inviteCode: '' // 通过分享链接进入时携带
  },

  onLaunch() {
    // 初始化云开发（callContainer 直连云托管，无需 request 域名白名单）
    if (wx.cloud && config.USE_CALLCONTAINER) {
      try {
        wx.cloud.init({ env: config.ENV_ID, traceUser: true });
      } catch (e) {
        // 云开发环境未关联小程序时会抛错，记录但不阻断业务（request 层会降级）
        console.warn('[cloud] init 失败，将走降级链路：', e && e.errMsg);
      }
    }
    // 读取缓存的登录态
    const userId = wx.getStorageSync('userId');
    if (userId) {
      this.globalData.userId = userId;
      this.refreshUser();
    }
  },

  // 小程序登录：wx.login 拿 code 换用户
  async login() {
    if (this.globalData.userId) {
      await this.refreshUser();
      return this.globalData.userInfo;
    }
    const { code } = await new Promise((resolve, reject) => {
      wx.login({ success: resolve, fail: reject });
    });
    const res = await api.login(code, '', '', this.globalData.inviteCode || '');
    if (res.code === 0 && res.data) {
      this.globalData.userId = res.data.userId;
      this.globalData.userInfo = res.data;
      wx.setStorageSync('userId', res.data.userId);
      return res.data;
    }
    throw new Error(res.message || '登录失败');
  },

  async refreshUser() {
    const userId = this.globalData.userId;
    if (!userId) return null;
    const res = await api.getUserInfo(userId);
    if (res.code === 0 && res.data) {
      this.globalData.userInfo = res.data;
      return res.data;
    }
    // 登录态失效则重新登录
    this.globalData.userId = null;
    wx.removeStorageSync('userId');
    return null;
  },

  // 确保已登录（页面可随时调用）
  async ensureLogin() {
    if (this.globalData.userId && this.globalData.userInfo) {
      return this.globalData.userInfo;
    }
    return this.login();
  }
});
