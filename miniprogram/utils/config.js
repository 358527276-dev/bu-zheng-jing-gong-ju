// ===== 全局配置 =====
// 当前模式：走 Render 公网域名（已部署）
// 后续部署微信云托管后，把 USE_CALLCONTAINER 改回 true 即可

// 本地调试用（callContainer 关闭时生效）
const LOCAL_SERVER_URL = 'https://bu-zheng-jing-gong-ju.onrender.com';

// 正式公网域名（callContainer 不可用时的降级入口）
const PUBLIC_BASE = 'https://bu-zheng-jing-gong-ju.onrender.com';

// true = 优先 callContainer 直连云托管；false = 走 LOCAL_SERVER_URL/PUBLIC_BASE
const USE_CALLCONTAINER = false;

// 激励视频广告位 ID（开通「流量主」后在 mp.weixin.qq.com → 流量主 → 广告位管理 里创建，把 id 填这里）
// 未开通流量主时留空，看广告入口会自动降级为「看视频得次数」直接发放（调试期可用）。
const REWARDED_AD_UNIT_ID = '';

module.exports = {
  ENV_ID,
  SERVICE_NAME,
  USE_CALLCONTAINER,
  API_BASE: (USE_CALLCONTAINER ? PUBLIC_BASE : LOCAL_SERVER_URL) + '/api',
  REWARDED_AD_UNIT_ID
};
