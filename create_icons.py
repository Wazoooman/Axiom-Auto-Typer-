import struct
import zlib

def create_png(width, height, color_r, color_g, color_b):
    """Create a minimal PNG file with a solid color"""
    # PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk (image header)
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    ihdr_chunk = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # IDAT chunk (image data)
    # Create pixel data: each row starts with 0 (filter type), then RGB bytes for each pixel
    idat_data = b''
    for y in range(height):
        idat_data += b'\x00'  # Filter type: None
        for x in range(width):
            idat_data += struct.pack('BBB', color_r, color_g, color_b)
    
    compressed = zlib.compress(idat_data, 9)
    idat_crc = zlib.crc32(b'IDAT' + compressed) & 0xffffffff
    idat_chunk = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    # IEND chunk (image end)
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    iend_chunk = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    
    return png_signature + ihdr_chunk + idat_chunk + iend_chunk

# Create icons
sizes = [16, 32, 48, 128]
for size in sizes:
    png_data = create_png(size, size, 31, 115, 230)  # Blue color
    with open(f'icons/{size}.png', 'wb') as f:
        f.write(png_data)
    print(f'Created icons/{size}.png ({size}x{size})')

print('Icon generation complete!')
