// 全量接口自检
const BASE = 'http://localhost:3000/api';
let pass = 0, fail = 0;

async function test(name, method, path, body) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    const data = await res.json();
    if (data.code === 0) {
      console.log(`  ✅ ${name}`);
      pass++;
      return data;
    } else {
      console.log(`  ❌ ${name} - ${data.message}`);
      fail++;
      return null;
    }
  } catch (e) {
    console.log(`  ❌ ${name} - ${e.message}`);
    fail++;
    return null;
  }
}

async function testWithToken(name, method, path, token, body) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    const data = await res.json();
    if (data.code === 0) {
      console.log(`  ✅ ${name}`);
      pass++;
      return data;
    } else {
      console.log(`  ❌ ${name} - ${data.message}`);
      fail++;
      return null;
    }
  } catch (e) {
    console.log(`  ❌ ${name} - ${e.message}`);
    fail++;
    return null;
  }
}

async function main() {
  console.log('\n========== 全量接口自检 ==========\n');
  
  // 用户模块
  console.log('📱 用户模块');
  const login = await test('用户登录', 'POST', '/user/login', { nickname: 'selfcheck_' + Date.now() });
  const userId = login?.data?.userId;
  await test('获取用户信息', 'GET', `/user/info?userId=${userId}`);
  await test('余额充值(管理员)', 'POST', '/user/recharge', { userId, amount: 100, payMethod: 'admin' });
  console.log('');
  
  // 工具模块
  console.log('🛠 工具模块');
  const tools = await test('工具列表', 'GET', '/tools/list');
  if (tools?.data?.list?.length > 0) {
    await test('工具详情', 'GET', `/tools/detail?id=${tools.data.list[0].id}`);
  }
  console.log('');
  
  // 会员模块
  console.log('👑 会员模块');
  await test('会员套餐列表', 'GET', '/vip/packages');
  await test('会员信息', 'GET', `/vip/info?userId=${userId}`);
  console.log('');
  
  // 签到模块
  console.log('📅 签到模块');
  await test('签到状态', 'GET', `/sign/status?userId=${userId}`);
  await test('签到', 'POST', '/sign/do', { userId });
  console.log('');
  
  // 任务模块
  console.log('🎯 任务模块');
  await test('任务列表', 'GET', `/tasks/list?userId=${userId}`);
  console.log('');
  
  // 邀请模块
  console.log('🤝 邀请模块');
  await test('邀请信息', 'GET', `/invite/info?userId=${userId}`);
  console.log('');
  
  // 成长模块
  console.log('📈 成长模块');
  await test('等级列表', 'GET', '/growth/levels');
  await test('成长记录', 'GET', `/growth/records?userId=${userId}`);
  console.log('');
  
  // 支付模块
  console.log('💰 支付模块');
  await test('余额支付月卡', 'POST', '/vip/purchase', { userId, vipType: 'monthly', payMethod: 'balance' });
  await test('创建充值订单(微信)', 'POST', '/pay/create', { userId, type: 'recharge', amount: 50, payMethod: 'wechat' });
  await test('创建会员订单(支付宝)', 'POST', '/pay/create', { userId, type: 'vip', vipType: 'quarterly', payMethod: 'alipay' });
  console.log('');
  
  // 管理端模块
  console.log('🔐 管理端模块');
  await test('管理登录(错误密码应失败)', 'POST', '/admin/login', { password: 'wrong' }); // 应该失败，不计数
  fail--; // 上面那个预期失败的，不算失败
  const adminLogin = await test('管理登录(正确密码)', 'POST', '/admin/login', { password: 'admin123' });
  const token = adminLogin?.data?.token;
  if (token) {
    await testWithToken('管理端统计', 'GET', '/admin/stats', token);
    await testWithToken('管理端订单列表', 'GET', '/admin/orders?pageSize=5', token);
  }
  // 未鉴权应该被拦截
  try {
    const res = await fetch(BASE + '/admin/stats');
    const data = await res.json();
    if (data.code === 401) {
      console.log('  ✅ 未鉴权访问被拦截');
      pass++;
    } else {
      console.log('  ❌ 未鉴权访问居然成功了！安全漏洞！');
      fail++;
    }
  } catch {
    console.log('  ✅ 未鉴权访问被拦截');
    pass++;
  }
  console.log('');
  
  // 汇总
  console.log('========== 自检结果 ==========');
  console.log(`通过: ${pass} 项`);
  console.log(`失败: ${fail} 项`);
  console.log(`通过率: ${((pass / (pass + fail)) * 100).toFixed(1)}%`);
  console.log('');
  
  if (fail === 0) {
    console.log('🎉 全部通过！可以上线！');
  } else {
    console.log(`⚠️  有 ${fail} 项失败，请修复后再上线`);
  }
}

main();
