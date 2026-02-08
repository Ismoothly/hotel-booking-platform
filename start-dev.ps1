#!/usr/bin/env powershell
# 快速启动开发环境脚本

Write-Host "🚀 酒店预订平台 - 开发环境启动脚本" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在根目录
if (-not (Test-Path ".\server\package.json")) {
    Write-Host "❌ 错误: 请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 项目根目录检查通过" -ForegroundColor Green
Write-Host ""

# 启动后端服务器
Write-Host "📌 启动后端服务器..." -ForegroundColor Yellow
Write-Host "执行: cd server && npm start" -ForegroundColor Gray

Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; npm start" -NewWindow
Write-Host "✅ 后端启动中... (新窗口)" -ForegroundColor Green
Write-Host ""

# 等待后端启动
Write-Host "⏳ 等待后端启动 (5秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 验证后端
$backendCheck = try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
    $response.StatusCode -eq 200
} catch {
    $false
}

if ($backendCheck) {
    Write-Host "✅ 后端服务器已启动成功" -ForegroundColor Green
} else {
    Write-Host "⚠️ 后端服务器启动中，请等待..." -ForegroundColor Yellow
}

Write-Host ""

# 启动客户端
Write-Host "📌 启动客户端应用..." -ForegroundColor Yellow
Write-Host "执行: cd client && npm start" -ForegroundColor Gray

Set-Location "$PSScriptRoot\client"
& npm start

# 这行不会执行，因为 npm start 会阻塞
# 如果用户关闭了服务器，脚本才会继续
