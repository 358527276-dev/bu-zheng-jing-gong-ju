# 微信H5登录配置指南

## 概述

网页版H5现已支持微信扫码登录，需要配置微信开放平台的网站应用。

## 前置条件

1. **微信开放平台账号**：https://open.weixin.qq.com
2. **已认证的开发者资质**（需要企业营业执照）
3. **已创建的网站应用**（需要审核通过）

## 配置步骤

### 1. 创建网站应用

1. 登录微信开放平台：https://open.weixin.qq.com
2. 进入「网站应用」→「创建网站应用」
3. 填写应用信息：
   - 应用名称：不正经工具箱
   - 应用官网：https://bu-zheng-jing-gong-ju.onrender.com
   - 授权回调域：`bu-zheng-jing-gong-ju.onrender.com`（不带https://）

### 2. 获取AppID和AppSecret

创建成功后，在应用详情页获取：
- **AppID**：wx开头的应用ID
- **AppSecret**：应用密钥（点击生成后只显示一次，请妥善保存）

### 3. 配置环境变量

在Render后台设置以下环境变量：

```
WX_H5_APPID=你的网站应用AppID
WX_H5_SECRET=你的网站应用AppSecret
WX_H5_REDIRECT_URI=https://bu-zheng-jing-gong-ju.onrender.com/api/user/h5-wechat-callback
```

### 4. 验证配置

1. 访问 https://bu-zheng-jing-gong-ju.onrender.com
2. 点击「微信登录」按钮
3. 如果配置正确，会跳转到微信扫码授权页面
4. 如果未配置，会提示「微信登录未配置，使用快捷登录」

## 登录流程

```
用户点击微信登录
    ↓
前端请求 /api/user/h5-wechat-auth-url
    ↓
后端返回微信授权URL
    ↓
用户扫码授权
    ↓
微信回调 /api/user/h5-wechat-callback
    ↓
后端用code换取access_token和openid
    ↓
后端获取用户信息（昵称、头像）
    ↓
创建或更新用户记录
    ↓
重定向到前端 /?wechat_login=1&userId=xxx
    ↓
前端保存userId到localStorage
    ↓
登录完成
```

## 降级方案

如果未配置微信H5登录，系统会自动降级为快捷登录：
- 自动生成随机userId
- 昵称显示为「H5用户」
- 可以正常使用所有工具

## 注意事项

1. **域名备案**：微信开放平台要求网站应用必须有ICP备案
2. **HTTPS**：回调地址必须使用HTTPS
3. **AppSecret安全**：不要将AppSecret提交到代码仓库
4. **回调域名**：授权回调域不要带协议头（https://）

## 常见问题

**Q: 提示「redirect_uri参数错误」**
A: 检查授权回调域是否与网站域名一致，注意不要带https://

**Q: 提示「invalid appid」**
A: 检查WX_H5_APPID是否正确，注意是网站应用的AppID，不是小程序的

**Q: 扫码后提示「code无效」**
A: code只能使用一次，且有效期5分钟，可能是重复使用或过期

**Q: 未配置微信登录怎么办？**
A: 系统会自动降级为快捷登录，不影响使用

## 技术实现

### 后端接口

- `GET /api/user/h5-wechat-auth-url` - 获取微信授权URL
- `GET /api/user/h5-wechat-callback` - 微信OAuth回调

### 前端逻辑

- 点击微信登录按钮 → 请求授权URL → 跳转微信授权页
- 授权成功后微信回调后端 → 后端处理并创建用户 → 重定向前端带userId
- 前端检测URL参数 → 保存userId → 更新UI显示用户信息

## 参考文档

- 微信开放平台网站应用开发指南：https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
- OAuth2.0协议说明：https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Authorization_request.html
