// 全面测试会员购买
const BASE = 'http://localhost:3000/api';

async function test() {
  console.log('========== 全面测试会员购买 ==========\n');
  
  // 先登录
  const loginRes = await fetch(`${BASE}/user/login?nickname=测试VIP用户`).then(r => r.json());
  const userId = loginRes.data.user.id;
  console.log(`测试用户ID: ${userId}, 余额: ${loginRes.data.user.balance}`);
  
  // 先充点钱
  console.log('\n--- 先充值100元（余额支付测试用） ---');
  await fetch(`${BASE}/user/recharge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount: 100, payMethod: 'balance_admin' })
  }).then(r => r.json());
  const info1 = await fetch(`${BASE}/user/info?userId=${userId}`).then(r => r.json());
  console.log(`充值后余额: ${info1.data.user.balance}`);
  
  // ========== 测试1：余额支付月卡 ==========
  console.log('\n--- 测试1：余额支付买月卡(5.9元) ---');
  const r1 = await fetch(`${BASE}/vip/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, vipType: 'monthly', payMethod: 'balance' })
  }).then(r => r.json());
  console.log(`结果: code=${r1.code}, message=${r1.message}`);
  if (r1.code === 0) {
    console.log(`  ✅ 成功！会员类型: ${r1.data.vipType}, 到期: ${r1.data.expireAt?.substring(0,10)}`);
  } else {
    console.log(`  ❌ 失败！`);
  }
  const info2 = await fetch(`${BASE}/user/info?userId=${userId}`).then(r => r.json());
  console.log(`  余额: ${info2.data.user.balance}, 会员: ${info2.data.user.vip_type}`);
  
  // ========== 测试2：微信扫码买季卡 ==========
  console.log('\n--- 测试2：微信扫码买季卡(15.9元) ---');
  const r2 = await fetch(`${BASE}/pay/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, type: 'vip', payMethod: 'wechat', vipType: 'quarterly' })
  }).then(r => r.json());
  console.log(`结果: code=${r2.code}, message=${r2.message}`);
  if (r2.code === 0) {
    console.log(`  ✅ 订单创建成功！订单号: ${r2.data.orderNo}, 金额: ${r2.data.amount}`);
    console.log(`  支付方式: ${r2.data.payMethod}, 收款码: ${r2.data.qrCode ? '有' : '无'}`);
    
    // 后台确认
    console.log('\n  --- 后台确认到账 ---');
    const confirmRes = await fetch(`${BASE}/admin/pay/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: r2.data.orderId, password: 'admin123' })
    }).then(r => r.json());
    console.log(`  确认结果: code=${confirmRes.code}, message=${confirmRes.message}`);
    
    if (confirmRes.code === 0) {
      const info3 = await fetch(`${BASE}/user/info?userId=${userId}`).then(r => r.json());
      console.log(`  ✅ 确认成功！会员: ${info3.data.user.vip_type}, 到期: ${info3.data.user.vip_expire_at?.substring(0,10)}`);
    } else {
      console.log(`  ❌ 确认失败！`);
    }
  } else {
    console.log(`  ❌ 订单创建失败！`);
  }
  
  // ========== 测试3：支付宝扫码买月卡 ==========
  console.log('\n--- 测试3：支付宝扫码买月卡(5.9元) ---');
  const r3 = await fetch(`${BASE}/pay/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, type: 'vip', payMethod: 'alipay', vipType: 'monthly' })
  }).then(r => r.json());
  console.log(`结果: code=${r3.code}, message=${r3.message}`);
  if (r3.code === 0) {
    console.log(`  ✅ 订单创建成功！支付方式: ${r3.data.payMethod}`);
    
    const confirmRes = await fetch(`${BASE}/admin/pay/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: r3.data.orderId, password: 'admin123' })
    }).then(r => r.json());
    console.log(`  确认结果: code=${confirmRes.code}, message=${confirmRes.message}`);
  } else {
    console.log(`  ❌ 失败！`);
  }
  
  // ========== 测试4：余额支付年卡 ==========
  console.log('\n--- 测试4：余额支付买年卡(39元) ---');
  const r4 = await fetch(`${BASE}/vip/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, vipType: 'yearly', payMethod: 'balance' })
  }).then(r => r.json());
  console.log(`结果: code=${r4.code}, message=${r4.message}`);
  if (r4.code === 0) {
    console.log(`  ✅ 成功！`);
  } else {
    console.log(`  ❌ 失败！`);
  }
  
  // ========== 测试5：余额支付终身卡 ==========
  console.log('\n--- 测试5：余额支付买终身卡(69元) ---');
  const r5 = await fetch(`${BASE}/vip/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, vipType: 'lifetime', payMethod: 'balance' })
  }).then(r => r.json());
  console.log(`结果: code=${r5.code}, message=${r5.message}`);
  if (r5.code === 0) {
    console.log(`  ✅ 成功！终身会员`);
  } else {
    console.log(`  ❌ 失败！`);
  }
  
  // 最终余额
  const infoFinal = await fetch(`${BASE}/user/info?userId=${userId}`).then(r => r.json());
  console.log(`\n最终状态: 余额=${infoFinal.data.user.balance}, 会员=${infoFinal.data.user.vip_type}`);
  
  console.log('\n========== 测试完成 ==========');
}

test().catch(console.error);
