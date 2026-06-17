#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OmniGuard DAST Runner
=====================
Runs all test categories and writes report.json.
Usage: python runner.py [--category <name>]
"""
import json, time, sys, importlib, os
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent
CONFIG_FILE = ROOT / "input.json"
REPORT_FILE = ROOT / "report.json"
SAVEPOINT_FILE = ROOT / "savepoint.json"

def load_config():
    with open(CONFIG_FILE) as f:
        return json.load(f)

def save_report(records):
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)

def save_savepoint(completed_categories):
    with open(SAVEPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump({"completed": completed_categories, "ts": datetime.now(timezone.utc).isoformat()}, f, indent=2)

def load_savepoint():
    if SAVEPOINT_FILE.exists():
        with open(SAVEPOINT_FILE, encoding="utf-8") as f:
            return json.load(f).get("completed", [])
    return []

def safe_print(*args, **kwargs):
    """Print that never fails on encoding — replaces non-ASCII safely."""
    msg = " ".join(str(a) for a in args)
    try:
        print(msg, **kwargs)
    except UnicodeEncodeError:
        print(msg.encode("ascii", errors="replace").decode("ascii"), **kwargs)

def print_summary(records):
    safe_print("\n" + "="*60)
    safe_print("  DAST REPORT SUMMARY")
    safe_print("="*60)
    findings = [r for r in records if r["finding"]]
    by_severity = {}
    for r in findings:
        by_severity.setdefault(r["severity"], []).append(r)

    safe_print(f"  Total tests run : {len(records)}")
    safe_print(f"  Total findings  : {len(findings)}")
    safe_print()
    for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]:
        items = by_severity.get(sev, [])
        if items:
            icon = {"CRITICAL": "[X]", "HIGH": "[!]", "MEDIUM": "[?]", "LOW": "[~]", "INFO": "[i]"}.get(sev, "[ ]")
            safe_print(f"  {icon} {sev}: {len(items)} finding(s)")
            for r in items:
                safe_print(f"      [{r['test_category']}] {r['method']} {r['endpoint']} -- {r['note']}")
    safe_print()
    no_findings = [r for r in records if not r["finding"]]
    safe_print(f"  [OK] Passed (no finding): {len(no_findings)}")
    safe_print("="*60)
    safe_print(f"  Full report: {REPORT_FILE}")
    safe_print("="*60 + "\n")

CATEGORIES = [
    "test_01_authn_bypass",
    "test_02_authz_privesc",
    "test_03_idor",
    "test_04_rbac_matrix",
    "test_05_token_tampering",
    "test_06_injection",
    "test_07_rate_limiting",
    "test_08_hardcoded_creds",
]

def main():
    config = load_config()
    base_url = config["baseUrl"]
    safe_print(f"\n[DAST] Target: {base_url}")
    safe_print(f"[DAST] Started: {datetime.now(timezone.utc).isoformat()}\n")

    only_category = None
    if "--category" in sys.argv:
        idx = sys.argv.index("--category")
        only_category = sys.argv[idx + 1]

    completed = load_savepoint()
    all_records = []

    # Load existing report if partial run
    if REPORT_FILE.exists():
        with open(REPORT_FILE, encoding="utf-8") as f:
            try:
                all_records = json.load(f)
            except Exception:
                all_records = []

    sys.path.insert(0, str(ROOT))

    for cat in CATEGORIES:
        if only_category and cat != only_category:
            continue
        if cat in completed and not only_category:
            safe_print(f"[SKIP] {cat} (already completed per savepoint)")
            continue

        safe_print(f"\n{'--'*25}")
        safe_print(f"[RUN ] {cat}")
        safe_print(f"{'--'*25}")

        try:
            mod = importlib.import_module(cat)
            records = mod.run(config)
            all_records.extend(records)
            save_report(all_records)
            completed.append(cat)
            save_savepoint(completed)
            findings_in_cat = sum(1 for r in records if r["finding"])
            safe_print(f"[DONE] {cat}: {len(records)} tests, {findings_in_cat} finding(s)")
        except Exception as e:
            safe_print(f"[ERR ] {cat} failed: {e}")
            import traceback; traceback.print_exc()

        time.sleep(0.5)  # throttle between categories

    print_summary(all_records)

if __name__ == "__main__":
    main()
