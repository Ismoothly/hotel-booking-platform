# 微信小程序真机调试启动脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  微信小程序真机调试配置助手" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 获取本机局域网 IP
Write-Host "[1/4] 正在获取本机 IP 地址..." -ForegroundColor Yellow
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } |
    Select-Object -ExpandProperty IPAddress

if ($ipAddresses.Count -eq 0) {
    Write-Host "❌ 未找到可用的网络连接" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 找到以下 IP 地址:" -ForegroundColor Green
$index = 1
$ipList = @()
foreach ($ip in $ipAddresses) {
    Write-Host "   [$index] $ip" -ForegroundColor White
    $ipList += $ip
    $index++
}

# 如果有多个 IP，让用户选择
$selectedIP = $ipList[0]
if ($ipList.Count -gt 1) {
    Write-Host ""
    $choice = Read-Host "请选择要使用的 IP（输入序号，默认 1）"
    if ($choice -match '^\d+$' -and [int]$choice -le $ipList.Count -and [int]$choice -gt 0) {
        $selectedIP = $ipList[[int]$choice - 1]
    }
}

Write-Host ""
Write-Host "将使用 IP: $selectedIP" -ForegroundColor Green

# 2. 检查 MongoDB 是否运行
Write-Host ""
Write-Host "[2/4] 检查 MongoDB 状态..." -ForegroundColor Yellow
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoProcess) {
    Write-Host "✅ MongoDB 正在运行" -ForegroundColor Green
} else {
    Write-Host "⚠️  MongoDB 未运行" -ForegroundColor Yellow
    Write-Host "   提示: 如果使用 Docker，请运行:" -ForegroundColor Gray
    Write-Host "   docker run -d -p 27017:27017 --name mongodb mongo:latest" -ForegroundColor Gray
}

# 3. 检查后端服务是否运行
Write-Host ""
Write-Host "[3/4] 检查后端服务状态..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ 后端服务正在运行" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务未运行" -ForegroundColor Red
    Write-Host "   正在启动后端服务..." -ForegroundColor Yellow
    
    # 在新窗口中启动后端
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"
    
    Write-Host "   等待服务启动..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 3
        Write-Host "✅ 后端服务启动成功" -ForegroundColor Green
    } catch {
        Write-Host "❌ 后端服务启动失败，请手动检查" -ForegroundColor Red
    }
}

# 4. 显示配置信息
Write-Host ""
Write-Host "[4/4] 真机调试配置信息" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 小程序配置步骤:" -ForegroundColor White
Write-Host "   1. 在手机上打开小程序（微信扫码或真机调试）" -ForegroundColor White
Write-Host "   2. 进入【我的】页面" -ForegroundColor White
Write-Host "   3. 点击【⚙️ API 配置】" -ForegroundColor White
Write-Host "   4. 输入以下地址:" -ForegroundColor White
Write-Host ""
Write-Host "   http://${selectedIP}:5000/api" -ForegroundColor Green -BackgroundColor Black
Write-Host ""
Write-Host "   5. 点击【测试连接】验证" -ForegroundColor White
Write-Host "   6. 点击【保存配置】" -ForegroundColor White
Write-Host "   7. 重启小程序" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 5. 测试 API 连接
Write-Host "🔍 正在测试 API 连接..." -ForegroundColor Yellow
try {
    $testUrl = "http://${selectedIP}:5000/api/hotels"
    $response = Invoke-RestMethod -Uri $testUrl -TimeoutSec 5
    Write-Host "✅ API 连接测试成功！" -ForegroundColor Green
    Write-Host "   返回了 $($response.data.Count) 家酒店" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  API 连接测试失败" -ForegroundColor Yellow
    Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 可能的原因:" -ForegroundColor Yellow
    Write-Host "   - 防火墙阻止了 5000 端口" -ForegroundColor Gray
    Write-Host "   - 后端服务未正确启动" -ForegroundColor Gray
    Write-Host "   - 网络配置问题" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔧 添加防火墙规则（需要管理员权限）:" -ForegroundColor Yellow
    Write-Host "   netsh advfirewall firewall add rule name=`"Node 5000`" dir=in action=allow protocol=TCP localport=5000" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "💡 重要提示:" -ForegroundColor Yellow
Write-Host "   - 确保手机和电脑连接同一 WiFi" -ForegroundColor White
Write-Host "   - 如果 IP 地址改变，需要重新配置" -ForegroundColor White
Write-Host "   - 详细说明请查看: MINIPROGRAM_DEBUG_GUIDE.md" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 6. 提供快捷操作
Write-Host "快捷操作:" -ForegroundColor Cyan
Write-Host "   [1] 启动小程序编译（微信）" -ForegroundColor White
Write-Host "   [2] 打开微信开发者工具" -ForegroundColor White
Write-Host "   [3] 查看后端日志" -ForegroundColor White
Write-Host "   [4] 重启后端服务" -ForegroundColor White
Write-Host "   [Q] 退出" -ForegroundColor White
Write-Host ""

$action = Read-Host "请选择操作（输入序号）"

switch ($action) {
    "1" {
        Write-Host "正在启动小程序编译..." -ForegroundColor Green
        Set-Location hotel-booking-taro
        npm run dev:weapp
    }
    "2" {
        Write-Host "正在打开微信开发者工具..." -ForegroundColor Green
        $wechatDevTool = "C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat"
        if (Test-Path $wechatDevTool) {
            & $wechatDevTool open --project "$(Get-Location)\hotel-booking-taro"
        } else {
            Write-Host "未找到微信开发者工具，请手动打开" -ForegroundColor Yellow
            Write-Host "项目路径: $(Get-Location)\hotel-booking-taro\dist" -ForegroundColor Gray
        }
    }
    "3" {
        Write-Host "正在查看后端日志..." -ForegroundColor Green
        Get-Content server\logs\*.log -Tail 50 -Wait
    }
    "4" {
        Write-Host "正在重启后端服务..." -ForegroundColor Green
        Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server*" } | Stop-Process
        Start-Sleep -Seconds 2
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm run dev"
    }
    default {
        Write-Host "退出配置助手" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "完成！祝你调试顺利！🎉" -ForegroundColor Green
