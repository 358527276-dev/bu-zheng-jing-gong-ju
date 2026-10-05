// ===== 全局配置 =====
// 正式环境走微信云托管 callContainer 直连，不依赖公网域名（云托管测试域名仅供调试，不可用于正式环境）。
// 本地调试：把 USE_CALLCONTAINER 改成 false，并设置 LOCAL_SERVER_URL = 'http://localhost:3000'。
const ENV_ID = 'smart-cs-d0g1en1xl9861cfa6';
const SERVICE_NAME = 'buzhengjing-api';

// 本地调试用（callContainer 关闭时生效）
const LOCAL_SERVER_URL = 'http://localhost:3000';

// 正式公网域名（callContainer 不可用时的降级入口；需在 mp 后台加 request 合法域名）
const PUBLIC_BASE = 'https://buzhengjing-api-smart-cs-d0g1en1xl9861cfa6-1496251301.ap-shanghai.run.wxcloudrun.com';

// true = 优先 callContainer 直连，失败自动降级 PUBLIC_BASE；false = 本地调试走 LOCAL_SERVER_URL
const USE_CALLCONTAINER = true;

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
