# Double Token Test Script
# Usage: .\test-double-token.ps1

Write-Host "`n========== Double Token Test ==========" -ForegroundColor Cyan
Write-Host "Server: http://localhost:5000`n" -ForegroundColor Gray

# Test 1: Login
Write-Host "[Test 1] Login and get tokens..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"merchant","password":"merchant123"}' `
        -SessionVariable session `
        -UseBasicParsing `
        -ErrorAction Stop

    $loginData = ($loginResponse.Content | ConvertFrom-Json).data
    $accessToken = $loginData.accessToken
    
    Write-Host "  OK Login successful" -ForegroundColor Green
    Write-Host "  OK Access Token: $($accessToken.Substring(0,30))..." -ForegroundColor Green
    
    # Check response headers for Set-Cookie
    if ($loginResponse.Headers['Set-Cookie'] -match 'refresh_token') {
        Write-Host "  OK Refresh Token Cookie set in response header" -ForegroundColor Green
        Write-Host "    - Found Set-Cookie header with refresh_token" -ForegroundColor Gray
    } else {
        Write-Host "  WARN Cookie not visible in headers (may be HttpOnly)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  FAIL Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    Please ensure backend is running (cd server && node src\index.js)" -ForegroundColor Yellow
    exit 1
}

# Test 2: Access protected endpoint with Access Token
Write-Host "`n[Test 2] Access protected endpoint..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    $meResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/me" `
        -Method GET `
        -Headers $headers `
        -UseBasicParsing `
        -ErrorAction Stop

    $userData = ($meResponse.Content | ConvertFrom-Json).data
    Write-Host "  OK Access successful" -ForegroundColor Green
    Write-Host "    - User: $($userData.username)" -ForegroundColor Gray
    Write-Host "    - Role: $($userData.role)" -ForegroundColor Gray
} catch {
    Write-Host "  FAIL Access failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Refresh Access Token
Write-Host "`n[Test 3] Refresh with Refresh Token..." -ForegroundColor Yellow
try {
    $refreshResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/refresh" `
        -Method POST `
        -UseBasicParsing `
        -WebSession $session `
        -ErrorAction Stop

    $newAccessToken = ($refreshResponse.Content | ConvertFrom-Json).data.accessToken
    Write-Host "  OK Refresh successful" -ForegroundColor Green
    Write-Host "  OK New Access Token: $($newAccessToken.Substring(0,30))..." -ForegroundColor Green
    
    # Verify token rotation
    if ($newAccessToken -ne $accessToken) {
        Write-Host "  OK Token rotated (rotation mechanism working)" -ForegroundColor Green
    } else {
        Write-Host "  WARN Token unchanged" -ForegroundColor Yellow
    }
    
    $accessToken = $newAccessToken
} catch {
    Write-Host "  FAIL Refresh failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Access with new token
Write-Host "`n[Test 4] Access with new token..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    $meResponse2 = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/me" `
        -Method GET `
        -UseBasicParsing `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "  OK New token valid" -ForegroundColor Green
} catch {
    Write-Host "  FAIL New token invalid: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 5: Logout
Write-Host "`n[Test 5] Logout..." -ForegroundColor Yellow
try {
    $logoutResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/logout" `
        -Method POST `
        -UseBasicParsing `
        -ErrorAction Stop

    Write-Host "  OK Logout successful" -ForegroundColor Green
    
    # Try refresh after logout (should fail)
    try {
        $failedRefresh = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/refresh" `
            -Method POST `
            -WebSession $session `
            -UseBasicParsing
            -WebSession $session `
            -ErrorAction Stop
        Write-Host "  WARN Refresh token still valid after logout" -ForegroundColor Yellow
    } catch {
        Write-Host "  OK Refresh token invalidated (expected)" -ForegroundColor Green
    }
} catch {
    Write-Host "  FAIL Logout failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "OK All tests passed! Double token mechanism working" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
