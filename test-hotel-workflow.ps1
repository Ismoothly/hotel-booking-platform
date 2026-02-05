# 测试酒店创建和查询流程

Write-Host "`n========== 测试酒店审核流程 ==========" -ForegroundColor Cyan

# 1. 商户登录
Write-Host "`n[1] 商户登录..." -ForegroundColor Yellow
$loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST -ContentType "application/json" `
    -Body '{"username":"merchant","password":"merchant123"}'
$merchantToken = $loginResp.data.accessToken
Write-Host "  ✓ 商户登录成功" -ForegroundColor Green

# 2. 查询当前客户端酒店列表
Write-Host "`n[2] 查询客户端当前酒店..." -ForegroundColor Yellow
$clientHotels = Invoke-RestMethod -Uri "http://localhost:5000/api/hotels"
Write-Host "  ✓ 客户端可见酒店数: $($clientHotels.total)" -ForegroundColor Green
$clientHotels.data | ForEach-Object {
    Write-Host "    - $($_.nameCn) [status: $($_.status)]" -ForegroundColor Gray
}

# 3. 创建新酒店
Write-Host "`n[3] 创建新酒店..." -ForegroundColor Yellow
$hotelData = @{
    nameCn = "测试审核酒店"
    nameEn = "Test Review Hotel"
    address = "上海市测试区测试路999号"
    starRating = 4
    openingDate = "2024-06-01"
    images = @("https://example.com/1.jpg")
    rooms = @(
        @{ type = "标准间"; price = 399; description = "25平米，大床" }
    )
    facilities = @("WiFi", "空调")
} | ConvertTo-Json -Depth 10

$headers = @{ "Authorization" = "Bearer $merchantToken" }
$newHotel = Invoke-RestMethod -Uri "http://localhost:5000/api/hotels" `
    -Method POST -Headers $headers -ContentType "application/json" -Body $hotelData

Write-Host "  ✓ 酒店创建成功" -ForegroundColor Green
Write-Host "    ID: $($newHotel.data.id)" -ForegroundColor Gray
Write-Host "    状态: status=$($newHotel.data.status), reviewStatus=$($newHotel.data.reviewStatus)" -ForegroundColor Gray

$hotelId = $newHotel.data.id

# 4. 再次查询客户端（应该看不到新酒店）
Write-Host "`n[4] 查询客户端（新酒店应不可见）..." -ForegroundColor Yellow
$clientHotels2 = Invoke-RestMethod -Uri "http://localhost:5000/api/hotels"
Write-Host "  ✓ 客户端可见酒店数: $($clientHotels2.total)" -ForegroundColor $(if ($clientHotels2.total -eq $clientHotels.total) { "Green" } else { "Red" })

# 5. 管理员登录
Write-Host "`n[5] 管理员登录..." -ForegroundColor Yellow
$adminLoginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST -ContentType "application/json" `
    -Body '{"username":"admin","password":"admin123"}'
$adminToken = $adminLoginResp.data.accessToken
Write-Host "  ✓ 管理员登录成功" -ForegroundColor Green

# 6. 查看待审核酒店
Write-Host "`n[6] 查询待审核酒店..." -ForegroundColor Yellow
$adminHeaders = @{ "Authorization" = "Bearer $adminToken" }
$pendingHotels = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/hotels/pending" `
    -Headers $adminHeaders
Write-Host "  ✓ 待审核酒店数: $($pendingHotels.total)" -ForegroundColor Green
$pendingHotels.data | ForEach-Object {
    Write-Host "    - $($_.nameCn) [ID: $($_.id), status: $($_.status), review: $($_.reviewStatus)]" -ForegroundColor Gray
}

# 7. 审核通过
Write-Host "`n[7] 审核通过..." -ForegroundColor Yellow
$approveResp = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/hotels/$hotelId/approve" `
    -Method PUT -Headers $adminHeaders
Write-Host "  ✓ 审核通过" -ForegroundColor Green
Write-Host "    状态: reviewStatus=$($approveResp.data.reviewStatus)" -ForegroundColor Gray

# 8. 再次查询客户端（仍应看不到）
Write-Host "`n[8] 查询客户端（审核通过但未发布）..." -ForegroundColor Yellow
$clientHotels3 = Invoke-RestMethod -Uri "http://localhost:5000/api/hotels"
Write-Host "  ✓ 客户端可见酒店数: $($clientHotels3.total)" -ForegroundColor $(if ($clientHotels3.total -eq $clientHotels.total) { "Green" } else { "Red" })

# 9. 发布酒店
Write-Host "`n[9] 发布酒店..." -ForegroundColor Yellow
$publishResp = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/hotels/$hotelId/publish" `
    -Method PUT -Headers $adminHeaders
Write-Host "  ✓ 发布成功" -ForegroundColor Green
Write-Host "    状态: status=$($publishResp.data.status)" -ForegroundColor Gray

# 10. 最终查询客户端（应该能看到新酒店了）
Write-Host "`n[10] 查询客户端（已发布应可见）..." -ForegroundColor Yellow
$clientHotels4 = Invoke-RestMethod -Uri "http://localhost:5000/api/hotels"
Write-Host "  ✓ 客户端可见酒店数: $($clientHotels4.total)" -ForegroundColor $(if ($clientHotels4.total -gt $clientHotels.total) { "Green" } else { "Red" })
$clientHotels4.data | ForEach-Object {
    Write-Host "    - $($_.nameCn) [status: $($_.status)]" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
if ($clientHotels4.total -gt $clientHotels.total) {
    Write-Host "✓ 测试通过！新酒店已出现在客户端" -ForegroundColor Green
} else {
    Write-Host "✗ 测试失败！新酒店未出现在客户端" -ForegroundColor Red
}
Write-Host "========================================`n" -ForegroundColor Cyan
