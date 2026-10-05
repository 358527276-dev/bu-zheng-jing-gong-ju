// API 请求模块
const API_BASE = '/api';

const api = {
  // 通用请求方法
  async request(url, method = 'GET', data = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (data) {
        if (method === 'GET') {
          const params = new URLSearchParams(data).toString();
          url += `?${params}`;
        } else {
          options.body = JSON.stringify(data);
        }
      }
      
      const response = await fetch(`${API_BASE}${url}`, options);
      const result = await response.json();
      return result;
    } catch (err) {
      console.error('API请求失败:', err);
      return { code: -1, message: '网络错误，请稍后重试', data: null };
    }
  },
  
  // ===== 用户 =====
  async login(code, nickname, avatar, inviteCode) {
    return this.request('/user/login', 'POST', { code, nickname, avatar, inviteCode });
  },
  
  async getUserInfo(userId) {
    return this.request('/user/info', 'GET', { userId });
  },
  
  async recharge(userId, amount, payMethod, bonus) {
    return this.request('/user/recharge', 'POST', { userId, amount, payMethod, bonus });
  },
  
  // ===== 工具 =====
  async getTools(category, userId) {
    return this.request('/tools/list', 'GET', { category, userId });
  },
  
  async getToolDetail(toolId, userId) {
    return this.request('/tools/detail', 'GET', { toolId, userId });
  },
  
  // ===== 订单 =====
  async createOrder(userId, toolId, inputParams, useFree) {
    return this.request('/order/create', 'POST', { userId, toolId, inputParams, useFree });
  },
  
  async payOrder(userId, orderId) {
    return this.request('/order/pay', 'POST', { userId, orderId });
  },
  
  async getOrderList(userId, page = 1, pageSize = 10) {
    return this.request('/order/list', 'GET', { userId, page, pageSize });
  },
  
  async getOrderDetail(orderId) {
    return this.request('/order/detail', 'GET', { orderId });
  },
  
  // ===== 签到 =====
  async getSignStatus(userId) {
    return this.request('/sign/status', 'GET', { userId });
  },
  
  async doSign(userId) {
    return this.request('/sign/do', 'POST', { userId });
  },
  
  // ===== 任务 =====
  async getTasks(userId) {
    return this.request('/tasks/list', 'GET', { userId });
  },
  
  async completeTask(userId, taskId, extraData) {
    return this.request('/tasks/complete', 'POST', { userId, taskId, extraData });
  },
  
  // ===== 邀请 =====
  async getInviteInfo(userId) {
    return this.request('/invite/info', 'GET', { userId });
  },
  
  async acceptInvite(userId, inviteCode) {
    return this.request('/invite/accept', 'POST', { userId, inviteCode });
  },
  
  async getInviteList(userId, page = 1, pageSize = 20) {
    return this.request('/invite/list', 'GET', { userId, page, pageSize });
  },
  
  // ===== 分享 =====
  async recordShare(userId, type, toolId) {
    return this.request('/share/record', 'POST', { userId, type, toolId });
  },
  
  // ===== 会员 =====
  async getVipInfo(userId) {
    return this.request('/vip/info', 'GET', { userId });
  },
  
  async getVipPackages() {
    return this.request('/vip/packages', 'GET');
  },
  
  async purchaseVip(userId, vipType, payMethod) {
    return this.request('/vip/purchase', 'POST', { userId, vipType, payMethod });
  },
  
  // ===== 成长等级 =====
  async getLevels() {
    return this.request('/growth/levels', 'GET');
  },
  
  async getGrowthRecords(userId, page = 1, pageSize = 20) {
    return this.request('/growth/records', 'GET', { userId, page, pageSize });
  },
  
  // ===== 统计 =====
  async getStats(userId) {
    return this.request('/stats/summary', 'GET', { userId });
  },
  
  // ===== 手工支付（扫码） =====
  async getPayConfig() {
    return this.request('/pay/config', 'GET');
  },
  
  async createPayOrder(userId, type, amount, payMethod, vipType) {
    return this.request('/pay/create', 'POST', { userId, type, amount, payMethod, vipType });
  },
  
  async getPayOrderStatus(orderId) {
    return this.request('/pay/order', 'GET', { orderId });
  },
  
  async cancelPayOrder(orderId) {
    return this.request('/pay/cancel', 'POST', { orderId });
  },
  
  // ===== 管理端 =====
  async adminLogin(password) {
    return this.request('/admin/login', 'POST', { password });
  },
  
  async adminGetOrders(status, page = 1, pageSize = 20) {
    return this.request('/admin/orders', 'GET', { status, page, pageSize });
  },
  
  async adminConfirmOrder(orderId) {
    return this.request('/admin/confirm', 'POST', { orderId });
  },
  
  async adminGetStats() {
    return this.request('/admin/stats', 'GET');
  }
};
