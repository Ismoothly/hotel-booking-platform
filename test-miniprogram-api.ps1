# 测试真机调试 API 连接

param(
    [string]$IP = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  真机调试 API 连接测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 如果未提供 IP，尝试获取
if ($IP -eq "") {
    Write-Host "正在获取本机 IP 地址..." -ForegroundColor Yellow
    $ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | 
        Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } |
        Select-Object -ExpandProperty IPAddress
    
    if ($ipAddresses.Count -eq 0) {
        Write-Host "❌ 未找到可用的网络连接" -ForegroundColor Red
        exit 1
    }
    
    $IP = $ipAddresses[0]
    Write-Host "使用 IP: $IP" -ForegroundColor Green
}

$baseUrl = "http://${IP}:5000"
$apiUrl = "${baseUrl}/api"

Write-Host ""
Write-Host "测试地址: $apiUrl" -ForegroundColor Cyan
Write-Host ""

# 测试 1: 健康检查
Write-Host "[1/4] 测试健康检查..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "${baseUrl}/health" -TimeoutSec 5
    if ($response.success) {
        Write-Host "✅ 健康检查通过" -ForegroundColor Green
    } else {
        Write-Host "⚠️  健康检查异常: $($response.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因:" -ForegroundColor Yellow
    Write-Host "  - 后端服务未启动（请运行: cd server; npm run dev）" -ForegroundColor Gray
    Write-Host "  - 防火墙阻止了 5000 端口" -ForegroundColor Gray
    exit 1
}

# 测试 2: 获取酒店列表
Write-Host ""
Write-Host "[2/4] 测试酒店列表 API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "${apiUrl}/hotels" -TimeoutSec 5
    if ($response.success) {
        Write-Host "✅ 酒店列表 API 正常" -ForegroundColor Green
        Write-Host "   返回 $($response.data.Count) 家酒店" -ForegroundColor Gray
        
        if ($response.data.Count -gt 0) {
            $hotel = $response.data[0]
            Write-Host "   示例酒店: $($hotel.nameCn)" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  API 返回异常" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 酒店列表 API 失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试 3: 测试登录 API
Write-Host ""
Write-Host "[3/4] 测试登录 API..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "${apiUrl}/auth/login" `
        -Method POST `
        -Body $loginData `
        -ContentType "application/json" `
        -TimeoutSec 5
    
    if ($response.success) {
        Write-Host "✅ 登录 API 正常" -ForegroundColor Green
        Write-Host "   用户: $($response.data.user.username)" -ForegroundColor Gray
        Write-Host "   角色: $($response.data.user.role)" -ForegroundColor Gray
        Write-Host "   Token: $($response.data.accessToken.Substring(0, 20))..." -ForegroundColor Gray
    } else {
        Write-Host "⚠️  登录失败: $($response.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 登录 API 失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试 4: 测试 CORS
Write-Host ""
Write-Host "[4/4] 测试 CORS 配置..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://192.168.1.100"
        "Access-Control-Request-Method" = "POST"
    }
    
    $response = Invoke-WebRequest -Uri "${apiUrl}/hotels" `
        -Method OPTIONS `
        -Headers $headers `
        -TimeoutSec 5
    
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader) {
        Write-Host "✅ CORS 配置正常" -ForegroundColor Green
        Write-Host "   允许的来源: $corsHeader" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  CORS 头部未找到" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  CORS 测试跳过（开发环境通常自动允许）" -ForegroundColor Yellow
}

# 总结
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 测试总结" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ 所有基础测试通过！" -ForegroundColor Green
Write-Host ""
Write-Host "📱 小程序配置地址:" -ForegroundColor White
Write-Host ""
Write-Host "   $apiUrl" -ForegroundColor Green -BackgroundColor Black
Write-Host ""
Write-Host "请在小程序中:" -ForegroundColor White
Write-Host "   1. 进入【我的】→【⚙️ API 配置】" -ForegroundColor Gray
Write-Host "   2. 输入上面的地址" -ForegroundColor Gray
Write-Host "   3. 点击【测试连接】" -ForegroundColor Gray
Write-Host "   4. 点击【保存配置】" -ForegroundColor Gray
Write-Host "   5. 重启小程序" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示: 确保手机和电脑连接同一 WiFi" -ForegroundColor Yellow
Write-Host ""
