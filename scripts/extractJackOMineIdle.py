"""Extract original GIF colors using the background mask; calibrate against Lucky Red.

Usage: python scripts/extractJackOMineIdle.py path/to/JackOMine.gif
Requires Pillow and NumPy (available in the bundled workspace Python).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1] / 'public/assets/rollercoin/hamsters/pets'
LEVELS = [1, 10, 20, 30, 40, 50]
BOXES = [(208, 364, 416, 548), (86, 164, 294, 380), (210, 14, 422, 236),
         (498, 14, 712, 236), (660, 162, 880, 382), (532, 328, 756, 550)]
MOUNTS = [(270, 448, 404, 540), (150, 270, 290, 375), (270, 128, 416, 228),
          (556, 128, 666, 224), (728, 278, 874, 374), (598, 438, 746, 548)]


def character_only(rgba):
    expanded = np.array(Image.fromarray(rgba[:, :, 3]).filter(ImageFilter.MaxFilter(5))) > 0
    groups = np.zeros(expanded.shape, dtype=np.int32)
    biggest, biggest_size, group = 0, 0, 0
    for sy, sx in np.argwhere(expanded):
        if groups[sy, sx]:
            continue
        group += 1
        stack = [(int(sy), int(sx))]
        groups[sy, sx] = group
        size = 0
        while stack:
            y, x = stack.pop()
            size += 1
            for ny, nx in [(y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)]:
                if (0 <= ny < expanded.shape[0] and 0 <= nx < expanded.shape[1]
                        and expanded[ny, nx] and not groups[ny, nx]):
                    groups[ny, nx] = group
                    stack.append((ny, nx))
        if size > biggest_size:
            biggest, biggest_size = group, size
    rgba[:, :, 3] = np.where(groups == biggest, rgba[:, :, 3], 0)
    return Image.fromarray(rgba)


def main():
    source = Image.open(sys.argv[1])
    assert source.size == (1024, 550) and source.n_frames == 6
    mask = Image.open(Path(__file__).with_name('jack-o-mine-idle-mask.png')).getchannel('A')
    assert mask.size == source.size
    mask = np.array(mask.filter(ImageFilter.MaxFilter(9))) > 150
    colors = set()
    for level in LEVELS:
        walk = Image.open(ROOT / 'jack-o-mine' / f'lvl{level:02d}' / 'sprite_walk.png').convert('RGBA')
        colors.update(color[:3] for _, color in walk.getcolors(walk.width * walk.height) if color[3])
    palette = np.array(list(colors), dtype=np.int16)
    cells = [[] for _ in LEVELS]
    restored = [0 for _ in LEVELS]
    for frame in range(6):
        source.seek(frame)
        assert source.info['duration'] == 100
        pixels = np.array(source.convert('RGBA'))
        rgb = pixels[:, :, :3].astype(np.int16)
        unique, inverse = np.unique(rgb.reshape(-1, 3), axis=0, return_inverse=True)
        near = np.max(abs(unique[:, None, :] - palette[None, :, :]), axis=2).min(axis=1)
        foreground = near[inverse].reshape(source.height, source.width) <= 4
        cool = (rgb[:, :, 2] >= rgb[:, :, 0] - 4) & (rgb[:, :, 2] >= rgb[:, :, 1] - 4)
        for index, (box, mount) in enumerate(zip(BOXES, MOUNTS)):
            moving_mount = np.zeros(mask.shape, dtype=bool)
            x0, y0, x1, y1 = mount
            moving_mount[y0:y1, x0:x1] = cool[y0:y1, x0:x1]
            # A first-frame mask cannot cover every subsequent leg pose.
            uncovered = foreground & moving_mount & ~mask
            rgba = pixels.copy()
            rgba[:, :, 3] = (foreground & (mask | moving_mount)) * 255
            leg_y = (y0 + y1) // 2
            # Soil shares a few pumpkin colors, but the mount's legs are neutral gray.
            rgba[leg_y:y1, x0:x1, 3] *= rgb[leg_y:y1, x0:x1, 2] >= rgb[leg_y:y1, x0:x1, 1] - 6
            cropped = np.array(Image.fromarray(rgba).crop(box))
            if index == 3:
                cropped[180 - box[1]:, 666 - box[0]:, 3] = 0
            if index == 4:
                cropped[338 - box[1]:, :728 - box[0], 3] = 0
            pose = character_only(cropped)
            x0, y0, x1, y1 = box
            restored[index] += np.count_nonzero((np.array(pose)[:, :, 3] > 0) & uncovered[y0:y1, x0:x1])
            cells[index].append(pose)
    assert all(count > 0 for count in restored), restored
    for level, poses, recovered in zip(LEVELS, cells, restored):
        bounds = [pose.getbbox() for pose in poses]
        union = (min(b[0] for b in bounds), min(b[1] for b in bounds),
                 max(b[2] for b in bounds), max(b[3] for b in bounds))
        reference = Image.open(ROOT / 'lucky-red' / f'lvl{level:02d}' / 'idle.png').convert('RGBA')
        reference_area = np.count_nonzero(np.array(reference)[:, :, 3])
        area = np.mean([np.count_nonzero(np.array(pose)[:, :, 3]) for pose in poses])
        width, height = union[2] - union[0], union[3] - union[1]
        scale = min((reference_area / area) ** .5, 156 / width, 156 / height)
        size = (round(width * scale), round(height * scale))
        strip = Image.new('RGBA', (960, 160))
        normalized_areas = []
        for frame, pose in enumerate(poses):
            cell = Image.new('RGBA', (160, 160))
            cell.paste(pose.crop(union).resize(size, Image.Resampling.NEAREST), ((160 - size[0]) // 2, 158 - size[1]))
            bounds = cell.getbbox()
            assert bounds and 0 < bounds[0] < bounds[2] < 160 and 0 < bounds[1] < bounds[3] < 160
            normalized_areas.append(np.count_nonzero(np.array(cell)[:, :, 3]))
            strip.paste(cell, (frame * 160, 0))
            if frame == 0:
                cell.save(ROOT / 'jack-o-mine' / f'lvl{level:02d}' / 'idle.png')
        assert .8 < np.mean(normalized_areas) / reference_area < 1.15
        strip.save(ROOT / 'jack-o-mine' / f'lvl{level:02d}' / 'sprite_idle.png')
        print(f'Level {level}: {recovered} moving-mount pixels recovered; {size}, Lucky Red area ratio {np.mean(normalized_areas) / reference_area:.2f}')


if __name__ == '__main__':
    main()
