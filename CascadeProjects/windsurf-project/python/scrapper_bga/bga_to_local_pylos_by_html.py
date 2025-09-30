from __future__ import annotations

"""bga_to_local_pylos_by_html
Parse BGA 'gamereview' HTML fragments (saved under ./gamelogs/) and convert
them to the local JSON history format used by the Pylos app.

Assumptions and mappings:
- We only need moves; other metadata can be null/empty.
- Coordinate mapping: BGA logs show triples like (x, y, z) 1-based.
  Local format expects "level-row-col" 0-based. We map as:
    level = z - 1; row = x - 1; col = y - 1
- Recognized messages (case-insensitive):
  * "<name> places a ball at (x, y, z)"
     -> text: "colocar {level}-{row}-{col}"
  * "<name> moves a ball from (x1, y1, z1) to (x2, y2, z2)"
     -> if z2 > z1: text: "subir {src} -> {dst}", else "mover {src} -> {dst}"
  * "<name> (recovers|takes back|takes) a ball (at|from) (x, y, z)"
     -> text: "recuperar {level}-{row}-{col}"
  Unrecognized message lines are ignored.

Output:
- For each input file gamelogs/gamelogs_<TABLEID>.html, a JSON is written to:
    gamelogs/converted/pylos_historial_<TABLEID>.json
  with structure (unknown fields set to null or empty):
    {
      "exportedAt": ISO8601,
      "archived": [
        {
          "id": "bga-<TABLEID>",
          "endedAt": null,
          "winner": null,
          "reason": null,
          "vsAI": null,
          "iaDepth": null,
          "iaTimeMode": null,
          "iaTimeSeconds": 0,
          "totalMoves": N,
          "moves": [ { "player": null, "source": null, "text": "..." }, ... ]
        }
      ]
    }

Usage:
  python bga_to_local_pylos_by_html.py                 # process all HTMLs
  python bga_to_local_pylos_by_html.py <table_id>      # process a single file

Notes:
- This script does not require external packages.
"""

import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Iterable, List, Optional, Tuple


ROOT = Path(__file__).parent
IN_DIR = ROOT / "gamelogs"
OUT_DIR = IN_DIR / "converted"


# --- Regexes for extracting move text blocks ---------------------------------

# We only examine the inner text of <div class="gamelogreview whiteblock">...</div>
# so keep patterns simple and robust.
RE_PLACE = re.compile(
    r"\bplaces\s+a\s+ball\s+at\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)",
    re.IGNORECASE,
)
RE_MOVE = re.compile(
    r"\bmoves\s+a\s+ball\s+from\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*"
    r"to\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)",
    re.IGNORECASE,
)
RE_RECOVER = re.compile(
    r"\b(?:recovers|takes\s+back|takes)\s+a\s+ball\s+(?:at|from)\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)",
    re.IGNORECASE,
)


def to_local_key(x: int, y: int, z: int) -> str:
    """Convert BGA (x,y,z) 1-based into local "level-row-col" 0-based string."""
    level = z - 1
    row = x - 1
    col = y - 1
    return f"{level}-{row}-{col}"


@dataclass
class ParsedMove:
    text: str
    player: Optional[str] = None  # 'L' | 'D' or None when unknown
    source: Optional[str] = None  # 'IA' | 'PLAYER' or None when unknown


def extract_move_texts(html: str) -> Iterable[str]:
    """Yield inner texts of all gamelogreview blocks, in order.

    We deliberately avoid external parsers: this regex finds
    <div class="gamelogreview whiteblock"> ... </div> and returns the text part.
    """
    # Normalize whitespace a bit to be friendlier to regex.
    s = unescape(html)
    # Remove newlines to simplify matching across the line
    s = s.replace("\n", " ")
    # Extract text inside the review blocks
    # Note: non-greedy match between tags; we strip leftover tags in post.
    block_re = re.compile(
        r"<div\s+class=\"gamelogreview\s+whiteblock\"[^>]*>(.*?)</div>",
        re.IGNORECASE,
    )
    for m in block_re.finditer(s):
        raw = m.group(1)
        # Strip any nested tags quickly
        text = re.sub(r"<[^>]+>", "", raw)
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            yield text


def parse_move_line(line: str) -> Optional[ParsedMove]:
    """Parse a single review line into a ParsedMove or None if unsupported.

    Examples of supported lines:
      - "Alice places a ball at (1, 2, 1)"
      - "Bob moves a ball from (1,1,1) to (2,2,2)"
      - "Alice recovers a ball at (1, 2, 1)"
    """
    # PLACE
    m = RE_PLACE.search(line)
    if m:
        x, y, z = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
        key = to_local_key(x, y, z)
        return ParsedMove(text=f"colocar {key}")

    # MOVE / LIFT
    m = RE_MOVE.search(line)
    if m:
        x1, y1, z1, x2, y2, z2 = map(int, m.groups())
        src = to_local_key(x1, y1, z1)
        dst = to_local_key(x2, y2, z2)
        verb = "subir" if z2 > z1 else "mover"
        return ParsedMove(text=f"{verb} {src} -> {dst}")

    # RECOVER
    m = RE_RECOVER.search(line)
    if m:
        x, y, z = map(int, m.groups())
        key = to_local_key(x, y, z)
        return ParsedMove(text=f"recuperar {key}")

    return None


def parse_gamelog_html(html: str) -> List[ParsedMove]:
    """Parse a full BGA gamelogs HTML fragment and return a list of parsed moves."""
    moves: List[ParsedMove] = []
    for line in extract_move_texts(html):
        pm = parse_move_line(line)
        if pm is not None:
            moves.append(pm)
    return moves


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def write_history_json(table_id: str, moves: List[ParsedMove], out_path: Path) -> None:
    """Write the local history JSON with only moves filled; other fields null/empty."""
    exported_at = datetime.now(timezone.utc).isoformat()
    payload = {
        "exportedAt": exported_at,
        "archived": [
            {
                "id": f"bga-{table_id}",
                "endedAt": None,
                "winner": None,
                "reason": None,
                "vsAI": None,
                "iaDepth": None,
                "iaTimeMode": None,
                "iaTimeSeconds": 0,
                "totalMoves": len(moves),
                "moves": [
                    {
                        "player": m.player,  # unknown from BGA log
                        "source": m.source,  # unknown from BGA log
                        "text": m.text,
                    }
                    for m in moves
                ],
            }
        ],
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def table_id_from_filename(path: Path) -> Optional[str]:
    m = re.match(r"gamelogs_(\d+)\.html\Z", path.name)
    return m.group(1) if m else None


def process_file(path: Path) -> Optional[Path]:
    tid = table_id_from_filename(path)
    if not tid:
        print(f"[skip] Not a gamelogs_*.html file: {path.name}")
        return None
    try:
        html = read_text(path)
        moves = parse_gamelog_html(html)
        out_path = OUT_DIR / f"pylos_historial_{tid}.json"
        write_history_json(tid, moves, out_path)
        print(f"[ok] {path.name} -> {out_path.relative_to(ROOT)} ({len(moves)} moves)")
        return out_path
    except Exception as e:
        print(f"[error] Failed processing {path.name}: {e}")
        return None


def process_all(target_id: Optional[str] = None) -> None:
    if not IN_DIR.exists():
        print(f"Input folder not found: {IN_DIR}")
        return
    files = sorted(IN_DIR.glob("gamelogs_*.html"))
    if target_id:
        files = [p for p in files if p.name == f"gamelogs_{target_id}.html"]
        if not files:
            print(f"No input file for table_id={target_id}")
            return
    if not files:
        print("No gamelog HTML files found.")
        return
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for p in files:
        process_file(p)


if __name__ == "__main__":
    # Optional single table_id argument
    arg_tid = sys.argv[1] if len(sys.argv) >= 2 else None
    process_all(arg_tid)

