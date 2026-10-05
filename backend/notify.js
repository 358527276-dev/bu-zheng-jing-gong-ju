// ===== 站长通知模块 =====
// 支持 Server酱 / 企业微信群机器人 / 飞书机器人。
// 渠道在 notify.config.js 里配置，填了 key 就推，全空则静默不推送。
const https = require('https');
const cfg = require('./notify.config');

// 通用 JSON POST（不引入新依赖，用原生 https）
function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const channels = {
  // Server酱：https://sct.ftqq.com/ ，推送到微信
  async serverchan(title, content) {
    if (!cfg.serverchan || !cfg.serverchan.sendkey) return;
    await post(`https://sctapi.ftqq.com/${cfg.serverchan.sendkey}.send`, {
      title,
      desp: content
    });
  },
  // 企业微信群机器人
  async wechatwork(title, content) {
    if (!cfg.wechatwork || !cfg.wechatwork.key) return;
    await post(`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${cfg.wechatwork.key}`, {
      msgtype: 'markdown',
      markdown: { content: `## ${title}\n\n${content}` }
    });
  },
  // 飞书自定义机器人
  async feishu(title, content) {
    if (!cfg.feishu || !cfg.feishu.token) return;
    await post(`https://open.feishu.cn/open-apis/bot/v2/hook/${cfg.feishu.token}`, {
      msg_type: 'text',
      content: { text: `${title}\n${content}` }
    });
  }
};

// 统一发送：所有已配置渠道都推一遍，单个渠道失败不影响其他
async function notify(title, content) {
  for (const name of Object.keys(channels)) {
    try {
      await channels[name](title, content);
    } catch (err) {
      console.error(`[notify] ${name} 推送失败:`, err.message);
    }
  }
}

module.exports = { notify };
