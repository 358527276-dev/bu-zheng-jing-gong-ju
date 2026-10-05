# 全量接口自检脚本
$BASE = "http://localhost:3000/api"
$pass = 0
$fail = 0

function Test-Endpoint($name, $method, $path, $body = $null) {
    try {
        if ($method -eq "GET") {
            $resp = Invoke-RestMethod -Uri "$BASE$path" -Method Get
        } else {
            $json = $body | ConvertTo-Json -Depth 5
            $resp = Invoke-RestMethod -Uri "$BASE$path" -Method Post -Body $json -ContentType "application/json"
        }
        if ($resp.code -eq 0) {
            Write-Host "  ✅ $name" -ForegroundColor Green
            $script:pass++
            return $resp
        } else {
            Write-Host "  ❌ $name - $($resp.message)" -ForegroundColor Red
            $script:fail++
            return $null
        }
    } catch {
        Write-Host "  ❌ $name - $($_.Exception.Message)" -ForegroundColor Red
        $script:fail++
        return $null
    }
}

Write-Host "========== 全量接口自检 ==========" -ForegroundColor Cyan
Write-Host ""

# === 用户模块 ===
Write-Host "📱 用户模块" -ForegroundColor Yellow
$loginResp = Test-Endpoint "用户登录" "POST" "/user/login" @{ nickname = "自检用户_"+(Get-Random) }
$userId = $loginResp.data.userId
Test-Endpoint "获取用户信息" "GET" "/user/info?userId=$userId"
Test-Endpoint "余额充值(管理员)" "POST" "/user/recharge" @{ userId = $userId; amount = 100; payMethod = "admin" }
Write-Host ""

# === 工具模块 ===
Write-Host "🛠 工具模块" -ForegroundColor Yellow
$toolsResp = Test-Endpoint "工具列表" "GET" "/tools/list"
if ($toolsResp -and $toolsResp.data.list.Count -gt 0) {
    $toolId = $toolsResp.data.list[0].id
    Test-Endpoint "工具详情" "GET" "/tools/detail?id=$toolId"
}
Write-Host ""

# === 会员模块 ===
Write-Host "👑 会员模块" -ForegroundColor Yellow
Test-Endpoint "会员套餐列表" "GET" "/vip/packages"
Test-Endpoint "会员信息" "GET" "/vip/info?userId=$userId"
Write-Host ""

# === 签到模块 ===
Write-Host "📅 签到模块" -ForegroundColor Yellow
Test-Endpoint "签到状态" "GET" "/sign/status?userId=$userId"
Test-Endpoint "签到" "POST" "/sign/do" @{ userId = $userId }
Write-Host ""

# === 任务模块 ===
Write-Host "🎯 任务模块" -ForegroundColor Yellow
Test-Endpoint "任务列表" "GET" "/tasks/list?userId=$userId"
Write-Host ""

# === 邀请模块 ===
Write-Host "🤝 邀请模块" -ForegroundColor Yellow
Test-Endpoint "邀请信息" "GET" "/invite/info?userId=$userId"
Write-Host ""

# === 成长模块 ===
Write-Host "📈 成长模块" -ForegroundColor Yellow
Test-Endpoint "等级列表" "GET" "/growth/levels"
Test-Endpoint "成长记录" "GET" "/growth/records?userId=$userId"
Write-Host ""

# === 支付模块（余额支付） ===
Write-Host "💰 支付模块" -ForegroundColor Yellow
Test-Endpoint "余额支付月卡" "POST" "/vip/purchase" @{ userId = $userId; vipType = "monthly"; payMethod = "balance" }
Test-Endpoint "创建充值订单" "POST" "/pay/create" @{ userId = $userId; type = "recharge"; amount = 50; payMethod = "wechat" }
Write-Host ""

# === 管理端模块 ===
Write-Host "🔐 管理端模块" -ForegroundColor Yellow
Test-Endpoint "管理登录(错误密码)" "POST" "/admin/login" @{ password = "wrongpass" }  # 应该失败
$adminLogin = Test-Endpoint "管理登录(正确密码)" "POST" "/admin/login" @{ password = "admin123" }
if ($adminLogin) {
    $token = $adminLogin.data.token
    $headers = @{ "X-Admin-Token" = $token }
    try {
        $resp = Invoke-RestMethod -Uri "$BASE/admin/stats" -Method Get -Headers $headers
        if ($resp.code -eq 0) { Write-Host "  ✅ 管理端统计" -ForegroundColor Green; $script:pass++ } else { Write-Host "  ❌ 管理端统计" -ForegroundColor Red; $script:fail++ }
    } catch { Write-Host "  ❌ 管理端统计 - $($_.Exception.Message)" -ForegroundColor Red; $script:fail++ }
    try {
        $resp = Invoke-RestMethod -Uri "$BASE/admin/orders?pageSize=5" -Method Get -Headers $headers
        if ($resp.code -eq 0) { Write-Host "  ✅ 管理端订单列表" -ForegroundColor Green; $script:pass++ } else { Write-Host "  ❌ 管理端订单列表" -ForegroundColor Red; $script:fail++ }
    } catch { Write-Host "  ❌ 管理端订单列表 - $($_.Exception.Message)" -ForegroundColor Red; $script:fail++ }
}
# 未鉴权访问应该失败
try {
    $resp = Invoke-RestMethod -Uri "$BASE/admin/stats" -Method Get
    Write-Host "  ❌ 未鉴权访问(应该失败但成功了)" -ForegroundColor Red
    $script:fail++
} catch {
    Write-Host "  ✅ 未鉴权访问被拦截" -ForegroundColor Green
    $script:pass++
}
Write-Host ""

# === 汇总 ===
Write-Host "========== 自检结果 ==========" -ForegroundColor Cyan
Write-Host "通过: $pass 项" -ForegroundColor Green
Write-Host "失败: $fail 项" -ForegroundColor Red
$total = $pass + $fail
Write-Host "通过率: $([math]::Round($pass / $total * 100, 1))%" -ForegroundColor Cyan
Write-Host ""

if ($fail -eq 0) {
    Write-Host "🎉 全部通过！可以上线！" -ForegroundColor Green
} else {
    Write-Host "⚠️  有 $fail 项失败，请修复后再上线" -ForegroundColor Yellow
}
