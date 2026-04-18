"""Generate a workbook-backed parity fixture from the CRAVEzero template workbook."""

from __future__ import annotations

import json
from pathlib import Path

import openpyxl

WORKBOOK = Path("CRAVEzero/200512_LCC_tool_beta_v2.xlsm")
OUTPUT = Path("tests/fixtures/excel-reference.json")


def num(value: object | None, default: float = 0.0) -> float:
    if value is None:
        return default
    return float(value)


def main() -> None:
    wb = openpyxl.load_workbook(WORKBOOK, data_only=True, keep_vba=True)
    pi = wb["Project Information"]
    calc = wb["Calc"]
    results = wb["Results"]

    fixture = {
        "meta": {
            "description": (
                "Workbook-backed parity fixture extracted from the CRAVEzero "
                "base template workbook cached values."
            ),
            "workbook": str(WORKBOOK).replace("\\", "/"),
            "variant": "BASE",
            "formulaMode": "excel_replica",
            "generated": "2026-04-18",
            "generatedBy": "scripts/generate-excel-reference-fixture.py",
        },
        "input": {
            "referencePeriod": int(num(pi["D119"].value)),
            "interestRate": num(pi["D121"].value),
            "inflationRate": num(pi["D123"].value),
            "treatedFloorArea": num(pi["D52"].value),
            "energyPrices": [],
            "energyInputs": [],
            "costItems": [],
            "serviceComponents": [],
            "buildingElementMaintenancePercent": num(pi["D175"].value),
            "wlcInput": {
                "landCost": 0,
                "enablingCosts": 0,
                "planningFees": 0,
                "userSupportPropMgmt": 0,
                "userSupportCharges": 0,
                "userSupportAdmin": 0,
                "financeCost": 0,
                "designCostsTotal": 0,
                "siteManagementCostsTotal": 0,
            },
            "designCosts": [],
        },
        "expected": {
            "realInterestRate": num(pi["D125"].value),
            "discountFactors": {
                "year0": num(calc["D8"].value),
                "year1": num(calc["E8"].value),
                "year2": num(calc["F8"].value),
                "year40": num(calc["AR8"].value),
            },
            "aggregate": {
                "totalConstruction": num(results["B65"].value),
                "nonConstructionCosts": num(results["B56"].value),
                "designCosts": num(results["B57"].value),
                "buildingSiteManagement": num(results["B61"].value),
                "energyConsumed": num(results["B77"].value),
                "energyProduced": num(results["B78"].value),
                "maintenanceAtRefPeriod": num(results["B80"].value),
                "operationAndMaintenance": num(results["B76"].value),
                "lcc": num(results["B62"].value),
                "wlc": num(results["B55"].value),
            },
        },
    }

    wb.close()
    OUTPUT.write_text(json.dumps(fixture, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
