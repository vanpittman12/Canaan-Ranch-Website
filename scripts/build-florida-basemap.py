#!/usr/bin/env python3
"""Stitch a clean OpenStreetMap Mapnik mosaic of Florida.

Tile window is integer z=8 OSM tiles, so MAP_FRAME in lib/service-area.ts
is the exact Web Mercator bounds of the JPEG — no baked markers.
"""

from __future__ import annotations

import math
import sys
import time
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

Z = 8
X0, X1 = 65, 72  # inclusive start, exclusive end
Y0, Y1 = 104, 111
TILE = 256
USER_AGENT = (
    "CanaanPreserve/1.0 (https://canaanpreserve.com; "
    "static Florida service-area basemap, one-time mosaic)"
)
SOURCES = (
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
)


def tile2lon(x: int, z: int) -> float:
    return x / (2**z) * 360.0 - 180.0


def tile2lat(y: int, z: int) -> float:
    n = math.pi - (2.0 * math.pi * y) / (2**z)
    return math.degrees(math.atan(math.sinh(n)))


def fetch_tile(x: int, y: int) -> Image.Image:
    headers = {"User-Agent": USER_AGENT, "Accept": "image/png"}
    last_error: Exception | None = None
    for template in SOURCES:
        url = template.format(z=Z, x=x, y=y)
        request = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                data = response.read()
            image = Image.open(BytesIO(data)).convert("RGB")
            if image.size != (TILE, TILE):
                raise RuntimeError(f"{url} was {image.size}, expected {TILE}x{TILE}")
            return image
        except Exception as error:  # noqa: BLE001 — try the next tile host
            last_error = error
            time.sleep(0.4)
    raise RuntimeError(f"Failed to fetch tile {Z}/{x}/{y}: {last_error}")


def main() -> int:
    cols = X1 - X0
    rows = Y1 - Y0
    mosaic = Image.new("RGB", (cols * TILE, rows * TILE), (215, 228, 234))
    total = cols * rows
    done = 0
    for row, y in enumerate(range(Y0, Y1)):
        for col, x in enumerate(range(X0, X1)):
            mosaic.paste(fetch_tile(x, y), (col * TILE, row * TILE))
            done += 1
            print(f"stitched {done}/{total} ({Z}/{x}/{y})", flush=True)
            time.sleep(0.15)

    out = Path(__file__).resolve().parents[1] / "public" / "maps" / "florida-basemap.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    mosaic.save(out, "JPEG", quality=86, optimize=True, progressive=True)

    west = tile2lon(X0, Z)
    east = tile2lon(X1, Z)
    north = tile2lat(Y0, Z)
    south = tile2lat(Y1, Z)
    print("wrote", out, "bytes", out.stat().st_size)
    print("MAP_FRAME = {")
    print(f"  west: {west},")
    print(f"  east: {east},")
    print(f"  north: {north},")
    print(f"  south: {south},")
    print(f"  width: {mosaic.size[0]},")
    print(f"  height: {mosaic.size[1]},")
    print("}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
