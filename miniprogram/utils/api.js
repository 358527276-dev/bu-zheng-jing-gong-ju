// ===== API 接口层（对接现有 Express 后端）=====
const request = require('./request');

const api = {
  // 登录（code 来自 wx.login）
  login(code, nickname, avatar, inviteCode) {
    return request('/user/wx-login', 'POST', { code, nickname, avatar, inviteCode });
  },
  getUserInfo: (userId) => request('/user/info', 'GET', { userId }),
  getTools: (category, userId) => request('/tools/list', 'GET', { category, userId }),
  getToolDetail: (toolId, userId) => request('/tools/detail', 'GET', { toolId, userId }),
  createOrder: (userId, toolId, inputParams, useFree) =>
    request('/order/create', 'POST', { userId, toolId, inputParams, useFree }),
  payOrder: (userId, orderId) => request('/order/pay', 'POST', { userId, orderId }),
  getOrderList: (userId, page = 1, pageSize = 10) =>
    request('/order/list', 'GET', { userId, page, pageSize }),
  getSignStatus: (userId) => request('/sign/status', 'GET', { userId }),
  doSign: (userId) => request('/sign/do', 'POST', { userId }),
  getTasks: (userId) => request('/tasks/list', 'GET', { userId }),
  completeTask: (userId, taskId, extraData) =>
    request('/tasks/complete', 'POST', { userId, taskId, extraData }),
  getInviteInfo: (userId) => request('/invite/info', 'GET', { userId }),
  getInviteList: (userId, page = 1, pageSize = 20) =>
    request('/invite/list', 'GET', { userId, page, pageSize }),
  recordShare: (userId, type, toolId) => request('/share/record', 'POST', { userId, type, toolId }),
  getVipInfo: (userId) => request('/vip/info', 'GET', { userId }),
  getVipPackages: () => request('/vip/packages', 'GET'),
  getLevels: () => request('/growth/levels', 'GET'),
  getStats: (userId) => request('/stats/summary', 'GET', { userId })
};

module.exports = api;
