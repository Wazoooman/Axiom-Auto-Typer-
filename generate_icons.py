from PIL import Image, ImageDraw

# Create simple gradient icons for each size
sizes = [16, 32, 48, 128]
for size in sizes:
    # Create image with gradient from blue to purple
    img = Image.new('RGB', (size, size), color=(31, 115, 230))
    draw = ImageDraw.Draw(img)
    
    # Add a white graduation cap symbol
    if size >= 32:
        # Draw simple cap shape
        cap_y = size // 3
        draw.polygon(
            [(size * 0.2, cap_y), (size * 0.8, cap_y), (size * 0.9, cap_y + size // 4), (size * 0.1, cap_y + size // 4)],
            fill=(255, 255, 255)
        )
        # Draw cap board
        draw.rectangle(
            [(size * 0.15, cap_y + size // 4), (size * 0.85, cap_y + size // 4 + size // 6)],
            fill=(255, 255, 255)
        )
    
    img.save(f'icons/{size}.png')
    print(f'Created icons/{size}.png')

print('Icon generation complete!')
