#!/usr/bin/env pwsh
# 测试管理端登录功能

Write-Host "`n========== 管理端登录测试 ==========" -ForegroundColor Cyan

# 1. 检查后端服务
Write-Host "`n[1] 检查后端服务 (端口 5000)..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri 'http://localhost:5000/health' -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ 后端服务正常运行" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务未运行: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请先启动后端: cd server && npm start" -ForegroundColor Yellow
    exit 1
}

# 2. 检查管理端服务
Write-Host "`n[2] 检查管理端服务 (端口 3001)..." -ForegroundColor Yellow
try {
    $adminCheck = Invoke-WebRequest -Uri 'http://localhost:3001' -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ 管理端正常运行" -ForegroundColor Green
} catch {
    Write-Host "❌ 管理端未运行: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请先启动管理端: cd admin && set PORT=3001 && npm start" -ForegroundColor Yellow
    exit 1
}

# 3. 测试直接访问后端 API
Write-Host "`n[3] 测试直接访问后端 API..." -ForegroundColor Yellow
$loginBody = @{
    username = 'admin'
    password = 'admin123'
} | ConvertTo-Json

try {
    $directResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' `
        -Method POST `
        -Body $loginBody `
        -ContentType 'application/json' `
        -UseBasicParsing
    
    Write-Host "✅ 后端 API 登录成功" -ForegroundColor Green
    Write-Host "   Token: $($directResponse.data.accessToken.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ 后端 API 登录失败" -ForegroundColor Red
    Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   响应: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# 4. 测试通过管理端代理访问
Write-Host "`n[4] 测试通过管理端代理访问后端 API..." -ForegroundColor Yellow
try {
    $proxyResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' `
        -Method POST `
        -Body $loginBody `
        -ContentType 'application/json' `
        -UseBasicParsing
    
    Write-Host "✅ 管理端代理登录成功" -ForegroundColor Green
    Write-Host "   Token: $($proxyResponse.data.accessToken.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ 管理端代理登录失败" -ForegroundColor Red
    Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    
    # 检查是否是代理配置问题
    if ($_.Exception.Message -match '404') {
        Write-Host "`n⚠️  可能的原因：React 代理未正确配置" -ForegroundColor Yellow
        Write-Host "   解决方案：" -ForegroundColor Cyan
        Write-Host "   1. 确认 admin/package.json 中有: `"proxy`": `"http://localhost:5000`"" -ForegroundColor Cyan
        Write-Host "   2. 重启管理端服务" -ForegroundColor Cyan
    } elseif ($_.Exception.Message -match 'timeout|连接') {
        Write-Host "`n⚠️  可能的原因：网络连接问题" -ForegroundColor Yellow
        Write-Host "   解决方案：" -ForegroundColor Cyan
        Write-Host "   1. 检查防火墙设置" -ForegroundColor Cyan
        Write-Host "   2. 确认后端服务监听 0.0.0.0:5000" -ForegroundColor Cyan
    }
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ 所有测试通过！管理端登录功能正常" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n访问管理端: http://localhost:3001" -ForegroundColor Cyan
Write-Host "默认账号: admin / admin123" -ForegroundColor Cyan
Write-Host ""
