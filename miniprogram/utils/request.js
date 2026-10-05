// ===== 统一请求封装 =====
// 优先 wx.cloud.callContainer 直连云托管（不依赖公网域名、无需白名单）。
// 云开发环境尚未关联小程序时 callContainer 会失败 → 自动降级 wx.request 打正式域名。
// 本地调试：把 utils/config.js 里 USE_CALLCONTAINER 改成 false 即直接走 wx.request + 本地地址。
const config = require('./config');

// GET 参数拼成 query string（callContainer 不会自动序列化 data）
const buildQuery = (data) => {
  if (!data || typeof data !== 'object') return '';
  const parts = [];
  Object.keys(data).forEach((key) => {
    const val = data[key];
    if (val === undefined || val === null || val === '') return;
    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
  });
  return parts.length ? '?' + parts.join('&') : '';
};

// wx.request 兜底（走公网域名，需要在小程序后台加 request 合法域名）
const wxRequest = (url, method, data) => new Promise((resolve) => {
  wx.request({
    url: config.API_BASE + url,
    method,
    data: data || {},
    header: { 'Content-Type': 'application/json' },
    success(res) {
      if (res.statusCode >= 200 && res.statusCode < 300 && res.data) {
        resolve(res.data);
      } else {
        resolve({ code: -1, message: (res.data && res.data.message) || '请求失败', data: null });
      }
    },
    fail(err) {
      console.error('请求失败:', url, err);
      resolve({ code: -1, message: '网络错误，请检查服务是否启动', data: null });
    }
  });
});

const request = (url, method = 'GET', data = null) => {
  const m = String(method).toUpperCase();
  const isGet = m === 'GET';

  // 本地调试模式：直接 wx.request
  if (!config.USE_CALLCONTAINER) {
    return wxRequest(url, m, data);
  }

  // 正式环境：云托管直连；不可用时自动降级公网域名
  if (wx.cloud && wx.cloud.callContainer) {
    return new Promise((resolve) => {
      wx.cloud.callContainer({
        name: config.SERVICE_NAME,
        path: '/api' + url + (isGet ? buildQuery(data) : ''),
        method: m,
        data: isGet ? {} : (data || {}),
        header: { 'Content-Type': 'application/json' },
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300 && res.data) {
            resolve(res.data);
          } else {
            resolve({ code: -1, message: (res.data && res.data.message) || '请求失败', data: null });
          }
        },
        fail(err) {
          // 云开发环境未关联小程序 / 服务不存在 → 降级公网域名，保证业务可用
          console.warn('[cloud] callContainer 失败，降级公网:', url, err && err.errMsg);
          wxRequest(url, m, data).then(resolve);
        }
      });
    });
  }

  // 无 callContainer 能力（基础库过低等）
  return wxRequest(url, m, data);
};

module.exports = request;
