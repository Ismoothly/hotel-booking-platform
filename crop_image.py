from PIL import Image, ImageChops

def trim_whitespace(image_path):
    img = Image.open(image_path)
    
    # 如果是RGBA，转换为RGB
    if img.mode == 'RGBA':
        bg = Image.new('RGB', img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg
    
    # 检测非白色区域
    bg = Image.new('RGB', img.size, (255, 255, 255))
    diff = ImageChops.difference(img, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    
    if bbox:
        # 添加小边距
        padding = 20
        bbox = (
            max(0, bbox[0] - padding),
            max(0, bbox[1] - padding),
            min(img.size[0], bbox[2] + padding),
            min(img.size[1], bbox[3] + padding)
        )
        cropped = img.crop(bbox)
        cropped.save(image_path)
        print(f'裁剪前: {img.size}, 裁剪后: {cropped.size}')
        return cropped.size
    else:
        print('无法检测边界')
        return img.size

if __name__ == '__main__':
    trim_whitespace('concurrent-flow.png')
