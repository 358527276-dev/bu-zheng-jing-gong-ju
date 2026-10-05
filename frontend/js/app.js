// 一元AI趣味工坊 - 前端主逻辑（含裂变增长+会员体系）
(function() {
  'use strict';
  
  // ===== 状态管理 =====
  const state = {
    userId: null,
    userInfo: null,
    tools: [],
    currentTool: null,
    currentPage: 'home',
    formData: {},
    selectedRechargeAmount: 5,
    currentOrder: null,
    useFree: true, // 是否使用免费次数
    selectedVipType: 'monthly',
    vipPackages: []
  };
  
  // ===== DOM 元素 =====
  const $ = (id) => document.getElementById(id);
  
  const elements = {
    // 页面
    pageHome: $('pageHome'),
    pageTool: $('pageTool'),
    pageResult: $('pageResult'),
    pageProfile: $('pageProfile'),
    pageOrders: $('pageOrders'),
    pageSign: $('pageSign'),
    pageTasks: $('pageTasks'),
    pageVip: $('pageVip'),
    pageInvite: $('pageInvite'),
    pageLevels: $('pageLevels'),
    
    // 导航
    pageTitle: $('pageTitle'),
    backBtn: $('backBtn'),
    userBtn: $('userBtn'),
    userAvatar: $('userAvatar'),
    tabBar: $('tabBar'),
    
    // 首页
    userBalance: $('userBalance'),
    freeUses: $('freeUses'),
    signDays: $('signDays'),
    rechargeBtn: $('rechargeBtn'),
    vipEntry: $('vipEntry'),
    signEntry: $('signEntry'),
    taskBanner: $('taskBanner'),
    toolsGrid: $('toolsGrid'),
    categoryTabs: document.querySelectorAll('.tab-item'),
    
    // 工具详情
    toolDetailIcon: $('toolDetailIcon'),
    toolDetailName: $('toolDetailName'),
    toolDetailDesc: $('toolDetailDesc'),
    toolDetailPrice: $('toolDetailPrice'),
    toolForm: $('toolForm'),
    generateBtn: $('generateBtn'),
    
    // 结果页
    resultContent: $('resultContent'),
    shareBtn: $('shareBtn'),
    regenBtn: $('regenBtn'),
    
    // 个人中心
    profileAvatar: $('profileAvatar'),
    profileName: $('profileName'),
    profileId: $('profileId'),
    profileLevel: $('profileLevel'),
    growthFill: $('growthFill'),
    growthPoints: $('growthPoints'),
    nextLevelNeed: $('nextLevelNeed'),
    profileVipBadge: $('profileVipBadge'),
    statBalance: $('statBalance'),
    statFree: $('statFree'),
    statUses: $('statUses'),
    gridSign: $('gridSign'),
    gridTasks: $('gridTasks'),
    gridInvite: $('gridInvite'),
    gridVip: $('gridVip'),
    signBadge: $('signBadge'),
    menuRecharge: $('menuRecharge'),
    menuOrders: $('menuOrders'),
    menuGrowth: $('menuGrowth'),
    
    // 签到
    signBtn: $('signBtn'),
    
    // 任务
    dailyTasksList: $('dailyTasksList'),
    newbieTasksList: $('newbieTasksList'),
    
    // 会员
    vipPackages: $('vipPackages'),
    vipBuyBtn: $('vipBuyBtn'),
    
    // 邀请
    inviteCode: $('inviteCode'),
    inviteCount: $('inviteCount'),
    inviteReward: $('inviteReward'),
    copyInviteCode: $('copyInviteCode'),
    inviteShareBtn: $('inviteShareBtn'),
    
    // 等级
    myLevelIcon: $('myLevelIcon'),
    myLevelName: $('myLevelName'),
    myGrowthPoints: $('myGrowthPoints'),
    levelsList: $('levelsList'),
    
    // 订单页
    ordersList: $('ordersList'),
    
    // 充值弹窗
    rechargeModal: $('rechargeModal'),
    closeRecharge: $('closeRecharge'),
    confirmRecharge: $('confirmRecharge'),
    
    // 支付弹窗
    payModal: $('payModal'),
    payToolName: $('payToolName'),
    payPrice: $('payPrice'),
    payBalance: $('payBalance'),
    cancelPay: $('cancelPay'),
    confirmPay: $('confirmPay'),
    
    // Toast & Loading
    toast: $('toast'),
    loading: $('loading'),
    loadingText: $('loadingText')
  };
  
  // ===== 工具函数 =====
  
  function showToast(message, duration = 2000) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => {
      elements.toast.classList.remove('show');
    }, duration);
  }
  
  function showLoading(text = '加载中...') {
    elements.loadingText.textContent = text;
    elements.loading.style.display = 'flex';
  }
  
  function hideLoading() {
    elements.loading.style.display = 'none';
  }
  
  // ===== 页面导航 =====
  
  const pageTitles = {
    'home': '不正经工具箱',
    'tool': '工具详情',
    'result': '生成结果',
    'profile': '个人中心',
    'orders': '使用记录',
    'sign': '每日签到',
    'tasks': '任务中心',
    'vip': '快乐会员',
    'invite': '邀请好友',
    'levels': '等级特权'
  };
  
  const showBackBtn = ['tool', 'result', 'orders', 'sign', 'tasks', 'vip', 'invite', 'levels'];
  const showTabBar = ['home', 'profile'];
  
  function navigateTo(pageName, options = {}) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    const pageId = 'page' + pageName.charAt(0).toUpperCase() + pageName.slice(1);
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.add('active');
      state.currentPage = pageName;
    }
    
    // 标题
    elements.pageTitle.textContent = options.title || pageTitles[pageName] || '不正经工具箱';
    
    // 返回按钮
    elements.backBtn.style.display = showBackBtn.includes(pageName) ? 'flex' : 'none';
    
    // 用户头像
    elements.userBtn.style.display = (pageName === 'home') ? 'flex' : 'none';
    
    // TabBar
    elements.tabBar.style.display = showTabBar.includes(pageName) ? 'flex' : 'none';
    
    // 更新TabBar选中
    document.querySelectorAll('.tab-bar-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.tab === pageName) item.classList.add('active');
    });
    
    window.scrollTo(0, 0);
  }
  
  // ===== 用户相关 =====
  
  async function initUser() {
    const savedUser = localStorage.getItem('yy_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      state.userId = user.userId;
      state.userInfo = user;
      updateUserUI();
      return;
    }
    
    showLoading('登录中...');
    const result = await api.login('test_user_001', '测试用户', '😀');
    hideLoading();
    
    if (result.code === 0) {
      state.userId = result.data.userId;
      state.userInfo = result.data;
      localStorage.setItem('yy_user', JSON.stringify(result.data));
      updateUserUI();
    } else {
      showToast('登录失败，请刷新重试');
    }
  }
  
  function updateUserUI() {
    if (!state.userInfo) return;
    
    const u = state.userInfo;
    
    // 首页
    elements.userAvatar.textContent = u.avatar;
    elements.userBalance.textContent = u.balance?.toFixed(2) || '0.00';
    elements.freeUses.textContent = u.freeUses || 0;
    elements.signDays.textContent = u.signStatus?.signDays || 0;
    
    // 个人中心
    elements.profileAvatar.textContent = u.avatar;
    elements.profileName.textContent = u.nickname;
    elements.profileId.textContent = u.userId;
    elements.statBalance.textContent = u.balance?.toFixed(2) || '0.00';
    elements.statFree.textContent = u.freeUses || 0;
    elements.statUses.textContent = u.totalUses || 0;
    
    // 等级
    const levelInfo = u.levelInfo || { icon: '🥉', name: '青铜' };
    elements.profileLevel.textContent = `${levelInfo.icon} ${levelInfo.name}`;
    
    // 成长值进度条
    const growth = u.growthPoints || 0;
    elements.growthPoints.textContent = growth;
    
    const levels = [
      { min: 0, max: 100 },
      { min: 100, max: 500 },
      { min: 500, max: 2000 },
      { min: 2000, max: 5000 },
      { min: 5000, max: 10000 }
    ];
    
    let currentLevelIndex = 0;
    for (let i = 0; i < levels.length; i++) {
      if (growth >= levels[i].min) currentLevelIndex = i;
    }
    
    const currentLevel = levels[currentLevelIndex];
    const nextLevel = levels[currentLevelIndex + 1] || { max: 10000 };
    const progress = Math.min(100, ((growth - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100);
    elements.growthFill.style.width = progress + '%';
    elements.nextLevelNeed.textContent = Math.max(0, nextLevel.min - growth);
    
    // VIP标识
    if (u.vipInfo?.isVip) {
      elements.profileVipBadge.style.display = 'block';
    } else {
      elements.profileVipBadge.style.display = 'none';
    }
    
    // 签到状态
    if (u.signStatus?.todaySigned) {
      elements.signBadge.textContent = '已签';
      elements.signBadge.style.background = '#52c41a';
    }
  }
  
  async function refreshUserInfo() {
    if (!state.userId) return;
    
    const result = await api.getUserInfo(state.userId);
    if (result.code === 0) {
      state.userInfo = { ...state.userInfo, ...result.data };
      localStorage.setItem('yy_user', JSON.stringify(state.userInfo));
      updateUserUI();
    }
  }
  
  // ===== 工具列表 =====
  
  async function loadTools(category = 'all') {
    showLoading();
    const result = await api.getTools(category, state.userId);
    hideLoading();
    
    if (result.code === 0) {
      state.tools = result.data.tools;
      renderTools();
    } else {
      showToast('加载失败，请稍后重试');
    }
  }
  
  function renderTools() {
    const html = state.tools.map((tool, index) => `
      <div class="tool-card ${tool.vipOnly && !tool.canUse ? 'locked' : ''}" data-tool-id="${tool.id}">
        ${tool.vipOnly ? '<div class="vip-tag">VIP</div>' : ''}
        ${index < 3 ? '<div class="tool-card-hot">热门</div>' : ''}
        <div class="tool-card-icon">${tool.icon}</div>
        <div class="tool-card-name">${tool.name}</div>
        <div class="tool-card-desc">${tool.description}</div>
        <div class="tool-card-footer">
          <span class="tool-card-price">¥${tool.price}</span>
          <span class="tool-card-count">${tool.useCount}人用过</span>
        </div>
      </div>
    `).join('');
    
    elements.toolsGrid.innerHTML = html;
    
    document.querySelectorAll('.tool-card').forEach(card => {
      card.addEventListener('click', () => {
        const toolId = card.dataset.toolId;
        openTool(toolId);
      });
    });
  }
  
  // ===== 工具详情 =====
  
  function openTool(toolId) {
    const tool = state.tools.find(t => t.id == toolId);
    if (!tool) {
      showToast('工具不存在');
      return;
    }
    
    if (tool.vipOnly && !tool.canUse) {
      showToast('该工具为VIP专属，开通会员即可使用');
      navigateTo('vip');
      return;
    }
    
    state.currentTool = tool;
    state.formData = {};
    
    elements.toolDetailIcon.textContent = tool.icon;
    elements.toolDetailName.textContent = tool.name;
    elements.toolDetailDesc.textContent = tool.description;
    elements.toolDetailPrice.textContent = tool.price;
    
    renderToolForm(tool);
    
    navigateTo('tool', { title: tool.name });
  }
  
  function renderToolForm(tool) {
    let formHtml = '';
    
    // 免费次数开关
    const hasFree = (state.userInfo?.freeUses || 0) > 0;
    formHtml += `
      <div class="free-use-toggle">
        <div>
          <div class="free-use-label">使用免费次数</div>
          <div class="free-use-info">剩余 ${state.userInfo?.freeUses || 0} 次</div>
        </div>
        <div class="switch ${state.useFree && hasFree ? 'on' : ''}" id="freeSwitch"></div>
      </div>
    `;
    
    // 工具表单内容
    switch (parseInt(tool.id)) {
      case 1: 
        formHtml += `
          <div class="form-group">
            <label class="form-label">起名类型</label>
            <div class="form-options">
              <div class="form-option active" data-field="type" data-value="pet">🐱 宠物名</div>
              <div class="form-option" data-field="type" data-value="web">🌐 网名</div>
              <div class="form-option" data-field="type" data-value="baby">👶 宝宝名</div>
            </div>
          </div>
          <div class="form-group" id="genderGroup" style="display:none;">
            <label class="form-label">性别</label>
            <div class="form-options">
              <div class="form-option active" data-field="gender" data-value="boy">男孩</div>
              <div class="form-option" data-field="gender" data-value="girl">女孩</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">风格偏好</label>
            <div class="form-options">
              <div class="form-option active" data-field="style" data-value="cute">可爱风</div>
              <div class="form-option" data-field="style" data-value="cool">酷炫风</div>
              <div class="form-option" data-field="style" data-value="literary">文艺范</div>
              <div class="form-option" data-field="style" data-value="funny">搞笑派</div>
            </div>
          </div>
        `;
        state.formData = { type: 'pet', gender: 'boy', style: 'cute' };
        break;
        
      case 2:
        const zodiacs = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
        formHtml += `
          <div class="form-group">
            <label class="form-label">选择你的星座</label>
            <div class="form-options">
              ${zodiacs.map((z, i) => `
                <div class="form-option ${i === 0 ? 'active' : ''}" data-field="zodiac" data-value="${z}">${z}</div>
              `).join('')}
            </div>
          </div>
        `;
        state.formData = { zodiac: '白羊座' };
        break;
        
      case 3:
        formHtml += `
          <div class="form-group">
            <label class="form-label">情话类型</label>
            <div class="form-options">
              <div class="form-option active" data-field="type" data-value="sweet">日常甜蜜</div>
              <div class="form-option" data-field="type" data-value="literary">文艺深情</div>
              <div class="form-option" data-field="type" data-value="funny">搞笑土味</div>
              <div class="form-option" data-field="type" data-value="ambiguous">暧昧撩人</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">对谁说</label>
            <div class="form-options">
              <div class="form-option active" data-field="target" data-value="crush">暗恋对象</div>
              <div class="form-option" data-field="target" data-value="lover">男/女朋友</div>
              <div class="form-option" data-field="target" data-value="spouse">老公/老婆</div>
            </div>
          </div>
        `;
        state.formData = { type: 'sweet', target: 'crush' };
        break;
        
      case 4:
        formHtml += `
          <div class="form-group">
            <label class="form-label">输入名字（2-4个字最佳）</label>
            <input type="text" class="form-input" id="acrosticName" placeholder="比如：我爱你、李白、王者荣耀" maxlength="10">
          </div>
        `;
        state.formData = { name: '' };
        break;
        
      case 5:
        formHtml += `
          <div class="meme-mode-tabs">
            <div class="meme-mode-tab active" data-mode="ai">
              <span class="mode-icon">✨</span>
              <span class="mode-name">AI生成</span>
              <span class="mode-tag">VIP</span>
            </div>
            <div class="meme-mode-tab" data-mode="template">
              <span class="mode-icon">🎨</span>
              <span class="mode-name">模板制作</span>
            </div>
          </div>
          
          <!-- AI生成模式 -->
          <div class="meme-ai-panel" id="memeAiPanel">
            <div class="form-group">
              <label class="form-label">选择表情包形象</label>
              <div class="meme-ai-characters" id="memeAiCharacters">
                <div class="meme-char-item active" data-char="panda">
                  <div class="meme-char-emoji">🐼</div>
                  <div class="meme-char-name">熊猫头</div>
                </div>
                <div class="meme-char-item" data-char="doge">
                  <div class="meme-char-emoji">🐶</div>
                  <div class="meme-char-name">柴犬Doge</div>
                </div>
                <div class="meme-char-item" data-char="cat">
                  <div class="meme-char-emoji">🐱</div>
                  <div class="meme-char-name">沙雕猫</div>
                </div>
                <div class="meme-char-item" data-char="frog">
                  <div class="meme-char-emoji">🐸</div>
                  <div class="meme-char-name">悲伤蛙</div>
                </div>
                <div class="meme-char-item" data-char="duck">
                  <div class="meme-char-emoji">🦆</div>
                  <div class="meme-char-name">可达鸭</div>
                </div>
                <div class="meme-char-item" data-char="mushroom">
                  <div class="meme-char-emoji">🍄</div>
                  <div class="meme-char-name">蘑菇头</div>
                </div>
              </div>
            </div>
            <div class="form-group">
              <div class="form-label-row">
                <label class="form-label">表情包文案</label>
                <span class="form-tip" id="randomMemeBtnAi">🎲 随机推荐</span>
              </div>
              <textarea class="form-textarea" id="memeTextInputAi" placeholder="输入你想加的文字，比如：上班如上坟" maxlength="20">上班如上坟</textarea>
              <div class="form-char-count"><span id="memeCharCountAi">5</span>/20</div>
            </div>
            <div class="meme-ai-tip">
              💡 AI生成约需5-10秒，生成的图片可直接保存分享
            </div>
          </div>
          
          <!-- 模板制作模式 -->
          <div class="meme-template-panel" id="memeTemplatePanel" style="display:none;">
            <div class="form-group">
              <label class="form-label">选择表情包风格</label>
              <div class="meme-templates" id="memeTemplates">
                <div class="meme-template-item active" data-template="classic">
                  <div class="meme-template-preview">📝</div>
                  <div class="meme-template-name">经典大字报</div>
                </div>
                <div class="meme-template-item" data-template="gradient">
                  <div class="meme-template-preview">🌈</div>
                  <div class="meme-template-name">渐变ins风</div>
                </div>
                <div class="meme-template-item" data-template="bubble">
                  <div class="meme-template-preview">💬</div>
                  <div class="meme-template-name">气泡对话</div>
                </div>
                <div class="meme-template-item" data-template="retro">
                  <div class="meme-template-preview">📰</div>
                  <div class="meme-template-name">复古报纸</div>
                </div>
                <div class="meme-template-item" data-template="cartoon">
                  <div class="meme-template-preview">🎀</div>
                  <div class="meme-template-name">可爱卡通</div>
                </div>
                <div class="meme-template-item" data-template="blackboard">
                  <div class="meme-template-preview">📋</div>
                  <div class="meme-template-name">黑板粉笔</div>
                </div>
              </div>
            </div>
            <div class="form-group">
              <div class="form-label-row">
                <label class="form-label">表情包文案</label>
                <span class="form-tip" id="randomMemeBtn">🎲 随机推荐</span>
              </div>
              <textarea class="form-textarea" id="memeTextInput" placeholder="输入你想加的文字，比如：上班如上坟" maxlength="30">上班如上坟</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">文字风格</label>
              <div class="form-options">
                <div class="form-option active" data-field="fontStyle" data-value="bold">粗黑霸气</div>
                <div class="form-option" data-field="fontStyle" data-value="round">圆润可爱</div>
              <div class="form-option" data-field="fontStyle" data-value="art">艺术字体</div>
            </div>
          </div>
        `;
        state.formData = { template: 'classic', text: '上班如上坟', fontStyle: 'bold' };
        break;
        
      case 6:
        formHtml += `
          <div class="form-group">
            <label class="form-label">发布场景</label>
            <div class="form-options">
              <div class="form-option active" data-field="scene" data-value="food">美食打卡</div>
              <div class="form-option" data-field="scene" data-value="travel">旅行风景</div>
              <div class="form-option" data-field="scene" data-value="selfie">自拍美照</div>
              <div class="form-option" data-field="scene" data-value="daily">日常随拍</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">文案风格</label>
            <div class="form-options">
              <div class="form-option active" data-field="style" data-value="literary">文艺清新</div>
              <div class="form-option" data-field="style" data-value="funny">搞笑沙雕</div>
              <div class="form-option" data-field="style" data-value="simple">简洁明了</div>
            </div>
          </div>
        `;
        state.formData = { scene: 'food', style: 'literary' };
        break;
        
      case 7:
        formHtml += `
          <div class="form-group">
            <label class="form-label">1. 周末你更喜欢？</label>
            <div class="form-options">
              <div class="form-option active" data-field="q1" data-value="a">宅在家追剧</div>
              <div class="form-option" data-field="q1" data-value="b">约朋友出去玩</div>
              <div class="form-option" data-field="q1" data-value="c">学习提升自己</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">2. 遇到困难时你会？</label>
            <div class="form-options">
              <div class="form-option active" data-field="q2" data-value="a">自己默默解决</div>
              <div class="form-option" data-field="q2" data-value="b">找朋友帮忙</div>
              <div class="form-option" data-field="q2" data-value="c">先放一放再说</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">3. 你更看重什么？</label>
            <div class="form-options">
              <div class="form-option active" data-field="q3" data-value="a">事业成就</div>
              <div class="form-option" data-field="q3" data-value="b">感情幸福</div>
              <div class="form-option" data-field="q3" data-value="c">自由快乐</div>
            </div>
          </div>
        `;
        state.formData = { q1: 'a', q2: 'a', q3: 'a', answers: {} };
        break;
        
      case 8:
        formHtml += `
          <div class="form-group">
            <label class="form-label">你的年龄</label>
            <div class="form-options">
              <div class="form-option active" data-field="age" data-value="22">18-25岁</div>
              <div class="form-option" data-field="age" data-value="28">26-30岁</div>
              <div class="form-option" data-field="age" data-value="33">31-35岁</div>
              <div class="form-option" data-field="age" data-value="38">35岁以上</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">你的性格</label>
            <div class="form-options">
              <div class="form-option active" data-field="personality" data-value="外向">外向开朗</div>
              <div class="form-option" data-field="personality" data-value="内向">内向慢热</div>
              <div class="form-option" data-field="personality" data-value="活泼">活泼好动</div>
              <div class="form-option" data-field="personality" data-value="安静">安静沉稳</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">有兴趣爱好吗？</label>
            <div class="form-options">
              <div class="form-option active" data-field="hobby" data-value="1">有很多</div>
              <div class="form-option" data-field="hobby" data-value="0">基本没有</div>
            </div>
          </div>
        `;
        state.formData = { age: 22, personality: '外向', hobby: 1 };
        break;
        
      case 9:
        formHtml += `
          <div class="form-group">
            <label class="form-label">你的行业</label>
            <div class="form-options">
              <div class="form-option active" data-field="industry" data-value="internet">互联网/IT</div>
              <div class="form-option" data-field="industry" data-value="finance">金融/经济</div>
              <div class="form-option" data-field="industry" data-value="education">教育/培训</div>
              <div class="form-option" data-field="industry" data-value="medical">医疗/健康</div>
              <div class="form-option" data-field="industry" data-value="other">其他行业</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">工作年限</label>
            <div class="form-options">
              <div class="form-option active" data-field="years" data-value="1">1年以内</div>
              <div class="form-option" data-field="years" data-value="3">1-3年</div>
              <div class="form-option" data-field="years" data-value="5">3-5年</div>
              <div class="form-option" data-field="years" data-value="10">5年以上</div>
            </div>
          </div>
        `;
        state.formData = { industry: 'internet', years: '1' };
        break;
        
      case 10:
        formHtml += `
          <div class="form-group">
            <label class="form-label">场景类型</label>
            <div class="form-options">
              <div class="form-option active" data-field="scene" data-value="greeting">初次聊天</div>
              <div class="form-option" data-field="scene" data-value="date">约会</div>
              <div class="form-option" data-field="scene" data-value="conflict">吵架和好</div>
              <div class="form-option" data-field="scene" data-value="daily">日常聊天</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">对方性格</label>
            <div class="form-options">
              <div class="form-option active" data-field="personality" data-value="gentle">温柔型</div>
              <div class="form-option" data-field="personality" data-value="humorous">幽默型</div>
              <div class="form-option" data-field="personality" data-value="cold">高冷型</div>
              <div class="form-option" data-field="personality" data-value="cute">可爱型</div>
            </div>
          </div>
        `;
        state.formData = { scene: 'greeting', personality: 'gentle' };
        break;
        
      case 11: // 周公解梦
        formHtml += `
          <div class="form-group">
            <label class="form-label">梦见了什么？</label>
            <textarea class="form-textarea" id="dreamInput" placeholder="比如：梦见自己在天上飞、梦见捡钱、梦见前任..." rows="4"></textarea>
            <div class="form-tip">越详细解的越准哦~（娱乐为主）</div>
          </div>
        `;
        state.formData = { dreamContent: '' };
        break;
        
      case 12: // 星座运势
        const signs = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
        formHtml += `
          <div class="form-group">
            <label class="form-label">你的星座</label>
            <div class="form-options">
              ${signs.map((s, i) => `<div class="form-option ${i===0?'active':''}" data-field="sign" data-value="${s}">${s}座</div>`).join('')}
            </div>
          </div>
        `;
        state.formData = { sign: '白羊' };
        break;
        
      case 13: // 手机号吉凶
        formHtml += `
          <div class="form-group">
            <label class="form-label">输入手机号</label>
            <input type="tel" class="form-input" id="phoneInput" placeholder="请输入11位手机号" maxlength="11" />
            <div class="form-tip">娱乐测算，不要当真~</div>
          </div>
        `;
        state.formData = { phoneNumber: '' };
        break;
        
      case 14: // 彩虹屁生成器
        formHtml += `
          <div class="form-group">
            <label class="form-label">想夸谁？</label>
            <input type="text" class="form-input" id="complimentTarget" placeholder="比如：男朋友、闺蜜、老板、自己..." />
          </div>
          <div class="form-group">
            <label class="form-label">夸人风格</label>
            <div class="form-options">
              <div class="form-option active" data-field="style" data-value="sweet">甜蜜撒娇</div>
              <div class="form-option" data-field="style" data-value="funny">搞笑夸张</div>
              <div class="form-option" data-field="style" data-value="literary">文艺深情</div>
            </div>
          </div>
        `;
        state.formData = { target: '', style: 'sweet' };
        break;
        
      case 15: // 优雅怼人
        formHtml += `
          <div class="form-group">
            <label class="form-label">什么场景？</label>
            <div class="form-options">
              <div class="form-option active" data-field="scene" data-value="argue">被人抬杠</div>
              <div class="form-option" data-field="scene" data-value="stupid">遇到傻逼</div>
              <div class="form-option" data-field="scene" data-value="ex">前任找事</div>
              <div class="form-option" data-field="scene" data-value="colleague">傻逼同事</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">杀伤力</label>
            <div class="form-options">
              <div class="form-option active" data-field="intensity" data-value="light">轻微阴阳</div>
              <div class="form-option" data-field="intensity" data-value="medium">中度伤害</div>
              <div class="form-option" data-field="intensity" data-value="heavy">致命一击</div>
            </div>
          </div>
        `;
        state.formData = { scene: 'argue', intensity: 'light' };
        break;
        
      case 16: // emo文案
        formHtml += `
          <div class="form-group">
            <label class="form-label">什么心情？</label>
            <div class="form-options">
              <div class="form-option active" data-field="style" data-value="love">爱而不得</div>
              <div class="form-option" data-field="style" data-value="life">生活感慨</div>
              <div class="form-option" data-field="style" data-value="lateNight">深夜emo</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">想说点什么？（可选）</label>
            <input type="text" class="form-input" id="emoScene" placeholder="比如：想TA了、今天有点丧..." />
          </div>
        `;
        state.formData = { scene: '', style: 'love' };
        break;
        
      case 17: // 歌词改编（VIP）
        formHtml += `
          <div class="form-group">
            <label class="form-label">想改编哪首歌？</label>
            <input type="text" class="form-input" id="songNameInput" placeholder="比如：孤勇者、七里香、小幸运..." />
          </div>
          <div class="form-group">
            <label class="form-label">想改成什么故事？</label>
            <textarea class="form-textarea" id="songStoryInput" placeholder="比如：打工人的日常、减肥失败、单身狗的日常..." rows="3"></textarea>
          </div>
        `;
        state.formData = { songName: '', story: '' };
        break;
        
      default:
        formHtml = '<p style="text-align:center; color:#999; padding: 40px 0;">工具开发中...</p>';
    }
    
    elements.toolForm.innerHTML = formHtml;
    
    // 选项点击
    document.querySelectorAll('.form-option').forEach(option => {
      option.addEventListener('click', () => {
        const field = option.dataset.field;
        const value = option.dataset.value;
        
        option.parentElement.querySelectorAll('.form-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        
        state.formData[field] = value;
        
        if (field === 'type' && parseInt(tool.id) === 1) {
          const genderGroup = document.getElementById('genderGroup');
          if (genderGroup) genderGroup.style.display = value === 'baby' ? 'block' : 'none';
        }
      });
    });
    
    // 输入框
    const acrosticInput = document.getElementById('acrosticName');
    if (acrosticInput) {
      acrosticInput.addEventListener('input', (e) => {
        state.formData.name = e.target.value;
      });
    }
    
    // 新工具输入框监听
    const inputMappings = [
      { id: 'dreamInput', field: 'dreamContent' },
      { id: 'phoneInput', field: 'phoneNumber' },
      { id: 'complimentTarget', field: 'target' },
      { id: 'emoScene', field: 'scene' },
      { id: 'songNameInput', field: 'songName' },
      { id: 'songStoryInput', field: 'story' }
    ];
    inputMappings.forEach(m => {
      const el = document.getElementById(m.id);
      if (el) {
        el.addEventListener('input', (e) => {
          state.formData[m.field] = e.target.value;
        });
      }
    });
    
    // 表情包：模板选择
    document.querySelectorAll('.meme-template-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.meme-template-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        state.formData.template = item.dataset.template;
      });
    });
    
    // 表情包：文案输入
    const memeTextInput = document.getElementById('memeTextInput');
    if (memeTextInput) {
      memeTextInput.addEventListener('input', (e) => {
        state.formData.text = e.target.value;
      });
    }
    
    // 表情包：随机推荐文案
    const randomMemeBtn = document.getElementById('randomMemeBtn');
    if (randomMemeBtn) {
      randomMemeBtn.addEventListener('click', async () => {
        const memes = [
          '上班如上坟',
          '摆烂一时爽，一直摆烂一直爽',
          '你礼貌吗？',
          '我看不懂，但我大受震撼',
          '退！退！退！',
          '咱就是说，一整个大无语',
          '栓Q了老铁',
          '蚌埠住了',
          '破防了家人们',
          '伤害性不高，侮辱性极强',
          '听君一席话，如听一席话',
          '笑不活了',
          '老六行为',
          '这是可以说的吗',
          '我真的会谢',
          '有被冒犯到，谢谢',
          '就这？就这？',
          '你没事吧',
          '工资三千五，命比咖啡苦',
          '摸鱼一时爽，一直摸鱼一直爽',
          '单身狗的凝视',
          '狗粮吃饱了，谢谢款待',
          '月老是不是把我的红线拿去织毛衣了',
          '躺平是我最后的倔强',
          '人生苦短，再来一碗',
          '摆烂一天是一天',
          '今天也是精神不正常的一天呢',
          '做人哪有不疯的，硬撑罢了',
          '这逼班我是一天也上不下去了',
          '早八人，早八魂'
        ];
        const randomText = memes[Math.floor(Math.random() * memes.length)];
        memeTextInput.value = randomText;
        state.formData.text = randomText;
        showToast('🎲 已换一句');
      });
    }
    
    // 表情包：模式切换
    document.querySelectorAll('.meme-mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        document.querySelectorAll('.meme-mode-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const aiPanel = document.getElementById('memeAiPanel');
        const tplPanel = document.getElementById('memeTemplatePanel');
        
        if (mode === 'ai') {
          aiPanel.style.display = 'block';
          tplPanel.style.display = 'none';
          state.formData.mode = 'ai';
          // 同步AI输入框的值到formData
          const aiInput = document.getElementById('memeTextInputAi');
          if (aiInput) state.formData.text = aiInput.value;
        } else {
          aiPanel.style.display = 'none';
          tplPanel.style.display = 'block';
          state.formData.mode = 'template';
          state.formData.text = memeTextInput?.value || '';
        }
      });
    });
    
    // 表情包AI：形象选择
    document.querySelectorAll('.meme-char-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.meme-char-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        state.formData.template = item.dataset.char;
      });
    });
    
    // 表情包AI：文案输入和字数
    const memeTextInputAi = document.getElementById('memeTextInputAi');
    if (memeTextInputAi) {
      memeTextInputAi.addEventListener('input', (e) => {
        state.formData.text = e.target.value;
        state.formData.mode = 'ai';
        const count = document.getElementById('memeCharCountAi');
        if (count) count.textContent = e.target.value.length;
      });
      // 初始化formData
      state.formData.text = memeTextInputAi.value;
      state.formData.mode = 'ai';
      state.formData.template = 'panda';
    }
    
    // 表情包AI：随机推荐
    const randomMemeBtnAi = document.getElementById('randomMemeBtnAi');
    if (randomMemeBtnAi) {
      randomMemeBtnAi.addEventListener('click', async () => {
        const memes = [
          '上班如上坟', '摆烂一时爽', '你礼貌吗', '破防了',
          '退！退！退！', '蚌埠住了', '栓Q了', '笑不活了',
          '老六行为', '我真的会谢', '躺平是我最后的倔强',
          '这逼班我上够了', '早八人早八魂', '人生苦短再来一碗',
          '做人哪有不疯的', '工资三千五命比咖啡苦', '有被冒犯到'
        ];
        const randomText = memes[Math.floor(Math.random() * memes.length)];
        memeTextInputAi.value = randomText;
        state.formData.text = randomText;
        state.formData.mode = 'ai';
        document.getElementById('memeCharCountAi').textContent = randomText.length;
        showToast('🎲 已换一句');
      });
    }
    
    // 免费次数开关
    const freeSwitch = document.getElementById('freeSwitch');
    if (freeSwitch) {
      freeSwitch.addEventListener('click', () => {
        if ((state.userInfo?.freeUses || 0) <= 0) {
          showToast('暂无免费次数');
          return;
        }
        state.useFree = !state.useFree;
        freeSwitch.classList.toggle('on', state.useFree);
      });
    }
  }
  
  // ===== 生成与支付 =====
  
  async function handleGenerate() {
    if (!state.currentTool) return;
    
    if (parseInt(state.currentTool.id) === 4 && !state.formData.name) {
      showToast('请输入名字');
      return;
    }
    
    // 新工具校验
    const toolId = parseInt(state.currentTool.id);
    if (toolId === 11 && !state.formData.dreamContent) {
      showToast('说说你梦见了什么~');
      return;
    }
    if (toolId === 13 && !state.formData.phoneNumber) {
      showToast('请输入手机号');
      return;
    }
    if (toolId === 13 && state.formData.phoneNumber.length !== 11) {
      showToast('手机号是11位哦~');
      return;
    }
    if (toolId === 14 && !state.formData.target) {
      showToast('告诉我你想夸谁~');
      return;
    }
    if (toolId === 17 && !state.formData.songName) {
      showToast('说说你想改编哪首歌');
      return;
    }
    if (toolId === 17 && !state.formData.story) {
      showToast('说说你想改成什么故事');
      return;
    }
    
    showLoading('生成中...');
    
    try {
      const result = await api.createOrder(state.userId, state.currentTool.id, state.formData, state.useFree);
      hideLoading();
      
      if (result.code !== 0) {
        if (result.code === 1001) {
          showToast('余额不足，请先充值');
          setTimeout(() => openRechargeModal(), 800);
        } else if (result.code === 1005) {
          showToast('免费次数不足');
        } else if (result.code === 2001) {
          showToast('该工具为VIP专属');
          setTimeout(() => navigateTo('vip'), 800);
        } else {
          showToast(result.message);
        }
        return;
      }
      
      // 直接支付（免费或余额）
      showLoading(result.data.amount > 0 ? '支付中...' : '生成中...');
      const payResult = await api.payOrder(state.userId, result.data.orderId);
      hideLoading();
      
      if (payResult.code === 0) {
        state.currentOrder = { id: payResult.data.orderId, result: payResult.data.result };
        
        // 更新用户信息
        state.userInfo.balance = payResult.data.remainingBalance;
        state.userInfo.freeUses = payResult.data.freeUses;
        state.userInfo.growthPoints = payResult.data.growthPoints;
        state.userInfo.level = payResult.data.level;
        state.userInfo.totalUses = (state.userInfo.totalUses || 0) + 1;
        localStorage.setItem('yy_user', JSON.stringify(state.userInfo));
        updateUserUI();
        
        showResult(payResult.data.result);
        showToast('生成成功！');
      } else {
        showToast(payResult.message);
      }
    } catch (err) {
      hideLoading();
      showToast('生成失败，请稍后重试');
    }
  }
  
  // ===== 结果展示 =====
  
  function showResult(result) {
    if (window.__debug) window.__debug.lastResult = result;
    const toolId = parseInt(state.currentTool.id);
    let html = '';
    
    switch (toolId) {
      case 1:
        const names = result.names || result;
        html = `<ul class="name-list">${names.map((item, i) => `
          <li class="name-item">
            <div class="name-rank">${i + 1}</div>
            <div><div class="name-text">${item.name || item}</div><div class="name-reason">${item.meaning || item.reason || ''}</div></div>
          </li>
        `).join('')}</ul>`;
        break;
        
      case 2:
        const scoreColor = result.overallScore >= 85 ? '#52c41a' : result.overallScore >= 70 ? '#fa8c16' : '#ff4d4f';
        html = `
          <div class="fortune-result">
            <div class="fortune-header">
              <div class="fortune-zodiac">${state.formData.zodiac || '白羊座'}</div>
              <div class="fortune-date">${new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</div>
              ${result.fromAI ? '<div class="fortune-ai-tag">✨ AI 智能运势</div>' : ''}
            </div>
            
            <div class="fortune-overall-card">
              <div class="fortune-score-ring">
                <svg viewBox="0 0 120 120" class="score-svg">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#f0f0f0" stroke-width="8"/>
                  <circle cx="60" cy="60" r="54" fill="none" stroke="${scoreColor}" stroke-width="8" 
                    stroke-dasharray="${result.overallScore * 3.39} 339" stroke-linecap="round"
                    transform="rotate(-90 60 60)"/>
                </svg>
                <div class="score-num">${result.overallScore}</div>
                <div class="score-label">综合运势</div>
              </div>
              <div class="fortune-motto">「 ${result.todaysMotto || '今日好运' } 」</div>
            </div>
            
            <div class="fortune-scores-grid">
              <div class="score-card love">
                <div class="score-icon">💕</div>
                <div class="score-info">
                  <div class="score-name">桃花运</div>
                  <div class="score-bar"><div class="score-bar-fill" style="width:${result.loveScore}%"></div></div>
                </div>
                <div class="score-value">${result.loveScore}</div>
              </div>
              <div class="score-card career">
                <div class="score-icon">💼</div>
                <div class="score-info">
                  <div class="score-name">事业运</div>
                  <div class="score-bar"><div class="score-bar-fill" style="width:${result.careerScore}%"></div></div>
                </div>
                <div class="score-value">${result.careerScore}</div>
              </div>
              <div class="score-card wealth">
                <div class="score-icon">💰</div>
                <div class="score-info">
                  <div class="score-name">财运</div>
                  <div class="score-bar"><div class="score-bar-fill" style="width:${result.wealthScore}%"></div></div>
                </div>
                <div class="score-value">${result.wealthScore}</div>
              </div>
              <div class="score-card health">
                <div class="score-icon">🏃</div>
                <div class="score-info">
                  <div class="score-name">健康运</div>
                  <div class="score-bar"><div class="score-bar-fill" style="width:${result.healthScore}%"></div></div>
                </div>
                <div class="score-value">${result.healthScore}</div>
              </div>
            </div>
            
            <div class="fortune-detail-card">
              <div class="detail-title">🌟 整体运势</div>
              <div class="detail-text">${result.overallText || ''}</div>
            </div>
            
            <div class="fortune-detail-row">
              <div class="fortune-detail-half">
                <div class="detail-title small">💕 感情运</div>
                <div class="detail-text small">${result.loveText || ''}</div>
              </div>
              <div class="fortune-detail-half">
                <div class="detail-title small">💼 事业运</div>
                <div class="detail-text small">${result.careerText || ''}</div>
              </div>
            </div>
            
            <div class="fortune-detail-row">
              <div class="fortune-detail-half">
                <div class="detail-title small">💰 财运</div>
                <div class="detail-text small">${result.wealthText || ''}</div>
              </div>
              <div class="fortune-detail-half">
                <div class="detail-title small">🏃 健康运</div>
                <div class="detail-text small">${result.healthText || ''}</div>
              </div>
            </div>
            
            <div class="fortune-lucky-card">
              <div class="lucky-item">
                <div class="lucky-icon">🎨</div>
                <div class="lucky-info">
                  <div class="lucky-label">幸运颜色</div>
                  <div class="lucky-value">${result.luckyColor || '-'}</div>
                </div>
              </div>
              <div class="lucky-item">
                <div class="lucky-icon">🔢</div>
                <div class="lucky-info">
                  <div class="lucky-label">幸运数字</div>
                  <div class="lucky-value">${result.luckyNumber || '-'}</div>
                </div>
              </div>
              <div class="lucky-item">
                <div class="lucky-icon">🧭</div>
                <div class="lucky-info">
                  <div class="lucky-label">幸运方位</div>
                  <div class="lucky-value">${result.luckyDirection || '-'}</div>
                </div>
              </div>
            </div>
            
            <div class="fortune-suggestion">
              <div class="suggestion-icon">💡</div>
              <div class="suggestion-text">${result.suggestion || '保持好心情，今天也是美好的一天～'}</div>
            </div>
          </div>
        `;
        break;
        
      case 3:
        const words = result.words || result;
        html = `<ul class="love-words-list">${words.map((item, i) => `
          <li class="love-word-item">
            <div class="love-word-num">${i + 1}</div>
            <div class="love-word-text">${typeof item === 'string' ? item : (item.text || item.content || item)}</div>
          </li>
        `).join('')}</ul>`;
        break;
        
      case 4:
        const poemLines = result.poem || [];
        html = `
          <div class="acrostic-poem">
            <div class="acrostic-title">《${result.title || result.name || '藏头诗'}》</div>
            <div class="poem-lines">${poemLines.map(line => `<span class="poem-line">${line}</span>`).join('')}</div>
            <div class="acrostic-type">—— ${result.explanation || result.type || 'AI生成'}</div>
            ${result.fromAI ? '<div class="acrostic-ai-tag">✨ AI 智能生成</div>' : ''}
          </div>
        `;
        break;
        
      case 5:
        // AI生图模式
        if (result.fromAI && result.imageUrl) {
          html = `
            <div class="meme-result">
              <div class="meme-ai-badge">✨ AI智能生成</div>
              <div class="meme-image-wrap">
                <img id="memeAiImage" src="${result.imageUrl}" alt="AI表情包" />
              </div>
              <div class="meme-actions">
                <button class="meme-action-btn" id="memeDownloadBtn">
                  <span>📥</span> 保存图片
                </button>
                <button class="meme-action-btn meme-share-btn" id="memeShareBtn">
                  <span>📤</span> 分享给朋友
                </button>
              </div>
              <div class="meme-tip">💡 长按图片也可以保存哦~</div>
            </div>
          `;
        } else {
          // 模板Canvas模式
          html = `
            <div class="meme-result">
              <div class="meme-canvas-wrap">
                <canvas id="memeCanvas" width="400" height="400"></canvas>
              </div>
              <div class="meme-actions">
                <button class="meme-action-btn" id="memeDownloadBtn">
                  <span>📥</span> 保存图片
                </button>
                <button class="meme-action-btn meme-share-btn" id="memeShareBtn">
                  <span>📤</span> 分享给朋友
                </button>
              </div>
              <div class="meme-tip">💡 提示：长按图片也可以保存哦~</div>
            </div>
          `;
        }
        break;
        
      case 6:
        const momentTexts = result.texts || result;
        html = momentTexts.map((text, i) => `
          <div class="moment-item">
            <div class="moment-num">${i + 1}</div>
            <div class="moment-text">${typeof text === 'string' ? text : (text.text || text.content || text)}</div>
          </div>
        `).join('');
        break;
        
      case 7:
        html = `
          <div class="personality-result">
            <div class="personality-emoji">${result.emoji || '🌟'}</div>
            <div class="personality-type">${result.type || '综合型'}</div>
            ${result.fromAI ? '<div class="personality-ai-tag">✨ AI 智能分析</div>' : ''}
            <div class="personality-desc">${result.desc || ''}</div>
            <div class="personality-traits">${(result.traits || []).map(t => `<span class="trait-tag">${t}</span>`).join('')}</div>
            <div class="personality-section">
              <div class="personality-section-title">💼 适合职业</div>
              <div class="personality-career-list">${(result.suitable || []).map(s => `<span class="career-tag">${s}</span>`).join('')}</div>
            </div>
            ${result.loveStyle ? `
            <div class="personality-section">
              <div class="personality-section-title">💕 恋爱中的你</div>
              <div class="personality-section-text">${result.loveStyle}</div>
            </div>
            ` : ''}
            ${result.friendStyle ? `
            <div class="personality-section">
              <div class="personality-section-title">🤝 做朋友的你</div>
              <div class="personality-section-text">${result.friendStyle}</div>
            </div>
            ` : ''}
            ${result.growthAdvice ? `
            <div class="personality-section">
              <div class="personality-section-title">🌱 成长建议</div>
              <div class="personality-section-text">${result.growthAdvice}</div>
            </div>
            ` : ''}
          </div>
        `;
        break;
        
      case 8:
        const probLevelColor = result.probability >= 75 ? '#52c41a' : result.probability >= 50 ? '#fa8c16' : '#ff4d4f';
        html = `
          <div class="probability-result">
            <div class="probability-circle" style="--prob: ${result.probability}%; --color: ${probLevelColor};">
              <div class="probability-num">${result.probability}<span class="probability-unit">%</span></div>
              <div class="probability-level">${result.level || '脱单概率'}</div>
            </div>
            <div class="probability-summary">${result.analysis || result.summary || ''}</div>
            
            <div class="prob-detail-grid">
              <div class="prob-detail-item">
                <div class="prob-detail-icon">✅</div>
                <div class="prob-detail-label">你的优势</div>
                <div class="prob-detail-list">
                  ${(result.advantages || []).map(a => `<div class="prob-detail-text">• ${a}</div>`).join('')}
                </div>
              </div>
              <div class="prob-detail-item">
                <div class="prob-detail-icon">⚠️</div>
                <div class="prob-detail-label">需要注意</div>
                <div class="prob-detail-list">
                  ${(result.problems || []).map(p => `<div class="prob-detail-text">• ${p}</div>`).join('')}
                </div>
              </div>
            </div>
            
            <div class="prob-best-time">
              <span class="time-icon">✨</span>
              <span class="time-label">最佳脱单时机：</span>
              <span class="time-value">${result.bestTime || '下半年'}</span>
            </div>
            
            ${result.type ? `
            <div class="prob-suitable-type">
              <div class="type-label">💕 适合你的类型</div>
              <div class="type-text">${result.type}</div>
            </div>
            ` : ''}
            
            <div class="probability-suggestions">
              <div class="suggestion-title">💡 脱单建议</div>
              ${(result.suggestions || []).map((s, i) => `<div class="suggestion-item"><span class="sug-num">${i + 1}</span>${s}</div>`).join('')}
            </div>
          </div>
        `;
        break;
        
      case 9:
        html = `
          <div class="career-result">
            <div class="career-header">
              <div class="career-emoji">💼</div>
              <div class="career-type">${result.personality}人格</div>
              <div class="career-ai-tag">${result.fromAI ? '✨ AI 智能生成' : '📋 分析生成'}</div>
            </div>
            
            <div class="career-card">
              <div class="career-card-title">🎯 核心建议</div>
              <div class="career-card-text">${result.advice}</div>
            </div>
            
            <div class="career-row">
              <div class="career-col">
                <div class="career-col-title">✅ 优势</div>
                <div class="career-col-list">
                  ${result.strengths.map(s => `<div class="career-col-item green">• ${s}</div>`).join('')}
                </div>
              </div>
              <div class="career-col">
                <div class="career-col-title">⚠️ 待提升</div>
                <div class="career-col-list">
                  ${result.weaknesses.map(w => `<div class="career-col-item orange">• ${w}</div>`).join('')}
                </div>
              </div>
            </div>
            
            <div class="career-card">
              <div class="career-card-title">💼 适合职业</div>
              <div class="career-suitable">
                ${result.suitable.map(s => `<span class="career-suitable-tag">${s}</span>`).join('')}
              </div>
              <div class="career-salary">
                <span class="salary-label">💰 参考薪资</span>
                <span class="salary-value">${result.salaryRange}</span>
              </div>
            </div>
            
            ${result.developmentPath ? `
            <div class="career-card">
              <div class="career-card-title">🛤️ 发展路径</div>
              <div class="career-card-text">${result.developmentPath}</div>
            </div>
            ` : ''}
            
            ${result.learningSuggestions && result.learningSuggestions.length ? `
            <div class="career-card">
              <div class="career-card-title">📚 学习建议</div>
              <div class="career-learning-list">
                ${result.learningSuggestions.map((s, i) => `
                  <div class="career-learning-item">
                    <span class="learning-num">${i + 1}</span>
                    <span class="learning-text">${s}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
          </div>
        `;
        break;
        
      case 10:
        html = `
          <div class="eq-result">
            <div class="eq-tip">💡 三种风格任选，总有一款合适</div>
            ${result.replies?.map((r, i) => `
              <div class="eq-card">
                <div class="eq-style-badge style-${i + 1}">${r.style || '方案' + (i + 1)}</div>
                <div class="eq-text">${r.text || ''}</div>
                <div class="eq-reason">💭 ${r.reason || r.analysis || ''}</div>
                <div class="eq-copy" onclick="copyText('${(r.text || '').replace(/'/g, "\\'")}')">复制</div>
              </div>
            `).join('')}
          </div>
        `;
        break;
        
      default:
        html = '<p style="text-align:center; padding:40px 0; color:#999;">结果生成中...</p>';
    }
    
    elements.resultContent.innerHTML = html;
    navigateTo('result', { title: state.currentTool.name });
    
    // 表情包工具：Canvas生成图片
    if (parseInt(state.currentTool.id) === 5) {
      setTimeout(() => {
        drawMemeCanvas();
        bindMemeActions();
      }, 100);
    }
  }
  
  // ===== 签到 =====
  
  async function loadSignPage() {
    const result = await api.getSignStatus(state.userId);
    if (result.code === 0) {
      const status = result.data;
      const btn = elements.signBtn;
      
      // 连续签到天数
      const daysCount = document.getElementById('signDaysCount');
      if (daysCount) daysCount.textContent = status.signDays || 0;
      
      // 渲染7天日历
      const calendar = document.getElementById('signCalendar');
      if (calendar && status.weekList) {
        calendar.innerHTML = status.weekList.map((day, idx) => {
          const icon = day.isSigned ? '✅' : (day.isToday ? '👈' : '🎁');
          const rewardText = day.balance > 0 ? `+${day.freeUses}次 +¥${day.balance}` : `+${day.freeUses}次`;
          return `
            <div class="sign-day-new ${day.isSigned ? 'signed' : ''} ${day.isToday ? 'today' : ''}">
              <div class="sign-day-icon-new">${icon}</div>
              <div class="sign-day-num-new">第${day.day}天</div>
              <div class="sign-day-reward-new">${rewardText}</div>
            </div>
          `;
        }).join('');
      }
      
      // 今日奖励
      const todayIdx = status.todaySigned 
        ? ((status.signDays - 1) % 7) 
        : (status.signDays % 7);
      const todayReward = status.weekList?.[todayIdx] || { freeUses: 1, balance: 0, growth: 5 };
      
      const freeEl = document.getElementById('todayFreeReward');
      if (freeEl) freeEl.textContent = `+${todayReward.freeUses || 1}次`;
      
      const growthEl = document.getElementById('todayGrowthReward');
      if (growthEl) growthEl.textContent = `+${todayReward.growth || 5}点`;
      
      const balanceEl = document.getElementById('todayBalanceReward');
      if (balanceEl) balanceEl.textContent = `+¥${(todayReward.balance || 0).toFixed(1)}`;
      
      // 按钮状态
      if (status.todaySigned) {
        btn.textContent = '今日已签到 ✓';
        btn.disabled = true;
        btn.style.opacity = '0.6';
      } else {
        btn.textContent = '立即签到';
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    }
  }
  
  async function handleSign() {
    showLoading('签到中...');
    const result = await api.doSign(state.userId);
    hideLoading();
    
    if (result.code === 0) {
      const reward = result.data.reward;
      let msg = '签到成功！';
      if (reward) {
        msg = `+${reward.freeUses || 0}次免费 +${reward.growth || 0}成长值`;
        if (reward.balance) msg += ` +¥${reward.balance}`;
        if (result.data.bonus?.length) msg += `\n${result.data.bonus.join(' ')}`;
      }
      showToast(msg);
      await refreshUserInfo();
      loadSignPage();
    } else {
      showToast(result.message);
    }
  }
  
  // ===== 任务中心 =====
  
  async function loadTasks() {
    showLoading();
    const result = await api.getTasks(state.userId);
    hideLoading();
    
    if (result.code === 0) {
      const tasks = result.data.tasks;
      const dailyTasks = tasks.filter(t => t.type === 'daily');
      const newbieTasks = tasks.filter(t => t.type === 'once' || t.type === 'repeat');
      
      renderTaskList(elements.dailyTasksList, dailyTasks);
      renderTaskList(elements.newbieTasksList, newbieTasks);
    }
  }
  
  function renderTaskList(container, tasks) {
    const taskIcons = {
      daily_sign: '📅',
      daily_share: '📤',
      first_use: '✨',
      invite_friend: '🤝',
      first_recharge: '💰',
      browse_tools: '🔍',
      share_app: '📱'
    };
    
    container.innerHTML = tasks.map(task => `
      <div class="task-item-new">
        <div class="task-item-icon-new">${taskIcons[task.id] || '🎯'}</div>
        <div class="task-item-info-new">
          <div class="task-item-name-new">${task.name}</div>
          <div class="task-item-desc-new">${task.desc}</div>
        </div>
        <div class="task-item-reward-new">
          ${task.reward.freeUses ? `+${task.reward.freeUses}次` : ''}
        </div>
        <button class="task-item-btn-new ${task.completed ? 'done' : ''}" data-task-id="${task.id}">
          ${task.completed ? '已完成' : '去完成'}
        </button>
      </div>
    `).join('');
    
    // 绑定点击
    container.querySelectorAll('.task-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const taskId = btn.dataset.taskId;
        handleTaskClick(taskId);
      });
    });
  }
  
  function handleTaskClick(taskId) {
    switch (taskId) {
      case 'daily_sign':
        navigateTo('sign');
        break;
      case 'invite_friend':
        navigateTo('invite');
        break;
      case 'first_recharge':
        openRechargeModal();
        break;
      default:
        showToast('请在使用过程中完成任务');
    }
  }
  
  // ===== 会员中心 =====
  
  async function loadVipPage() {
    showLoading();
    const [pkgResult, infoResult] = await Promise.all([
      api.getVipPackages(),
      api.getVipInfo(state.userId)
    ]);
    hideLoading();
    
    if (pkgResult.code === 0) {
      state.vipPackages = pkgResult.data.packages;
      renderVipPackages(pkgResult.data.packages);
    }
    
    // 更新用户VIP信息
    if (infoResult.code === 0) {
      state.userInfo.vipInfo = infoResult.data;
    }
  }
  
  function renderVipPackages(packages) {
    const tags = { monthly: '', quarterly: '推荐', yearly: '超值', lifetime: '最划算' };
    const units = { monthly: '/月', quarterly: '/季', yearly: '/年', lifetime: '终身' };
    
    elements.vipPackages.innerHTML = packages.map((pkg, index) => `
      <div class="vip-pkg-card ${pkg.type === 'quarterly' ? 'active' : ''}" data-type="${pkg.type}">
        ${tags[pkg.type] ? `<div class="pkg-tag-new">${tags[pkg.type]}</div>` : ''}
        <div class="pkg-name-new">${pkg.name}</div>
        <div class="pkg-price-new">¥${pkg.price}</div>
        <div class="pkg-unit-new">${units[pkg.type]}</div>
      </div>
    `).join('');
    
    // 默认选中季卡
    state.selectedVipType = 'quarterly';
    updateVipHeaderPrice();
    
    // 绑定选择
    document.querySelectorAll('.vip-pkg-card').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.vip-pkg-card').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        state.selectedVipType = item.dataset.type;
        updateVipHeaderPrice();
      });
    });
  }
  
  function updateVipHeaderPrice() {
    const pkg = state.vipPackages.find(p => p.type === state.selectedVipType);
    const units = { monthly: '/月', quarterly: '/季', yearly: '/年', lifetime: '终身' };
    const headerPriceEl = document.getElementById('vipHeaderPrice');
    const bottomPriceEl = document.getElementById('vipBottomPrice');
    const heroUnitEl = document.querySelector('.vip-hero-price-unit');
    if (pkg) {
      if (headerPriceEl) headerPriceEl.textContent = pkg.price;
      if (bottomPriceEl) bottomPriceEl.textContent = pkg.price;
      if (heroUnitEl) heroUnitEl.textContent = units[pkg.type] || '';
    }
  }
  
  async function handlePurchaseVip() {
    if (!state.selectedVipType) {
      showToast('请选择会员套餐');
      return;
    }
    
    const payMethod = state.selectedVipPayMethod || 'balance';
    
    if (payMethod === 'balance') {
      // 余额支付走老接口
      showLoading('开通中...');
      const result = await api.purchaseVip(state.userId, state.selectedVipType, payMethod);
      hideLoading();
      
      if (result.code === 0) {
        showToast('余额支付开通成功！');
        await refreshUserInfo();
        loadVipPage();
      } else if (result.code === 1001) {
        showToast('余额不足，请先充值');
        setTimeout(() => openRechargeModal(), 800);
      } else {
        showToast(result.message);
      }
    } else {
      // 微信/支付宝走扫码支付
      showLoading('创建订单中...');
      const result = await api.createPayOrder(state.userId, 'vip', 0, payMethod, state.selectedVipType);
      hideLoading();
      
      if (result.code === 0) {
        openQrcodeModal(result.data, 'vip');
      } else {
        showToast(result.message);
      }
    }
  }
  
  // ===== 邀请页面 =====
  
  async function loadInvitePage() {
    showLoading();
    const [infoRes, listRes] = await Promise.all([
      api.getInviteInfo(state.userId),
      api.getInviteList(state.userId, 1, 20)
    ]);
    hideLoading();
    
    if (infoRes.code === 0) {
      const info = infoRes.data;
      const codeEl = document.getElementById('inviteCode');
      const countEl = document.getElementById('inviteCount');
      const totalEl = document.getElementById('inviteTotalReward');
      
      if (codeEl) codeEl.textContent = info.inviteCode;
      if (countEl) countEl.textContent = info.inviteCount;
      // 累计获得金额 = 邀请人数 × 5元
      if (totalEl) totalEl.textContent = (info.inviteCount * 5).toFixed(1);
    }
    
    if (listRes.code === 0) {
      const listData = listRes.data;
      const container = document.getElementById('inviteListContainer');
      const countEl = document.getElementById('inviteListCount');
      
      if (countEl) countEl.textContent = `共${listData.total}人`;
      
      if (container) {
        if (listData.list.length === 0) {
          container.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">🤝</div>
              <div class="empty-state-text">还没有邀请记录<br>快去邀请好友吧~</div>
            </div>
          `;
        } else {
          container.innerHTML = listData.list.map(item => {
            const date = new Date(item.createdAt);
            const timeStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;
            return `
              <div class="invite-item">
                <div class="invite-avatar">${item.inviteeAvatar}</div>
                <div class="invite-info">
                  <div class="invite-name">${item.inviteeName}</div>
                  <div class="invite-time">${timeStr} 加入</div>
                </div>
                <div class="invite-reward-tag">+10次 +¥5</div>
              </div>
            `;
          }).join('');
        }
      }
    }
  }
  
  function handleCopyInviteCode() {
    const code = elements.inviteCode.textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        showToast('邀请码已复制');
      });
    } else {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('邀请码已复制');
    }
  }
  
  // ===== 等级页面 =====
  
  async function loadLevelsPage() {
    showLoading();
    const result = await api.getLevels();
    hideLoading();
    
    if (result.code === 0) {
      const levels = result.data.levels;
      const currentLevel = state.userInfo?.level || 'bronze';
      const growthPoints = state.userInfo?.growthPoints || 0;
      
      // 更新头部
      const currentLevelInfo = levels.find(l => l.level === currentLevel) || levels[0];
      elements.myLevelIcon.textContent = currentLevelInfo.icon;
      elements.myLevelName.textContent = currentLevelInfo.name;
      elements.myGrowthPoints.textContent = growthPoints;
      
      // 渲染等级列表
      elements.levelsList.innerHTML = levels.map(level => `
        <div class="level-item ${level.level === currentLevel ? 'current' : ''}">
          <div class="level-icon">${level.icon}</div>
          <div class="level-info">
            <div class="level-name">${level.name}</div>
            <div class="level-desc">
              每日免费${level.dailyFree}次 · 
              ${level.discount === 1 ? '原价' : `${level.discount * 10}折优惠`}
              ${level.minGrowth > 0 ? ` · 需要${level.minGrowth}成长值` : ''}
            </div>
          </div>
          ${level.level === currentLevel ? '<div class="level-tag">当前等级</div>' : ''}
        </div>
      `).join('');
    }
  }
  
  // ===== 分享 =====
  
  async function handleShare() {
    showLoading('记录中...');
    const result = await api.recordShare(state.userId, 'result', state.currentTool?.id);
    hideLoading();
    
    if (result.code === 0) {
      showToast(result.message);
      await refreshUserInfo();
    } else {
      showToast(result.message);
    }
  }
  
  // ===== 充值 =====
  
  function openRechargeModal() {
    elements.rechargeModal.classList.add('show');
  }
  
  function closeRechargeModal() {
    elements.rechargeModal.classList.remove('show');
  }
  
  async function handleRecharge() {
    const amount = state.selectedRechargeAmount;
    const payMethod = state.selectedPayMethod || 'wechat';
    
    if (!amount || amount <= 0) {
      showToast('请选择充值金额');
      return;
    }
    
    showLoading('创建订单中...');
    const result = await api.createPayOrder(state.userId, 'recharge', amount, payMethod);
    hideLoading();
    
    if (result.code === 0) {
      closeRechargeModal();
      openQrcodeModal(result.data, 'recharge');
    } else {
      showToast(result.message);
    }
  }
  
  // ===== 扫码支付弹窗 =====
  let qrcodePollTimer = null;
  let qrcodeCountdownTimer = null;
  
  function openQrcodeModal(orderInfo, type) {
    const modal = document.getElementById('qrcodeModal');
    const titleEl = document.getElementById('qrcodeTitle');
    const amountEl = document.getElementById('qrcodeAmount');
    const imgEl = document.getElementById('qrcodeImg');
    const tipEl = document.getElementById('qrcodeTip');
    const orderNoEl = document.getElementById('qrcodeOrderNo');
    const statusEl = document.getElementById('qrcodeStatus');
    const countdownEl = document.getElementById('qrcodeCountdown');
    
    titleEl.textContent = type === 'vip' ? '开通会员' : '充值余额';
    amountEl.textContent = orderInfo.amount.toFixed(2);
    imgEl.src = orderInfo.qrCode;
    orderNoEl.textContent = orderInfo.orderNo;
    statusEl.style.display = 'none';
    
    const methodNames = { wechat: '微信', alipay: '支付宝' };
    tipEl.textContent = `请使用${methodNames[orderInfo.payMethod] || ''}扫码支付`;
    
    modal.classList.add('show');
    
    // 倒计时
    startQrcodeCountdown(orderInfo.expireAt);
    
    // 轮询订单状态
    startQrcodePolling(orderInfo.orderId, type);
  }
  
  function closeQrcodeModal() {
    const modal = document.getElementById('qrcodeModal');
    modal.classList.remove('show');
    
    if (qrcodePollTimer) {
      clearInterval(qrcodePollTimer);
      qrcodePollTimer = null;
    }
    if (qrcodeCountdownTimer) {
      clearInterval(qrcodeCountdownTimer);
      qrcodeCountdownTimer = null;
    }
  }
  
  function startQrcodeCountdown(expireAt) {
    const countdownEl = document.getElementById('qrcodeCountdown');
    
    function update() {
      const now = new Date().getTime();
      const expire = new Date(expireAt).getTime();
      const remain = Math.max(0, expire - now);
      
      const minutes = Math.floor(remain / 60000);
      const seconds = Math.floor((remain % 60000) / 1000);
      
      countdownEl.textContent = `⏱ 支付剩余时间：${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      if (remain <= 0) {
        countdownEl.textContent = '⏰ 订单已超时';
        countdownEl.style.color = '#ef4444';
        if (qrcodeCountdownTimer) {
          clearInterval(qrcodeCountdownTimer);
          qrcodeCountdownTimer = null;
        }
      }
    }
    
    update();
    qrcodeCountdownTimer = setInterval(update, 1000);
  }
  
  function startQrcodePolling(orderId, type) {
    const statusEl = document.getElementById('qrcodeStatus');
    
    qrcodePollTimer = setInterval(async () => {
      const result = await api.getPayOrderStatus(orderId);
      
      if (result.code === 0) {
        const status = result.data.status;
        
        if (status === 1) {
          // 支付成功
          clearInterval(qrcodePollTimer);
          qrcodePollTimer = null;
          
          statusEl.style.display = 'block';
          showToast('支付成功！');
          
          // 刷新用户信息
          await refreshUserInfo();
          
          setTimeout(() => {
            closeQrcodeModal();
          }, 1500);
        } else if (status === 2 || status === 3) {
          // 取消或超时
          clearInterval(qrcodePollTimer);
          qrcodePollTimer = null;
          
          const msg = status === 2 ? '订单已取消' : '订单已超时';
          showToast(msg);
        }
      }
    }, 3000);
  }
  
  async function handleCancelQrcodePay() {
    const orderNoEl = document.getElementById('qrcodeOrderNo');
    // 从订单号获取订单ID比较麻烦，直接关闭不取消了（超时会自动取消）
    closeQrcodeModal();
  }
  
  function handleIPaid() {
    showToast('已通知管理员，确认后自动到账~');
  }
  
  // ===== 订单记录 =====
  
  async function loadOrders() {
    showLoading();
    const result = await api.getOrderList(state.userId, 1, 20);
    hideLoading();
    
    if (result.code === 0) {
      renderOrders(result.data.list);
    }
  }
  
  function renderOrders(orders) {
    if (!orders || orders.length === 0) {
      elements.ordersList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">暂无使用记录</div>
        </div>
      `;
      return;
    }
    
    elements.ordersList.innerHTML = orders.map(order => `
      <div class="order-item">
        <div class="order-header">
          <span class="order-tool">${order.toolName}</span>
          <span class="order-amount">${order.amount > 0 ? '-¥' + order.amount.toFixed(2) : '免费'}</span>
        </div>
        <div class="order-info">
          <span>${new Date(order.createdAt).toLocaleString('zh-CN')}</span>
          <span class="order-status ${order.status === 1 ? 'success' : 'pending'}">
            ${order.status === 1 ? '已完成' : '待支付'}
          </span>
        </div>
      </div>
    `).join('');
  }
  
  // ===== 事件绑定 =====
  
  function bindEvents() {
    // 返回
    elements.backBtn.addEventListener('click', () => {
      const backMap = {
        'result': 'tool',
        'tool': 'home',
        'orders': 'profile',
        'sign': 'profile',
        'tasks': 'profile',
        'vip': 'profile',
        'invite': 'profile',
        'levels': 'profile'
      };
      const target = backMap[state.currentPage] || 'home';
      const options = target === 'tool' ? { title: state.currentTool?.name } : {};
      navigateTo(target, options);
    });
    
    // 用户头像
    elements.userBtn.addEventListener('click', () => {
      navigateTo('profile');
      refreshUserInfo();
    });
    
    // TabBar
    document.querySelectorAll('.tab-bar-item').forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        if (tab === 'home') navigateTo('home');
        else if (tab === 'profile') {
          navigateTo('profile');
          refreshUserInfo();
        }
      });
    });
    
    // 分类标签
    elements.categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadTools(tab.dataset.category);
      });
    });
    
    // 首页按钮
    elements.rechargeBtn.addEventListener('click', openRechargeModal);
    elements.vipEntry.addEventListener('click', () => { navigateTo('vip'); loadVipPage(); });
    elements.signEntry.addEventListener('click', () => { navigateTo('sign'); loadSignPage(); });
    elements.taskBanner.addEventListener('click', () => { navigateTo('tasks'); loadTasks(); });
    
    // 个人中心网格
    elements.gridSign.addEventListener('click', () => { navigateTo('sign'); loadSignPage(); });
    elements.gridTasks.addEventListener('click', () => { navigateTo('tasks'); loadTasks(); });
    elements.gridInvite.addEventListener('click', () => { navigateTo('invite'); loadInvitePage(); });
    elements.gridVip.addEventListener('click', () => { navigateTo('vip'); loadVipPage(); });
    
    // 个人中心菜单
    elements.menuRecharge.addEventListener('click', openRechargeModal);
    elements.menuOrders.addEventListener('click', () => { navigateTo('orders'); loadOrders(); });
    elements.menuGrowth.addEventListener('click', () => { navigateTo('levels'); loadLevelsPage(); });
    
    // 签到按钮
    elements.signBtn.addEventListener('click', handleSign);
    
    // 会员支付方式选择（新样式 - 列表单选）
    document.querySelectorAll('.vip-pay-row').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.vip-pay-row').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        state.selectedVipPayMethod = item.dataset.vipPay;
      });
    });
    state.selectedVipPayMethod = 'balance';
    
    // 会员购买
    elements.vipBuyBtn.addEventListener('click', handlePurchaseVip);
    
    // 邀请
    elements.copyInviteCode.addEventListener('click', handleCopyInviteCode);
    elements.inviteShareBtn.addEventListener('click', () => showToast('分享功能开发中...'));
    
    // 充值弹窗
    elements.closeRecharge.addEventListener('click', closeRechargeModal);
    document.querySelector('#rechargeModal .modal-mask').addEventListener('click', closeRechargeModal);
    
    document.querySelectorAll('.recharge-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.recharge-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        state.selectedRechargeAmount = parseFloat(item.dataset.amount);
        state.selectedRechargeBonus = parseFloat(item.dataset.bonus) || 0;
      });
    });
    
    // 支付方式选择
    document.querySelectorAll('.pay-method-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.pay-method-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        state.selectedPayMethod = item.dataset.method;
      });
    });
    state.selectedPayMethod = 'wechat'; // 默认微信
    
    elements.confirmRecharge.addEventListener('click', handleRecharge);
    
    // 扫码支付弹窗事件
    document.getElementById('closeQrcode').addEventListener('click', closeQrcodeModal);
    document.getElementById('cancelQrcodePay').addEventListener('click', handleCancelQrcodePay);
    document.getElementById('iPaidBtn').addEventListener('click', handleIPaid);
    
    // 生成按钮
    elements.generateBtn.addEventListener('click', handleGenerate);
    
    // 结果页操作
    elements.shareBtn.addEventListener('click', handleShare);
    elements.regenBtn.addEventListener('click', () => {
      navigateTo('tool', { title: state.currentTool?.name });
    });
  }
  
  // ===== 表情包Canvas生成（高级版）=====
  
  // 表情包风格模板
  const memeStyles = {
    classic: {
      name: '经典大字报',
      icon: '📝',
      bgColor: '#ffffff',
      textColor: '#000000',
      strokeColor: '#ffffff',
      strokeWidth: 6,
      fontWeight: '900',
      fontSize: 42,
      layout: 'center'
    },
    gradient: {
      name: '渐变ins风',
      icon: '🌈',
      gradient: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3'],
      textColor: '#ffffff',
      strokeColor: 'rgba(0,0,0,0.3)',
      strokeWidth: 2,
      fontWeight: '800',
      fontSize: 36,
      layout: 'center'
    },
    bubble: {
      name: '气泡对话',
      icon: '💬',
      bgColor: '#f5f5f5',
      bubbleColor: '#95ec69',
      textColor: '#000000',
      strokeColor: 'transparent',
      strokeWidth: 0,
      fontWeight: '500',
      fontSize: 28,
      layout: 'bubble'
    },
    retro: {
      name: '复古报纸',
      icon: '📰',
      bgColor: '#1a1a1a',
      textColor: '#ffffff',
      strokeColor: '#1a1a1a',
      strokeWidth: 0,
      fontWeight: 'bold',
      fontSize: 38,
      fontFamily: '"STSong", "SimSun", serif',
      layout: 'retro'
    },
    cartoon: {
      name: '可爱卡通',
      icon: '🎀',
      bgColor: '#fff0f5',
      textColor: '#ff4757',
      strokeColor: '#ffffff',
      strokeWidth: 4,
      fontWeight: '900',
      fontSize: 34,
      layout: 'cartoon'
    },
    blackboard: {
      name: '黑板粉笔',
      icon: '📋',
      bgColor: '#2d5a3d',
      textColor: '#ffffff',
      strokeColor: 'transparent',
      strokeWidth: 0,
      fontWeight: 'bold',
      fontSize: 36,
      fontFamily: '"KaiTi", "STKaiti", serif',
      layout: 'blackboard'
    }
  };
  
  function drawMemeCanvas() {
    const canvas = document.getElementById('memeCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const style = memeStyles[state.formData.template] || memeStyles.classic;
    const text = state.formData.text || '你好';
    const fontStyle = state.formData.fontStyle || 'bold';
    
    const W = 400;
    const H = 400;
    
    // 清空画布
    ctx.clearRect(0, 0, W, H);
    
    // 根据不同风格绘制
    switch (state.formData.template) {
      case 'gradient':
        drawGradientStyle(ctx, W, H, text, fontStyle);
        break;
      case 'bubble':
        drawBubbleStyle(ctx, W, H, text, fontStyle);
        break;
      case 'retro':
        drawRetroStyle(ctx, W, H, text, fontStyle);
        break;
      case 'cartoon':
        drawCartoonStyle(ctx, W, H, text, fontStyle);
        break;
      case 'blackboard':
        drawBlackboardStyle(ctx, W, H, text, fontStyle);
        break;
      case 'classic':
      default:
        drawClassicStyle(ctx, W, H, text, fontStyle);
        break;
    }
    
    // 右下角小水印
    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('不正经工具箱', W - 12, H - 12);
  }
  
  // ===== 1. 经典大字报风格 =====
  function drawClassicStyle(ctx, W, H, text, fontStyle) {
    // 白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    
    // 顶部装饰线
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 30);
    ctx.lineTo(W - 20, 30);
    ctx.stroke();
    
    // 底部装饰线
    ctx.beginPath();
    ctx.moveTo(20, H - 30);
    ctx.lineTo(W - 20, H - 30);
    ctx.stroke();
    
    // 四角装饰
    const cornerSize = 15;
    ctx.lineWidth = 3;
    // 左上
    ctx.beginPath();
    ctx.moveTo(20, 30 + cornerSize);
    ctx.lineTo(20, 30);
    ctx.lineTo(20 + cornerSize, 30);
    ctx.stroke();
    // 右上
    ctx.beginPath();
    ctx.moveTo(W - 20 - cornerSize, 30);
    ctx.lineTo(W - 20, 30);
    ctx.lineTo(W - 20, 30 + cornerSize);
    ctx.stroke();
    // 左下
    ctx.beginPath();
    ctx.moveTo(20, H - 30 - cornerSize);
    ctx.lineTo(20, H - 30);
    ctx.lineTo(20 + cornerSize, H - 30);
    ctx.stroke();
    // 右下
    ctx.beginPath();
    ctx.moveTo(W - 20 - cornerSize, H - 30);
    ctx.lineTo(W - 20, H - 30);
    ctx.lineTo(W - 20, H - 30 - cornerSize);
    ctx.stroke();
    
    // 主文字（居中，大字，黑字白边）
    let fontSize = 48;
    const fontWeight = fontStyle === 'bold' ? '900' : fontStyle === 'round' ? '700' : 'bold';
    const fontFamily = fontStyle === 'art' ? '"STXingkai", "KaiTi", serif' : '"Microsoft YaHei", "PingFang SC", sans-serif';
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 自动换行
    const lines = wrapText(ctx, text, W - 60);
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    let startY = (H - totalHeight) / 2 + lineHeight / 2;
    
    // 调整字号（如果太多行）
    while (lines.length > 4 && fontSize > 20) {
      fontSize -= 4;
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      const newLines = wrapText(ctx, text, W - 60);
      if (newLines.length <= 4) {
        lines.length = 0;
        lines.push(...newLines);
        break;
      }
    }
    
    // 重新计算垂直位置
    const newLineHeight = fontSize * 1.2;
    const newTotalHeight = lines.length * newLineHeight;
    startY = (H - newTotalHeight) / 2 + newLineHeight / 2;
    
    // 画文字（白色描边 + 黑色填充）
    lines.forEach((line, i) => {
      const y = startY + i * newLineHeight;
      
      // 白色描边
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.lineJoin = 'round';
      ctx.strokeText(line, W / 2, y);
      
      // 黑色描边
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(line, W / 2, y);
      
      // 白色填充
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, W / 2, y);
    });
  }
  
  // ===== 2. 渐变ins风 =====
  function drawGradientStyle(ctx, W, H, text, fontStyle) {
    // 彩色渐变背景
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    const gradients = [
      ['#ff9a9e', '#fecfef', '#fecfef'],
      ['#a8edea', '#fed6e3'],
      ['#ffecd2', '#fcb69f'],
      ['#a1c4fd', '#c2e9fb'],
      ['#d299c2', '#fef9d7'],
      ['#89f7fe', '#66a6ff']
    ];
    const chosen = gradients[Math.floor(text.length % gradients.length)];
    chosen.forEach((color, i) => {
      gradient.addColorStop(i / (chosen.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    
    // 装饰圆圈
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const x = (i * 53 + 20) % W;
      const y = (i * 73 + 30) % H;
      const r = 20 + (i * 17) % 40;
      ctx.fillStyle = '#ffffff';
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // 半透明玻璃卡片
    const cardY = 80;
    const cardH = H - 160;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, 30, cardY, W - 60, cardH, 20);
    ctx.fill();
    
    // 玻璃描边
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, 30, cardY, W - 60, cardH, 20);
    ctx.stroke();
    
    // 文字
    let fontSize = 36;
    const fontWeight = fontStyle === 'bold' ? '800' : fontStyle === 'round' ? '600' : 'bold';
    const fontFamily = fontStyle === 'art' ? '"STXingkai", "KaiTi", serif' : '"Microsoft YaHei", "PingFang SC", sans-serif';
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lines = wrapText(ctx, text, W - 100);
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    const startY = (H - totalHeight) / 2 + lineHeight / 2;
    
    // 文字阴影
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = '#ffffff';
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, startY + i * lineHeight);
    });
    
    ctx.shadowColor = 'transparent';
  }
  
  // ===== 3. 气泡对话风格 =====
  function drawBubbleStyle(ctx, W, H, text, fontStyle) {
    // 浅灰背景（模拟聊天背景）
    ctx.fillStyle = '#ededed';
    ctx.fillRect(0, 0, W, H);
    
    // 顶部状态栏
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, W, 44);
    ctx.fillStyle = '#000';
    ctx.font = '600 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('微信聊天', W / 2, 22);
    
    // 时间
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.font = '11px sans-serif';
    ctx.fillText('今天 12:30', W / 2, 70);
    
    // 头像
    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.arc(35, 110, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('我', 35, 110);
    
    // 气泡（绿色）
    const bubbleX = 65;
    const bubbleY = 90;
    const bubbleMaxW = W - 90;
    
    let fontSize = 28;
    const fontWeight = fontStyle === 'bold' ? '600' : fontStyle === 'round' ? '500' : '500';
    const fontFamily = '"Microsoft YaHei", "PingFang SC", sans-serif';
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    
    const lines = wrapText(ctx, text, bubbleMaxW - 30);
    const lineHeight = fontSize * 1.4;
    const bubbleH = Math.max(60, lines.length * lineHeight + 24);
    
    // 气泡尾巴
    ctx.fillStyle = '#95ec69';
    ctx.beginPath();
    ctx.moveTo(bubbleX, 105);
    ctx.lineTo(bubbleX - 8, 98);
    ctx.lineTo(bubbleX - 8, 112);
    ctx.closePath();
    ctx.fill();
    
    // 气泡主体
    roundRect(ctx, bubbleX, bubbleY, bubbleMaxW, bubbleH, 8);
    ctx.fill();
    
    // 文字
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    lines.forEach((line, i) => {
      ctx.fillText(line, bubbleX + 15, bubbleY + 12 + i * lineHeight);
    });
    
    // 底部"对方正在输入..."
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('对方正在输入...', 70, H - 50);
  }
  
  // ===== 4. 复古报纸风格 =====
  function drawRetroStyle(ctx, W, H, text, fontStyle) {
    // 黑色背景
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, W, H);
    
    // 做旧纹理（随机噪点）
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
      ctx.fillRect(
        Math.random() * W,
        Math.random() * H,
        Math.random() * 3,
        Math.random() * 3
      );
    }
    
    // 顶部报纸标题栏
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px "STSong", "SimSun", serif';
    ctx.textAlign = 'center';
    ctx.fillText('今日份快乐', W / 2, 40);
    
    // 分隔线
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 55);
    ctx.lineTo(W - 30, 55);
    ctx.stroke();
    
    // 日期期号
    ctx.font = '11px "STSong", "SimSun", serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('第1024期', 30, 72);
    ctx.textAlign = 'right';
    ctx.fillText('2025年', W - 30, 72);
    
    // 第二条线
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(30, 82);
    ctx.lineTo(W - 30, 82);
    ctx.stroke();
    
    // 主标题（竖排感觉的大字）
    let fontSize = 44;
    const fontFamily = fontStyle === 'art' ? '"STXingkai", "KaiTi", serif' : '"STSong", "SimSun", serif';
    const fontWeight = 'bold';
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lines = wrapText(ctx, text, W - 80);
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    const startY = (H - totalHeight) / 2 + lineHeight / 2;
    
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, startY + i * lineHeight);
    });
    
    // 底部装饰
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(30, H - 50);
    ctx.lineTo(W - 30, H - 50);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px "STSong", serif';
    ctx.textAlign = 'center';
    ctx.fillText('—— 人生苦短，必须性感 ——', W / 2, H - 30);
  }
  
  // ===== 5. 可爱卡通风 =====
  function drawCartoonStyle(ctx, W, H, text, fontStyle) {
    // 粉色渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#fff0f5');
    gradient.addColorStop(1, '#ffe4ec');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    
    // 装饰元素（小心心和星星）
    const decorations = [
      { emoji: '💖', x: 40, y: 50, size: 24 },
      { emoji: '✨', x: W - 50, y: 60, size: 20 },
      { emoji: '🎀', x: 30, y: H - 60, size: 22 },
      { emoji: '⭐', x: W - 40, y: H - 50, size: 18 },
      { emoji: '💕', x: W / 2 - 80, y: 30, size: 16 },
      { emoji: '🌸', x: W / 2 + 90, y: H - 35, size: 20 }
    ];
    
    decorations.forEach(d => {
      ctx.font = `${d.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.emoji, d.x, d.y);
    });
    
    // 圆角白色卡片
    const cardY = 70;
    const cardH = H - 140;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 25, cardY, W - 50, cardH, 24);
    ctx.fill();
    
    // 卡片阴影
    ctx.strokeStyle = 'rgba(255,107,107,0.2)';
    ctx.lineWidth = 2;
    roundRect(ctx, 25, cardY, W - 50, cardH, 24);
    ctx.stroke();
    
    // 顶部小装饰（可爱的小耳朵）
    ctx.fillStyle = '#ffb6c1';
    ctx.beginPath();
    ctx.arc(W / 2 - 30, cardY, 15, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W / 2 + 30, cardY, 15, Math.PI, 0);
    ctx.fill();
    
    // 文字
    let fontSize = 34;
    const fontWeight = fontStyle === 'bold' ? '900' : fontStyle === 'round' ? '700' : 'bold';
    const fontFamily = fontStyle === 'art' ? '"STXingkai", "KaiTi", serif' : '"Microsoft YaHei", "PingFang SC", sans-serif';
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lines = wrapText(ctx, text, W - 90);
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    const startY = (H - totalHeight) / 2 + lineHeight / 2;
    
    // 文字：粉色填充 + 白色描边
    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.lineJoin = 'round';
      ctx.strokeText(line, W / 2, y);
      
      ctx.fillStyle = '#ff4757';
      ctx.fillText(line, W / 2, y);
    });
  }
  
  // ===== 6. 黑板粉笔风格 =====
  function drawBlackboardStyle(ctx, W, H, text, fontStyle) {
    // 深绿黑板背景
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, '#2d5a3d');
    gradient.addColorStop(1, '#1e3d2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    
    // 黑板边框
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, W - 12, H - 12);
    
    // 木纹效果
    ctx.strokeStyle = '#6b3410';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    
    // 粉笔灰噪点
    for (let i = 0; i < 150; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.08})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * W,
        Math.random() * H,
        Math.random() * 1.5,
        0, Math.PI * 2
      );
      ctx.fill();
    }
    
    // 粉笔文字（带点模糊效果模拟粉笔）
    let fontSize = 40;
    const fontFamily = fontStyle === 'art' ? '"STXingkai", "KaiTi", serif' : '"KaiTi", "STKaiti", serif';
    const fontWeight = 'bold';
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lines = wrapText(ctx, text, W - 80);
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    const startY = (H - totalHeight) / 2 + lineHeight / 2;
    
    // 粉笔效果：多层半透明叠加
    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      
      // 底层（模糊的粉笔灰）
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `${fontWeight} ${fontSize + 2}px ${fontFamily}`;
      ctx.fillText(line, W / 2 + 1, y + 1);
      
      // 中层
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillText(line, W / 2, y);
      
      // 顶层（亮的部分）
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `${fontWeight} ${fontSize - 1}px ${fontFamily}`;
      ctx.fillText(line, W / 2 - 1, y - 1);
    });
    
    // 右下角粉笔擦痕迹
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.ellipse(W - 60, H - 40, 35, 12, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // ===== 工具函数：文字换行 =====
  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  // ===== 工具函数：圆角矩形 =====
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  
  function bindMemeActions() {
    // 保存图片
    const downloadBtn = document.getElementById('memeDownloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        // AI图片模式
        const aiImg = document.getElementById('memeAiImage');
        if (aiImg && aiImg.src) {
          const link = document.createElement('a');
          link.download = `AI表情包_${Date.now()}.png`;
          link.href = aiImg.src;
          link.crossOrigin = 'anonymous';
          link.click();
          showToast('已保存到相册！');
          return;
        }
        
        // Canvas模式
        const canvas = document.getElementById('memeCanvas');
        if (!canvas) return;
        
        const link = document.createElement('a');
        link.download = `表情包_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('已保存到相册！');
      });
    }
    
    // 分享
    const shareBtn = document.getElementById('memeShareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        // AI图片模式
        const aiImg = document.getElementById('memeAiImage');
        if (aiImg && aiImg.src) {
          if (navigator.share) {
            try {
              await navigator.share({
                title: '我的AI表情包',
                text: state.formData.text,
                url: aiImg.src
              });
            } catch (e) {
              showToast('分享取消');
            }
          } else {
            showToast('💡 长按图片可以保存分享哦~');
          }
          return;
        }
        
        const canvas = document.getElementById('memeCanvas');
        if (!canvas) return;
        
        if (navigator.share) {
          canvas.toBlob(async (blob) => {
            const file = new File([blob], 'meme.png', { type: 'image/png' });
            try {
              await navigator.share({
                title: '我的表情包',
                text: state.formData.text,
                files: [file]
              });
            } catch (e) {
              showToast('分享取消');
            }
          });
        } else {
          showToast('💡 长按图片可以保存分享哦~');
        }
      });
    }
  }
  
  // 暴露到全局
  window.drawMemeCanvas = drawMemeCanvas;
  
  // ===== 新人福利弹窗 =====
  
  function showNewbieModal() {
    document.getElementById('newbieModal').classList.add('show');
  }
  
  function closeNewbieModal() {
    document.getElementById('newbieModal').classList.remove('show');
    localStorage.setItem('yy_newbie_shown', '1');
    updateNewbieBanner();
  }
  
  function closeNewbieModalAndUse() {
    closeNewbieModal();
    showToast('🎁 新人福利已到账！');
    // 滚动到工具列表
    document.querySelector('.tools-section')?.scrollIntoView({ behavior: 'smooth' });
  }
  
  function updateNewbieBanner() {
    const shown = localStorage.getItem('yy_newbie_shown');
    const banner = document.getElementById('newbieBanner');
    if (banner && shown) {
      banner.style.display = 'none';
    }
  }
  
  // 暴露到全局供HTML调用
  window.showNewbieModal = showNewbieModal;
  window.closeNewbieModal = closeNewbieModal;
  window.closeNewbieModalAndUse = closeNewbieModalAndUse;
  
  // ===== 初始化 =====
  
  async function init() {
    bindEvents();
    await initUser();
    await loadTools('all');
    
    // 新人弹窗（只显示一次）
    if (!localStorage.getItem('yy_newbie_shown')) {
      setTimeout(() => {
        showNewbieModal();
      }, 500);
    } else {
      updateNewbieBanner();
    }
  }
  
  document.addEventListener('DOMContentLoaded', init);
  
  // 暴露全局函数
  window.copyText = function(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板');
      }).catch(() => {
        showToast('复制失败，请长按复制');
      });
    } else {
      showToast('复制失败，请长按复制');
    }
  };
  
  window.closeNewbieModal = function() {
    const modal = document.getElementById('newbieModal');
    if (modal) modal.style.display = 'none';
  };
  
  // 调试入口
  window.__debug = {
    getState: () => state,
    getCurrentTool: () => state.currentTool,
    getFormData: () => state.formData,
    lastResult: null
  };

})();
