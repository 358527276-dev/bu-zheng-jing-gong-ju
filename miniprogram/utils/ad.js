// ===== 激励视频广告封装 =====
// 用法：
//   const ad = require('../../utils/ad');
//   ad.showRewardVideo({
//     onSuccess: () => { /* 看完了，找后端发放奖励 */ },
//     onFail: (msg) => { /* 没广告 / 用户中途退出 */ }
//   });
const config = require('./config');

let rewardedAd = null;

function getAd() {
  if (rewardedAd) return rewardedAd;
  if (!config.REWARDED_AD_UNIT_ID) return null;
  if (!wx.createRewardedVideoAd) return null;
  rewardedAd = wx.createRewardedVideoAd({ adUnitId: config.REWARDED_AD_UNIT_ID });
  rewardedAd.onError((err) => {
    console.warn('[ad] 激励视频加载失败', err && err.errMsg);
  });
  return rewardedAd;
}

/**
 * 弹出激励视频广告，看完（isEnded === true）才回调 onSuccess。
 * 没有配置广告位 id 时走降级：直接当作看完（调试期保持链路可用）。
 */
function showRewardVideo({ onSuccess, onFail } = {}) {
  const ad = getAd();

  // 降级：还没接入广告位，直接发放（上线前务必填上 REWARDED_AD_UNIT_ID）
  if (!ad) {
    console.warn('[ad] 未配置激励视频广告位，走降级直接发放');
    if (typeof onSuccess === 'function') onSuccess();
    return;
  }

  const handleClose = (res) => {
    if (res && res.isEnded) {
      if (typeof onSuccess === 'function') onSuccess();
    } else {
      if (typeof onFail === 'function') onFail('广告未看完，没有奖励哦~');
    }
  };

  ad.onClose(handleClose);

  ad.show().catch((err) => {
    // show 失败（比如广告还没加载好），尝试重新 load 一次再 show
    ad.load()
      .then(() => ad.show())
      .catch(() => {
        if (typeof onFail === 'function') onFail('广告加载失败，请稍后再试~');
      });
  });
}

module.exports = { showRewardVideo };
