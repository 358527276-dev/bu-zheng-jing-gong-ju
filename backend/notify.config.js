// ===== 站长通知配置 =====
// 客户下单/充值时给站长推送提醒。三种渠道任选其一，填上 key 即生效；全留空则不推送（默认）。
//
// 【Server酱 —— 最简单，推荐】
//   微信扫码登录 https://sct.ftqq.com/ ，首页「SendKey」一键复制，
//   填到下面 serverchan.sendkey，提醒会直接推到你的微信（免费）。
//
// 【企业微信群机器人】
//   任意企业微信群 → 右上角 … → 群机器人 → 添加机器人，
//   复制 Webhook 地址里 key= 后面的那串，填到 wechatwork.key。
//
// 【飞书自定义机器人】
//   飞书群 → 设置 → 群机器人 → 添加自定义机器人，
//   复制 Webhook 地址最后一段，填到 feishu.token。
module.exports = {
  serverchan: { sendkey: 'SCT432892TVjhNF9DOaMGHU4aqoPBGbzck' },
  wechatwork: { key: '' },
  feishu: { token: '' }
};
