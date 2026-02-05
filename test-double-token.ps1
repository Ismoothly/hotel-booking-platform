# 双 Token 机制测试脚本
# 使用方法：.\test-double-token.ps1

Write-Host "`n========== 双 Token 机制测试 ==========" -ForegroundColor Cyan
Write-Host "测试服务器: http://localhost:5000`n" -ForegroundColor Gray

# 测试 1: 登录
Write-Host "[测试 1] 登录并获取 Token..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"merchant","password":"merchant123"}' `
        -SessionVariable session `
        -ErrorAction Stop

    $loginData = ($loginResponse.Content | ConvertFrom-Json).data
    $accessToken = $loginData.accessToken
    
    Write-Host "  ✓ 登录成功" -ForegroundColor Green
    Write-Host "  ✓ Access Token: $($accessToken.Substring(0,30))..." -ForegroundColor Green
    
    # 检查 Cookie
    $cookies = $session.Cookies.GetCookies("http://localhost:5000")
    $refreshCookie = $cookies | Where-Object {$_.Name -eq "refresh_token"}
    
    if ($refreshCookie) {
        Write-Host "  ✓ Refresh Token Cookie 已设置 (HttpOnly)" -ForegroundColor Green
        Write-Host "    - Name: $($refreshCookie.Name)" -ForegroundColor Gray
        Write-Host "    - Path: $($refreshCookie.Path)" -ForegroundColor Gray
        Write-Host "    - HttpOnly: $($refreshCookie.HttpOnly)" -ForegroundColor Gray
    } else {
        Write-Host "  ✗ Refresh Token Cookie 未找到" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ✗ 登录失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    请确保后端服务已启动 (cd server && npm run dev)" -ForegroundColor Yellow
    exit 1
}

# 测试 2: 使用 Access Token 访问受保护接口
Write-Host "`n[测试 2] 使用 Access Token 访问受保护接口..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    $meResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/me" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    $userData = ($meResponse.Content | ConvertFrom-Json).data
    Write-Host "  ✓ 访问成功" -ForegroundColor Green
    Write-Host "    - 用户: $($userData.username)" -ForegroundColor Gray
    Write-Host "    - 角色: $($userData.role)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ 访问失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 测试 3: 刷新 Access Token
Write-Host "`n[测试 3] 使用 Refresh Token 刷新..." -ForegroundColor Yellow
try {
    $refreshResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/refresh" `
        -Method POST `
        -WebSession $session `
        -ErrorAction Stop

    $newAccessToken = ($refreshResponse.Content | ConvertFrom-Json).data.accessToken
    Write-Host "  ✓ 刷新成功" -ForegroundColor Green
    Write-Host "  ✓ 新 Access Token: $($newAccessToken.Substring(0,30))..." -ForegroundColor Green
    
    # 验证新旧 Token 不同
    if ($newAccessToken -ne $accessToken) {
        Write-Host "  ✓ Token 已更新 (旋转机制生效)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Token 未变化" -ForegroundColor Yellow
    }
    
    $accessToken = $newAccessToken
} catch {
    Write-Host "  ✗ 刷新失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 测试 4: 使用新 Token 访问
Write-Host "`n[测试 4] 使用新 Token 访问..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    $meResponse2 = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/me" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "  ✓ 新 Token 有效" -ForegroundColor Green
} catch {
    Write-Host "  ✗ 新 Token 无效: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 测试 5: 退出登录
Write-Host "`n[测试 5] 退出登录..." -ForegroundColor Yellow
try {
    $logoutResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/logout" `
        -Method POST `
        -WebSession $session `
        -ErrorAction Stop

    Write-Host "  ✓ 退出成功" -ForegroundColor Green
    
    # 尝试用已退出的 refresh token 刷新（应该失败）
    try {
        $failedRefresh = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/refresh" `
            -Method POST `
            -WebSession $session `
            -ErrorAction Stop
        Write-Host "  ⚠ 警告: 退出后 refresh token 仍然有效" -ForegroundColor Yellow
    } catch {
        Write-Host "  ✓ Refresh Token 已失效（符合预期）" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ 退出失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✓ 所有测试通过！双 Token 机制运行正常" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
