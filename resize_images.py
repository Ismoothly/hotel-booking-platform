from PIL import Image
import os

os.chdir('F:\\hotel-booking-platform')

# 缩小三个 PNG 文件到 75% 大小（平衡清晰度和显示完整性）
images = {
    'architecture.png': 0.75,
    'sequence-diagram.png': 0.75,
    'concurrent-flow.png': 0.75
}

for img_name, scale in images.items():
    try:
        img = Image.open(img_name)
        original_size = (img.width, img.height)
        new_size = (int(img.width * scale), int(img.height * scale))
        
        # 使用高质量缩放
        img_resized = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # 保存，覆盖原文件
        img_resized.save(img_name, quality=98, optimize=True)
        
        new_file_size = os.path.getsize(img_name)
        print(f"✅ {img_name}: {original_size[0]}x{original_size[1]} → {new_size[0]}x{new_size[1]}")
    except Exception as e:
        print(f"❌ {img_name}: {e}")

print("\n✨ 所有图片已缩小完成！")
