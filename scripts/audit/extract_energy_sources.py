"""Extract energy source list from CRAVEzero workbook (PI!C131:C149)."""

import json
from datetime import datetime, timezone
from pathlib import Path

import openpyxl

WORKBOOK = Path("CRAVEzero/200512_LCC_tool_beta_v2.xlsm")
OUTPUT = Path("scripts/output/energy_sources.json")


def extract():
    wb = openpyxl.load_workbook(WORKBOOK, data_only=True, keep_vba=True)
    ws = wb["Project Information"]

    sources = []
    for row in range(131, 150):
        name = ws.cell(row=row, column=3).value  # C
        if name is None:
            continue

        if 131 <= row <= 141:
            category = "fuel_source"
        elif 142 <= row <= 149:
            category = "energy_carrier"
        else:
            category = "unknown"

        sources.append({
            "index": row - 130,
            "row": row,
            "name": name,
            "category": category,
            "is_header": row == 131,
        })

    # Assertions
    assert len(sources) == 19, f"Expected 19 energy sources, got {len(sources)}"
    assert sources[1]["name"] == "Oil", f"Index 2 should be Oil, got {sources[1]['name']}"
    assert sources[-1]["name"] == "Energy produced by local wind plants", (
        f"Last source: {sources[-1]['name']}"
    )

    envelope = {
        "source": "CRAVEzero workbook Project Information sheet",
        "extracted_from": "PI!C131:C149",
        "extraction_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "count": len(sources),
        "note": "Index 1 maps to row 131 (header row). Valid selectable sources are indices 2-19 (rows 132-149).",
        "sources": sources,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(envelope, f, indent=2, ensure_ascii=False)

    print(f"Extracted {len(sources)} energy sources to {OUTPUT}")


if __name__ == "__main__":
    extract()
