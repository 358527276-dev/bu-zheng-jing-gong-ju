// ===== 结果页：通用结果渲染器 =====
const api = require('../../utils/api');

function parseResult(toolId, result) {
  if (!result) return [];
  const blocks = [];

  // AI表情包：图片
  const imgUrl = result.imageUrl || result.image || result.img_url;
  if (imgUrl) {
    blocks.push({ type: 'image', url: imgUrl.startsWith('http') ? imgUrl : '' });
    if (result.text) blocks.push({ type: 'text', text: result.text });
    return blocks;
  }

  // 模板表情包：文字卡片
  if (result.useCanvas && result.text) {
    blocks.push({ type: 'memeText', text: result.text });
    return blocks;
  }

  // 纯文本
  if (typeof result === 'string') {
    blocks.push({ type: 'text', text: result });
    return blocks;
  }

  // 名字列表 {names:[{name,meaning}]} 或 [{...}]
  const names = result.names;
  if (Array.isArray(names) && names.length) {
    blocks.push({
      type: 'list',
      items: names.map((n, i) => ({
        rank: i + 1,
        title: typeof n === 'string' ? n : (n.name || ''),
        sub: typeof n === 'object' ? (n.meaning || n.reason || '') : ''
      }))
    });
    if (result.fromAI) return blocks;
  }

  // 文案数组 {words/texts/replies: [...]}
  const arr = result.words || result.texts || result.replies;
  if (Array.isArray(arr) && arr.length) {
    blocks.push({
      type: 'list',
      items: arr.map((t, i) => ({
        rank: i + 1,
        title: typeof t === 'string' ? t : (t.text || t.content || JSON.stringify(t)),
        sub: typeof t === 'object' ? (t.reason || t.desc || '') : ''
      }))
    });
  }

  // 藏头诗 {title, poem[], explanation}
  if (result.poem) {
    blocks.push({ type: 'poem', title: result.title || '', lines: Array.isArray(result.poem) ? result.poem : [String(result.poem)], sub: result.explanation || '' });
  }

  // 运势/摆烂指南 {overallScore 或 score, motto...}
  if (result.overallScore !== undefined || result.score !== undefined) {
    const scoreVal = result.overallScore !== undefined ? result.overallScore : result.score;
    blocks.push({ type: 'score', score: scoreVal, motto: result.todaysMotto || result.motto || result.verdict || '' });
  }

  // 摆烂指南：继续卷的好处
  if (Array.isArray(result.pros_roll) && result.pros_roll.length) {
    blocks.push({
      type: 'list',
      items: result.pros_roll.map((t, i) => ({ rank: i + 1, title: t, sub: '' }))
    });
    blocks.splice(blocks.length - 1, 0, { type: 'text', text: '💪 继续卷的好处' });
  }

  // 摆烂指南：摆烂的好处
  if (Array.isArray(result.pros_lazy) && result.pros_lazy.length) {
    blocks.push({ type: 'text', text: '🛋️ 摆烂的好处' });
    blocks.push({
      type: 'list',
      items: result.pros_lazy.map((t, i) => ({ rank: i + 1, title: t, sub: '' }))
    });
  }

  // 塔罗牌：抽到的牌单独成卡
  if (result.cardName) {
    blocks.push({ type: 'text', text: `🃏 今日抽到：【${result.cardName}${result.cardEmoji || ''}】${result.reversed ? '逆位' : '正位'}${result.cardMeaning ? ' —— ' + result.cardMeaning : ''}` });
  }

  // 感情塔罗三牌阵：过去-现在-未来
  if (Array.isArray(result.cardNames) && result.cardNames.length) {
    const posNames = ['过去', '现在', '未来'];
    const lines = result.cardNames.map((n, i) => `${posNames[i] || '第' + (i + 1) + '张'}：${n}${(result.cardEmojis || [])[i] || ''}`);
    blocks.push({ type: 'text', text: '🃏 三牌阵解读\n' + lines.join('\n') });
  }

  // 其余字符串/数字字段 → 键值展示
  const kvs = [];
  const LABELS = {
    loveScore: '桃花运', wealthScore: '财运', careerScore: '事业运', luckyColor: '幸运色',
    luckyNumber: '幸运数字', luckyItem: '幸运物', summary: '综合点评', advice: '今日建议',
    probability: '缘分指数', level: '缘分等级', title2: '标题', target: '对象', scene: '场景',
    cardName: '抽到的塔罗牌', cardMeaning: '牌面寓意', reversed: '正逆位',
    bestTime: '好运时期', type: '适合你的类型', analysis: '塔罗解读', suggestion: '小建议',
    reason: '分析', verdict: '结论', warning: '注意', motto: '金句'
  };
  for (const [k, v] of Object.entries(result)) {
    if (['names', 'words', 'texts', 'replies', 'poem', 'title', 'explanation', 'fromAI', 'overallScore', 'todaysMotto', 'motto', 'useCanvas', 'template', 'fontStyle', 'tip', 'imageUrl', 'image', 'img_url', 'text', 'cardName', 'cardEmoji', 'cardMeaning', 'reversed', 'cardNames', 'cardEmojis', 'score', 'verdict', 'pros_roll', 'pros_lazy'].includes(k)) continue;
    if (v === null || v === undefined || typeof v === 'object') continue;
    kvs.push({ key: LABELS[k] || k, value: String(v) });
  }
  if (kvs.length) blocks.push({ type: 'kv', items: kvs });

  // 兜底 text 字段
  if (result.text && !imgUrl) blocks.push({ type: 'text', text: result.text });
  if (result.tip) blocks.push({ type: 'tip', text: result.tip });

  if (!blocks.length) {
    blocks.push({ type: 'text', text: JSON.stringify(result, null, 2) });
  }
  return blocks;
}

Page({
  data: {
    toolName: '',
    toolId: 0,
    blocks: [],
    copied: false
  },

  onLoad(options) {
    const last = getApp().globalData.lastResult;
    this.toolId = parseInt(options.toolId);
    this.setData({
      toolId: this.toolId,
      toolName: decodeURIComponent(options.toolName || '生成结果')
    });
    if (last && last.toolId === this.toolId) {
      this.setData({ blocks: parseResult(this.toolId, last.result) });
      this.rawResult = last.result;
      this.formData = last.formData;
    }
  },

  onCopy() {
    const blocks = this.data.blocks;
    let text = '';
    blocks.forEach(b => {
      if (b.type === 'text' || b.type === 'tip') text += b.text + '\n';
      if (b.type === 'memeText') text += b.text + '\n';
      if (b.type === 'list') b.items.forEach(i => { text += `${i.rank}. ${i.title}${i.sub ? ' — ' + i.sub : ''}\n`; });
      if (b.type === 'kv') b.items.forEach(i => { text += `${i.key}：${i.value}\n`; });
      if (b.type === 'poem') { text += (b.title ? `《${b.title}》\n` : ''); b.lines.forEach(l => text += l + '\n'); text += (b.sub || '') + '\n'; }
      if (b.type === 'score') text += `综合评分：${b.score} ${b.motto ? '「' + b.motto + '」' : ''}\n`;
    });
    wx.setClipboardData({ data: text.trim() });
    this.setData({ copied: true });
    setTimeout(() => this.setData({ copied: false }), 2000);
  },

  onSaveImage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showToast({ title: '图片地址无效', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '保存中...' });
    wx.downloadFile({
      url,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
          fail: () => wx.showToast({ title: '保存失败，请授权相册权限', icon: 'none' }),
          complete: () => wx.hideLoading()
        });
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: '下载失败', icon: 'none' }); }
    });
  },

  goBackTool() {
    wx.navigateBack();
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  // 一键复制小红书文案+标签
  onCopyXhs() {
    const blocks = this.data.blocks;
    let text = '';
    blocks.forEach(b => {
      if (b.type === 'text' || b.type === 'tip') text += b.text + '\n';
      if (b.type === 'memeText') text += b.text + '\n';
      if (b.type === 'list') b.items.forEach(i => { text += `${i.rank}. ${i.title}${i.sub ? ' — ' + i.sub : ''}\n`; });
      if (b.type === 'kv') b.items.forEach(i => { text += `${i.key}：${i.value}\n`; });
      if (b.type === 'poem') { text += (b.title ? `《${b.title}》\n` : ''); b.lines.forEach(l => text += l + '\n'); text += (b.sub || '') + '\n'; }
      if (b.type === 'score') text += `综合评分：${b.score} ${b.motto ? '「' + b.motto + '」' : ''}\n`;
    });
    const xhsText = text.trim() + '\n\n#不正经工具箱 #' + this.data.toolName + ' #AI生成 #今日运势 #好玩的工具';
    wx.setClipboardData({
      data: xhsText,
      success: () => wx.showToast({ title: '已复制，去小红书粘贴吧~', icon: 'none', duration: 2500 })
    });
  },

  onShareAppMessage() {
    const app = getApp();
    api.recordShare(app.globalData.userId, 'result', this.toolId);
    return {
      title: `「${this.data.toolName}」的生成结果，笑死我了`,
      path: '/pages/index/index?invite=' + ((app.globalData.userInfo || {}).inviteCode || '')
    };
  }
});
