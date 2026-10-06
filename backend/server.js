// 一元AI趣味工坊 - 后端服务（含裂变增长+会员体系）
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const https = require('https');

// 优先读环境变量；环境变量缺失时读同目录 config.local.json（本地/云托管部署均可用）
try {
  const localCfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.local.json'), 'utf-8'));
  const envKeys = ['WX_APPID', 'WX_APPSECRET', 'AI_PROVIDER', 'AI_API_KEY', 'AI_MODEL', 'AI_ENDPOINT', 'ADMIN_PASSWORD'];
  envKeys.forEach(k => { if (!process.env[k] && localCfg[k]) process.env[k] = localCfg[k]; });
} catch (e) { /* 无本地配置文件，忽略 */ }


const db = require('./db');
const aiTools = require('./aiTools');
const aiService = require('./aiService');
const { notify } = require('./notify');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 托管前端静态文件
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ===== 工具函数 =====
function generateOrderNo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `YY${year}${month}${day}${random}`;
}

function success(res, data = {}, message = 'success') {
  res.json({ code: 0, message, data });
}

function fail(res, message = 'error', code = -1) {
  res.json({ code, message, data: null });
}

// 计算实际应付价格（等级折扣）
function calcActualPrice(user, basePrice) {
  const levelInfo = db.growth.getLevelInfo(user.level);
  const discount = levelInfo.discount || 1.0;
  return Math.round(basePrice * discount * 100) / 100;
}

// ===== 用户相关接口 =====

// 登录/注册
app.post('/api/user/login', (req, res) => {
  try {
    const { code, nickname, avatar, inviteCode } = req.body;
    const openid = code || `guest_${Date.now()}`;
    
    let user = db.users.findByOpenid(openid);
    
    if (!user) {
      // 新用户注册
      user = db.users.create({
        openid,
        nickname: nickname || '匿名用户',
        avatar: avatar || '😀',
        balance: 0,
        free_uses: 5 // 新人福利：5次免费
      });
      
      // 处理邀请
      if (inviteCode) {
        db.invite.acceptInvite(user.id, inviteCode);
      }
    } else {
      // 更新登录时间
      user = db.users.update(user.id, {
        last_login_at: new Date().toISOString(),
        ...(nickname ? { nickname } : {}),
        ...(avatar ? { avatar } : {})
      });
    }
    
    // 获取会员信息
    const vipInfo = db.vip.getVipInfo(user.id);
    const signStatus = db.sign.getSignStatus(user.id);
    const levelInfo = db.growth.getLevelInfo(user.level);
    
    success(res, {
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      balance: user.balance,
      totalSpent: user.total_spent,
      totalUses: user.total_uses,
      freeUses: user.free_uses,
      growthPoints: user.growth_points,
      level: user.level,
      levelInfo,
      vipInfo,
      signStatus,
      inviteCode: user.invite_code
    }, '登录成功');
  } catch (err) {
    console.error('登录失败:', err);
    fail(res, '登录失败');
  }
});

// ===== 小程序登录（微信 code2session） =====
// 配置环境变量 WX_APPID / WX_APPSECRET 后走真实微信登录；
// 未配置时降级：直接把 code 当 openid（仅限本地开发调试）。
function httpsGet(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

app.post('/api/user/wx-login', async (req, res) => {
  try {
    const { code, nickname, avatar, inviteCode } = req.body;
    if (!code) return fail(res, '缺少code');

    const WX_APPID = process.env.WX_APPID || '';
    const WX_SECRET = process.env.WX_APPSECRET || '';
    let openid = null;

    if (WX_APPID && WX_SECRET) {
      const session = await httpsGet(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${code}&grant_type=authorization_code`
      );
      if (session.openid) {
        openid = session.openid;
      } else {
        console.error('code2session失败:', session);
        return fail(res, '微信登录失败：' + (session.errmsg || 'code无效'));
      }
    } else {
      openid = 'wx_' + code; // 本地开发降级
    }

    let user = db.users.findByOpenid(openid);
    if (!user) {
      user = db.users.create({
        openid,
        nickname: nickname || '微信用户' + String(openid).slice(-4),
        avatar: avatar || '😀',
        balance: 0,
        free_uses: 5
      });
      if (inviteCode) db.invite.acceptInvite(user.id, inviteCode);
    } else {
      user = db.users.update(user.id, { last_login_at: new Date().toISOString() });
    }

    const vipInfo = db.vip.getVipInfo(user.id);
    const signStatus = db.sign.getSignStatus(user.id);
    const levelInfo = db.growth.getLevelInfo(user.level);

    success(res, {
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      balance: user.balance,
      totalSpent: user.total_spent,
      totalUses: user.total_uses,
      freeUses: user.free_uses,
      growthPoints: user.growth_points,
      level: user.level,
      levelInfo,
      vipInfo,
      signStatus,
      inviteCode: user.invite_code
    }, '登录成功');
  } catch (err) {
    console.error('小程序登录失败:', err);
    fail(res, '登录失败');
  }
});

// ===== H5微信登录（OAuth 2.0） =====
// 获取微信OAuth授权URL
app.get('/api/user/h5-wechat-auth-url', (req, res) => {
  try {
    const WX_H5_APPID = process.env.WX_H5_APPID || '';
    const WX_H5_SECRET = process.env.WX_H5_SECRET || '';
    const redirectUri = process.env.WX_H5_REDIRECT_URI || '';

    if (!WX_H5_APPID || !WX_H5_SECRET || !redirectUri) {
      return fail(res, '微信H5登录未配置，请在环境变量中设置 WX_H5_APPID、WX_H5_SECRET、WX_H5_REDIRECT_URI');
    }

    const state = 'h5_' + Date.now() + Math.random().toString(36).slice(2, 8);
    const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${WX_H5_APPID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;

    success(res, { authUrl, state }, '获取授权URL成功');
  } catch (err) {
    console.error('获取微信授权URL失败:', err);
    fail(res, '获取授权URL失败');
  }
});

// 微信OAuth回调处理
app.get('/api/user/h5-wechat-callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.redirect('/?error=wechat_login_failed&msg=缺少授权code');
    }

    const WX_H5_APPID = process.env.WX_H5_APPID || '';
    const WX_H5_SECRET = process.env.WX_H5_SECRET || '';

    if (!WX_H5_APPID || !WX_H5_SECRET) {
      return res.redirect('/?error=wechat_login_failed&msg=微信H5登录未配置');
    }

    // 用code换取access_token和openid
    const tokenData = await httpsGet(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WX_H5_APPID}&secret=${WX_H5_SECRET}&code=${code}&grant_type=authorization_code`
    );

    if (tokenData.errcode) {
      console.error('微信OAuth token获取失败:', tokenData);
      return res.redirect(`/?error=wechat_login_failed&msg=${encodeURIComponent(tokenData.errmsg || '授权失败')}`);
    }

    const { access_token, openid } = tokenData;

    // 用access_token获取用户信息
    const userInfo = await httpsGet(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
    );

    if (userInfo.errcode) {
      console.error('微信用户信息获取失败:', userInfo);
      return res.redirect(`/?error=wechat_login_failed&msg=${encodeURIComponent(userInfo.errmsg || '获取用户信息失败')}`);
    }

    // 查找或创建用户
    let user = db.users.findByOpenid(openid);
    if (!user) {
      user = db.users.create({
        openid,
        nickname: userInfo.nickname || '微信用户',
        avatar: userInfo.headimgurl || '😀',
        balance: 0,
        free_uses: 5
      });
    } else {
      user = db.users.update(user.id, {
        nickname: userInfo.nickname || user.nickname,
        avatar: userInfo.headimgurl || user.avatar,
        last_login_at: new Date().toISOString()
      });
    }

    // 重定向到前端页面，带上userId
    res.redirect(`/?wechat_login=1&userId=${user.id}`);
  } catch (err) {
    console.error('微信H5登录回调失败:', err);
    res.redirect('/?error=wechat_login_failed&msg=登录失败');
  }
});

// 获取用户信息
app.get('/api/user/info', (req, res) => {
  try {
    const { userId } = req.query;
    const user = db.users.findById(userId);
    
    if (!user) {
      return fail(res, '用户不存在');
    }
    
    const vipInfo = db.vip.getVipInfo(userId);
    const signStatus = db.sign.getSignStatus(userId);
    const levelInfo = db.growth.getLevelInfo(user.level);
    const inviteInfo = db.invite.getInviteInfo(userId);
    
    success(res, {
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      balance: user.balance,
      totalSpent: user.total_spent,
      totalUses: user.total_uses,
      freeUses: user.free_uses,
      growthPoints: user.growth_points,
      level: user.level,
      levelInfo,
      vipInfo,
      signStatus,
      inviteInfo
    });
  } catch (err) {
    fail(res, '获取用户信息失败');
  }
});

// 充值（模拟）
app.post('/api/user/recharge', (req, res) => {
  try {
    const { userId, amount, payMethod, bonus } = req.body;
    
    if (!amount || amount <= 0) {
      return fail(res, '充值金额无效');
    }
    
    const user = db.users.findById(userId);
    if (!user) {
      return fail(res, '用户不存在');
    }
    
    const isFirstRecharge = user.total_spent === 0 && user.balance === 0;
    const realAmount = parseFloat(amount);
    let bonusAmount = 0;
    let bonusMessage = '';
    
    // 档位赠送（前端传的充值礼包赠送）
    const packageBonus = parseFloat(bonus) || 0;
    if (packageBonus > 0) {
      bonusAmount += packageBonus;
    }
    
    // 首充双倍：首次充值额外送50%
    if (isFirstRecharge) {
      const firstBonus = realAmount * 0.5;
      bonusAmount += firstBonus;
      bonusMessage = `首充福利：额外赠送¥${firstBonus.toFixed(2)}！`;
    }
    
    const totalAdd = realAmount + bonusAmount;
    
    // 模拟支付（真实环境调用微信/支付宝API）
    const method = payMethod || 'wechat';
    
    const updatedUser = db.users.update(userId, {
      balance: user.balance + totalAdd,
      total_spent: user.total_spent + realAmount
    });
    
    // 首次充值任务
    if (isFirstRecharge) {
      db.tasks.completeTask(userId, 'first_recharge');
    }
    
    success(res, { 
      balance: updatedUser.balance,
      bonus: bonusAmount,
      packageBonus: packageBonus,
      isFirstRecharge: isFirstRecharge,
      payMethod: method
    }, isFirstRecharge ? `充值成功！${bonusMessage}` : '充值成功');
  } catch (err) {
    fail(res, '充值失败');
  }
});

// ===== 签到接口 =====

// 获取签到状态
app.get('/api/sign/status', (req, res) => {
  try {
    const { userId } = req.query;
    const status = db.sign.getSignStatus(userId);
    success(res, status);
  } catch (err) {
    fail(res, '获取签到状态失败');
  }
});

// 签到
app.post('/api/sign/do', (req, res) => {
  try {
    const { userId } = req.body;
    const result = db.sign.doSign(userId);
    
    if (result.success) {
      success(res, result, result.message);
    } else {
      fail(res, result.message, result.already ? 1002 : -1);
    }
  } catch (err) {
    fail(res, '签到失败');
  }
});

// ===== 任务中心接口 =====

// 获取任务列表
app.get('/api/tasks/list', (req, res) => {
  try {
    const { userId } = req.query;
    const tasks = db.tasks.getTaskList(userId);
    success(res, { tasks });
  } catch (err) {
    fail(res, '获取任务列表失败');
  }
});

// 完成任务
app.post('/api/tasks/complete', (req, res) => {
  try {
    const { userId, taskId, extraData } = req.body;
    const result = db.tasks.completeTask(userId, taskId, extraData);
    
    if (result.success) {
      success(res, result, result.message);
    } else {
      fail(res, result.message, result.already ? 1003 : -1);
    }
  } catch (err) {
    fail(res, '任务完成失败');
  }
});

// ===== 邀请接口 =====

// 获取邀请信息
app.get('/api/invite/info', (req, res) => {
  try {
    const { userId } = req.query;
    const info = db.invite.getInviteInfo(userId);
    success(res, info);
  } catch (err) {
    fail(res, '获取邀请信息失败');
  }
});

// 接受邀请
app.post('/api/invite/accept', (req, res) => {
  try {
    const { userId, inviteCode } = req.body;
    const result = db.invite.acceptInvite(userId, inviteCode);
    
    if (result.success) {
      success(res, result, result.message);
    } else {
      fail(res, result.message);
    }
  } catch (err) {
    fail(res, '接受邀请失败');
  }
});

// 邀请列表
app.get('/api/invite/list', (req, res) => {
  try {
    const { userId, page = 1, pageSize = 20 } = req.query;
    const { list, total } = db.invite.getInviteList(userId, parseInt(page), parseInt(pageSize));
    success(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    fail(res, '获取邀请列表失败');
  }
});

// ===== 分享接口 =====

// 记录分享
app.post('/api/share/record', (req, res) => {
  try {
    const { userId, type, toolId } = req.body;
    const result = db.share.recordShare(userId, type, toolId);
    
    if (result.success) {
      success(res, result, result.message);
    } else {
      fail(res, result.message, result.alreadyMax ? 1004 : -1);
    }
  } catch (err) {
    fail(res, '分享记录失败');
  }
});

// ===== 会员接口 =====

// 获取会员信息
app.get('/api/vip/info', (req, res) => {
  try {
    const { userId } = req.query;
    const info = db.vip.getVipInfo(userId);
    success(res, info);
  } catch (err) {
    fail(res, '获取会员信息失败');
  }
});

// 获取会员套餐
app.get('/api/vip/packages', (req, res) => {
  try {
    const packages = db.vip.getPackages();
    success(res, { packages });
  } catch (err) {
    fail(res, '获取套餐失败');
  }
});

// 购买会员
app.post('/api/vip/purchase', (req, res) => {
  try {
    const { userId, vipType, payMethod } = req.body;
    const result = db.vip.purchaseVip(userId, vipType, payMethod);
    
    if (result.success) {
      success(res, result, result.message);
    } else {
      fail(res, result.message, result.code || -1);
    }
  } catch (err) {
    console.error('购买会员失败:', err);
    fail(res, '购买失败');
  }
});

// ===== 成长等级接口 =====

// 获取所有等级
app.get('/api/growth/levels', (req, res) => {
  try {
    const levels = db.growth.getAllLevels();
    success(res, { levels });
  } catch (err) {
    fail(res, '获取等级列表失败');
  }
});

// 成长值记录
app.get('/api/growth/records', (req, res) => {
  try {
    const { userId, page = 1, pageSize = 20 } = req.query;
    const { list, total } = db.growth.getGrowthRecords(userId, parseInt(page), parseInt(pageSize));
    success(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    fail(res, '获取成长记录失败');
  }
});

// ===== 工具相关接口 =====

// 获取工具列表
app.get('/api/tools/list', (req, res) => {
  try {
    const { category, userId } = req.query;
    const tools = db.tools.findAll(category);
    
    // 如果传了userId，检查会员状态，返回VIP信息
    let userVip = false;
    if (userId) {
      const vipInfo = db.vip.getVipInfo(userId);
      userVip = vipInfo?.isVip || false;
    }
    
    success(res, {
      tools: tools.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        icon: t.icon,
        price: t.price,
        category: t.category,
        useCount: t.use_count,
        // 免费模式：全部工具开放
        vipOnly: false,
        canUse: true
      })),
      userVip
    });
  } catch (err) {
    fail(res, '获取工具列表失败');
  }
});

// 获取工具详情
app.get('/api/tools/detail', (req, res) => {
  try {
    const { toolId, userId } = req.query;
    const tool = db.tools.findById(toolId);
    
    if (!tool) {
      return fail(res, '工具不存在');
    }
    
    let actualPrice = tool.price;
    let userVip = false;
    let canUse = true;
    let levelInfo = null;

    if (userId) {
      const user = db.users.findById(userId);
      if (user) {
        actualPrice = calcActualPrice(user, tool.price);
        levelInfo = db.growth.getLevelInfo(user.level);
        const vipInfo = db.vip.getVipInfo(userId);
        userVip = vipInfo?.isVip || false;
        // 免费模式：全部工具开放
        canUse = true;
      }
    }

    success(res, {
      id: tool.id,
      name: tool.name,
      description: tool.description,
      icon: tool.icon,
      price: tool.price,
      actualPrice,
      category: tool.category,
      useCount: tool.use_count,
      // 免费模式：全部工具开放
      vipOnly: false,
      canUse,
      userVip,
      levelInfo
    });
  } catch (err) {
    fail(res, '获取工具详情失败');
  }
});

// ===== 支付与使用接口 =====

// 创建订单（广告免费模式：默认使用免费次数）
app.post('/api/order/create', (req, res) => {
  try {
    const { userId, toolId, inputParams, useFree, params, payType } = req.body;
    // 兼容小程序端字段名（params / inputParams 均可）
    const mergedParams = inputParams || params || {};
    
    const user = db.users.findById(userId);
    if (!user) {
      return fail(res, '用户不存在');
    }
    
    const tool = db.tools.findById(toolId);
    if (!tool) {
      return fail(res, '工具不存在');
    }

    // 免费模式：全部工具开放，不再做 VIP 专属拦截
    // （原 tool.vip_only 非会员拦截已下线，个人主体小程序走免费+广告路线）

    // ===== 广告免费模式：默认使用免费次数 =====
    // 只有显式指定 payType='balance' 时才走余额支付（弱化余额支付）
    const useBalance = payType === 'balance' && !useFree;
    
    if (!useBalance) {
      // 优先用每日免费次数（当天过期，不用浪费）
      const dailyFree = db.vip.useFree(userId);
      if (dailyFree) {
        const orderNo = generateOrderNo();
        const order = db.orders.create({
          order_no: orderNo,
          user_id: userId,
          tool_id: toolId,
          tool_name: tool.name,
          amount: 0,
          status: 0,
          input_params: JSON.stringify(mergedParams),
          pay_type: 'daily_free'
        });
        return success(res, {
          orderId: order.id,
          orderNo,
          amount: 0,
          toolName: tool.name,
          payType: 'daily_free',
          useFree: true,
          freeUsesLeft: user.free_uses
        }, '使用每日免费次数');
      }
      
      // 再用赠送的永久免费次数
      if (user.free_uses > 0) {
        const orderNo = generateOrderNo();
        const order = db.orders.create({
          order_no: orderNo,
          user_id: userId,
          tool_id: toolId,
          tool_name: tool.name,
          amount: 0,
          status: 0,
          input_params: JSON.stringify(mergedParams),
          pay_type: 'free'
        });
        return success(res, {
          orderId: order.id,
          orderNo,
          amount: 0,
          toolName: tool.name,
          payType: 'free',
          useFree: true,
          freeUsesLeft: user.free_uses - 1
        }, '使用免费次数');
      }
      
      // 免费次数用完了，提示看广告获取
      return fail(res, '免费次数不足，看广告可获得更多次数', 1005);
    }
    
    // ===== 余额支付（保留但弱化，需显式指定 payType=balance）=====
    const actualPrice = calcActualPrice(user, tool.price);
    
    if (user.balance < actualPrice) {
      return fail(res, '余额不足，请先充值', 1001);
    }
    
    const orderNo = generateOrderNo();
    const order = db.orders.create({
      order_no: orderNo,
      user_id: userId,
      tool_id: toolId,
      tool_name: tool.name,
      amount: actualPrice,
      original_price: tool.price,
      status: 0,
      input_params: JSON.stringify(mergedParams),
      pay_type: 'balance'
    });
    
    success(res, {
      orderId: order.id,
      orderNo,
      amount: actualPrice,
      originalPrice: tool.price,
      toolName: tool.name,
      payType: 'balance',
      discount: (user.level !== 'bronze') ? db.growth.getLevelInfo(user.level).discount : null
    }, '订单创建成功');
  } catch (err) {
    console.error('创建订单失败:', err);
    fail(res, '创建订单失败');
  }
});

// 支付订单
app.post('/api/order/pay', async (req, res) => {
  try {
    const { userId, orderId } = req.body;
    
    const order = db.orders.findById(orderId);
    if (!order || order.user_id !== parseInt(userId)) {
      return fail(res, '订单不存在');
    }
    
    if (order.status !== 0) {
      return fail(res, '订单状态异常');
    }
    
    const user = db.users.findById(userId);
    if (!user) {
      return fail(res, '用户不存在');
    }
    
    // 测试号（ID=1）不扣次数和余额，方便调试
    const isTestUser = parseInt(userId) === 1;
    
    // 免费订单直接成功
    if (order.pay_type === 'free' || order.pay_type === 'daily_free' || order.amount === 0) {
      // 扣除赠送的免费次数（如果是free类型，测试号不扣）
      if (order.pay_type === 'free' && !isTestUser) {
        db.users.update(userId, { free_uses: Math.max(0, user.free_uses - 1) });
      }
    } else if (!isTestUser) {
      // 余额支付（测试号不扣）
      if (user.balance < order.amount) {
        return fail(res, '余额不足');
      }
      
      db.users.update(userId, {
        balance: user.balance - order.amount,
        total_spent: user.total_spent + order.amount
      });
    }
    
    // 生成结果（支持异步AI调用）
    const inputParams = JSON.parse(order.input_params || '{}');
    const result = await generateToolResult(order.tool_id, inputParams);
    
    // 更新订单状态
    db.orders.update(orderId, {
      status: 1,
      pay_time: new Date().toISOString(),
      pay_method: order.pay_type || 'balance',
      output_result: JSON.stringify(result)
    });
    
    // 更新用户使用次数
    const updatedUser = db.users.findById(userId);
    db.users.update(userId, {
      total_uses: updatedUser.total_uses + 1
    });
    
    // 更新工具使用次数
    db.tools.incrementUseCount(order.tool_id);
    
    // 保存使用记录
    db.usageRecords.create({
      user_id: userId,
      tool_id: order.tool_id,
      tool_name: order.tool_name,
      input_params: order.input_params,
      output_result: JSON.stringify(result),
      amount: order.amount
    });
    
    // 首次使用任务
    if (updatedUser.total_uses === 0) {
      db.tasks.completeTask(userId, 'first_use');
    }
    
    // 成长值（消费1元=10成长值，免费也给1成长值）
    const growthPoints = order.amount > 0 ? Math.floor(order.amount * 10) : 1;
    db.users.addGrowth(userId, growthPoints, `使用${order.tool_name}`);
    
    // 获取最新用户信息
    const finalUser = db.users.findById(userId);
    
    success(res, {
      orderId,
      result,
      remainingBalance: finalUser.balance,
      freeUses: finalUser.free_uses,
      growthPoints: finalUser.growth_points,
      level: finalUser.level
    }, '生成成功');
  } catch (err) {
    console.error('支付失败:', err);
    fail(res, '生成失败');
  }
});

// 根据工具ID生成结果
async function generateToolResult(toolId, params) {
  switch (parseInt(toolId)) {
    case 1: // AI起名
      return await aiService.generateName(params.type, params.gender, params.style);
    case 2: // 塔罗日运占卜
      return await aiService.generateFortune(params.topic || '今日整体运');
    case 3: // AI土味情话
      return await aiService.generateLoveWords(params.type, params.target);
    case 4: // AI藏头诗
      return await aiService.generateAcrostic(params.name || '我爱你');
    case 5: // 表情包生成
      // AI生图模式（前端字段是 char，模板模式是 template）
      if (params.mode === 'ai' && params.text) {
        return await aiService.generateMemeImage(params.text, params.char || params.template || 'panda');
      }
      // 模板文字模式
      return {
        text: params.text || '上班如上坟',
        template: params.template || 'classic',
        fontStyle: params.fontStyle || 'bold',
        useCanvas: true,
        tip: '长按图片可保存分享',
        fromAI: false
      };
    case 6: // AI朋友圈文案
      return await aiService.generateMomentText(params.scene, params.style);
    case 7: // AI性格测试（前端传 q1/q2/q3，转成 answers 对象）
      const answers = {
        q1: params.q1,
        q2: params.q2,
        q3: params.q3
      };
      return await aiService.personalityTest(answers);
    case 8: // 感情塔罗三牌阵
      return await aiService.loveProbability(params || {});
    case 9: // 摆烂指南（VIP）
      return await aiService.generateLazyGuide(params.industry, params.years);
    case 10: // 消息已读 - 高情商回复（VIP）
      // 前端场景映射到后端场景
      const sceneMap10 = {
        daily: 'colleague',
        conflict: 'love_quarrel',
        colleague: 'colleague',
        argue: 'reject'
      };
      const backendScene = sceneMap10[params.scene] || 'colleague';
      const msg = params.message || '你好';
      return await aiService.generateEQReply(backendScene, msg);
    case 11: // 梦境塔罗牌
      return await aiService.generateDreamInterpretation(params.dreamContent);
    case 12: // 星座塔罗牌
      return await aiService.generateHoroscope(params.sign);
    case 13: // 号码塔罗牌
      return await aiService.generatePhoneFortune(params.phoneNumber);
    case 14: // 彩虹屁生成器
      return await aiService.generateCompliment(params.target, params.style);
    case 15: // 优雅怼人
      return await aiService.generateRoast(params.scene, params.intensity);
    case 16: // emo文案
      return await aiService.generateEmoText(params.scene, params.style);
    case 17: // 歌词改编（VIP）
      return await aiService.generateSongParody(params.songName, params.story);
    default:
      return { message: '工具正在开发中...' };
  }
}

// ===== 订单记录接口 =====

// 获取订单列表
app.get('/api/order/list', (req, res) => {
  try {
    const { userId, page = 1, pageSize = 10 } = req.query;
    
    const { list, total } = db.orders.findByUserId(userId, parseInt(page), parseInt(pageSize));
    
    success(res, {
      list: list.map(o => ({
        id: o.id,
        orderNo: o.order_no,
        toolName: o.tool_name,
        amount: o.amount,
        status: o.status,
        payType: o.pay_type,
        createdAt: o.created_at,
        result: o.output_result ? JSON.parse(o.output_result) : null
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    fail(res, '获取订单列表失败');
  }
});

// 获取订单详情
app.get('/api/order/detail', (req, res) => {
  try {
    const { orderId } = req.query;
    const order = db.orders.findById(orderId);
    
    if (!order) {
      return fail(res, '订单不存在');
    }
    
    success(res, {
      id: order.id,
      orderNo: order.order_no,
      toolName: order.tool_name,
      amount: order.amount,
      status: order.status,
      payMethod: order.pay_method,
      payTime: order.pay_time,
      createdAt: order.created_at,
      payType: order.pay_type,
      inputParams: order.input_params ? JSON.parse(order.input_params) : {},
      result: order.output_result ? JSON.parse(order.output_result) : null
    });
  } catch (err) {
    fail(res, '获取订单详情失败');
  }
});

// ===== 统计接口 =====

// 获取使用记录统计
app.get('/api/stats/summary', (req, res) => {
  try {
    const { userId } = req.query;
    
    const totalOrders = db.usageRecords.getTotalOrders(userId);
    const totalSpent = db.usageRecords.getTotalSpent(userId);
    const topTools = db.usageRecords.getTopTools(userId, 3);
    
    success(res, {
      totalOrders,
      totalSpent,
      topTools
    });
  } catch (err) {
    fail(res, '获取统计失败');
  }
});

// ===== 手工支付（扫码支付） =====

// 获取支付配置
app.get('/api/pay/config', (req, res) => {
  const config = db.manualPay.getPayConfig();
  success(res, config);
});

// 创建手工支付订单（充值/买会员）
app.post('/api/pay/create', (req, res) => {
  const { userId, type, amount, payMethod, vipType } = req.body;
  
  if (!userId || !type || !payMethod) {
    return fail(res, '参数不完整', 400);
  }
  
  if (type === 'recharge' && !amount) {
    return fail(res, '请输入充值金额', 400);
  }
  
  if (!['recharge', 'vip'].includes(type)) {
    return fail(res, '支付类型无效', 400);
  }
  
  if (!['wechat', 'alipay'].includes(payMethod)) {
    return fail(res, '支付方式无效', 400);
  }
  
  let finalAmount = parseFloat(amount);
  let extra = {};
  
  if (type === 'vip') {
    if (!vipType) return fail(res, '缺少会员类型', 400);
    const vip = db.vip.getPackages().find(p => p.type === vipType);
    if (!vip) return fail(res, '会员类型无效', 400);
    finalAmount = vip.price;
    extra.vipType = vipType;
  }
  
  // 充值赠送（可选）
  if (type === 'recharge') {
    const rechargePlans = [
      { amount: 5, bonus: 0 },
      { amount: 10, bonus: 1 },
      { amount: 30, bonus: 5 },
      { amount: 50, bonus: 12 },
      { amount: 100, bonus: 30 },
    ];
    const plan = rechargePlans.find(p => p.amount === finalAmount);
    if (plan) extra.bonus = plan.bonus;
  }
  
  const result = db.manualPay.createOrder(userId, type, finalAmount, payMethod, extra);
  
  if (result.success) {
    // 通知站长：有新收款订单待确认（渠道未配置时静默不推送）
    const o = result.order;
    const typeText = o.type === 'vip' ? '开通会员' : '余额充值';
    const methodText = (o.pay_method === 'wechat') ? '微信' : '支付宝';
    const timeStr = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
    notify(
      '💰 新收款订单待确认',
      `订单号：${o.order_no}\n` +
      `类型：${typeText}\n` +
      `金额：¥${parseFloat(o.amount).toFixed(2)}\n` +
      `支付方式：${methodText}（请核对是否已收到款）\n` +
      `用户ID：${userId}\n` +
      `时间：${timeStr}\n\n` +
      `请登录管理后台「待确认订单」核对收款后点击确认。`
    ).catch(() => {});
    success(res, {
      orderId: result.order.id,
      orderNo: result.order.order_no,
      amount: result.order.amount,
      type: result.order.type,
      payMethod: result.order.pay_method,
      expireAt: result.order.expire_at,
      qrCode: db.manualPay.getPayConfig().qrCodes[payMethod]
    }, '订单创建成功，请扫码支付');
  } else {
    fail(res, result.message);
  }
});

// 查询订单状态（用户端轮询）
app.get('/api/pay/order', (req, res) => {
  const { orderId } = req.query;
  if (!orderId) return fail(res, '缺少订单号', 400);
  
  // 先检查超时
  db.manualPay.checkExpired();
  
  const order = db.manualPay.getOrder(orderId);
  if (!order) return fail(res, '订单不存在', 404);
  
  success(res, {
    orderId: order.id,
    orderNo: order.order_no,
    status: order.status,
    amount: order.amount,
    type: order.type,
    expireAt: order.expire_at,
    paidAt: order.paid_at
  });
});

// 用户取消订单
app.post('/api/pay/cancel', (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return fail(res, '缺少订单号', 400);
  
  const result = db.manualPay.cancelOrder(orderId);
  if (result.success) {
    success(res, null, result.message);
  } else {
    fail(res, result.message);
  }
});

// 用户支付记录
app.get('/api/pay/my-orders', (req, res) => {
  const { userId, page = 1, pageSize = 20 } = req.query;
  if (!userId) return fail(res, '缺少用户ID', 400);
  
  const result = db.manualPay.getUserOrders(userId, parseInt(page), parseInt(pageSize));
  success(res, result);
});

// ===== 管理端接口 =====

// 管理员鉴权中间件
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token) return fail(res, '未登录', 401);
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    if (decoded.startsWith('admin_')) {
      next();
    } else {
      fail(res, '鉴权失败', 401);
    }
  } catch (e) {
    fail(res, '鉴权失败', 401);
  }
}

// 管理员登录
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) return fail(res, '请输入密码', 400);
  
  const ADMIN_PWD = process.env.ADMIN_PASSWORD || 'admin123';
  if (password === ADMIN_PWD) {
    const token = Buffer.from('admin_' + Date.now()).toString('base64');
    success(res, { token }, '登录成功');
  } else {
    fail(res, '密码错误', 401);
  }
});

// 管理端订单列表
app.get('/api/admin/orders', adminAuth, (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const result = db.manualPay.getAllOrders(
    status !== undefined ? status : null,
    parseInt(page),
    parseInt(pageSize)
  );
  success(res, result);
});

// 管理端确认到账
app.post('/api/admin/confirm', adminAuth, (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return fail(res, '缺少订单号', 400);
  
  const result = db.manualPay.confirmOrder(orderId);
  if (result.success) {
    success(res, null, result.message);
  } else {
    fail(res, result.message);
  }
});

// 管理端统计数据
app.get('/api/admin/stats', adminAuth, (req, res) => {
  try {
    const users = db.users.getAll();
    const orders = db.orders;
    
    const pendingCount = db.manualPay.getAllOrders(0).total;
    const today = new Date().toISOString().split('T')[0];
    const todayPaid = db.manualPay.getAllOrders(1).list.filter(
      o => o.paid_at && o.paid_at.startsWith(today)
    );
    const todayIncome = todayPaid.reduce((sum, o) => sum + o.amount, 0);
    
    const totalPaid = db.manualPay.getAllOrders(1);
    const totalIncome = totalPaid.list.reduce((sum, o) => sum + o.amount, 0);
    
    success(res, {
      totalUsers: users.length,
      totalIncome,
      todayIncome,
      pendingCount,
      todayNewUsers: users.filter(u => u.created_at && u.created_at.startsWith(today)).length,
      totalOrders: totalPaid.total
    });
  } catch (e) {
    fail(res, '获取统计失败');
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  success(res, { status: 'ok', time: new Date().toISOString() });
});

// ===== 启动服务 =====
// 云托管函数型：由 functions-framework 监听 3000 端口，业务模块只需导出 app
// 本地调试：自行监听端口
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 一元AI趣味工坊 后端服务启动成功！`);
    console.log(`📍 服务地址: http://localhost:${PORT}`);
    console.log(`📚 主要API:`);
    console.log(`   用户: login / wx-login / info / recharge`);
    console.log(`   工具: list / detail`);
    console.log(`   订单: create / pay / list / detail`);
    console.log(`   签到: status / do`);
    console.log(`   任务: list / complete`);
    console.log(`   邀请: info / accept / list`);
    console.log(`   分享: record`);
    console.log(`   会员: info / packages / purchase`);
    console.log(`   成长: levels / records`);
    console.log(`\n🤖 AI服务: ${aiService.isEnabled() ? `已接入 (${aiService.config.provider})` : '未配置 (使用本地模板)'}`);
    if (aiService.isEnabled()) {
      console.log(`   模型: ${aiService.config.model || '默认'}`);
    }
    console.log(`\n💰 测试用户ID: 1 (终身VIP + 无限免费 + 余额9999)`);
    console.log(`\n`);
  });
}

// ===== 云托管函数型入口 =====
// functions-framework 约定：导出 main(event, context)，框架监听 3000 并把 HTTP 请求转成事件调用。
// 这里把事件还原成 express 的 req/res，转交给上面的 app 处理，再把 express 的响应包成「集成响应」返回。
exports.main = (event, context) => {
  const http = require('http');
  const httpContext = (context && context.httpContext) || {};
  const fullUrl = httpContext.url || '/';
  const method = (httpContext.httpMethod || 'GET').toUpperCase();
  const inHeaders = Object.assign({}, httpContext.headers || {});

  const qIdx = fullUrl.indexOf('?');
  const pathname = qIdx >= 0 ? fullUrl.substring(0, qIdx) : fullUrl;
  const search = qIdx >= 0 ? fullUrl.substring(qIdx + 1) : '';

  // 还原请求体
  let bodyBuf;
  if (event === undefined || event === null) {
    bodyBuf = Buffer.alloc(0);
  } else if (Buffer.isBuffer(event)) {
    bodyBuf = event;
  } else if (typeof event === 'string') {
    bodyBuf = Buffer.from(event);
  } else if (typeof event === 'object' && Object.keys(event).length === 0) {
    bodyBuf = Buffer.alloc(0); // GET 类请求，框架给空对象，不需要 body
  } else {
    bodyBuf = Buffer.from(JSON.stringify(event));
    if (!inHeaders['content-type'] && !inHeaders['Content-Type']) {
      inHeaders['content-type'] = 'application/json';
    }
  }
  if (bodyBuf.length) {
    inHeaders['content-length'] = String(bodyBuf.length);
  }

  return new Promise((resolve) => {
    const req = new http.IncomingMessage();
    req.method = method;
    req.url = pathname + (search ? '?' + search : '');
    req.headers = inHeaders;
    req.complete = true;
    if (bodyBuf.length) req.push(bodyBuf);
    req.push(null);

    const res = new http.ServerResponse(req);
    const chunks = [];
    res.write = (chunk) => { if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))); return true; };
    res.end = (chunk) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      res.finished = true;
      res.headersSent = true;
      const outHeaders = {};
      try {
        const raw = res.getHeaders();
        Object.keys(raw).forEach(k => { outHeaders[k] = raw[k]; });
      } catch (e) { /* 无头信息时忽略 */ }
      resolve({
        statusCode: res.statusCode || 200,
        headers: outHeaders,
        body: Buffer.concat(chunks).toString('utf-8')
      });
    };

    app(req, res);
  });
};
