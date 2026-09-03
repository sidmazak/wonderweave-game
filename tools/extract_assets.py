#!/usr/bin/env python3
"""
Wonderweave asset extractor v2 — sources are RGBA with transparent backgrounds.
Uses the alpha channel for connected-component detection; sprites are cut with their existing alpha.
Outputs extracted/<source>/sNNN.png + index.json + labeled montages.
"""
import json
import os
from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage

SRC_DIR = "/home/z/my-project/upload"
OUT_DIR = "/home/z/my-project/extracted"
os.makedirs(OUT_DIR, exist_ok=True)

SOURCES = [
    ("scenes", "pasted_image_1788245411276.png"),
    ("sheet", "pasted_image_1788245416863.png"),
    ("mockups", "pasted_image_1788245422149.png"),
]

MIN_AREA = 350
MIN_DIM = 14


def process(name: str, fname: str):
    im = Image.open(os.path.join(SRC_DIR, fname)).convert("RGBA")
    W, H = im.size
    alpha = np.asarray(im)[:, :, 3]
    mask = alpha > 24
    # close small gaps so one sprite doesn't shatter into many components
    mask = ndimage.binary_closing(mask, structure=np.ones((3, 3)))
    lab, n = ndimage.label(mask)
    print(f"[{name}] {W}x{H}, {n} raw components")

    out_dir = os.path.join(OUT_DIR, name)
    os.makedirs(out_dir, exist_ok=True)
    index = []
    objs = ndimage.find_objects(lab)
    kept = 0
    for i, sl in enumerate(objs, start=1):
        if sl is None:
            continue
        ys, xs = sl
        h, w = ys.stop - ys.start, xs.stop - xs.start
        area = int((lab[sl] == i).sum())
        if area < MIN_AREA or w < MIN_DIM or h < MIN_DIM:
            continue
        fill = area / (w * h)
        pad = 3
        x0, y0 = max(0, xs.start - pad), max(0, ys.start - pad)
        x1, y1 = min(W, xs.stop + pad), min(H, ys.stop + pad)
        crop = im.crop((x0, y0, x1, y1))
        kept += 1
        sid = f"s{kept:03d}"
        crop.save(os.path.join(out_dir, f"{sid}.png"))
        index.append({
            "id": sid, "x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0),
            "area": area, "fill": round(fill, 2),
            "fx": round(x0 / W, 4), "fy": round(y0 / H, 4),
            "fx2": round(x1 / W, 4), "fy2": round(y1 / H, 4),
        })

    with open(os.path.join(out_dir, "index.json"), "w") as f:
        json.dump(index, f, indent=1)
    print(f"[{name}] kept {kept}")

    cell, cols, per_sheet = 120, 12, 96
    for sheet_i in range(0, len(index), per_sheet):
        chunk = index[sheet_i: sheet_i + per_sheet]
        rows = (len(chunk) + cols - 1) // cols
        montage = Image.new("RGB", (cols * cell, rows * (cell + 22)), (30, 30, 30))
        d = ImageDraw.Draw(montage)
        for j, info in enumerate(chunk):
            sp = Image.open(os.path.join(out_dir, f"{info['id']}.png"))
            sp.thumbnail((cell - 8, cell - 8))
            cx, cy = (j % cols) * cell, (j // cols) * (cell + 22)
            montage.paste(sp, (cx + 4, cy + 4), sp)
            d.text((cx + 6, cy + cell + 2), f"{info['id']} {info['w']}x{info['h']}", fill=(255, 220, 120))
        montage.save(os.path.join(OUT_DIR, f"montage_{name}_{sheet_i // per_sheet}.png"))
    print(f"[{name}] montages written")


for nm, fn in SOURCES:
    process(nm, fn)
print("done")
