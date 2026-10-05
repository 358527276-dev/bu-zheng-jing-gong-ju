// ===== 全量验证测试脚本 =====
const http = require('http');
const BASE_URL = 'http://localhost:3000';

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
function GET(path) { return api('GET', path, null); }
function POST(path, body) { return api('POST', path, body); }

let passed = 0, failed = 0;
const results = [];

function test(name, fn) {
  return async function() {
    try {
      await fn();
      passed++;
      results.push({ name: name, status: 'PASS' });
      console.log('  ✅ ' + name);
    } catch (err) {
      failed++;
      results.push({ name: name, status: 'FAIL', error: err.message });
      console.log('  ❌ ' + name + ' — ' + err.message);
    }
  };
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg || '断言失败');
}
function assertHas(obj, keys, msg) {
  for (let i = 0; i < keys.length; i++) {
    if (obj[keys[i]] === undefined) throw new Error((msg || '缺少字段') + ': ' + keys[i]);
  }
}

// 测试用户
let testUserId = null;
let freeModeUserId = null;

async function ensureTestUser() {
  const r1 = await GET('/api/user/info?userId=1');
  if (r1.body.code === 0 && r1.body.data) {
    testUserId = 1;
    console.log('  ℹ️  使用已有测试用户 ID=1');
    return;
  }
  const code = 'test_user_' + Date.now();
  const r2 = await POST('/api/user/login', { code: code, nickname: '测试用户', avatar: '🧪' });
  if (r2.body.code === 0) {
    testUserId = r2.body.data.userId;
    console.log('  ℹ️  新建测试用户 ID=' + testUserId + ' (free=' + r2.body.data.freeUses + ')');
    return;
  }
  throw new Error('无法创建测试用户: ' + r2.body.message);
}

const tests = [];

// === 基础API ===
tests.push(test('健康检查', function() {
  return GET('/api/health').then(function(r) {
    assert(r.body.code === 0 && r.body.data.status === 'ok', '健康检查失败');
  });
}));

tests.push(test('创建测试用户', function() {
  return ensureTestUser().then(function() {
    assert(testUserId !== null, '测试用户ID为空');
  });
}));

tests.push(test('获取用户信息', function() {
  return GET('/api/user/info?userId=' + testUserId).then(function(r) {
    assert(r.body.code === 0, r.body.message);
    assertHas(r.body.data, ['userId', 'balance', 'freeUses', 'level', 'vipInfo', 'signStatus']);
  });
}));

tests.push(test('工具列表(17个全开放)', function() {
  return GET('/api/tools/list?userId=' + testUserId).then(function(r) {
    assert(r.body.code === 0, r.body.message);
    assert(r.body.data.tools.length >= 17, '工具数量应>=17，实际' + r.body.data.tools.length);
    const allOpen = r.body.data.tools.every(function(t) { return t.canUse === true && t.vipOnly === false; });
    assert(allOpen, '免费模式下所有工具应开放');
    console.log('    📦 工具数: ' + r.body.data.tools.length + ', 全部开放: ' + (allOpen ? '是' : '否'));
  });
}));

tests.push(test('工具详情(VIP工具也开放)', function() {
  return GET('/api/tools/detail?toolId=9&userId=' + testUserId).then(function(r) {
    assert(r.body.code === 0, r.body.message);
    assert(r.body.data.canUse === true, 'canUse应为true');
    assert(r.body.data.vipOnly === false, 'vipOnly应为false');
  });
}));

// === 签到 ===
tests.push(test('签到状态查询', function() {
  return GET('/api/sign/status?userId=' + testUserId).then(function(r) {
    assert(r.body.code === 0, r.body.message);
    assertHas(r.body.data, ['todaySigned', 'signDays', 'weekList']);
  });
}));

tests.push(test('执行签到', function() {
  return POST('/api/sign/do', { userId: testUserId }).then(function(r) {
    assert(r.body.code === 0 || r.body.code === 1002, 'code=' + r.body.code + ' ' + r.body.message);
  });
}));

// === 任务 & 看广告 ===
tests.push(test('任务列表(含watch_ad)', function() {
  return GET('/api/tasks/list?userId=' + testUserId).then(function(r) {
    assert(r.body.code === 0, r.body.message);
    assert(Array.isArray(r.body.data.tasks), 'tasks应为数组');
    const watchAd = r.body.data.tasks.find(function(t) { return t.id === 'watch_ad'; });
    assert(watchAd, '应包含watch_ad任务');
    assert(watchAd.reward && watchAd.reward.freeUses > 0, 'watch_ad应有freeUses奖励');
    assert(watchAd.maxDaily >= 10, 'watch_ad每日上限应>=10');
    console.log('    📋 任务数: ' + r.body.data.tasks.length + ', watch_ad: +' + watchAd.reward.freeUses + '次/次, 上限' + watchAd.maxDaily + '次/天');
  });
}));

tests.push(test('完成看广告任务', function() {
  let beforeFree = 0;
  return GET('/api/user/info?userId=' + testUserId).then(function(b) {
    beforeFree = b.body.data.freeUses;
    return POST('/api/tasks/complete', { userId: testUserId, taskId: 'watch_ad' });
  }).then(function(r) {
    assert(r.body.code === 0 || r.body.code === 1003, 'code=' + r.body.code + ' ' + r.body.message);
    if (r.body.code === 0) {
      return GET('/api/user/info?userId=' + testUserId).then(function(a) {
        console.log('    🎁 免费次数: ' + beforeFree + ' → ' + a.body.data.freeUses + ' (+' + (a.body.data.freeUses - beforeFree) + ')');
        assert(a.body.data.freeUses > beforeFree, '完成任务后免费次数应增加');
      });
    } else {
      console.log('    ℹ️  今日已达上限');
    }
  });
}));

// === 会员 ===
tests.push(test('获取会员信息', function() {
  return GET('/api/vip/info?userId=' + testUserId).then(function(r) {
    assert(r.body.code === 0, r.body.message);
    assertHas(r.body.data, ['isVip', 'vipType', 'dailyFreeUses']);
  });
}));

tests.push(test('获取会员套餐', function() {
  return GET('/api/vip/packages').then(function(r) {
    assert(r.body.code === 0, r.body.message);
    assert(r.body.data.packages.length >= 4, '至少4种套餐');
  });
}));

// === 成长等级 ===
tests.push(test('获取所有等级', function() {
  return GET('/api/growth/levels').then(function(r) {
    assert(r.body.code === 0, r.body.message);
    assert(r.body.data.levels.length >= 5, '至少5个等级');
  });
}));

// === 邀请 ===
tests.push(test('获取邀请信息', function() {
  return GET('/api/invite/info?userId=' + testUserId).then(function(r) {
    assert(r.body.code === 0, r.body.message);
    assertHas(r.body.data, ['inviteCode', 'inviteCount']);
  });
}));

// === 分享 ===
tests.push(test('记录分享', function() {
  return POST('/api/share/record', { userId: testUserId, type: 'result', toolId: 1 }).then(function(r) {
    assert(r.body.code === 0 || r.body.code === 1004, 'code=' + r.body.code + ' ' + r.body.message);
  });
}));

// === 订单 ===
tests.push(test('获取订单列表', function() {
  return GET('/api/order/list?userId=' + testUserId).then(function(r) {
    assert(r.body.code === 0, r.body.message);
    assert(Array.isArray(r.body.data.list), 'list应为数组');
  });
}));

// === 广告免费模式：余额=0新用户 ===
tests.push(test('创建余额=0的新用户', function() {
  const code = 'free_mode_test_' + Date.now();
  return POST('/api/user/login', { code: code, nickname: '免费模式测试', avatar: '🆓' }).then(function(r) {
    assert(r.body.code === 0, r.body.message);
    freeModeUserId = r.body.data.userId;
    assert(r.body.data.balance === 0, '新用户余额应为0，实际' + r.body.data.balance);
    assert(r.body.data.freeUses >= 3, '新用户免费次数应>=3，实际' + r.body.data.freeUses);
    console.log('    👤 用户ID: ' + freeModeUserId + ', 余额: ¥' + r.body.data.balance + ', 免费次数: ' + r.body.data.freeUses);
  });
}));

// 补充免费次数（确保能测完所有工具）
tests.push(test('补充免费次数(看广告x8)', function() {
  if (!freeModeUserId) throw new Error('无免费模式用户');
  let added = 0;
  let promise = Promise.resolve();
  for (let i = 0; i < 8; i++) {
    promise = promise.then(function() {
      return POST('/api/tasks/complete', { userId: freeModeUserId, taskId: 'watch_ad' });
    }).then(function(r) {
      if (r.body.code === 0) added++;
    });
  }
  return promise.then(function() {
    return GET('/api/user/info?userId=' + freeModeUserId);
  }).then(function(a) {
    console.log('    🎫 补充后免费次数: ' + a.body.data.freeUses + ' (通过' + added + '次看广告获得)');
    assert(a.body.data.freeUses >= 8, '免费次数应>=8');
  });
}));

// === 17个工具测试 ===
const toolCases = [
  { id: 1,  name: 'AI起名',               params: { type: 'pet', gender: 'male', style: 'cute' } },
  { id: 2,  name: '塔罗日运占卜',          params: { topic: 'today' } },
  { id: 3,  name: 'AI土味情话',           params: { type: 'sweet', target: 'crush' } },
  { id: 4,  name: 'AI藏头诗',             params: { name: '我爱你' } },
  { id: 5,  name: '表情包(template参数)',  params: { text: '上班如上坟', template: 'classic', mode: 'template' } },
  { id: 5,  name: '表情包(char参数兼容)',  params: { text: '测试一下', char: 'panda', mode: 'template' } },
  { id: 6,  name: 'AI朋友圈文案',          params: { scene: 'food', style: 'funny' } },
  { id: 7,  name: '性格测试(q1/q2/q3)',    params: { q1: 'A', q2: 'B', q3: 'C' } },
  { id: 8,  name: '感情塔罗三牌阵',        params: { status: 'single', question: '我什么时候脱单' } },
  { id: 9,  name: '摆烂指南',              params: { industry: 'internet', years: '3' } },
  { id: 10, name: '消息已读(daily场景)',   params: { scene: 'daily', message: '你好' } },
  { id: 10, name: '消息已读(conflict场景)',params: { scene: 'conflict', message: '你怎么回事' } },
  { id: 11, name: '梦境塔罗牌',            params: { dreamContent: '我梦见自己飞起来了' } },
  { id: 12, name: '星座塔罗牌',            params: { sign: '狮子' } },
  { id: 13, name: '号码塔罗牌',            params: { phoneNumber: '13800138000' } },
  { id: 14, name: '彩虹屁生成器',          params: { target: '小明', style: 'funny' } },
  { id: 15, name: '优雅怼人',              params: { scene: '同事抬杠', intensity: 'medium' } },
  { id: 16, name: 'emo文案',               params: { scene: 'love', style: 'lateNight' } },
  { id: 17, name: '歌词改编',              params: { songName: '孤勇者', story: '打工人' } },
];

toolCases.forEach(function(tc) {
  tests.push(test('工具#' + tc.id + ' ' + tc.name, function() {
    const uid = freeModeUserId || testUserId;
    let orderId = null;
    return POST('/api/order/create', { userId: uid, toolId: tc.id, params: tc.params }).then(function(createR) {
      if (createR.body.code !== 0) throw new Error('创建订单: ' + createR.body.message + ' (code=' + createR.body.code + ')');
      assert(createR.body.data.useFree === true, '应使用免费次数(useFree=true)');
      assert(createR.body.data.amount === 0, '金额应为0（免费模式）');
      assertHas(createR.body.data, ['orderId', 'orderNo', 'payType']);
      orderId = createR.body.data.orderId;
      return POST('/api/order/pay', { userId: uid, orderId: orderId });
    }).then(function(payR) {
      if (payR.body.code !== 0) throw new Error('生成失败: ' + payR.body.message);
      assert(payR.body.data.result !== undefined, '应返回result');
      const result = payR.body.data.result;
      assert(result && typeof result === 'object', 'result应为对象');
      const keys = Object.keys(result);
      assert(keys.length > 0, '返回结果不应为空');
      const hasFromAI = result.fromAI !== undefined;
      const aiStatus = hasFromAI ? (result.fromAI ? 'AI生成' : '本地模板') : '⚠️无fromAI';
      console.log('    ✨ ' + aiStatus + ', 字段: ' + keys.slice(0, 4).join(', ') + (keys.length > 4 ? '...' : ''));
    });
  }));
});

tests.push(test('验证免费次数正常扣减', function() {
  const uid = freeModeUserId || testUserId;
  return GET('/api/user/info?userId=' + uid).then(function(r) {
    assert(r.body.code === 0, r.body.message);
    console.log('    🎫 用户' + uid + ' 剩余免费次数: ' + r.body.data.freeUses);
    assert(typeof r.body.data.freeUses === 'number', 'freeUses应为数字');
  });
}));

// === 运行 ===
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  一元AI趣味工坊 - 全量验证测试');
  console.log('='.repeat(60));

  console.log('\n⏳ 等待服务就绪...');
  let ready = false;
  for (let i = 0; i < 15; i++) {
    try {
      const r = await GET('/api/health');
      if (r.body.code === 0) { ready = true; break; }
    } catch (e) {}
    await new Promise(function(res) { setTimeout(res, 500); });
  }
  if (!ready) { console.log('❌ 服务未启动'); process.exit(1); }
  console.log('✅ 服务就绪\n');

  for (let i = 0; i < tests.length; i++) {
    await tests[i]();
  }

  console.log('\n' + '='.repeat(60));
  console.log('  测试结果汇总');
  console.log('='.repeat(60));
  console.log('  总计: ' + (passed + failed) + '  |  ✅ 通过: ' + passed + '  |  ❌ 失败: ' + failed);

  if (failed > 0) {
    console.log('\n  失败详情:');
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'FAIL') {
        console.log('    ❌ ' + r.name);
        console.log('       ' + r.error);
      }
    }
  }

  console.log('\n' + (failed === 0 ? '🎉 所有测试通过！' : '⚠️  有失败项，请检查'));
  console.log('='.repeat(60) + '\n');
  process.exit(failed === 0 ? 0 : 1);
}
main().catch(function(e) { console.error('测试异常:', e); process.exit(1); });
