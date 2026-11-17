#!/usr/bin/env python3
"""Download the ARASAAC pictograms used by the app and link them in the content.

scripts/arasaac-pictures.json maps an item id to an ARASAAC pictogram id,
chosen by hand (the ARASAAC search often returns unrelated pictures). This script:
  1. downloads each pictogram (300 px PNG) to public/pictures/<item-id>.png
  2. sets "picture": "pictures/<item-id>.png" on that item in the content files
  3. removes "picture" from items that are no longer in the map
Items without a picture keep showing their emoji.

To change a picture: find a better one on https://arasaac.org, put its number in
scripts/arasaac-pictures.json and run:  python3 scripts/fetch-pictures.py

Pictograms: Sergio Palao. Origin: ARASAAC (https://arasaac.org).
License: CC BY-NC-SA 4.0. Owner: Government of Aragón (Spain).
Needs Pillow (pip install pillow) to make the files smaller.
"""

import io
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAP = json.loads((ROOT / "scripts" / "arasaac-pictures.json").read_text("utf8"))
OUT = ROOT / "public" / "pictures"
URL = "https://static.arasaac.org/pictograms/{id}/{id}_300.png"


def save_small(data: bytes, target: Path) -> None:
    try:
        from PIL import Image
    except ImportError:
        target.write_bytes(data)
        return
    img = Image.open(io.BytesIO(data)).convert("RGBA")
    img = img.resize((240, 240), Image.LANCZOS)
    img = img.quantize(colors=64, method=Image.FASTOCTREE)
    img.save(target, optimize=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for item_id, picto in MAP.items():
        target = OUT / f"{item_id}.png"
        if not target.exists():
            data = urllib.request.urlopen(URL.format(id=picto), timeout=30).read()
            save_small(data, target)
            print(f"  ✓ {target.relative_to(ROOT)}  ←  ARASAAC {picto}")
    # Remove files that are no longer used
    for f in OUT.glob("*.png"):
        if f.stem not in MAP:
            f.unlink()
            print(f"  – removed {f.name}")
    files = [ROOT / "src/content/common.json"] + sorted((ROOT / "src/content/units").glob("unit-*.json"))
    for path in files:
        data = json.loads(path.read_text("utf8"))
        items = data.get("items", []) + data.get("commands", [])
        changed = False
        for item in items:
            want = f"pictures/{item['id']}.png" if item["id"] in MAP else None
            if item.get("picture") != want:
                if want:
                    item["picture"] = want
                else:
                    item.pop("picture", None)
                changed = True
        if changed:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", "utf8")
            print(f"  ✓ updated {path.relative_to(ROOT)}")
    print(f"Done: {len(MAP)} pictures.")


if __name__ == "__main__":
    main()
