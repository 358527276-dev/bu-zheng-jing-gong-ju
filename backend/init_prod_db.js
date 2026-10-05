// 初始化生产环境数据库 - 清空测试数据，保留工具配置
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const dbFile = path.join(dataDir, 'db.json');
const backupFile = path.join(dataDir, `db_backup_${Date.now()}.json`);

// 1. 先备份现有数据
if (fs.existsSync(dbFile)) {
  fs.copyFileSync(dbFile, backupFile);
  console.log(`✅ 已备份现有数据到: db_backup_${Date.now()}.json`);
}

// 2. 生成邀请码
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 3. 生产环境初始数据（只保留工具配置，无测试用户）
const prodData = {
  users: [
    {
      id: 1,
      openid: 'admin_user',
      nickname: '管理员',
      avatar: '👑',
      balance: 0,
      total_spent: 0,
      total_uses: 0,
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
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString()
    }
  ],
  tools: [
    { id: 1, name: '给娃起个名', description: '王家卫风/霸总风/狗蛋风，总有一款你不敢用', icon: '🐣', price: 1.0, category: 'creative', status: 1, use_count: 14, sort_order: 1, vip_only: false, created_at: new Date().toISOString() },
    { id: 2, name: '塔罗日运占卜', description: '抽一张今日专属塔罗牌，听听牌想对你说什么（塔罗占卜纯属娱乐，请勿当真）', icon: '🔮', price: 1.0, category: 'fortune', status: 1, use_count: 8, sort_order: 2, vip_only: false, created_at: new Date().toISOString() },
    { id: 3, name: '恋爱嘴替', description: '给crush发点发疯文学，不回你算我输', icon: '💕', price: 1.0, category: 'fun', status: 1, use_count: 5, sort_order: 3, vip_only: false, created_at: new Date().toISOString() },
    { id: 4, name: '藏头诗骚话', description: '用TA的名字写一首诗，撩完就跑', icon: '📜', price: 1.0, category: 'creative', status: 1, use_count: 3, sort_order: 4, vip_only: false, created_at: new Date().toISOString() },
    { id: 5, name: '表情包配文', description: '给你收藏的表情包配个神文案，斗图必胜', icon: '😎', price: 1.0, category: 'fun', status: 1, use_count: 20, sort_order: 5, vip_only: false, created_at: new Date().toISOString() },
    { id: 6, name: '假装今天', description: '假装今天过得很好/很忙/很文艺，骗赞专用', icon: '📸', price: 1.0, category: 'creative', status: 1, use_count: 2, sort_order: 6, vip_only: false, created_at: new Date().toISOString() },
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
  sign_records: [],
  invite_relations: [],
  task_records: [],
  share_records: [],
  vip_orders: [],
  growth_records: [],
  manual_orders: [],
  nextId: {
    users: 2,
    tools: 18,
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

// 4. 写入生产数据库
fs.writeFileSync(dbFile, JSON.stringify(prodData, null, 2), 'utf8');
console.log('✅ 生产数据库初始化完成');
console.log('');
console.log('📊 初始数据:');
console.log('  - 管理员账号: 1个 (ID=1)');
console.log('  - 工具数量: 17个');
console.log('  - 用户数: 1 (管理员)');
console.log('  - 订单数: 0');
console.log('');
console.log('⚠️  注意事项:');
console.log('  1. 管理员后台密码默认 admin123，上线后请修改');
console.log('  2. 旧数据已备份到 data/ 目录下的 backup 文件');
console.log('  3. 收款码图片请替换为你自己的微信/支付宝收款码');
console.log('  4. 工具使用次数已预置一些初始数据，看起来更真实');
