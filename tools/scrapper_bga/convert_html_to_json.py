from __future__ import annotations

"""bga_to_local_pylos_by_html
Parse BGA 'gamereview' HTML fragments (saved under ./gamelogs/) and convert
them to JSON.

This script now produces two outputs per input HTML:
- Legacy Pylos history (local app format):
    gamelogs/converted/pylos_historial_<TABLEID>.json
- Example-style moves (mirrors the provided text example with move/time/actor):
    gamelogs/converted_example/pylos_example_<TABLEID>.json

Assumptions and mappings (for localized move text):
- Coordinate mapping: BGA logs show triples like (x, y, z) 1-based.
  Local format expects "level-row-col" 0-based. We map as:
    level = z - 1; row = x - 1; col = y - 1
- Recognized messages (case-insensitive):
  * "<name> places a ball at (x, y, z)"
     -> text: "colocar {level}-{row}-{col}"
  * "<name> moves [up] a ball from (x1, y1, z1) to (x2, y2, z2)"
     -> if z2 > z1: text: "subir {src} -> {dst}", else "mover {src} -> {dst}"
  * "<name> (recovers|takes back|takes|returns|returned) a/the ball (at|from) (x, y, z)"
     -> text: "recuperar {level}-{row}-{col}"
  Other lines are preserved as raw events in the example-style JSON.

Usage:
  python convert_html_to_json.py                 # process all HTMLs
  python convert_html_to_json.py <table_id>      # process a single file

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
from typing import Dict, Iterable, List, Optional, Tuple


ROOT = Path(__file__).parent
IN_DIR = ROOT / "gamelogs"
OUT_DIR = IN_DIR / "converted"
OUT_DIR_EXAMPLE = IN_DIR / "converted_example"


# --- Regexes for extracting move text blocks ---------------------------------

# We only examine the inner text of <div class="gamelogreview whiteblock">...</div>
# so keep patterns simple and robust.
RE_PLACE = re.compile(
    r"\bplaces\s+a\s+ball\s+at\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)",
    re.IGNORECASE,
)
RE_MOVE = re.compile(
    r"\bmoves(?:\s+up)?\s+a\s+ball\s+from\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*"
    r"to\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)",
    re.IGNORECASE,
)
RE_RECOVER = re.compile(
    r"\b(?:recovers|takes\s+back|takes|returns|returned)\s+(?:a\s+|the\s+)?ball\s+(?:at|from)\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)",
    re.IGNORECASE,
)

# Regex to pair move number and time with the following review text
RE_MOVE_TRIPLE = re.compile(
    r"<div\s+class=\"smalltext\">\s*Move\s+(\d+)\s*:\s*<span[^>]*>\s*(.*?)\s*</span>\s*</div>\s*"
    r"<div\s+class=\"gamelogreview\s+whiteblock\"[^>]*>(.*?)</div>",
    re.IGNORECASE | re.DOTALL,
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


@dataclass
class ExampleMove:
    """Example-style move entry mirroring the provided text example."""
    move: int
    time: str
    actor: Optional[str]
    raw: str
    parsed: Optional[Dict[str, object]]  # action, coords, localKey, localText, etc.


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


def extract_move_entries(html: str) -> List[Tuple[int, str, str]]:
    """Return [(move_number, time_str, review_text), ...] in order.

    We scan for a pattern of a smalltext Move header immediately followed by a
    gamelogreview block. The HTML is minified onto a single line; we use DOTALL.
    """
    s = unescape(html).replace("\n", " ")
    entries: List[Tuple[int, str, str]] = []
    for m in RE_MOVE_TRIPLE.finditer(s):
        move_no = int(m.group(1))
        time_str = re.sub(r"\s+", " ", m.group(2)).strip()
        raw = m.group(3)
        text = re.sub(r"<[^>]+>", "", raw)
        text = re.sub(r"\s+", " ", text).strip()
        entries.append((move_no, time_str, text))
    return entries


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


def parse_actor(line: str) -> Optional[str]:
    """Extract the actor/player name at the start of a review line, if present."""
    # Consider common verbs to anchor the split
    verb_re = re.compile(
        r"\b(places|moves\s+up|moves|recovers|takes\s+back|takes|returns|returned|makes|does|completes)\b",
        re.IGNORECASE,
    )
    m = verb_re.search(line)
    if not m:
        return None
    before = line[: m.start()].strip()
    # Sometimes actor names can have colons trimmed; keep simple and take last token group
    return before if before else None


def parse_example_action(line: str) -> Optional[Dict[str, object]]:
    """Parse a review line into a structured action dict used in example JSON.

    Returns a dict with keys like: action, coords/src/dst, localKey/localText.
    """
    # PLACE
    m = RE_PLACE.search(line)
    if m:
        x, y, z = map(int, m.groups())
        key = to_local_key(x, y, z)
        return {
            "action": "place",
            "coords": {"x": x, "y": y, "z": z},
            "localKey": key,
            "localText": f"colocar {key}",
        }

    # MOVE / LIFT
    m = RE_MOVE.search(line)
    if m:
        x1, y1, z1, x2, y2, z2 = map(int, m.groups())
        src = to_local_key(x1, y1, z1)
        dst = to_local_key(x2, y2, z2)
        verb = "subir" if z2 > z1 else "mover"
        return {
            "action": "lift" if verb == "subir" else "move",
            "src": {"x": x1, "y": y1, "z": z1, "local": src},
            "dst": {"x": x2, "y": y2, "z": z2, "local": dst},
            "localText": f"{verb} {src} -> {dst}",
        }

    # RECOVER
    m = RE_RECOVER.search(line)
    if m:
        x, y, z = map(int, m.groups())
        key = to_local_key(x, y, z)
        return {
            "action": "recover",
            "coords": {"x": x, "y": y, "z": z},
            "localKey": key,
            "localText": f"recuperar {key}",
        }

    # Other notable events (kept as-is)
    if re.search(r"makes\s+a\s+line", line, re.IGNORECASE):
        return {"action": "line_made"}
    if re.search(r"does\s+not\s+return\s+a\s+second\s+ball", line, re.IGNORECASE):
        return {"action": "no_second_return"}
    if re.search(r"completes\s+the\s+pyramid", line, re.IGNORECASE):
        return {"action": "pyramid_completed"}

    return None


def parse_gamelog_html(html: str) -> List[ParsedMove]:
    """Parse a full BGA gamelogs HTML fragment and return a list of parsed moves."""
    moves: List[ParsedMove] = []
    for line in extract_move_texts(html):
        pm = parse_move_line(line)
        if pm is not None:
            moves.append(pm)
    return moves


def parse_example_from_html(html: str) -> Tuple[List[ExampleMove], Optional[str]]:
    """Parse HTML into example-style move entries and detect winner if present."""
    entries = extract_move_entries(html)
    result: List[ExampleMove] = []
    winner: Optional[str] = None
    win_re = re.compile(r"The\s+end\s+of\s+the\s+game:\s*(.*?)\s+wins!", re.IGNORECASE)
    for move_no, time_str, text in entries:
        # Winner detection
        wm = win_re.search(text)
        if wm:
            winner = wm.group(1).strip()
        actor = parse_actor(text)
        parsed = parse_example_action(text)
        result.append(ExampleMove(move=move_no, time=time_str, actor=actor, raw=text, parsed=parsed))
    return result, winner


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


def write_example_json(table_id: str, ex_moves: List[ExampleMove], winner: Optional[str], out_path: Path) -> None:
    """Write the example-style JSON with move number, time, actor and parsed info."""
    payload = {
        "tableId": table_id,
        "winner": winner,
        "moves": [
            {
                "move": m.move,
                "time": m.time,
                "actor": m.actor,
                "raw": m.raw,
                "parsed": m.parsed,
            }
            for m in ex_moves
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
        # Legacy output (for local Pylos app)
        moves = parse_gamelog_html(html)
        out_path = OUT_DIR / f"pylos_historial_{tid}.json"
        write_history_json(tid, moves, out_path)
        # Example-style output (mirrors text example)
        ex_moves, winner = parse_example_from_html(html)
        out_example = OUT_DIR_EXAMPLE / f"pylos_example_{tid}.json"
        write_example_json(tid, ex_moves, winner, out_example)
        print(
            f"[ok] {path.name} -> {out_path.relative_to(ROOT)} ({len(moves)} moves); "
            f"also -> {out_example.relative_to(ROOT)} ({len(ex_moves)} entries)"
        )
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

