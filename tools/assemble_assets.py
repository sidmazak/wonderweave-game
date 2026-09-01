#!/usr/bin/env python3
"""Copy selected extracted sprites into public/game/assets with semantic names, then build a verification contact sheet."""
import os, shutil
from PIL import Image, ImageDraw

SRC = "/home/z/my-project/extracted"
DST = "/home/z/my-project/public/game/assets"
os.makedirs(DST, exist_ok=True)

MAP = {
    # logo & characters
    "sheet/s003": "logo.png",
    "sheet/s051": "bunny-lantern.png",
    "sheet/s052": "bunny-heart.png",
    "sheet/s053": "bunny-pack.png",
    "sheet/s133": "bunny-wizard.png",
    "sheet/s089": "bunny-rest.png",
    "mockups/s013": "bunny-cheer.png",
    "mockups/s026": "bunny-walk.png",
    # board tiles
    "sheet/s005": "tile-flame.png",
    "sheet/s006": "tile-drop.png",
    "sheet/s008": "tile-star.png",
    "sheet/s009": "tile-flower.png",
    "sheet/s010": "tile-orb.png",
    "sheet/s011": "tile-mushroom.png",
    "sheet/s013": "tile-leaf.png",
    "sheet/s016": "tile-gem.png",
    "sheet/s158": "fx-rainbow.png",
    # decorations
    "sheet/s004": "deco-butterfly.png",
    "sheet/s014": "deco-balloon.png",
    "sheet/s015": "fx-petal.png",
    "sheet/s258": "deco-cloud-white.png",
    "scenes/s017": "deco-island.png",
    "scenes/s019": "deco-island-falls.png",
    "scenes/s020": "deco-tree.png",
    "scenes/s029": "deco-clouds-pink.png",
    "scenes/s034": "deco-cloud-pink.png",
    "scenes/s044": "deco-mushrooms.png",
    "scenes/s046": "deco-flowers.png",
    "scenes/s055": "deco-sign.png",
    "scenes/s060": "deco-lamp.png",
    "scenes/s062": "deco-arch.png",
    "scenes/s063": "deco-platform.png",
    "scenes/s068": "deco-waterfall.png",
    "scenes/s073": "deco-moon.png",
    # ui elements
    "sheet/s097": "pill-tan.png",
    "sheet/s098": "pill-gold.png",
    "sheet/s099": "pill-silver.png",
    "sheet/s100": "icon-bow.png",
    "sheet/s196": "bar-stars.png",
    "sheet/s222": "bar-green.png",
    "sheet/s233": "banner-combo.png",
    "mockups/s094": "banner-objective.png",
    "sheet/s254": "plaque-loading.png",
    "mockups/s050": "dialog-confirm.png",
    "mockups/s060": "frame-square.png",
    "sheet/s170": "medallion-1.png",
    "sheet/s171": "medallion-lock.png",
    "sheet/s174": "icon-back.png",
    "sheet/s175": "icon-pause.png",
    "sheet/s176": "icon-gear.png",
    "sheet/s178": "icon-close.png",
    "sheet/s189": "icon-check.png",
    "sheet/s117": "heart-purple.png",
    "sheet/s118": "heart-pink.png",
    "sheet/s197": "banner-wood.png",
    "sheet/s198": "banner-floral.png",
    "sheet/s209": "banner-parch.png",
    "sheet/s033": "star-sparkle.png",
    "sheet/s275": "fx-sparkle.png",
    "sheet/s315": "fx-burst.png",
    "sheet/s285": "fx-firework.png",
    "sheet/s067": "icon-bolt.png",
    "mockups/s024": "panel-howto.png",
    "mockups/s025": "splash-loading.png",
    "mockups/s001": "splash-title.png",
    # backgrounds
    "scenes/s001": "bg-castle.png",
    "scenes/s002": "bg-forest.png",
    "scenes/s003": "bg-ruins.png",
    "scenes/s004": "bg-night.png",
    "scenes/s005": "panel-parchment.png",
    "scenes/s006": "bg-map.png",
    "scenes/s008": "bg-altar.png",
    "scenes/s010": "bg-arch.png",
    "scenes/s012": "bg-sunset.png",
    "scenes/s015": "bg-sky.png",
}

for src, dst in MAP.items():
    shutil.copyfile(os.path.join(SRC, src + ".png"), os.path.join(DST, dst))
print(f"copied {len(MAP)} assets")

# verification contact sheet
files = sorted(os.listdir(DST))
cell, cols = 110, 10
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cell, rows * (cell + 20)), (40, 40, 40))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(os.path.join(DST, f))
    im.thumbnail((cell - 10, cell - 10))
    cx, cy = (i % cols) * cell, (i // cols) * (cell + 20)
    sheet.paste(im, (cx + 5, cy + 5), im)
    d.text((cx + 4, cy + cell + 2), f.replace(".png", "")[:18], fill=(255, 230, 150))
sheet.save("/home/z/my-project/extracted/final_assets_sheet.png")
print("contact sheet written")
