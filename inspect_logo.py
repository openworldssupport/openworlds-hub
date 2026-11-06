import struct
import zlib
from collections import Counter

path = "public/logo-email.png"
data = open(path, "rb").read()
offset = 8
compressed = b""
while offset < len(data):
    length = struct.unpack(">I", data[offset:offset + 4])[0]
    kind = data[offset + 4:offset + 8]
    if kind == b"IHDR":
        width, height, depth, color_type, _, _, _ = struct.unpack(">IIBBBBB", data[offset + 8:offset + 21])
    if kind == b"IDAT":
        compressed += data[offset + 8:offset + 8 + length]
    offset += 12 + length
raw = zlib.decompress(compressed)
stride = width * 4
rows = []
previous = bytearray(stride)
position = 0
for _ in range(height):
    filter_type = raw[position]
    position += 1
    line = bytearray(raw[position:position + stride])
    position += stride
    for index in range(stride):
        left = line[index - 4] if index >= 4 else 0
        up = previous[index]
        upper_left = previous[index - 4] if index >= 4 else 0
        if filter_type == 1:
            line[index] = (line[index] + left) & 255
        elif filter_type == 2:
            line[index] = (line[index] + up) & 255
        elif filter_type == 3:
            line[index] = (line[index] + ((left + up) // 2)) & 255
        elif filter_type == 4:
            estimate = left + up - upper_left
            distances = (abs(estimate - left), abs(estimate - up), abs(estimate - upper_left))
            best = left if distances[0] <= distances[1] and distances[0] <= distances[2] else (up if distances[1] <= distances[2] else upper_left)
            line[index] = (line[index] + best) & 255
    rows.append(line)
    previous = line

for y in range(0, height, 8):
    out = []
    for x in range(0, width, 8):
        r, g, b, a = rows[y][x * 4:x * 4 + 4]
        if a < 16:
            out.append(".")
        elif r < 60 and g < 100 and b > 180:
            out.append("#")
        elif r > 220 and g > 220 and b > 220:
            out.append(" ")
        elif r > 140 and g > 180 and b > 220:
            out.append("+")
        else:
            out.append("?")
    print("".join(out))

colors = Counter()
for y in range(height):
    for x in range(width):
        r, g, b, a = rows[y][x * 4:x * 4 + 4]
        if a > 8:
            colors[(r // 32 * 32, g // 32 * 32, b // 32 * 32)] += 1
print(colors.most_common(12))
