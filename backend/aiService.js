// ===== AI服务模块 =====
// 支持豆包(火山方舟) / 千问(阿里云百炼) / 无AI(本地降级)
// 配置方式：设置环境变量 AI_PROVIDER / AI_API_KEY / AI_MODEL

const https = require('https');

// 配置
const config = {
  provider: process.env.AI_PROVIDER || 'none', // 'doubao' | 'qwen' | 'none'
  apiKey: process.env.AI_API_KEY || '',
  model: process.env.AI_MODEL || '',
  endpoint: process.env.AI_ENDPOINT || ''
};

// 豆包模型默认值
const DOUBAO_MODEL = 'doubao-lite-4k';
const DOUBAO_ENDPOINT = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

// 千问模型默认值
const QWEN_MODEL = 'qwen-turbo';
const QWEN_ENDPOINT = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// 检查是否配置了真实AI
function isEnabled() {
  return config.provider !== 'none' && config.apiKey;
}

// 通用聊天接口
function chat(messages, options = {}) {
  return new Promise((resolve, reject) => {
    if (!isEnabled()) {
      return reject(new Error('AI未配置'));
    }

    const provider = config.provider;
    
    if (provider === 'doubao') {
      callDoubao(messages, options).then(resolve).catch(reject);
    } else if (provider === 'qwen') {
      callQwen(messages, options).then(resolve).catch(reject);
    } else {
      reject(new Error('不支持的AI提供商: ' + provider));
    }
  });
}

// ===== 豆包（火山方舟）=====
function callDoubao(messages, options = {}) {
  return new Promise((resolve, reject) => {
    const model = options.model || config.model || DOUBAO_MODEL;
    const endpoint = config.endpoint || DOUBAO_ENDPOINT;
    
    const postData = JSON.stringify({
      model: model,
      messages: messages,
      temperature: options.temperature !== undefined ? options.temperature : 0.7,
      max_tokens: options.maxTokens || 1024
    });
    
    const url = new URL(endpoint);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      }
    };
    
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.choices && result.choices[0]) {
            resolve({
              content: result.choices[0].message.content,
              usage: result.usage,
              raw: result
            });
          } else {
            reject(new Error('AI返回格式异常: ' + data));
          }
        } catch (e) {
          reject(new Error('AI返回解析失败: ' + data));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ===== 千问（阿里云百炼）=====
function callQwen(messages, options = {}) {
  return new Promise((resolve, reject) => {
    const model = options.model || config.model || QWEN_MODEL;
    const endpoint = config.endpoint || QWEN_ENDPOINT;
    
    const postData = JSON.stringify({
      model: model,
      messages: messages,
      temperature: options.temperature !== undefined ? options.temperature : 0.7,
      max_tokens: options.maxTokens || 1024
    });
    
    const url = new URL(endpoint);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      }
    };
    
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.choices && result.choices[0]) {
            resolve({
              content: result.choices[0].message.content,
              usage: result.usage,
              raw: result
            });
          } else {
            reject(new Error('AI返回格式异常: ' + data));
          }
        } catch (e) {
          reject(new Error('AI返回解析失败: ' + data));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ===== 职业规划生成 =====
async function generateCareerPlan(info) {
  const { age, personality, hobby, industry, years } = info;
  
  // 如果没配置AI，返回本地模板
  if (!isEnabled()) {
    return generateLocalCareerPlan(info);
  }
  
  const prompt = `你是一位资深的中文职业规划师。请根据以下用户信息，给出一份专业的职业规划建议，所有内容必须用中文回答：

【用户信息】
- 年龄：${age}岁
- 性格：${personality}
- 兴趣爱好：${hobby === '1' ? '兴趣爱好广泛' : '兴趣爱好不多，喜欢宅'}
- 当前行业：${industry}
- 工作年限：${years}年

请用纯JSON格式返回，字段如下：
{
  "personalityType": "性格类型（如：创意型/实干型/社交型/思考型等，4-6个字）",
  "suitableCareers": ["适合的职业1", "适合的职业2", "适合的职业3", "适合的职业4"],
  "coreAdvice": "核心建议（80-100字，纯中文）",
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["劣势1", "劣势2"],
  "salaryRange": "薪资范围（如：15K-30K/月）",
  "developmentPath": "发展路径建议（分阶段描述，100-150字，纯中文）",
  "learningSuggestions": ["学习建议1", "学习建议2", "学习建议3"]
}

重要要求：
1. 所有内容必须是纯中文，不要出现英文
2. 只返回JSON对象本身，不要任何解释、说明或markdown格式
3. 建议要结合用户的具体年龄、性格、行业、年限，给出针对性的分析`;

  try {
    const result = await chat([
      { role: 'system', content: '你是一位专业的职业规划师，擅长根据用户性格和背景给出精准的职业建议。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.8, maxTokens: 800 });
    
    // 尝试解析JSON
    let jsonStr = result.content.trim();
    // 去掉可能的markdown代码块标记
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    
    const data = JSON.parse(jsonStr);
    return {
      personality: data.personalityType || '综合型',
      suitable: data.suitableCareers || [],
      advice: data.coreAdvice || '',
      strengths: data.strengths || [],
      weaknesses: data.weaknesses || [],
      salaryRange: data.salaryRange || '',
      developmentPath: data.developmentPath || '',
      learningSuggestions: data.learningSuggestions || [],
      fromAI: true
    };
  } catch (err) {
    console.error('AI职业规划生成失败，降级到本地模板:', err.message);
    return generateLocalCareerPlan(info);
  }
}

// ===== 本地降级版职业规划 =====
function generateLocalCareerPlan(info) {
  const { age, personality, hobby, industry, years } = info;
  
  // 性格 → 类型映射
  const personalityMap = {
    '外向开朗': { type: '社交型', strengths: ['沟通能力强', '人脉资源广', '团队协作好'], weaknesses: ['不够专注', '容易浮躁'] },
    '内向慢热': { type: '思考型', strengths: ['深度思考', '专注力强', '做事踏实'], weaknesses: ['社交偏弱', '表达需提升'] },
    '活泼好动': { type: '创意型', strengths: ['创意丰富', '执行力强', '适应力好'], weaknesses: ['耐心不足', '容易三分钟热度'] },
    '安静沉稳': { type: '实干型', strengths: ['认真负责', '稳定性高', '逻辑清晰'], weaknesses: ['偏保守', '突破力不足'] }
  };
  
  const p = personalityMap[personality] || personalityMap['安静沉稳'];
  
  // 行业 + 年限 → 适合职业映射
  const industryMap = {
    'internet': {
      base: ['产品经理', '运营经理', '项目经理'],
      byYears: {
        '1': ['产品助理', '运营专员', '测试工程师'],
        '3': ['产品经理', '高级运营', '项目经理'],
        '5': ['资深产品经理', '运营总监', '技术经理'],
        '10': ['产品总监', '事业部负责人', '创业者']
      }
    },
    'finance': {
      base: ['投资分析师', '财务经理', '风控专员'],
      byYears: {
        '1': ['分析师助理', '财务专员', '客户经理'],
        '3': ['投资分析师', '财务主管', '风控经理'],
        '5': ['高级分析师', '财务总监', '风控总监'],
        '10': ['投资总监', 'CFO', '基金经理']
      }
    },
    'education': {
      base: ['课程设计师', '教学主管', '教育产品经理'],
      byYears: {
        '1': ['助教', '课程顾问', '教研助理'],
        '3': ['主讲老师', '教研主管', '产品经理'],
        '5': ['教学总监', '教研负责人', '产品总监'],
        '10': ['校长', '教育创业者', '内容合伙人']
      }
    },
    'medical': {
      base: ['健康管理师', '医药代表', '医疗产品经理'],
      byYears: {
        '1': ['住院医师', '医药代表', '健康顾问'],
        '3': ['主治医师', '区域经理', '产品经理'],
        '5': ['副主任医师', '销售总监', '医疗产品总监'],
        '10': ['主任医师', '事业部总经理', '医疗创业者']
      }
    },
    'other': {
      base: ['项目经理', '销售经理', '自主创业'],
      byYears: {
        '1': ['管培生', '销售助理', '行政专员'],
        '3': ['项目经理', '销售主管', '部门主管'],
        '5': ['部门经理', '销售总监', '运营总监'],
        '10': ['副总', '总经理', '创业者']
      }
    }
  };
  
  const ind = industryMap[industry] || industryMap.other;
  const suitable = ind.byYears[years] || ind.base;
  
  // 薪资范围（按年限）
  const salaryMap = {
    '1': '5K-10K',
    '3': '10K-20K',
    '5': '20K-35K',
    '10': '35K-80K'
  };
  
  // 发展建议（按年龄+性格）
  let developmentPath = '';
  if (parseInt(age) <= 25) {
    developmentPath = `你还在职业起步期，建议先深耕${ind.base[0]}方向打基础。前3年重点积累专业技能和行业认知，不要频繁跳槽。${personality === '外向开朗' ? '你的性格适合多拓展人脉，为未来管理岗铺路。' : '你的性格适合深耕专业，可以考虑走专家路线。'}`;
  } else if (parseInt(age) <= 30) {
    developmentPath = `你正处于职业上升关键期，建议在${suitable[0]}方向形成核心竞争力。考虑从执行层转向管理层，或在专业领域成为专家。30岁前要确定长期赛道，${hobby === '1' ? '你的广泛爱好可以跨界发展，考虑复合型岗位。' : '专注一个方向深耕，建立护城河更重要。'}`;
  } else if (parseInt(age) <= 35) {
    developmentPath = `你已进入职业成熟期，建议往${suitable[1]}或${suitable[2]}方向突破。可以考虑带团队或独立负责业务线。35岁前要完成从"做事"到"带人"的转变，同时注意积累行业资源，为未来可能的创业或自由职业做准备。`;
  } else {
    developmentPath = `你有丰富的行业经验，建议往${suitable[2]}方向发展，或考虑内部创业、独立顾问等方向。此时你的核心价值是经验和资源，要学会把经验变现，同时保持学习，避免被年轻人替代。`;
  }
  
  // 学习建议
  let learningSuggestions = [];
  if (industry === 'internet') {
    learningSuggestions = ['系统学习产品思维和数据分析', '关注行业前沿趋势（AI/出海等）', '积累跨部门协作经验'];
  } else if (industry === 'finance') {
    learningSuggestions = ['考取相关职业资格证书', '提升宏观经济分析能力', '拓展高端人脉资源'];
  } else if (industry === 'education') {
    learningSuggestions = ['打磨教学教研能力', '学习课程设计和产品思维', '建立个人品牌影响力'];
  } else {
    learningSuggestions = ['提升项目管理能力', '培养商业思维和大局观', '持续学习保持竞争力'];
  }
  
  return {
    personality: p.type,
    suitable: suitable,
    advice: `你是${p.type}人格，适合从事与人打交道或需要深度思考的工作。建议结合${industry === 'other' ? '自身兴趣' : industry + '行业'}特点，找到最适合的切入点。`,
    strengths: p.strengths,
    weaknesses: p.weaknesses,
    salaryRange: salaryMap[years] || '10K-25K',
    developmentPath: developmentPath,
    learningSuggestions: learningSuggestions,
    fromAI: false
  };
}

// ===== 摆烂指南 =====
async function generateLazyGuide(industry, years) {
  if (!isEnabled()) {
    return generateLocalLazyGuide(industry, years);
  }
  
  const industryNames = {
    internet: '互联网/IT',
    finance: '金融/经济',
    education: '教育/培训',
    medical: '医疗/健康',
    other: '其他行业'
  };
  
  const prompt = `你是一个毒舌又真实的职场博主，专门分析"该继续卷还是直接摆烂"。
用户情况：
- 行业：${industryNames[industry] || '其他'}
- 工作年限：${years}年

请用幽默犀利的语气，给出"卷 vs 摆烂"的分析，用纯JSON格式返回：
{
  "verdict": "建议卷 / 建议摆烂 / 半卷半摆（4个字）",
  "score": 摆烂指数0-100,
  "reason": "为什么给这个建议，50-80字，幽默毒舌一点",
  "pros_roll": ["继续卷的好处1", "继续卷的好处2", "继续卷的好处3"],
  "pros_lazy": ["摆烂的好处1", "摆烂的好处2", "摆烂的好处3"],
  "warning": "摆烂的风险/代价，一句话",
  "suggestion": "最终建议，30-50字",
  "motto": "一句毒舌金句，15字以内"
}
语气要像李雪琴+杨笠那种，又好笑又扎心，让人一边笑一边觉得"说得对"。`;
  
  try {
    const result = await chat([
      { role: 'system', content: '你是毒舌职场博主，擅长用幽默犀利的语气分析职场问题。输出严格遵守JSON格式。' },
      { role: 'user', content: prompt }
    ]);
    let jsonStr = result.content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(jsonStr);
    return { ...parsed, fromAI: true };
  } catch (err) {
    return generateLocalLazyGuide(industry, years);
  }
}

function generateLocalLazyGuide(industry, years) {
  const y = parseInt(years) || 1;
  
  // 行业+年限 → 摆烂指数
  const baseScores = {
    internet: 75,
    finance: 60,
    education: 45,
    medical: 35,
    other: 55
  };
  let score = baseScores[industry] || 55;
  score += y * 2; // 工龄越长越想摆
  score = Math.min(95, Math.max(20, score));
  
  const verdicts = [
    { min: 80, text: '建议摆烂', reason: '都卷成这样了，命要紧。不如躺平看看世界，反正天塌下来有高个子顶着。' },
    { min: 60, text: '半卷半摆', reason: '卷也卷不动，躺也躺不平。建议工作日摆烂、周末卷一下，或者反过来。' },
    { min: 40, text: '谨慎摆烂', reason: '现在还不是摆烂的时候，再攒攒底气。等钱包厚了，想怎么烂怎么烂。' },
    { min: 0, text: '继续卷吧', reason: '你还年轻，摆烂的日子在后头呢。现在多卷一卷，以后烂得更安心。' }
  ];
  const v = verdicts.find(v => score >= v.min) || verdicts[verdicts.length - 1];
  
  return {
    verdict: v.text,
    score: score,
    reason: v.reason,
    pros_roll: [
      '钱包越来越鼓，说话越来越硬',
      '积累经验和人脉，以后想烂也有资本',
      '万一卷上去了呢？梦想还是要有的'
    ],
    pros_lazy: [
      '头发保住了，心情变好了',
      '终于有时间追剧打游戏谈恋爱',
      '上班如上坟 → 上班如上茶馆'
    ],
    warning: '摆烂一时爽，一直摆一直爽，但钱包可能会哭。',
    suggestion: score >= 70
      ? '建议先摆一个月试试，爽了就继续，不爽再回来卷，反正不亏。'
      : '再卷个一两年，攒够底气了再考虑摆烂的事。',
    motto: score >= 70 ? '摆烂是门艺术' : '卷王永不言败',
    fromAI: false
  };
}

// ===== AI起名 =====
async function generateName(type, gender, style) {
  if (!isEnabled()) {
    return generateLocalName(type, gender, style);
  }
  
  const typeMap = { pet: '宠物', baby: '宝宝', nickname: '网名/昵称', web: '网名/昵称', company: '公司/品牌' };
  const typeName = typeMap[type] || '昵称';
  const genderMap = { male: '男/公', boy: '男/公', female: '女/母', girl: '女/母', neutral: '中性' };
  const genderName = genderMap[gender] || '中性';
  const styleMap = { cute: '可爱萌系', cool: '酷炫霸气', literary: '文艺清新', funny: '搞笑沙雕', elegant: '优雅高级' };
  const styleName = styleMap[style] || '可爱';
  
  const prompt = `请为${typeName}起6个好听的名字。
要求：
- 性别倾向：${genderName}
- 风格：${styleName}
- 每个名字附带一句简短的寓意或解释（10字以内）
- 名字要新颖不俗气，朗朗上口

请用JSON格式返回：
{
  "names": [
    {"name": "名字1", "meaning": "寓意1"},
    {"name": "名字2", "meaning": "寓意2"},
    {"name": "名字3", "meaning": "寓意3"},
    {"name": "名字4", "meaning": "寓意4"},
    {"name": "名字5", "meaning": "寓意5"},
    {"name": "名字6", "meaning": "寓意6"}
  ]
}

只返回JSON，不要其他文字。所有内容用中文。`;

  try {
    const result = await chat([
      { role: 'system', content: '你是一位创意起名专家，擅长起各种类型的好名字。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.9, maxTokens: 500 });
    
    let jsonStr = result.content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    const data = JSON.parse(jsonStr);
    return { names: data.names || [], fromAI: true };
  } catch (err) {
    console.error('AI起名失败:', err.message);
    return generateLocalName(type, gender, style);
  }
}

function generateLocalName(type, gender, style) {
  const names = [
    { name: '糯米', meaning: '软糯可爱' },
    { name: '团子', meaning: '圆滚滚的萌' },
    { name: '豆豆', meaning: '小巧灵动' },
    { name: '奶茶', meaning: '甜蜜温暖' },
    { name: '布丁', meaning: 'Q弹可爱' },
    { name: '麻薯', meaning: '软萌治愈' }
  ];
  return { names, fromAI: false };
}

// ===== 塔罗牌数据（大阿尔卡纳22张）=====
const TAROT_MAJOR = [
  { name: '愚者', emoji: '🃏', meaning: '新的开始、纯真、无限可能' },
  { name: '魔术师', emoji: '🎩', meaning: '创造力、自信、心想事成' },
  { name: '女祭司', emoji: '🌙', meaning: '直觉、智慧、倾听内心的声音' },
  { name: '皇后', emoji: '👑', meaning: '丰盛、滋养、温柔的力量' },
  { name: '皇帝', emoji: '🏛️', meaning: '掌控、秩序、执行力' },
  { name: '教皇', emoji: '📜', meaning: '指引、学习、精神成长' },
  { name: '恋人', emoji: '💕', meaning: '爱与联结、重要的选择' },
  { name: '战车', emoji: '🏎️', meaning: '意志力、前进、克服困难' },
  { name: '力量', emoji: '🦁', meaning: '内在勇气、温柔而坚定' },
  { name: '隐者', emoji: '🏮', meaning: '独处、反思、寻找答案' },
  { name: '命运之轮', emoji: '🎡', meaning: '转折、机遇、顺势而为' },
  { name: '正义', emoji: '⚖️', meaning: '公平、因果、做出抉择' },
  { name: '倒吊人', emoji: '🙃', meaning: '换个角度、暂停、以退为进' },
  { name: '死神', emoji: '🍂', meaning: '结束与重生、放下过去' },
  { name: '节制', emoji: '🍶', meaning: '平衡、耐心、调和' },
  { name: '恶魔', emoji: '😈', meaning: '欲望、束缚、看清执念' },
  { name: '高塔', emoji: '🗼', meaning: '突变、打破旧格局、重建' },
  { name: '星星', emoji: '⭐', meaning: '希望、灵感、治愈' },
  { name: '月亮', emoji: '🌜', meaning: '潜意识、迷茫、相信直觉' },
  { name: '太阳', emoji: '☀️', meaning: '快乐、成功、活力满满' },
  { name: '审判', emoji: '📯', meaning: '觉醒、答案揭晓、重新出发' },
  { name: '世界', emoji: '🌍', meaning: '圆满、达成、新的循环' }
];

// 抽塔罗牌：count 张，约 35% 概率逆位
function drawTarot(count = 1) {
  const cards = [];
  for (let i = 0; i < count; i++) {
    const card = TAROT_MAJOR[Math.floor(Math.random() * TAROT_MAJOR.length)];
    cards.push({ ...card, reversed: Math.random() < 0.35 });
  }
  return cards;
}

// 把塔罗牌格式化成文案片段
function tarotCardStr(card) {
  return `【${card.name}${card.emoji}】${card.reversed ? '逆位' : '正位'}`;
}

// ===== 2. 塔罗日运占卜 =====
async function generateFortune(topic) {
  if (!isEnabled()) {
    return generateLocalFortune(topic);
  }

  const today = new Date().toLocaleDateString('zh-CN');
  const card = drawTarot(1)[0];
  const topicName = { today: '今日整体运', love: '感情运', career: '事业运', wealth: '财运' }[topic] || topic || '今日整体运';

  const prompt = `请做一次塔罗牌占卜解读。用户在今天（${today}）想问「${topicName}」，抽到了一张${tarotCardStr(card)}。

请用JSON格式返回：
{
  "overallScore": 85,
  "cardName": "${card.name}",
  "cardEmoji": "${card.emoji}",
  "reversed": ${card.reversed},
  "cardMeaning": "这张牌的核心寓意，25字以内",
  "overallText": "结合「${topicName}」的整体解读，80-100字",
  "loveText": "感情方面的提示，40-60字",
  "careerText": "事业/学业方面的提示，40-60字",
  "wealthText": "财运方面的提示，40-60字",
  "suggestion": "今天的一个小建议，30-50字",
  "todaysMotto": "一句塔罗寄语，20字以内"
}

只返回JSON，不要其他文字。所有内容用中文，语气像一个温柔有趣的塔罗占卜师，积极向上。`;

  try {
    const result = await chat([
      { role: 'system', content: '你是一位温柔有趣的塔罗占卜师，擅长把牌意讲得通俗易懂又给人力量。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.8, maxTokens: 600 });

    let jsonStr = result.content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    const data = JSON.parse(jsonStr);
    return { ...data, fromAI: true };
  } catch (err) {
    console.error('AI塔罗占卜生成失败:', err.message);
    return generateLocalFortune(topic);
  }
}

function generateLocalFortune(topic) {
  const card = drawTarot(1)[0];
  const topicName = { today: '今日整体运', love: '感情运', career: '事业运', wealth: '财运' }[topic] || topic || '今日整体运';
  const positive = card.reversed ? '逆位提醒你换个角度看问题' : '正位能量顺畅';

  return {
    overallScore: 78,
    cardName: card.name,
    cardEmoji: card.emoji,
    reversed: card.reversed,
    cardMeaning: card.meaning,
    overallText: `今天的你抽到了${tarotCardStr(card)}。关于「${topicName}」，这张牌的关键词是「${card.meaning}」。${positive}，保持开放的心态，今天会有不错的体验。`,
    loveText: '感情上适合真诚表达，单身的多出门走走，有伴的多夸夸对方。',
    careerText: '工作学习上稳扎稳打就好，别急于求成，小事也能积累成就感。',
    wealthText: '财运平稳，理性消费，小确幸比大惊喜更长久。',
    suggestion: '今天适合做一件让自己开心的小事，哪怕只是喝杯奶茶。',
    todaysMotto: '牌面有深意，生活有惊喜',
    fromAI: false
  };
}

// ===== AI土味情话 =====
async function generateLoveWords(loveType, target) {
  if (!isEnabled()) {
    return generateLocalLoveWords(loveType, target);
  }
  
  const typeName = { sweet: '甜蜜暖心', funny: '搞笑沙雕', poem: '文艺诗意', earthy: '土味尬撩', direct: '直接霸气' }[loveType] || '甜蜜';
  const targetName = { bf: '男朋友', gf: '女朋友', crush: '暗恋对象', friend: '好朋友' }[target] || '喜欢的人';
  
  const prompt = `请生成5句给${targetName}的${typeName}情话。
要求：
- 每句15-30字，不要太长
- 要新颖不俗套，让对方心动/发笑
- 符合${typeName}的风格
- 适合微信聊天用

请用JSON格式返回：
{
  "words": ["情话1", "情话2", "情话3", "情话4", "情话5"]
}

只返回JSON，不要其他文字。`;

  try {
    const result = await chat([
      { role: 'system', content: '你是一位情话大师，擅长写各种风格的情话。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.95, maxTokens: 400 });
    
    let jsonStr = result.content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    const data = JSON.parse(jsonStr);
    return { words: data.words || [], fromAI: true };
  } catch (err) {
    console.error('AI情话生成失败:', err.message);
    return generateLocalLoveWords(loveType, target);
  }
}

function generateLocalLoveWords(loveType, target) {
  const words = [
    '你知道我最喜欢什么神吗？你的眼神',
    '我是九你是三，除了你还是你',
    '你上辈子一定是碳酸饮料吧，不然我怎么一看到你就开心得冒泡',
    '最近有谣言说我喜欢你，我澄清一下——那不是谣言',
    '我怀疑你是碳酸饮料，不然我怎么一看见你就想冒泡'
  ];
  return { words, fromAI: false };
}

// ===== AI藏头诗 =====
async function generateAcrostic(name) {
  if (!isEnabled()) {
    return generateLocalAcrostic(name);
  }
  
  const chars = name.split('');
  const firstChar = chars[0] || '我';
  
  const prompt = `请以"${name}"为藏头，生成一首4句的七言藏头诗。
要求：
- 每句第一个字依次是：${chars.join('、')}
- 风格：优美浪漫，有意境
- 押韵，读起来顺口
- 适合表白或表达美好祝愿

请用JSON格式返回：
{
  "poem": ["第一句诗", "第二句诗", "第三句诗", "第四句诗"],
  "title": "诗的标题（4-6个字）",
  "explanation": "诗意解读，30-50字"
}

重要：poem是字符串数组，每个元素是一句完整的诗。只返回JSON，不要其他文字。`;

  try {
    const result = await chat([
      { role: 'system', content: '你是一位才华横溢的诗人，擅长写藏头诗。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.85, maxTokens: 400 });
    
    let jsonStr = result.content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    const data = JSON.parse(jsonStr);
    return { poem: data.poem || [], title: data.title || '', explanation: data.explanation || '', fromAI: true };
  } catch (err) {
    console.error('AI藏头诗生成失败:', err.message);
    return generateLocalAcrostic(name);
  }
}

function generateLocalAcrostic(name) {
  const chars = name.split('');
  const poem = chars.map(c => c + '花明月暗笼轻雾'.slice(1));
  return {
    poem: poem.length >= 4 ? poem.slice(0, 4) : [...poem, '月照花林皆似霰', '风吹柳影满庭芳'].slice(0, 4),
    title: `${name}赋`,
    explanation: '此诗意境优美，以景寄情，表达美好祝愿。',
    fromAI: false
  };
}

// ===== AI表情包文案 =====
async function generateMemeText(mood) {
  if (!isEnabled()) {
    return generateLocalMemeText(mood);
  }
  
  const moodName = { happy: '开心/搞怪', sad: '难过/emo', angry: '生气/怼人', love: '表白/撩', work: '上班/打工', social: '社交/尴尬' }[mood] || '搞怪';
  
  const prompt = `请生成8句${moodName}主题的表情包文案。
要求：
- 每句10字以内，简短有力
- 要是2025年最新的网络流行梗
- 搞笑、有梗、好记
- 适合印在表情包上

请用JSON格式返回：
{
  "texts": ["文案1", "文案2", "文案3", "文案4", "文案5", "文案6", "文案7", "文案8"]
}

只返回JSON，不要其他文字。`;

  try {
    const result = await chat([
      { role: 'system', content: '你是一位资深梗主，精通网络流行语和表情包文化。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.95, maxTokens: 400 });
    
    let jsonStr = result.content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    const data = JSON.parse(jsonStr);
    return { texts: data.texts || [], fromAI: true };
  } catch (err) {
    console.error('AI表情包文案生成失败:', err.message);
    return generateLocalMemeText(mood);
  }
}

function generateLocalMemeText(mood) {
  const texts = ['上班如上坟', '我太难了', '躺平', '破防了', 'emo了', '笑死', '绝绝子', 'yyds'];
  return { texts, fromAI: false };
}

// ===== AI朋友圈文案 =====
async function generateMomentText(scene, style) {
  if (!isEnabled()) {
    return generateLocalMomentText(scene, style);
  }
  
  const sceneName = { food: '美食', travel: '旅行', selfie: '自拍', mood: '心情', work: '工作', pet: '宠物' }[scene] || '生活';
  const styleName = { literary: '文艺清新', funny: '搞笑沙雕', sweet: '甜蜜温柔', cool: '酷炫拽', simple: '简约高级' }[style] || '文艺';
  
  const prompt = `请生成5条${sceneName}主题的朋友圈文案，风格是${styleName}。
要求：
- 每条20-50字，适合发朋友圈
- 要有感觉、有画面感，不矫情
- 可以适当用emoji点缀
- 配文可以搭配对应的照片

请用JSON格式返回：
{
  "texts": ["文案1", "文案2", "文案3", "文案4", "文案5"]
}

只返回JSON，不要其他文字。`;

  try {
    const result = await chat([
      { role: 'system', content: '你是一位朋友圈文案高手，擅长写各种风格的配文。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.9, maxTokens: 500 });
    
    let jsonStr = result.content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    const data = JSON.parse(jsonStr);
    return { texts: data.texts || [], fromAI: true };
  } catch (err) {
    console.error('AI朋友圈文案生成失败:', err.message);
    return generateLocalMomentText(scene, style);
  }
}

function generateLocalMomentText(scene, style) {
  const texts = [
    '生活不止眼前的苟且，还有诗和远方 🌸',
    '今天也是元气满满的一天！',
    '愿你眼里有光，心中有爱 ✨',
    '把日子过成诗，把生活过成画',
    '好好吃饭，好好睡觉，好好生活'
  ];
  return { texts, fromAI: false };
}

// ===== AI性格测试 =====
async function personalityTest(answers) {
  if (!isEnabled()) {
    return generateLocalPersonality(answers);
  }
  
  const answersStr = Object.entries(answers).map(([k,v]) => `问题${k}: ${v}`).join('；');
  
  const prompt = `根据以下测试答案，分析用户的性格：
${answersStr}

请用JSON格式返回分析结果：
{
  "type": "性格类型（4个字，如：治愈系小太阳、高冷禁欲系等）",
  "emoji": "一个代表性格的emoji",
  "desc": "性格整体描述，80-120字",
  "traits": ["性格特点1", "性格特点2", "性格特点3", "性格特点4"],
  "suitable": ["适合的职业1", "适合的职业2", "适合的职业3"],
  "loveStyle": "恋爱中的样子，40-60字",
  "friendStyle": "做朋友的样子，30-50字",
  "growthAdvice": "成长建议，30-50字"
}

只返回JSON，不要其他文字。分析要准确有趣。`;

  try {
    const result = await chat([
      { role: 'system', content: '你是一位资深心理咨询师，擅长性格分析。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.8, maxTokens: 600 });
    
    let jsonStr = result.content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    const data = JSON.parse(jsonStr);
    return {
      type: data.type || '综合型',
      emoji: data.emoji || '🌟',
      desc: data.desc || '',
      traits: data.traits || [],
      suitable: data.suitable || [],
      loveStyle: data.loveStyle || '',
      friendStyle: data.friendStyle || '',
      growthAdvice: data.growthAdvice || '',
      fromAI: true
    };
  } catch (err) {
    console.error('AI性格测试失败:', err.message);
    return generateLocalPersonality(answers);
  }
}

function generateLocalPersonality(answers) {
  return {
    type: '治愈系小太阳',
    emoji: '🌻',
    desc: '你是一个温暖善良的人，总能给身边的人带来正能量。你善于倾听，朋友有烦恼都喜欢找你倾诉。虽然有时候会有点小敏感，但总体来说你积极乐观，热爱生活。',
    traits: ['温暖善良', '善于倾听', '积极乐观', '细腻敏感'],
    suitable: ['心理咨询师', '教师', '社工'],
    loveStyle: '在恋爱中你很会照顾人，总是把对方放在第一位，是个温柔体贴的好伴侣。',
    friendStyle: '做你的朋友太幸福了，你总是那个默默支持大家的人。',
    growthAdvice: '学会多关注自己的感受，你也值得被好好对待。',
    fromAI: false
  };
}

// ===== 8. 感情塔罗三牌阵 =====
async function loveProbability(info) {
  if (!isEnabled()) {
    return generateLocalLoveProb(info);
  }

  const cards = drawTarot(3);
  const positionNames = ['过去', '现在', '未来'];
  const cardsDesc = cards.map((c, i) => `${positionNames[i]}位：${tarotCardStr(c)}`).join('；');
  const statusName = { single: '单身', secret: '暗恋中', dating: '恋爱中', married: '已婚' }[info.status] || '单身';

  const prompt = `用户目前感情状态：${statusName}。心里想问的是：「${info.question || '我的感情接下来会怎么发展？'}」
请你作为塔罗占卜师，用过去-现在-未来三牌阵为Ta解读。抽到的三张牌是：
${cards.map((c, i) => `第${i + 1}张（${positionNames[i]}）：${tarotCardStr(c)} —— 牌意「${c.meaning}」`).join('\n')}

请用JSON格式返回：
{
  "probability": 72,
  "level": "缘分较旺",
  "cardNames": [${cards.map(c => `"${c.name}"`).join(', ')}],
  "cardEmojis": [${cards.map(c => `"${c.emoji}"`).join(', ')}],
  "analysis": "结合三张牌的整体感情走向解读，80-120字",
  "advantages": ["感情中的有利点1", "感情中的有利点2"],
  "problems": ["需要注意的地方1", "需要注意的地方2"],
  "suggestions": ["具体建议1", "具体建议2", "具体建议3"],
  "bestTime": "感情好运时期（如：今年秋冬）",
  "type": "适合Ta的类型描述，30-50字"
}

注意：
- probability是0-100的整数，代表这段感情的「缘分指数」，总体偏乐观（大部分人在45%-85%之间）
- level用"缘分较淡/缘分平稳/缘分较旺/缘分很旺"四个等级
- 解读要结合三张牌的牌意和正逆位，给出希望和方向感
- 只返回JSON，不要其他文字`;

  try {
    const result = await chat([
      { role: 'system', content: '你是一位温柔专业的塔罗占卜师，擅长感情主题的牌面解读，说话有分寸感、给人力量。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.8, maxTokens: 600 });

    let jsonStr = result.content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    const data = JSON.parse(jsonStr);
    return { ...data, fromAI: true };
  } catch (err) {
    console.error('AI感情塔罗生成失败:', err.message);
    return generateLocalLoveProb(info);
  }
}

function generateLocalLoveProb(info) {
  const cards = drawTarot(3);
  const positionNames = ['过去', '现在', '未来'];
  const statusName = { single: '单身', secret: '暗恋中', dating: '恋爱中', married: '已婚' }[info.status] || '单身';

  return {
    probability: 72,
    level: '缘分较旺',
    cardNames: cards.map(c => c.name),
    cardEmojis: cards.map(c => c.emoji),
    analysis: `你抽到了三张牌：${cards.map((c, i) => `${positionNames[i]}位${tarotCardStr(c)}`).join('，')}。过去的经历塑造了现在的你，现在正是调整心态的好时机，未来的牌面显示感情会有新的转机。作为${statusName}的你，保持开放和真诚，缘分正在路上。`,
    advantages: ['真诚待人', '心态开放'],
    problems: ['有时想太多', '表达不够直接'],
    suggestions: ['多参加社交活动', '主动一点不丢人', '先把自己的生活过精彩'],
    bestTime: '今年秋冬季节',
    type: '温柔体贴、能给你安全感的人最适合你。',
    fromAI: false
  };
}

// ===== AI高情商回复 =====
async function generateEQReply(scene, message) {
  if (!isEnabled()) {
    return generateLocalEQReply(scene, message);
  }
  
  const sceneName = {
    love_quarrel: '情侣吵架',
    colleague: '同事沟通',
    leader: '领导对话',
    blind_date: '相亲聊天',
    reject: '拒绝别人',
    compliment: '回应夸奖'
  }[scene] || '日常聊天';
  
  const prompt = `场景：${sceneName}
对方说的话：${message || '你好'}

请给出3种高情商回复方案，分别对应不同风格：
1. 温柔体贴型
2. 幽默化解型  
3. 高段位回复

请用JSON格式返回：
{
  "replies": [
    {"style": "温柔体贴", "text": "回复内容", "reason": "为什么这么回复，20字"},
    {"style": "幽默化解", "text": "回复内容", "reason": "为什么这么回复，20字"},
    {"style": "高段位", "text": "回复内容", "reason": "为什么这么回复，20字"}
  ]
}

重要：每个回复必须包含style（风格名称）、text（回复内容）、reason（分析）三个字段。只返回JSON，不要其他文字。`;

  try {
    const result = await chat([
      { role: 'system', content: '你是一位高情商沟通专家，擅长各种场景的话术。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.85, maxTokens: 600 });
    
    let jsonStr = result.content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
    const data = JSON.parse(jsonStr);
    return { replies: data.replies || [], fromAI: true };
  } catch (err) {
    console.error('AI高情商回复生成失败:', err.message);
    return generateLocalEQReply(scene, message);
  }
}

function generateLocalEQReply(scene, message) {
  return {
    replies: [
      { style: '温柔体贴', text: '我理解你的感受，我们好好聊聊好吗？', reason: '先共情再沟通，拉近距离' },
      { style: '幽默化解', text: '哈哈你说得对，我这就反省一下~', reason: '用幽默化解尴尬，气氛轻松' },
      { style: '高段位', text: '你说的有道理，不过我觉得也可以换个角度看', reason: '先肯定再表达，容易被接受' }
    ],
    fromAI: false
  };
}

// ===== AI生图（通义万相）=====
function generateImage(prompt, options = {}) {
  return new Promise((resolve, reject) => {
    if (!isEnabled()) {
      return reject(new Error('AI未配置'));
    }
    
    const model = options.model || process.env.IMAGE_MODEL || 'wanx2.1-t2i-turbo';
    const size = options.size || '512*512';
    const n = options.n || 1;
    
    const postData = JSON.stringify({
      model: model,
      input: { prompt: prompt },
      parameters: { size, n }
    });
    
    const reqOptions = {
      hostname: 'dashscope.aliyuncs.com',
      port: 443,
      path: '/api/v1/services/aigc/text2image/image-synthesis',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-DashScope-Async': 'enable'
      },
      timeout: 30000
    };
    
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.output && result.output.task_id) {
            // 轮询任务结果
            pollImageTask(result.output.task_id)
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error(result.message || '生图请求失败: ' + data.slice(0, 200)));
          }
        } catch (e) {
          reject(new Error('生图请求解析失败: ' + data.slice(0, 200)));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 轮询生图任务
function pollImageTask(taskId) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 30;
    
    function check() {
      attempts++;
      const options = {
        hostname: 'dashscope.aliyuncs.com',
        port: 443,
        path: `/api/v1/tasks/${taskId}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${config.apiKey}` },
        timeout: 10000
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            const status = result.output?.task_status;
            
            if (status === 'SUCCEEDED') {
              const results = result.output?.results || [];
              resolve({
                images: results.map(r => r.url),
                usage: result.usage
              });
            } else if (status === 'FAILED') {
              reject(new Error(result.output?.message || '图片生成失败'));
            } else if (attempts >= maxAttempts) {
              reject(new Error('图片生成超时'));
            } else {
              setTimeout(check, 2000);
            }
          } catch (e) {
            reject(e);
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    }
    
    setTimeout(check, 2000);
  });
}

// AI表情包生成
async function generateMemeImage(text, style = 'panda') {
  if (!isEnabled()) {
    return { fromAI: false, useCanvas: true };
  }
  
  // 风格映射到提示词
  const stylePrompts = {
    panda: '卡通熊猫，可爱搞怪表情，白色背景，表情包风格，简洁扁平插画',
    mushroom: '卡通蘑菇头人物，逗比表情，白色背景，表情包风格，暴走漫画风格',
    doge: '柴犬Doge脸，魔性表情，白色背景，表情包风格，迷因风格',
    cat: '沙雕猫咪，贱兮兮的表情，白色背景，表情包风格，可爱搞笑',
    frog: '悲伤蛙Pepe，丧系表情，绿色调，白色背景，表情包风格',
    duck: '可达鸭，呆萌可爱表情，黄色调，白色背景，表情包风格'
  };
  
  const stylePrompt = stylePrompts[style] || stylePrompts.panda;
  const prompt = `${stylePrompt}，表情包配文"${text}"，文字清晰醒目，粗体字，整体风格搞笑有趣，正方形构图`;
  
  try {
    const result = await generateImage(prompt, { size: '512*512' });
    return {
      imageUrl: result.images[0],
      fromAI: true,
      text: text,
      style: style
    };
  } catch (err) {
    console.error('AI表情包生成失败，降级到Canvas:', err.message);
    return { fromAI: false, useCanvas: true, text, style };
  }
}

// ===== 11. 梦境塔罗牌 =====
async function generateDreamInterpretation(dreamContent) {
  const card = drawTarot(1)[0];
  const systemPrompt = `你是一位温柔的塔罗占卜师，擅长用塔罗牌的意象来解读梦境。用户会告诉你梦见了什么，你要结合抽到的塔罗牌给Ta解读。解读要包含：
1. 一个吸引人的标题（比如"梦见这个，塔罗牌说……"）
2. 抽到的塔罗牌介绍（牌名+正逆位+核心牌意）
3. 梦境解读（把梦境意象和牌意结合起来，幽默一点但要有温度，像在跟朋友聊天）
4. 潜意识提示（这个梦可能在提醒Ta什么）
5. 一个温柔的小建议
格式要清晰，用emoji点缀，语气像一个温柔又有趣的塔罗师。不要太长，控制在300字以内。最后加一句"（塔罗解读纯属娱乐，轻松听听就好~）"`;
  const userContent = `我梦见了：${dreamContent}\n\n我今天为你抽到的塔罗牌是：${tarotCardStr(card)}，这张牌的核心寓意是「${card.meaning}」。请结合这张牌帮我解读这个梦。`;

  try {
    const result = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]);
    return { text: result.content, fromAI: true };
  } catch (err) {
    return generateLocalDream(dreamContent);
  }
}

function generateLocalDream(dreamContent) {
  const card = drawTarot(1)[0];
  const titles = [
    '塔罗牌说：这个梦有玄机',
    '抽到这张牌，你的梦有解了',
    '塔罗解读时间到~',
    '这张牌，正好说中你的梦'
  ];
  const analyses = [
    `你梦见了「${dreamContent}」，这很有意思。结合你抽到的${tarotCardStr(card)}，这张牌的关键词是「${card.meaning}」。你的潜意识可能在通过这个梦，提醒你最近多关注自己内心的感受。`,
    `塔罗牌显示，梦见「${dreamContent}」和你最近的心情有关。${tarotCardStr(card)}的出现，说明你内心其实已经有答案了，只是还需要一点时间确认。`,
    `从塔罗的角度看，梦见「${dreamContent}」配合${tarotCardStr(card)}，是个不错的组合。这张牌的寓意「${card.meaning}」正好对应你梦里的情绪，说明你在潜意识里正在消化一些东西。`
  ];
  const goods = ['好好睡一觉', '跟朋友聊聊', '吃顿好的', '听听音乐', '晒晒太阳', '把梦写下来'];
  const numbers = [3, 7, 8, 9, 12, 16, 23, 66, 88, 99];
  const colors = ['金色', '紫色', '粉色', '蓝色', '绿色', '红色'];

  const goodList = goods.sort(() => Math.random() - 0.5).slice(0, 3);

  const text = `## ${titles[Math.floor(Math.random() * titles.length)]}

### 🃏 今日梦境指引牌
${tarotCardStr(card)} —— 「${card.meaning}」

### 📖 梦境解读
${analyses[Math.floor(Math.random() * analyses.length)]}

### 💡 潜意识提示
这个梦可能在提醒你：最近别太累着自己，有些事顺其自然就好。

### ✅ 今天适合
${goodList.map(g => `· ${g}`).join('  ')}

### 🍀 塔罗小幸运
幸运数字：${numbers[Math.floor(Math.random() * numbers.length)]}
幸运颜色：${colors[Math.floor(Math.random() * colors.length)]}

*（塔罗解读纯属娱乐，轻松听听就好~）*`;

  return { text, fromAI: false };
}

// ===== 12. 星座塔罗牌 =====
async function generateHoroscope(sign) {
  const card = drawTarot(1)[0];
  const systemPrompt = `你是一位有趣的塔罗占卜师，今天要为某个星座抽一张塔罗指引牌。解读要包含：
1. 标题（如"天蝎座今日塔罗指引"）
2. 今日指引塔罗牌（牌名+正逆位+核心寓意）
3. 整体能量（1-5颗星）
4. 爱情提示
5. 事业/学业提示
6. 财运提示
7. 今日宜/忌
8. 幸运色 + 幸运数字
语气要轻松愉快，像朋友聊天，可以适当毒舌但要有分寸。用emoji点缀，不要太长，300字以内。`;
  const userContent = `请为${sign}座抽一张今日塔罗指引牌并解读。我今天抽到的牌是：${tarotCardStr(card)}，这张牌的核心寓意是「${card.meaning}」。请围绕这张牌给${sign}座写今日指引。`;

  try {
    const result = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]);
    return { text: result.content, fromAI: true };
  } catch (err) {
    return generateLocalHoroscope(sign);
  }
}

function generateLocalHoroscope(sign) {
  const card = drawTarot(1)[0];
  const stars = Math.floor(Math.random() * 2) + 3; // 3-5星
  const starStr = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);

  const loveTexts = [
    '单身的朋友今天魅力在线，可能会遇到心动的人哦~',
    '有伴的今天感情升温，适合一起吃顿好的。',
    '感情运平平，别太着急，好事多磨。',
    '今天适合默默发光，会有人注意到你的。'
  ];
  const workTexts = [
    '工作/学习效率超高，事半功倍！',
    '今天有点想摸鱼，没关系，偶尔摆烂也是充电。',
    '会有小挑战，但你完全能搞定。',
    '适合整理和复盘，磨刀不误砍柴工。'
  ];
  const moneyTexts = [
    '财运不错，可能有小惊喜~',
    '财运一般，忍住别剁手！',
    '偏财旺，买张彩票试试？',
    '今天看好钱包，理性消费。'
  ];

  const goods = ['喝奶茶', '早睡', '运动', '看书', '听音乐', '吃火锅'];
  const bads = ['熬夜', '冲动消费', '跟人对线', '立flag', '查账单'];
  const goodList = goods.sort(() => Math.random() - 0.5).slice(0, 3);
  const badList = bads.sort(() => Math.random() - 0.5).slice(0, 2);

  const luckyColors = ['粉色', '金色', '蓝色', '绿色', '紫色', '白色'];
  const luckyNums = [3, 5, 7, 8, 9, 12, 23, 66];

  const text = `## ${sign}座今日塔罗指引 🌟

### 🃏 今日指引牌
${tarotCardStr(card)} —— 「${card.meaning}」

### 综合能量：${starStr}

### 💕 爱情提示
${loveTexts[Math.floor(Math.random() * loveTexts.length)]}

### 💼 事业/学业
${workTexts[Math.floor(Math.random() * workTexts.length)]}

### 💰 财运
${moneyTexts[Math.floor(Math.random() * moneyTexts.length)]}

### ✅ 宜
${goodList.map(g => `· ${g}`).join('  ')}

### ❌ 忌
${badList.map(b => `· ${b}`).join('  ')}

### 🍀 今日幸运
幸运色：${luckyColors[Math.floor(Math.random() * luckyColors.length)]}
幸运数字：${luckyNums[Math.floor(Math.random() * luckyNums.length)]}

*（塔罗指引纯属娱乐，轻松听一听~）*`;

  return { text, fromAI: false };
}

// ===== 13. 号码塔罗牌 =====
async function generatePhoneFortune(phoneNumber) {
  // 用手机号数字求和，映射到大阿尔卡纳（0-21）
  const digits = phoneNumber.replace(/\D/g, '').split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  const card = TAROT_MAJOR[sum % TAROT_MAJOR.length];

  const systemPrompt = `你是一位有趣的塔罗占卜师，擅长把手机号码的数字能量和塔罗牌联系起来解读（这是一种数字塔罗的小玩法）。解读要包含：
1. 标题（如"号码塔罗：这个号藏着这样的能量"）
2. 号码对应的塔罗牌（牌名+正逆位+核心寓意）
3. 号码总评分（0-100分）
4. 财运 / 事业运 / 桃花运（每项1-5星）
5. 适合什么样的人用
6. 使用建议
语气幽默轻松，像朋友聊天，用emoji点缀，300字以内。`;
  const userContent = `帮我解读这个手机号：${phoneNumber}。我把号码所有数字相加再对应大阿尔卡纳，得到的是${tarotCardStr(card)}，这张牌的核心寓意是「${card.meaning}」。请围绕这张牌解读这个号码。`;

  try {
    const result = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]);
    return { text: result.content, fromAI: true };
  } catch (err) {
    return generateLocalPhoneFortune(phoneNumber);
  }
}

function generateLocalPhoneFortune(phoneNumber) {
  const digits = phoneNumber.replace(/\D/g, '').split('').map(Number);
  const sum = digits.reduce((a, b) => a + b, 0);
  const card = TAROT_MAJOR[sum % TAROT_MAJOR.length];
  const score = Math.min(98, 62 + (sum % 36));

  const comments = [
    '这个号码，和塔罗牌有点缘分。',
    '好家伙，这号对应的牌挺有意思！',
    '数字相加之后，答案浮出水面了。',
    '这号儿，越用越有感觉。',
    '隐藏的数字能量，被你发现了。'
  ];

  const fortuneStars = {
    money: Math.floor(Math.random() * 2) + 3,
    career: Math.floor(Math.random() * 2) + 3,
    love: Math.floor(Math.random() * 2) + 3
  };

  const toStar = n => '⭐'.repeat(n) + '☆'.repeat(5 - n);

  const suggestions = [
    '建议多用这个号点外卖，塔罗牌说是"丰盛"的能量。',
    '这个号适合接好消息的时候用。',
    '多拿这个号抢红包，手气会变好。',
    '建议给这个号充点话费，仪式感拉满。',
    '这个号接电话先说"喂你好"，好运加倍。'
  ];

  const text = `## 📱 号码塔罗解读

### 号码：${phoneNumber}
### 🃏 对应塔罗牌：${tarotCardStr(card)}
### 综合评分：${score}分

> ${comments[Math.floor(Math.random() * comments.length)]}

### 🔮 牌意解码
这张牌的关键词是「${card.meaning}」，你的号码数字之和刚好落在它身上，说明这个号码自带这种能量。

### 🔮 各项能量
💰 财运：${toStar(fortuneStars.money)}
💼 事业运：${toStar(fortuneStars.career)}
💕 桃花运：${toStar(fortuneStars.love)}

### 💡 使用建议
${suggestions[Math.floor(Math.random() * suggestions.length)]}

*（塔罗解读纯属娱乐，号码好不好用，自己说了算~）*`;

  return { text, fromAI: false };
}

// ===== 14. 彩虹屁生成器 =====
async function generateCompliment(target, style) {
  const systemPrompt = `你是一个彩虹屁大师，特别会夸人，夸得天花乱坠但又不让人觉得油腻。请根据用户提供的对象和风格，生成一段超级会夸人的话。
要求：
1. 要真诚又夸张，让人听了心花怒放
2. 可以适当使用比喻、排比等修辞手法
3. 语气要自然，不要太生硬
4. 100字左右，不要太长
5. 可以加点emoji`;
  
  try {
    const result = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `夸夸对象：${target}，风格：${style}` }
    ]);
    return { text: result.content, fromAI: true };
  } catch (err) {
    return generateLocalCompliment(target, style);
  }
}

function generateLocalCompliment(target, style) {
  const compliments = {
    sweet: [
      `你知道吗？${target}就像夏天的冰西瓜，第一口就让人开心到飞起~ 🍉`,
      `跟${target}待在一起，连呼吸都是甜的！感觉自己都要变成棉花糖了 🍬`,
      `${target}笑起来的时候，整个世界都亮了！比灯泡还亮 💡✨`
    ],
    funny: [
      `${target}这是什么神仙颜值啊？建议申请世界非物质文化遗产！`,
      `我严重怀疑${target}是下凡历劫的神仙，不然怎么会这么完美？`,
      `看见${target}之后，我才明白为什么古代君王不早朝了... 换我我也不起！`
    ],
    literary: [
      `若逢新雪初霁，满月当空，下面平铺着皓影，上面流转着亮银，而${target}带笑地向我步来，月色与雪色之间，${target}是第三种绝色。`,
      `${target}是四月早天里的云烟，黄昏吹着风的软，星子在无意中闪，细雨点洒在花前。`,
      `世间所有的美好，${target}占了九成，剩下一成分给山川湖海日月星辰。`
    ]
  };
  
  const list = compliments[style] || compliments.sweet;
  const text = list[Math.floor(Math.random() * list.length)];
  
  return { text, fromAI: false };
}

// ===== 15. 优雅怼人 =====
async function generateRoast(scene, intensity) {
  const systemPrompt = `你是一个优雅怼人大师，骂人不带脏字，但杀伤力极强。根据用户提供的场景和强度，生成一句怼人的话。
要求：
1. 要优雅、文明、有文化
2. 不带脏话，但让对方哑口无言
3. 可以阴阳怪气，可以反讽
4. 简短有力，一句话即可
5. 可以加点emoji增加杀伤力`;
  
  try {
    const result = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `场景：${scene}，强度：${intensity}` }
    ]);
    return { text: result.content, fromAI: true };
  } catch (err) {
    return generateLocalRoast(scene, intensity);
  }
}

function generateLocalRoast(scene, intensity) {
  const roasts = {
    light: [
      '您说得都对，毕竟您说得都对。😊',
      '好的呢，您开心就好~ 🌸',
      '嗯嗯，你这个想法很有想法。',
      '我一般不跟人抬杠，除非对方说的不对。'
    ],
    medium: [
      '你是不是在哪个工厂上班？这么会抬杠。🏭',
      '你脑子如果不用的话，可以捐给有需要的人哦~',
      '你是不是对自己有什么误解？',
      '我不跟你吵，因为我赢了不光彩，输了更丢人。'
    ],
    heavy: [
      '你这么会抬杠，工地上缺人你怎么不去？',
      '你是阿基米德的徒弟吗？这么会杠。',
      '我知道你有病，但你能不能别传染给别人？',
      '别总拿你的脚趾头思考问题，你用一次它受伤一次。'
    ]
  };
  
  const list = roasts[intensity] || roasts.medium;
  const text = list[Math.floor(Math.random() * list.length)];
  
  return { text, fromAI: false };
}

// ===== 16. emo文案生成器 =====
async function generateEmoText(scene, style) {
  const systemPrompt = `你是一个深夜emo文案大师，特别会写那种让人看了就想点赞的emo文案。
要求：
1. 要有氛围感，让人一看就觉得"哇，好有感觉"
2. 简短精致，适合发朋友圈
3. 可以文艺、可以忧伤、可以释然
4. 带点小遗憾、小伤感，但不要太丧
5. 可以加一些适合的emoji
6. 100字以内`;
  
  try {
    const result = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `场景：${scene}，风格：${style}` }
    ]);
    return { text: result.content, fromAI: true };
  } catch (err) {
    return generateLocalEmo(scene, style);
  }
}

function generateLocalEmo(scene, style) {
  const emoTexts = {
    love: [
      '后来啊，月亮失了约，太阳落了山，我们也走散了。🌙',
      '我存过你的照片，你喜欢的歌我也有去听，你感兴趣的东西我也尝试感兴趣，其实我远比表面更喜欢你。',
      '有些人遇见就已经是上上签了，更何况还能一起走过一段路。',
      '故事不长，也不难讲，只不过是，相识一场，爱而不得。💔'
    ],
    life: [
      '长大就是，难过的时候不哭了，只是安静地待着。',
      '成年人的崩溃，往往都是静音模式的。🤐',
      '我们都在用力地活着，在这个不怎么友好的世界里。',
      '有时候也想跟这个世界请个假，我不想活了... 也不是不想活，就是不想这么活。'
    ],
    lateNight: [
      '深夜的灯永远亮着，就像我永远睡不着。🌃',
      '凌晨三点的城市很安静，只有我的心事在吵闹。',
      '熬夜的人在等什么？等一个晚安，还是等一场天亮？',
      '手机没电了可以充，那我呢，我没电了怎么办。📱'
    ]
  };
  
  const list = emoTexts[style] || emoTexts.life;
  const text = list[Math.floor(Math.random() * list.length)];
  
  return { text, fromAI: false };
}

// ===== 17. 歌词改编 =====
async function generateSongParody(songName, story) {
  const systemPrompt = `你是一个歌词改编鬼才，特别会把流行歌曲改成搞笑版本。
要求：
1. 保留原歌的结构和押韵感
2. 把用户提供的故事/梗融入歌词里
3. 要搞笑、有梗、让人一看就想笑
4. 写一段主歌+副歌就行，不用太长
5. 风格要跟原歌类似但内容完全不一样
6. 标注好歌名和原曲`;
  
  try {
    const result = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `歌曲名：${songName}，改编故事：${story}` }
    ]);
    return { text: result.content, fromAI: true };
  } catch (err) {
    return generateLocalSongParody(songName, story);
  }
}

function generateLocalSongParody(songName, story) {
  const templates = [
    {
      title: '《上班之歌》（原曲：孤勇者）',
      lyrics: `都是勇敢的
你黑眼圈的 你的额头 你的痘痘
都不必隐藏
你加班的夜 你的外卖 你的自我

他们说 要带着光 驯服每一头甲方
他们说 要好好干活 没有人能摸鱼

为何工资 不可辜负
只有贫穷 值得歌颂
谁说摸鱼的才算英雄

🎵 爱你孤身在加班
爱你敲代码的模样
爱你对峙过需求
不肯改一场
爱你破旧的键盘
却敢堵产品的枪
爱你和我那么像
缺口都一样

去吗？配吗？这卑微的工牌
战吗？战啊！为了那碎银几两
致那黑夜中的呜咽与怒吼
谁说站在光里的才算打工人`
    },
    {
      title: '《胖若两人》（原曲：像鱼）',
      lyrics: `这是个简单的事
减肥又失败的事
体重秤上的数字
我都不敢直视

我要记住你的样子
像奶茶记住糖的位置
放下筷子的下一秒
又开始了下一次

🎵 我要胖成一团球
我要胖成两百斤
我要记住火锅的味道
记住烧烤的香气

放不下的是筷子
戒不掉的是奶茶
只有体重最诚实
它从不对我说谎`
    },
    {
      title: '《单身情歌》（改编版）',
      lyrics: `抓不住爱情的我
总是眼睁睁看它溜走
世界上幸福的人到处有
为何不能算我一个

为了爱孤军奋斗
早就吃够了爱情的苦
在爱中失落的人到处有
而我只是其中一个

🎵 单身的人那么多
快乐的没有几个
不要爱过了错过了留下了
单身的我独自唱情歌

想爱就别怕伤痛
可是伤痛也太多了
算了算了还是一个人过
单身也挺快活`
    }
  ];
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  const text = `## 🎵 改编完成！

${template.title}

${template.lyrics}

*（灵感来源：${songName} × ${story}）*

*纯属娱乐，不喜勿喷~*`;
  
  return { text, fromAI: false };
}

module.exports = {
  isEnabled,
  chat,
  generateCareerPlan,
  generateLazyGuide,
  generateName,
  generateFortune,
  generateLoveWords,
  generateAcrostic,
  generateMemeText,
  generateMomentText,
  personalityTest,
  loveProbability,
  generateEQReply,
  generateImage,
  generateMemeImage,
  generateDreamInterpretation,
  generateHoroscope,
  generatePhoneFortune,
  generateCompliment,
  generateRoast,
  generateEmoText,
  generateSongParody,
  config
};
