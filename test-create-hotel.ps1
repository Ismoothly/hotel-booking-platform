# 测试酒店创建 - 验证必填字段
Write-Host "========== Hotel Creation Test ==========" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"

# 1. 先登录获取token
Write-Host "[Step 1] 登录获取 token..." -ForegroundColor Yellow
$loginBody = @{
    username = "merchant1"
    password = "merchant123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -UseBasicParsing
    
    $token = $loginResponse.data.accessToken
    Write-Host "  ✓ 登录成功" -ForegroundColor Green
    Write-Host "  - Token: $($token.Substring(0, 30))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "  ✗ 登录失败: $_" -ForegroundColor Red
    exit 1
}

# 2. 测试创建酒店（缺少city字段）
Write-Host "[Step 2] 测试创建酒店（❌ 缺少city字段）..." -ForegroundColor Yellow
$hotelWithoutCity = @{
    nameCn = "测试酒店"
    nameEn = "Test Hotel"
    address = "测试地址123号"
    starRating = 4
    openingDate = "2024-01-01"
    rooms = @(
        @{
            type = "标准间"
            price = 300
            description = "25平米"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/hotels" `
        -Method POST `
        -Body $hotelWithoutCity `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $token" } `
        -UseBasicParsing
    
    Write-Host "  ✗ 意外成功（应该失败）" -ForegroundColor Red
} catch {
    $errorMsg = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "  ✓ 正确拒绝: $($errorMsg.message)" -ForegroundColor Green
}
Write-Host ""

# 3. 测试创建酒店（包含所有必填字段）
Write-Host "[Step 3] 测试创建酒店（✓ 包含所有必填字段）..." -ForegroundColor Yellow
$hotelComplete = @{
    nameCn = "测试豪华酒店"
    nameEn = "Test Luxury Hotel"
    address = "北京市朝阳区测试路123号"
    city = "北京"
    starRating = 5
    openingDate = "2024-01-15T00:00:00.000Z"
    rooms = @(
        @{
            type = "豪华大床房"
            price = 688
            description = "40平米，大床，景观房"
        },
        @{
            type = "商务套房"
            price = 988
            description = "60平米，独立客厅"
        }
    )
    images = @(
        "https://images.unsplash.com/photo-1566073771259-6a8506099945"
    )
    facilities = @("免费WiFi", "健身房", "游泳池")
    description = "这是一家测试酒店"
    phone = "010-1234-5678"
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/hotels" `
        -Method POST `
        -Body $hotelComplete `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $token" } `
        -UseBasicParsing
    
    Write-Host "  ✓ 创建成功" -ForegroundColor Green
    Write-Host "  - 酒店ID: $($response.data._id)" -ForegroundColor Gray
    Write-Host "  - 酒店名称: $($response.data.nameCn)" -ForegroundColor Gray
    Write-Host "  - 城市: $($response.data.city)" -ForegroundColor Gray
    Write-Host "  - 状态: $($response.data.status)" -ForegroundColor Gray
    Write-Host "  - 审核状态: $($response.data.reviewStatus)" -ForegroundColor Gray
    
    # 4. 删除测试酒店
    Write-Host ""
    Write-Host "[Step 4] 清理测试数据..." -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/hotels/$($response.data._id)" `
            -Method DELETE `
            -Headers @{ Authorization = "Bearer $token" } `
            -UseBasicParsing | Out-Null
        Write-Host "  ✓ 测试数据已删除" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ 删除失败（可手动删除）" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "  ✗ 创建失败" -ForegroundColor Red
    $errorMsg = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "  - 错误: $($errorMsg.message)" -ForegroundColor Red
    if ($errorMsg.errors) {
        Write-Host "  - 详情: $($errorMsg.errors -join ', ')" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
