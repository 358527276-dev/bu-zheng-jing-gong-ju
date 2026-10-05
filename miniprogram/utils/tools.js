// ===== 17 个工具的表单配置（与后端 generateToolResult 参数一一对应）=====
const ZODIACS = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const SIGNS = ZODIACS.map(z => z.replace('座',''));

const opt = (label, value) => ({ label, value });

const TOOLS_FORM = {
  1: {
    defaults: { type: 'pet', gender: 'boy', style: 'cute' },
    fields: [
      { key: 'type', label: '起名类型', type: 'options', options: [opt('🐱 宠物名','pet'), opt('🌐 网名','web'), opt('👶 宝宝名','baby')] },
      { key: 'gender', label: '性别', type: 'options', showIf: 'type==baby', options: [opt('男孩','boy'), opt('女孩','girl')] },
      { key: 'style', label: '风格偏好', type: 'options', options: [opt('可爱风','cute'), opt('酷炫风','cool'), opt('文艺范','literary'), opt('搞笑派','funny')] }
    ]
  },
  2: {
    defaults: { topic: '今日整体运' },
    fields: [
      { key: 'topic', label: '想问塔罗牌什么？', type: 'options', options: [opt('✨ 今日整体运','今日整体运'), opt('💕 感情运','感情运'), opt('💼 事业运','事业运'), opt('💰 财运','财运')] }
    ]
  },
  3: {
    defaults: { type: 'sweet', target: 'crush' },
    fields: [
      { key: 'type', label: '情话类型', type: 'options', options: [opt('日常甜蜜','sweet'), opt('文艺深情','literary'), opt('搞笑土味','funny'), opt('暧昧撩人','ambiguous')] },
      { key: 'target', label: '对谁说', type: 'options', options: [opt('暗恋对象','crush'), opt('男/女朋友','lover'), opt('老公/老婆','spouse')] }
    ]
  },
  4: {
    defaults: { name: '' },
    fields: [
      { key: 'name', label: '输入名字（2-4个字最佳）', type: 'input', placeholder: '比如：我爱你、李白、王者荣耀', maxlength: 10, required: true }
    ]
  },
  5: {
    defaults: { mode: 'ai', char: 'panda', template: 'classic', text: '上班如上坟', fontStyle: 'bold' },
    fields: [
      { key: 'mode', label: '制作方式', type: 'options', options: [opt('✨ AI生成','ai'), opt('🎨 模板文字','template')] },
      { key: 'char', label: '表情包形象', type: 'options', showIf: 'mode==ai',
        options: [opt('🐼 熊猫头','panda'), opt('🐶 柴犬Doge','doge'), opt('🐱 沙雕猫','cat'), opt('🐸 悲伤蛙','frog'), opt('🦆 可达鸭','duck'), opt('🍄 蘑菇头','mushroom')] },
      { key: 'template', label: '表情包风格', type: 'options', showIf: 'mode==template',
        options: [opt('📝 经典大字报','classic'), opt('🌈 渐变ins风','gradient'), opt('💬 气泡对话','bubble'), opt('📰 复古报纸','retro')] },
      { key: 'text', label: '表情包文案', type: 'textarea', placeholder: '输入你想加的文字，比如：上班如上坟', maxlength: 20, default: '上班如上坟' },
      { key: 'fontStyle', label: '文字风格', type: 'options', showIf: 'mode==template', options: [opt('粗黑霸气','bold'), opt('圆润可爱','round'), opt('艺术字体','art')] }
    ]
  },
  6: {
    defaults: { scene: 'food', style: 'literary' },
    fields: [
      { key: 'scene', label: '发布场景', type: 'options', options: [opt('美食打卡','food'), opt('旅行风景','travel'), opt('自拍美照','selfie'), opt('日常随拍','daily')] },
      { key: 'style', label: '文案风格', type: 'options', options: [opt('文艺清新','literary'), opt('搞笑沙雕','funny'), opt('简洁明了','simple')] }
    ]
  },
  7: {
    defaults: { q1: 'a', q2: 'a', q3: 'a' },
    fields: [
      { key: 'q1', label: '1. 周末你更喜欢？', type: 'options', options: [opt('宅在家追剧','a'), opt('约朋友出去玩','b'), opt('学习提升自己','c')] },
      { key: 'q2', label: '2. 遇到困难时你会？', type: 'options', options: [opt('自己默默解决','a'), opt('找朋友帮忙','b'), opt('先放一放再说','c')] },
      { key: 'q3', label: '3. 你更看重什么？', type: 'options', options: [opt('事业成就','a'), opt('感情幸福','b'), opt('自由快乐','c')] }
    ]
  },
  8: {
    defaults: { status: 'single', question: '' },
    fields: [
      { key: 'status', label: '你现在的感情状态', type: 'options', options: [opt('🙋 单身','single'), opt('🤫 暗恋中','secret'), opt('💕 恋爱中','dating'), opt('💍 已婚','married')] },
      { key: 'question', label: '心里想问塔罗牌什么？（可选）', type: 'input', placeholder: '比如：我什么时候能脱单？Ta对我什么感觉？', maxlength: 30 }
    ]
  },
  9: {
    defaults: { industry: 'internet', years: '1' },
    fields: [
      { key: 'industry', label: '你的行业', type: 'options', options: [opt('互联网/IT','internet'), opt('金融/经济','finance'), opt('教育/培训','education'), opt('医疗/健康','medical'), opt('其他行业','other')] },
      { key: 'years', label: '工作年限', type: 'options', options: [opt('1年以内','1'), opt('1-3年','3'), opt('3-5年','5'), opt('5年以上','10')] }
    ]
  },
  10: {
    defaults: { scene: 'daily', personality: 'gentle', message: '' },
    fields: [
      { key: 'scene', label: '什么场景？', type: 'options', options: [opt('不想回的消息','daily'), opt('情侣吵架','conflict'), opt('同事甩锅','colleague'), opt('被人怼了','argue')] },
      { key: 'personality', label: '对方性格', type: 'options', options: [opt('温柔型','gentle'), opt('幽默型','humorous'), opt('高冷型','cold'), opt('难搞型','difficult')] },
      { key: 'message', label: '对方说啥了？（可选）', type: 'textarea', placeholder: '把对方发的消息粘过来，我帮你想怎么回', maxlength: 100, tip: '不填也行，AI会根据场景瞎编一个' }
    ]
  },
  11: {
    defaults: { dreamContent: '' },
    fields: [
      { key: 'dreamContent', label: '梦见了什么？', type: 'textarea', placeholder: '比如：梦见自己在天上飞、梦见捡钱、梦见前任...', required: true, tip: '塔罗牌会根据你的梦境抽牌解读~（纯属娱乐）' }
    ]
  },
  12: {
    defaults: { sign: '白羊' },
    fields: [
      { key: 'sign', label: '你的星座', type: 'options', options: SIGNS.map(s => opt(s + '座', s)), tip: '塔罗牌会为你的星座抽一张今日指引牌~' }
    ]
  },
  13: {
    defaults: { phoneNumber: '' },
    fields: [
      { key: 'phoneNumber', label: '输入手机号', type: 'number', placeholder: '请输入11位手机号', maxlength: 11, required: true, tip: '数字相加对应一张塔罗牌，纯属娱乐~' }
    ]
  },
  14: {
    defaults: { target: '', style: 'sweet' },
    fields: [
      { key: 'target', label: '想夸谁？', type: 'input', placeholder: '比如：男朋友、闺蜜、老板、自己...', required: true },
      { key: 'style', label: '夸人风格', type: 'options', options: [opt('甜蜜撒娇','sweet'), opt('搞笑夸张','funny'), opt('文艺深情','literary')] }
    ]
  },
  15: {
    defaults: { scene: 'argue', intensity: 'light' },
    fields: [
      { key: 'scene', label: '什么场景？', type: 'options', options: [opt('被人抬杠','argue'), opt('被人杠上了','stupid'), opt('前任找事','ex'), opt('同事甩锅','colleague')] },
      { key: 'intensity', label: '杀伤力', type: 'options', options: [opt('轻微阴阳','light'), opt('中度伤害','medium'), opt('致命一击','heavy')] }
    ]
  },
  16: {
    defaults: { scene: '', style: 'love' },
    fields: [
      { key: 'style', label: '什么心情？', type: 'options', options: [opt('爱而不得','love'), opt('生活感慨','life'), opt('深夜emo','lateNight')] },
      { key: 'scene', label: '想说点什么？（可选）', type: 'input', placeholder: '比如：想TA了、今天有点丧...' }
    ]
  },
  17: {
    defaults: { songName: '', story: '' },
    fields: [
      { key: 'songName', label: '想改编哪首歌？', type: 'input', placeholder: '比如：孤勇者、七里香、小幸运...', required: true },
      { key: 'story', label: '想改成什么故事？', type: 'textarea', placeholder: '比如：打工人的日常、减肥失败、单身狗的日常...', required: true }
    ]
  }
};

// 分类
const CATEGORIES = [
  { key: 'all', name: '全部', icon: '🎁' },
  { key: 'creative', name: '骚话王', icon: '✍️' },
  { key: 'fun', name: '整活', icon: '🤪' },
  { key: 'test', name: '测一测', icon: '🧪' },
  { key: 'fortune', name: '塔罗牌', icon: '🃏' }
];

// 校验表单
function validateForm(toolId, formData) {
  const conf = TOOLS_FORM[toolId];
  if (!conf) return { ok: true };
  for (const f of conf.fields) {
    if (f.required && !f.showIf) {
      const v = formData[f.key];
      if (v === undefined || v === null || String(v).trim() === '') {
        return { ok: false, message: `请填写「${f.label.replace(/（.*?）/g,'')}」` };
      }
      if (toolId === 13 && String(v).length !== 11) {
        return { ok: false, message: '请输入11位手机号' };
      }
    }
  }
  return { ok: true };
}

module.exports = { TOOLS_FORM, CATEGORIES, validateForm };
