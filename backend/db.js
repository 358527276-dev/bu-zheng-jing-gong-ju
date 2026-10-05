// JSON文件数据库 - 含裂变增长和会员体系
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const dbFile = path.join(dataDir, 'db.json');

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 生成邀请码
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 初始化数据结构
const defaultData = {
  users: [
    {
      id: 1,
      openid: 'test_user_001',
      nickname: '测试用户',
      avatar: '😎',
      balance: 9999.0,
      total_spent: 0,
      total_uses: 0,
      free_uses: 9999,           // 测试号：无限免费
      growth_points: 0,
      level: 'diamond',          // 测试号：直接钻石
      invite_code: generateInviteCode(),
      inviter_id: null,
      vip_type: 'lifetime',      // 测试号：终身VIP
      vip_expire_at: null,
      sign_days: 0,
      last_sign_at: null,
      today_share_count: 0,
      last_share_date: null,
      today_free_used: 0,
      last_free_date: null,   // 上次免费使用日期
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString()
    }
  ],
  tools: [
    { id: 1, name: '给娃起个名', description: '王家卫风/霸总风/狗蛋风，总有一款你不敢用', icon: '🐣', price: 1.0, category: 'creative', status: 1, use_count: 0, sort_order: 1, vip_only: false, created_at: new Date().toISOString() },
    { id: 2, name: '塔罗日运占卜', description: '抽一张今日专属塔罗牌，听听牌想对你说什么（塔罗占卜纯属娱乐，请勿当真）', icon: '🔮', price: 1.0, category: 'fortune', status: 1, use_count: 0, sort_order: 2, vip_only: false, created_at: new Date().toISOString() },
    { id: 3, name: '恋爱嘴替', description: '给crush发点发疯文学，不回你算我输', icon: '💕', price: 1.0, category: 'fun', status: 1, use_count: 0, sort_order: 3, vip_only: false, created_at: new Date().toISOString() },
    { id: 4, name: '藏头诗骚话', description: '用TA的名字写一首诗，撩完就跑', icon: '📜', price: 1.0, category: 'creative', status: 1, use_count: 0, sort_order: 4, vip_only: false, created_at: new Date().toISOString() },
    { id: 5, name: '表情包配文', description: '给你收藏的表情包配个神文案，斗图必胜', icon: '😎', price: 1.0, category: 'fun', status: 1, use_count: 0, sort_order: 5, vip_only: false, created_at: new Date().toISOString() },
    { id: 6, name: '假装今天', description: '假装今天过得很好/很忙/很文艺，骗赞专用', icon: '📸', price: 1.0, category: 'creative', status: 1, use_count: 0, sort_order: 6, vip_only: false, created_at: new Date().toISOString() },
    { id: 7, name: '精神状态', description: '测测你现在精神正常吗？（大概率不）', icon: '🧠', price: 1.0, category: 'test', status: 1, use_count: 0, sort_order: 7, vip_only: false, created_at: new Date().toISOString() },
    { id: 8, name: '感情塔罗牌', description: '默想你的感情问题，抽三张牌看看缘分走向（塔罗占卜纯属娱乐，请勿当真）', icon: '🃏', price: 1.0, category: 'test', status: 1, use_count: 0, sort_order: 8, vip_only: false, created_at: new Date().toISOString() },
    { id: 9, name: '摆烂指南', description: '你适合继续卷还是直接躺平？（VIP专属）', icon: '💼', price: 1.0, category: 'test', status: 1, use_count: 0, sort_order: 9, vip_only: true, created_at: new Date().toISOString() },
    { id: 10, name: '消息已读', description: '帮你回那个不想回又不得不回的消息（VIP专属）', icon: '💬', price: 1.0, category: 'fun', status: 1, use_count: 0, sort_order: 10, vip_only: true, created_at: new Date().toISOString() },
    { id: 11, name: '梦境塔罗牌', description: '梦见啥了？抽张塔罗牌帮你解解梦（塔罗占卜纯属娱乐，请勿当真）', icon: '🌙', price: 1.0, category: 'fortune', status: 1, use_count: 0, sort_order: 11, vip_only: false, created_at: new Date().toISOString() },
    { id: 12, name: '星座塔罗牌', description: '你的星座今日抽到了哪张指引牌？（塔罗占卜纯属娱乐，请勿当真）', icon: '⭐', price: 1.0, category: 'fortune', status: 1, use_count: 0, sort_order: 12, vip_only: false, created_at: new Date().toISOString() },
    { id: 13, name: '号码塔罗牌', description: '手机号数字相加，对应你的专属塔罗牌（塔罗占卜纯属娱乐，请勿当真）', icon: '📱', price: 1.0, category: 'fortune', status: 1, use_count: 0, sort_order: 13, vip_only: false, created_at: new Date().toISOString() },
    { id: 14, name: '彩虹屁生成器', description: '夸人夸到天上去，谁听谁迷糊', icon: '🌈', price: 1.0, category: 'creative', status: 1, use_count: 0, sort_order: 14, vip_only: false, created_at: new Date().toISOString() },
    { id: 15, name: '优雅怼人', description: '文明优雅地怼回去，让对方无话可说', icon: '🔥', price: 1.0, category: 'fun', status: 1, use_count: 0, sort_order: 15, vip_only: false, created_at: new Date().toISOString() },
    { id: 16, name: 'emo文案', description: '深夜emo专属文案，朋友圈骗赞神器', icon: '😭', price: 1.0, category: 'creative', status: 1, use_count: 0, sort_order: 16, vip_only: false, created_at: new Date().toISOString() },
    { id: 17, name: '歌词改编', description: '把一首流行歌改成你的故事', icon: '🎵', price: 1.0, category: 'fun', status: 1, use_count: 0, sort_order: 17, vip_only: true, created_at: new Date().toISOString() }
  ],
  orders: [],
  usage_records: [],
  
  // 签到记录
  sign_records: [],
  
  // 邀请关系
  invite_relations: [],
  
  // 任务完成记录
  task_records: [],
  
  // 分享记录
  share_records: [],
  
  // 会员订单
  vip_orders: [],
  
  // 成长值记录
  growth_records: [],
  
  // 手工支付订单（扫码支付，人工审核）
  manual_orders: [],

  nextId: {
    users: 2,
    tools: 11,
    orders: 1,
    usage_records: 1,
    sign_records: 1,
    invite_relations: 1,
    task_records: 1,
    share_records: 1,
    vip_orders: 1,
    growth_records: 1,
    manual_orders: 1
  }
};

// ===== 支付配置 =====
const payConfig = {
  // 收款码图片
  qrCodes: {
    wechat: '/images/qrcode-wechat.jpg',
    alipay: '/images/qrcode-alipay.jpg'
  },
  // 管理员密码（后台审核用）
  adminPassword: 'admin123',
  // 订单超时时间（分钟）
  expireMinutes: 30
};

// 等级配置
const levelConfig = {
  bronze: { name: '青铜', icon: '🥉', minGrowth: 0, dailyFree: 3, discount: 1.0 },
  silver: { name: '白银', icon: '🥈', minGrowth: 100, dailyFree: 2, discount: 0.95 },
  gold: { name: '黄金', icon: '🥇', minGrowth: 500, dailyFree: 3, discount: 0.9 },
  platinum: { name: '铂金', icon: '💎', minGrowth: 2000, dailyFree: 5, discount: 0.85 },
  diamond: { name: '钻石', icon: '👑', minGrowth: 5000, dailyFree: 8, discount: 0.8 }
};

// 会员配置
const vipConfig = {
  monthly: { name: '快乐包月', price: 5.9, days: 30, dailyUses: 5, benefits: ['每日5次免费', '全部工具', '无广告'] },
  quarterly: { name: '季度爽卡', price: 15.9, days: 90, dailyUses: 10, benefits: ['每日10次免费', '全部工具', '无广告', '极速生成'] },
  yearly: { name: '年度会员', price: 39, days: 365, dailyUses: 20, benefits: ['每日20次免费', '全部工具', '无广告', '极速生成', '专属客服', '生日惊喜'] },
  lifetime: { name: '永久快乐卡', price: 69, days: -1, dailyUses: -1, benefits: ['无限次使用', '全部工具', '无广告', '极速生成', '专属客服', '优先体验新功能', '终身免费更新'] }
};

// 任务配置
const taskConfig = [
  { id: 'daily_sign', name: '每日签到', type: 'daily', reward: { freeUses: 1 }, growth: 5, desc: '每日签到领免费机会' },
  { id: 'daily_share', name: '分享结果', type: 'daily', reward: { freeUses: 1 }, growth: 3, maxDaily: 2, desc: '分享生成结果给好友' },
  { id: 'first_use', name: '首次使用工具', type: 'once', reward: { freeUses: 3 }, growth: 20, desc: '首次使用任意工具' },
  { id: 'invite_friend', name: '邀请好友注册', type: 'repeat', reward: { freeUses: 10, balance: 5 }, growth: 100, desc: '邀请好友注册，双方各得10次免费+5元' },
  { id: 'first_recharge', name: '首次充值', type: 'once', reward: { freeUses: 10 }, growth: 100, desc: '首次充值任意金额' },
  { id: 'browse_tools', name: '浏览3个工具', type: 'daily', reward: { freeUses: 1 }, growth: 2, desc: '浏览3个不同的工具' },
  { id: 'share_app', name: '分享小程序', type: 'once', reward: { freeUses: 5 }, growth: 30, desc: '分享小程序给好友' },
  { id: 'watch_ad', name: '看广告得次数', type: 'daily', reward: { freeUses: 1 }, growth: 1, maxDaily: 10, desc: '看一段广告，领取1次免费使用机会' }
];

// 签到梯度奖励（连续签到N天的奖励）
const signRewardConfig = [
  { day: 1, freeUses: 1, balance: 0, growth: 5 },
  { day: 2, freeUses: 1, balance: 0, growth: 5 },
  { day: 3, freeUses: 2, balance: 0.5, growth: 10 },
  { day: 4, freeUses: 2, balance: 0, growth: 5 },
  { day: 5, freeUses: 3, balance: 0, growth: 10 },
  { day: 6, freeUses: 3, balance: 0, growth: 5 },
  { day: 7, freeUses: 5, balance: 1, growth: 20 } // 周奖励
];

// 加载数据
function loadData() {
  try {
    if (fs.existsSync(dbFile)) {
      const content = fs.readFileSync(dbFile, 'utf-8');
      const data = JSON.parse(content);
      // 迁移旧数据（给老用户补上新增字段）
      data.users = data.users.map(u => ({
        free_uses: 0,
        growth_points: 0,
        level: 'bronze',
        invite_code: generateInviteCode(),
        inviter_id: null,
        vip_type: null,
        vip_expire_at: null,
        sign_days: 0,
        last_sign_at: null,
        today_share_count: 0,
        last_share_date: null,
        today_free_used: 0,
        last_free_date: null,
        ...u
      }));
      // 确保新表存在
      if (!data.sign_records) data.sign_records = [];
      if (!data.invite_relations) data.invite_relations = [];
      if (!data.task_records) data.task_records = [];
      if (!data.share_records) data.share_records = [];
      if (!data.vip_orders) data.vip_orders = [];
      if (!data.growth_records) data.growth_records = [];
      if (!data.manual_orders) data.manual_orders = [];
      
      // 迁移：更新工具名称和描述
      const toolUpdates = {
        1: { name: '给娃起个名', description: '王家卫风/霸总风/狗蛋风，总有一款你不敢用', icon: '🐣', category: 'creative' },
        2: { name: '塔罗日运占卜', description: '抽一张今日专属塔罗牌，听听牌想对你说什么（塔罗占卜纯属娱乐，请勿当真）', icon: '🔮', category: 'fortune' },
        3: { name: '恋爱嘴替', description: '给crush发点发疯文学，不回你算我输', icon: '💕', category: 'fun' },
        4: { name: '藏头诗骚话', description: '用TA的名字写一首诗，撩完就跑', icon: '📜', category: 'creative' },
        5: { name: '表情包配文', description: '给你收藏的表情包配个神文案，斗图必胜', icon: '😎', category: 'fun' },
        6: { name: '假装今天', description: '假装今天过得很好/很忙/很文艺，骗赞专用', icon: '📸', category: 'creative' },
        7: { name: '精神状态', description: '测测你现在精神正常吗？（大概率不）', icon: '🧠', category: 'test' },
        8: { name: '感情塔罗牌', description: '默想你的感情问题，抽三张牌看看缘分走向（塔罗占卜纯属娱乐，请勿当真）', icon: '🃏', category: 'test' },
        9: { name: '摆烂指南', description: '你适合继续卷还是直接躺平？（VIP专属）', icon: '💼', category: 'test' },
        10: { name: '消息已读', description: '帮你回那个不想回又不得不回的消息（VIP专属）', icon: '💬', category: 'fun' }
      };
      data.tools.forEach(tool => {
        if (toolUpdates[tool.id]) {
          Object.assign(tool, toolUpdates[tool.id]);
        }
      });
      
      if (!data.tools.some(t => t.id === 9)) {
        data.tools.push(
          { id: 9, name: 'AI职业规划', description: 'AI分析你的职业发展路径（VIP专属）', icon: '💼', price: 1.0, category: 'test', status: 1, use_count: 0, sort_order: 9, vip_only: true, created_at: new Date().toISOString() },
          { id: 10, name: '高情商回复', description: '聊天救星！高情商回复生成器（VIP专属）', icon: '💬', price: 1.0, category: 'fun', status: 1, use_count: 0, sort_order: 10, vip_only: true, created_at: new Date().toISOString() }
        );
      }
      // 确保nextId完整
      if (!data.nextId.sign_records) data.nextId.sign_records = 1;
      if (!data.nextId.invite_relations) data.nextId.invite_relations = 1;
      if (!data.nextId.task_records) data.nextId.task_records = 1;
      if (!data.nextId.share_records) data.nextId.share_records = 1;
      if (!data.nextId.vip_orders) data.nextId.vip_orders = 1;
      if (!data.nextId.growth_records) data.nextId.growth_records = 1;
      if (!data.nextId.manual_orders) data.nextId.manual_orders = 1;
      
      return data;
    }
  } catch (err) {
    console.error('加载数据库失败:', err);
  }
  // 返回默认数据的深拷贝
  return JSON.parse(JSON.stringify(defaultData));
}

// 保存数据
function saveData(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('保存数据库失败:', err);
    return false;
  }
}

// 内存中的数据
let db = loadData();

// 定期保存（每5秒）
setInterval(() => {
  saveData(db);
}, 5000);

// 退出时保存
process.on('SIGINT', () => {
  saveData(db);
  process.exit(0);
});

// ===== 工具函数 =====

function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isSameDay(dateStr) {
  if (!dateStr) return false;
  return dateStr.startsWith(getTodayStr());
}

function isYesterday(dateStr) {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  return dateStr.startsWith(yStr);
}

// 根据成长值计算等级
function calcLevel(growthPoints) {
  if (growthPoints >= 5000) return 'diamond';
  if (growthPoints >= 2000) return 'platinum';
  if (growthPoints >= 500) return 'gold';
  if (growthPoints >= 100) return 'silver';
  return 'bronze';
}

// 检查会员是否有效
function isVipActive(user) {
  if (!user.vip_type) return false;
  if (user.vip_type === 'lifetime') return true;
  if (!user.vip_expire_at) return false;
  return new Date(user.vip_expire_at) > new Date();
}

// 获取每日免费次数（等级+会员）
function getDailyFreeUses(user) {
  const level = levelConfig[user.level] || levelConfig.bronze;
  let freeUses = level.dailyFree;
  
  if (isVipActive(user)) {
    const vip = vipConfig[user.vip_type];
    if (vip.dailyUses === -1) {
      return { unlimited: true, count: 999 };
    }
    freeUses = Math.max(freeUses, vip.dailyUses);
  }
  
  return { unlimited: false, count: freeUses };
}

// ===== 数据库操作方法 =====

const database = {
  // 配置
  config: {
    levelConfig,
    vipConfig,
    taskConfig
  },
  
  // 工具函数
  utils: {
    getTodayStr,
    isSameDay,
    isYesterday,
    calcLevel,
    isVipActive,
    getDailyFreeUses,
    generateInviteCode
  },
  
  // ===== 用户操作 =====
  users: {
    findByOpenid(openid) {
      return db.users.find(u => u.openid === openid) || null;
    },
    findById(id) {
      return db.users.find(u => u.id === parseInt(id)) || null;
    },
    findByInviteCode(code) {
      return db.users.find(u => u.invite_code === code) || null;
    },
    create(user) {
      const id = db.nextId.users++;
      const newUser = {
        id,
        ...user,
        balance: user.balance || 0,
        total_spent: user.total_spent || 0,
        total_uses: user.total_uses || 0,
        free_uses: user.free_uses !== undefined ? user.free_uses : 5, // 新人送5次
        growth_points: user.growth_points || 0,
        level: user.level || 'bronze',
        invite_code: user.invite_code || generateInviteCode(),
        inviter_id: user.inviter_id || null,
        vip_type: user.vip_type || null,
        vip_expire_at: user.vip_expire_at || null,
        sign_days: user.sign_days || 0,
        last_sign_at: user.last_sign_at || null,
        today_share_count: 0,
        last_share_date: null,
        today_free_used: 0,
        last_free_date: null,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      };
      db.users.push(newUser);
      saveData(db);
      return newUser;
    },
    update(id, updates) {
      const index = db.users.findIndex(u => u.id === parseInt(id));
      if (index === -1) return null;
      db.users[index] = { ...db.users[index], ...updates };
      saveData(db);
      return db.users[index];
    },
    addGrowth(userId, points, reason) {
      const user = this.findById(userId);
      if (!user) return null;
      
      const newGrowth = user.growth_points + points;
      const newLevel = calcLevel(newGrowth);
      
      const updated = this.update(userId, {
        growth_points: newGrowth,
        level: newLevel
      });
      
      // 记录成长值变化
      db.growth_records.push({
        id: db.nextId.growth_records++,
        user_id: userId,
        points,
        reason,
        created_at: new Date().toISOString()
      });
      saveData(db);
      
      return updated;
    },
    addFreeUses(userId, count, reason) {
      const user = this.findById(userId);
      if (!user) return null;
      return this.update(userId, {
        free_uses: user.free_uses + count
      });
    },
    getAll() {
      return db.users;
    }
  },
  
  // ===== 工具操作 =====
  tools: {
    findAll(category) {
      let tools = db.tools.filter(t => t.status === 1);
      if (category && category !== 'all') {
        tools = tools.filter(t => t.category === category);
      }
      return tools.sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return b.use_count - a.use_count;
      });
    },
    findById(id) {
      return db.tools.find(t => t.id === parseInt(id)) || null;
    },
    incrementUseCount(id) {
      const tool = db.tools.find(t => t.id === parseInt(id));
      if (tool) {
        tool.use_count++;
        saveData(db);
      }
    }
  },
  
  // ===== 订单操作 =====
  orders: {
    create(order) {
      const id = db.nextId.orders++;
      const newOrder = {
        id,
        ...order,
        status: order.status || 0,
        created_at: new Date().toISOString()
      };
      db.orders.push(newOrder);
      saveData(db);
      return newOrder;
    },
    findById(id) {
      return db.orders.find(o => o.id === parseInt(id)) || null;
    },
    findByUserId(userId, page = 1, pageSize = 10) {
      const filtered = db.orders
        .filter(o => o.user_id === parseInt(userId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const start = (page - 1) * pageSize;
      const list = filtered.slice(start, start + pageSize);
      return { list, total: filtered.length };
    },
    update(id, updates) {
      const index = db.orders.findIndex(o => o.id === parseInt(id));
      if (index === -1) return null;
      db.orders[index] = { ...db.orders[index], ...updates };
      saveData(db);
      return db.orders[index];
    }
  },
  
  // ===== 使用记录 =====
  usageRecords: {
    create(record) {
      const id = db.nextId.usage_records++;
      const newRecord = {
        id,
        ...record,
        created_at: new Date().toISOString()
      };
      db.usage_records.push(newRecord);
      saveData(db);
      return newRecord;
    },
    findByUserId(userId) {
      return db.usage_records
        .filter(r => r.user_id === parseInt(userId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    getTopTools(userId, limit = 3) {
      const userRecords = db.usage_records.filter(r => r.user_id === parseInt(userId));
      const toolCount = {};
      userRecords.forEach(r => {
        const key = r.tool_name;
        toolCount[key] = (toolCount[key] || 0) + 1;
      });
      return Object.entries(toolCount)
        .map(([tool_name, count]) => ({ tool_name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
    getTotalSpent(userId) {
      return db.orders
        .filter(o => o.user_id === parseInt(userId) && o.status === 1)
        .reduce((sum, o) => sum + (o.amount || 0), 0);
    },
    getTotalOrders(userId) {
      return db.orders.filter(o => o.user_id === parseInt(userId) && o.status === 1).length;
    },
    getTodayFreeUsed(userId) {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return 0;
      if (!isSameDay(user.last_free_date)) return 0;
      return user.today_free_used || 0;
    }
  },
  
  // ===== 签到 =====
  sign: {
    doSign(userId) {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return { success: false, message: '用户不存在' };
      
      const today = getTodayStr();
      
      // 今天已签到
      if (isSameDay(user.last_sign_at)) {
        return { success: false, message: '今天已经签到过了', already: true };
      }
      
      // 计算连续签到天数
      let signDays = 1;
      if (isYesterday(user.last_sign_at)) {
        signDays = user.sign_days + 1;
      }
      
      // 根据梯度配置取奖励（7天一个循环）
      const cycleDay = ((signDays - 1) % 7) + 1;
      const dayReward = signRewardConfig.find(r => r.day === cycleDay) || signRewardConfig[0];
      
      // 完整周期额外奖励（每满7天多送一次）
      const fullWeeks = Math.floor((signDays - 1) / 7);
      let reward = {
        freeUses: dayReward.freeUses,
        balance: dayReward.balance || 0,
        growth: dayReward.growth || 5
      };
      
      let bonus = [];
      if (cycleDay === 7) {
        bonus.push('🎉 周签到礼包！');
      }
      
      // 里程碑奖励
      if (signDays === 30) {
        reward.freeUses += 20;
        reward.balance += 3;
        bonus.push('🏆 连续30天：+20次 + 3元 + 1天会员');
        reward.vipDay = 1;
      } else if (signDays === 100) {
        reward.freeUses += 100;
        reward.balance += 10;
        bonus.push('👑 百日达人：+100次 + 10元 + 7天会员');
        reward.vipDay = 7;
      }
      
      // 更新用户
      const updates = {
        sign_days: signDays,
        last_sign_at: new Date().toISOString(),
        free_uses: user.free_uses + reward.freeUses
      };
      
      if (reward.balance) {
        updates.balance = user.balance + reward.balance;
      }
      
      if (reward.vipDay) {
        const now = Date.now();
        const currentExpire = user.vip_expire_at ? new Date(user.vip_expire_at).getTime() : now;
        const newExpire = Math.max(now, currentExpire) + reward.vipDay * 24 * 60 * 60 * 1000;
        updates.vip_expire_at = new Date(newExpire).toISOString();
        if (!user.vip_type || user.vip_type === 'none') {
          updates.vip_type = 'monthly';
        }
      }
      
      const userIndex = db.users.findIndex(u => u.id === parseInt(userId));
      db.users[userIndex] = { ...db.users[userIndex], ...updates };
      
      // 增加成长值
      database.users.addGrowth(userId, reward.growth, `每日签到`);
      
      // 记录签到
      db.sign_records.push({
        id: db.nextId.sign_records++,
        user_id: userId,
        sign_days: signDays,
        reward: JSON.stringify(reward),
        created_at: new Date().toISOString()
      });
      
      saveData(db);
      
      return {
        success: true,
        signDays,
        reward,
        bonus,
        message: `签到成功！获得${reward.freeUses}次免费机会`
      };
    },
    getSignStatus(userId) {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return null;
      
      const todaySigned = isSameDay(user.last_sign_at);
      const signDays = user.sign_days || 0;
      
      // 生成7天签到状态列表
      const weekList = [];
      for (let i = 1; i <= 7; i++) {
        const reward = signRewardConfig.find(r => r.day === i);
        const isSigned = signDays >= i;
        const isToday = todaySigned ? i === ((signDays - 1) % 7) + 1 : i === (signDays % 7) + 1;
        weekList.push({
          day: i,
          freeUses: reward?.freeUses || 1,
          balance: reward?.balance || 0,
          isSigned,
          isToday: !todaySigned && isToday
        });
      }
      
      return {
        todaySigned,
        signDays,
        weekList,
        nextReward: this.getNextReward(signDays, todaySigned)
      };
    },
    getNextReward(currentDays, todaySigned) {
      const days = todaySigned ? currentDays + 1 : currentDays;
      const milestones = [
        { day: 7, desc: '周签到大礼包' },
        { day: 30, desc: '+20次 + 3元 + 1天VIP' },
        { day: 100, desc: '百日达人：+100次 + 10元 + 7天VIP' }
      ];
      return milestones.find(r => r.day > days) || { day: null, desc: '已获得全部里程碑奖励' };
    }
  },
  
  // ===== 邀请 =====
  invite: {
    getInviteInfo(userId) {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return null;
      
      // 邀请人数
      const inviteCount = db.invite_relations.filter(r => r.inviter_id === parseInt(userId)).length;
      
      return {
        inviteCode: user.invite_code,
        inviteCount,
        inviteUrl: `?invite=${user.invite_code}`,
        rewardPerPerson: { freeUses: 10, balance: 5 } // 每邀请一人的奖励
      };
    },
    
    getInviteList(userId, page = 1, pageSize = 20) {
      const all = db.invite_relations
        .filter(r => r.inviter_id === parseInt(userId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const total = all.length;
      const start = (page - 1) * pageSize;
      const list = all.slice(start, start + pageSize).map(r => {
        const invitee = db.users.find(u => u.id === r.invitee_id);
        return {
          id: r.id,
          inviteeId: r.invitee_id,
          inviteeName: invitee?.nickname || '匿名用户',
          inviteeAvatar: invitee?.avatar || '😀',
          createdAt: r.created_at
        };
      });
      
      return { list, total, page, pageSize };
    },
    
    acceptInvite(userId, inviteCode) {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return { success: false, message: '用户不存在' };
      
      if (user.inviter_id) {
        return { success: false, message: '你已经有邀请人了' };
      }
      
      const inviter = db.users.find(u => u.invite_code === inviteCode);
      if (!inviter) {
        return { success: false, message: '邀请码无效' };
      }
      
      if (inviter.id === user.id) {
        return { success: false, message: '不能邀请自己' };
      }
      
      // 建立邀请关系
      db.invite_relations.push({
        id: db.nextId.invite_relations++,
        inviter_id: inviter.id,
        invitee_id: user.id,
        created_at: new Date().toISOString()
      });
      
      // 被邀请人奖励
      const userIndex = db.users.findIndex(u => u.id === parseInt(userId));
      db.users[userIndex].inviter_id = inviter.id;
      db.users[userIndex].free_uses += 10; // 被邀请人得10次免费
      
      // 邀请人奖励：15次免费 + 100成长值（免费模式：不发余额，只发次数）
      database.users.addGrowth(inviter.id, 100, `邀请好友${user.nickname}注册`);
      database.users.addFreeUses(inviter.id, 15, '邀请好友奖励');
      
      // 完成邀请任务
      db.tasks.completeTask(inviter.id, 'invite_friend');
      
      saveData(db);
      
      return {
        success: true,
        message: '邀请成功！双方都获得了奖励',
        reward: { freeUses: 10, balance: 0 }
      };
    },
    getInviteList(userId, page = 1, pageSize = 20) {
      const relations = db.invite_relations
        .filter(r => r.inviter_id === parseInt(userId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const start = (page - 1) * pageSize;
      const list = relations.slice(start, start + pageSize).map(r => {
        const invitee = db.users.find(u => u.id === r.invitee_id);
        return {
          id: r.id,
          nickname: invitee?.nickname || '匿名用户',
          avatar: invitee?.avatar || '😀',
          totalSpent: invitee?.total_spent || 0,
          createdAt: r.created_at
        };
      });
      
      return { list, total: relations.length };
    }
  },
  
  // ===== 任务 =====
  tasks: {
    getTaskList(userId) {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return [];
      
      const today = getTodayStr();
      
      return taskConfig.map(task => {
        let completed = false;
        let progress = 0;
        let maxProgress = 1;
        
        if (task.type === 'once') {
          // 一次性任务
          completed = !!db.task_records.find(r => 
            r.user_id === parseInt(userId) && r.task_id === task.id
          );
        } else if (task.type === 'daily') {
          // 每日任务
          const todayRecords = db.task_records.filter(r => 
            r.user_id === parseInt(userId) && 
            r.task_id === task.id && 
            isSameDay(r.created_at)
          );
          
          if (task.maxDaily) {
            maxProgress = task.maxDaily;
            progress = Math.min(todayRecords.length, task.maxDaily);
            completed = todayRecords.length >= task.maxDaily;
          } else {
            completed = todayRecords.length > 0;
            progress = completed ? 1 : 0;
          }
        } else if (task.type === 'repeat') {
          // 可重复任务
          const count = db.task_records.filter(r => 
            r.user_id === parseInt(userId) && r.task_id === task.id
          ).length;
          progress = count;
        }
        
        return {
          id: task.id,
          name: task.name,
          type: task.type,
          desc: task.desc,
          reward: task.reward,
          growth: task.growth,
          maxDaily: task.maxDaily || null,
          completed,
          progress,
          maxProgress
        };
      });
    },
    completeTask(userId, taskId, extraData = {}) {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return { success: false, message: '用户不存在' };
      
      const task = taskConfig.find(t => t.id === taskId);
      if (!task) return { success: false, message: '任务不存在' };
      
      // 检查是否已完成
      if (task.type === 'once') {
        const done = db.task_records.find(r => 
          r.user_id === parseInt(userId) && r.task_id === taskId
        );
        if (done) return { success: false, message: '任务已完成', already: true };
      } else if (task.type === 'daily') {
        const todayCount = db.task_records.filter(r => 
          r.user_id === parseInt(userId) && 
          r.task_id === taskId && 
          isSameDay(r.created_at)
        ).length;
        
        if (task.maxDaily && todayCount >= task.maxDaily) {
          return { success: false, message: '今日任务已达上限', already: true };
        }
        if (!task.maxDaily && todayCount > 0) {
          return { success: false, message: '今日已完成', already: true };
        }
      }
      
      // 发放奖励
      let rewardDesc = [];
      if (task.reward.freeUses) {
        database.users.addFreeUses(userId, task.reward.freeUses, task.name);
        rewardDesc.push(`+${task.reward.freeUses}次免费`);
      }
      if (task.reward.balance) {
        const u = db.users.find(u => u.id === parseInt(userId));
        const idx = db.users.findIndex(u => u.id === parseInt(userId));
        db.users[idx].balance = u.balance + task.reward.balance;
        rewardDesc.push(`+${task.reward.balance}元`);
      }
      if (task.growth) {
        database.users.addGrowth(userId, task.growth, task.name);
        rewardDesc.push(`+${task.growth}成长值`);
      }
      
      // 记录任务
      db.task_records.push({
        id: db.nextId.task_records++,
        user_id: parseInt(userId),
        task_id: taskId,
        extra_data: JSON.stringify(extraData),
        created_at: new Date().toISOString()
      });
      
      saveData(db);
      
      return {
        success: true,
        message: `任务完成！获得${rewardDesc.join('、')}`,
        reward: task.reward,
        growth: task.growth
      };
    },
    hasCompleted(userId, taskId) {
      const task = taskConfig.find(t => t.id === taskId);
      if (!task) return false;
      
      if (task.type === 'once') {
        return !!db.task_records.find(r => 
          r.user_id === parseInt(userId) && r.task_id === taskId
        );
      } else if (task.type === 'daily') {
        const todayCount = db.task_records.filter(r => 
          r.user_id === parseInt(userId) && 
          r.task_id === taskId && 
          isSameDay(r.created_at)
        ).length;
        return task.maxDaily ? todayCount >= task.maxDaily : todayCount > 0;
      }
      return false;
    }
  },
  
  // ===== 分享 =====
  share: {
    recordShare(userId, type, toolId) {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return { success: false };
      
      const today = getTodayStr();
      
      // 重置每日分享次数
      let todayCount = isSameDay(user.last_share_date) ? user.today_share_count : 0;
      
      const maxDaily = 3;
      if (todayCount >= maxDaily) {
        return { success: false, message: '今日分享奖励已达上限', alreadyMax: true };
      }
      
      // 记录分享
      db.share_records.push({
        id: db.nextId.share_records++,
        user_id: parseInt(userId),
        share_type: type,
        tool_id: toolId || null,
        created_at: new Date().toISOString()
      });
      
      // 更新用户
      const userIndex = db.users.findIndex(u => u.id === parseInt(userId));
      db.users[userIndex].today_share_count = todayCount + 1;
      db.users[userIndex].last_share_date = new Date().toISOString();
      db.users[userIndex].free_uses += 1; // 每次分享+1次
      
      // 成长值
      database.users.addGrowth(userId, 3, '分享结果');
      
      // 完成任务
      database.tasks.completeTask(userId, 'daily_share');
      
      saveData(db);
      
      return {
        success: true,
        freeUses: 1,
        todayCount: todayCount + 1,
        maxDaily,
        message: '分享成功！获得1次免费机会'
      };
    }
  },
  
  // ===== 会员 =====
  vip: {
    getVipInfo(userId) {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return null;
      
      const isActive = isVipActive(user);
      const dailyFree = getDailyFreeUses(user);
      
      return {
        isVip: isActive,
        vipType: user.vip_type,
        vipName: user.vip_type ? vipConfig[user.vip_type]?.name : null,
        expireAt: user.vip_expire_at,
        dailyFreeUses: dailyFree,
        todayFreeUsed: this.getTodayFreeUsed(userId),
        benefits: isActive && user.vip_type ? vipConfig[user.vip_type].benefits : []
      };
    },
    getTodayFreeUsed(userId) {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return 0;
      if (!isSameDay(user.last_free_date)) return 0;
      return user.today_free_used || 0;
    },
    useFree(userId) {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return false;
      
      // 测试号ID=1，无限免费
      if (parseInt(userId) === 1) return true;
      
      const dailyFree = getDailyFreeUses(user);
      const todayUsed = isSameDay(user.last_free_date) ? user.today_free_used : 0;
      
      if (dailyFree.unlimited) {
        return true; // 无限次
      }
      
      if (todayUsed >= dailyFree.count) {
        return false; // 今日免费次数用完了
      }
      
      // 扣除免费次数
      const userIndex = db.users.findIndex(u => u.id === parseInt(userId));
      if (isSameDay(user.last_free_date)) {
        db.users[userIndex].today_free_used = todayUsed + 1;
      } else {
        db.users[userIndex].today_free_used = 1;
        db.users[userIndex].last_free_date = new Date().toISOString();
      }
      
      saveData(db);
      return true;
    },
    purchaseVip(userId, vipType, payMethod = 'balance') {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return { success: false, message: '用户不存在' };
      
      const vip = vipConfig[vipType];
      if (!vip) return { success: false, message: '会员类型无效' };
      
      // 判断是否首充（在扣费前判断！）
      const isFirstRecharge = user.total_spent === 0;
      
      // 检查余额
      if (payMethod === 'balance' && user.balance < vip.price) {
        return { success: false, message: '余额不足', code: 1001 };
      }
      
      // 计算到期时间
      let expireAt = null;
      if (vip.days === -1) {
        expireAt = null; // 终身
      } else {
        const now = new Date();
        // 如果已经是会员，在现有基础上延长
        if (isVipActive(user) && user.vip_expire_at) {
          now = new Date(user.vip_expire_at);
        }
        expireAt = new Date(now.getTime() + vip.days * 24 * 60 * 60 * 1000).toISOString();
      }
      
      // 扣减余额（余额支付才扣余额，微信/支付宝走外部渠道）
      if (payMethod === 'balance') {
        const userIndex = db.users.findIndex(u => u.id === parseInt(userId));
        db.users[userIndex].balance -= vip.price;
        db.users[userIndex].total_spent += vip.price;
      } else {
        // 微信/支付宝等外部支付，只加消费记录，不动余额
        const userIndex = db.users.findIndex(u => u.id === parseInt(userId));
        db.users[userIndex].total_spent += vip.price;
      }
      
      // 更新会员状态
      const userIndex = db.users.findIndex(u => u.id === parseInt(userId));
      db.users[userIndex].vip_type = vipType;
      db.users[userIndex].vip_expire_at = expireAt;
      
      // 会员订单
      const orderId = db.nextId.vip_orders++;
      db.vip_orders.push({
        id: orderId,
        user_id: parseInt(userId),
        vip_type: vipType,
        amount: vip.price,
        pay_method: payMethod,
        days: vip.days,
        status: 1,
        created_at: new Date().toISOString()
      });
      
      // 成长值
      database.users.addGrowth(userId, vip.price * 10, `购买${vip.name}`);
      
      // 首次充值任务（注意：扣费前判断的首充状态）
      if (isFirstRecharge) {
        database.tasks.completeTask(userId, 'first_recharge');
      }
      
      saveData(db);
      
      return {
        success: true,
        message: `开通${vip.name}成功！`,
        vipType,
        vipName: vip.name,
        expireAt,
        orderId
      };
    },
    getPackages() {
      return Object.entries(vipConfig).map(([key, config]) => ({
        type: key,
        name: config.name,
        price: config.price,
        days: config.days,
        dailyUses: config.dailyUses,
        benefits: config.benefits
      }));
    }
  },
  
  // ===== 手工支付（扫码+人工审核） =====
  manualPay: {
    // 创建支付订单
    createOrder(userId, type, amount, payMethod, extra = {}) {
      const user = db.users.find(u => u.id === parseInt(userId));
      if (!user) return { success: false, message: '用户不存在' };
      
      if (!amount || amount <= 0) {
        return { success: false, message: '金额无效' };
      }
      
      const orderNo = 'MP' + Date.now() + Math.floor(Math.random() * 1000);
      const order = {
        id: db.nextId.manual_orders++,
        order_no: orderNo,
        user_id: parseInt(userId),
        user_name: user.nickname,
        type: type,                    // recharge / vip
        amount: parseFloat(amount),
        pay_method: payMethod,         // wechat / alipay
        status: 0,                     // 0:待支付 1:已完成 2:已取消 3:已超时
        vip_type: extra.vipType || null,  // 如果是会员购买
        bonus: extra.bonus || 0,       // 充值赠送
        remark: extra.remark || '',
        created_at: new Date().toISOString(),
        paid_at: null,
        expire_at: new Date(Date.now() + payConfig.expireMinutes * 60 * 1000).toISOString()
      };
      
      db.manual_orders.push(order);
      saveData(db);
      
      return { success: true, order };
    },
    
    // 获取订单详情
    getOrder(orderId) {
      return db.manual_orders.find(o => o.id === parseInt(orderId)) || null;
    },
    
    // 获取用户订单列表
    getUserOrders(userId, page = 1, pageSize = 20) {
      const all = db.manual_orders
        .filter(o => o.user_id === parseInt(userId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const total = all.length;
      const start = (page - 1) * pageSize;
      return { list: all.slice(start, start + pageSize), total, page, pageSize };
    },
    
    // 获取全部订单（管理端）
    getAllOrders(status = null, page = 1, pageSize = 20) {
      let all = [...db.manual_orders];
      
      if (status !== null && status !== '') {
        all = all.filter(o => o.status === parseInt(status));
      }
      
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const total = all.length;
      const start = (page - 1) * pageSize;
      return { list: all.slice(start, start + pageSize), total, page, pageSize };
    },
    
    // 确认到账（管理端操作）
    confirmOrder(orderId) {
      const order = db.manual_orders.find(o => o.id === parseInt(orderId));
      if (!order) return { success: false, message: '订单不存在' };
      if (order.status !== 0) return { success: false, message: '订单状态不对' };
      
      const user = db.users.find(u => u.id === order.user_id);
      if (!user) return { success: false, message: '用户不存在' };
      
      order.status = 1;
      order.paid_at = new Date().toISOString();
      
      // 根据类型处理
      if (order.type === 'recharge') {
        // 充值：加余额
        const totalAdd = order.amount + (order.bonus || 0);
        const wasFirst = user.total_spent === 0;
        const userIndex = db.users.findIndex(u => u.id === user.id);
        db.users[userIndex].balance += totalAdd;
        db.users[userIndex].total_spent += order.amount;
        
        // 首充任务
        if (wasFirst) {
          database.tasks.completeTask(user.id, 'first_recharge');
        }
      } else if (order.type === 'vip') {
        // 会员购买
        const vipType = order.vip_type;
        const vip = vipConfig[vipType];
        if (!vip) return { success: false, message: '会员类型无效' };
        
        const wasFirst = user.total_spent === 0;
        
        // 计算到期时间
        let expireAt = null;
        if (vip.days === -1) {
          expireAt = null;
        } else {
          let now = new Date();
          if (isVipActive(user) && user.vip_expire_at) {
            now = new Date(user.vip_expire_at);
          }
          expireAt = new Date(now.getTime() + vip.days * 24 * 60 * 60 * 1000).toISOString();
        }
        
        const userIndex = db.users.findIndex(u => u.id === user.id);
        db.users[userIndex].vip_type = vipType;
        db.users[userIndex].vip_expire_at = expireAt;
        db.users[userIndex].total_spent += order.amount;
        
        // 成长值
        database.users.addGrowth(user.id, vip.price * 10, `购买${vip.name}`);
        
        // 首充任务
        if (wasFirst) {
          database.tasks.completeTask(user.id, 'first_recharge');
        }
      }
      
      saveData(db);
      return { success: true, message: '确认到账成功' };
    },
    
    // 取消订单
    cancelOrder(orderId) {
      const order = db.manual_orders.find(o => o.id === parseInt(orderId));
      if (!order) return { success: false, message: '订单不存在' };
      if (order.status !== 0) return { success: false, message: '订单状态不对' };
      
      order.status = 2;
      saveData(db);
      return { success: true, message: '订单已取消' };
    },
    
    // 检查并清理超时订单
    checkExpired() {
      const now = new Date();
      let count = 0;
      db.manual_orders.forEach(o => {
        if (o.status === 0 && new Date(o.expire_at) < now) {
          o.status = 3;
          count++;
        }
      });
      if (count > 0) saveData(db);
      return count;
    },
    
    // 获取支付配置（收款码等）
    getPayConfig() {
      return {
        qrCodes: payConfig.qrCodes,
        expireMinutes: payConfig.expireMinutes
      };
    }
  },
  
  // ===== 成长等级 =====
  growth: {
    getLevelInfo(level) {
      return levelConfig[level] || levelConfig.bronze;
    },
    getAllLevels() {
      return Object.entries(levelConfig).map(([key, config]) => ({
        level: key,
        name: config.name,
        icon: config.icon,
        minGrowth: config.minGrowth,
        dailyFree: config.dailyFree,
        discount: config.discount
      }));
    },
    getGrowthRecords(userId, page = 1, pageSize = 20) {
      const records = db.growth_records
        .filter(r => r.user_id === parseInt(userId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const start = (page - 1) * pageSize;
      return {
        list: records.slice(start, start + pageSize),
        total: records.length
      };
    }
  }
};

module.exports = database;
