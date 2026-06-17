#!/usr/bin/env python3
"""
CATEGORY 8 — Hardcoded Credentials / Secret Scan
==================================================
Static scan of the codebase for hardcoded secrets, API keys,
passwords, and credentials not protected by .gitignore.
No network requests are made in this module.
"""
import re, json
from pathlib import Path
from datetime import datetime, timezone
from dast_helpers import make_record, print_result

CATEGORY = "hardcoded_creds"

# ── Patterns to search for ──────────────────────────────────────────────────
SECRET_PATTERNS = [
    # (pattern_name, regex, severity)
    ("supabase_anon_key",     r"sb_publishable_[A-Za-z0-9_\-]{20,}",                 "HIGH"),
    ("supabase_service_key",  r"sb_secret_[A-Za-z0-9_\-]{20,}",                      "CRITICAL"),
    ("jwt_secret",            r"JWT_SECRET\s*[=:]\s*[\"']?[A-Za-z0-9_\-]{16,}",      "CRITICAL"),
    ("groq_api_key",          r"GROQ_API_KEY\s*[=:]\s*[\"']?[A-Za-z0-9_\-]{10,}",   "CRITICAL"),
    ("google_oauth_secret",   r"GOOGLE.*SECRET\s*[=:]\s*[\"']?[A-Za-z0-9_\-]{10,}", "CRITICAL"),
    ("generic_api_key",       r"api[_-]?key\s*[=:]\s*[\"'][A-Za-z0-9_\-]{16,}[\"']","HIGH"),
    ("hardcoded_password",    r"password\s*[=:]\s*[\"'][^\"']{6,}[\"']",              "HIGH"),
    ("hardcoded_email_creds", r"testuser@omniguard\.dev",                              "CRITICAL"),
    ("bypass_auth_flag",      r"bypassAuth",                                           "HIGH"),
    ("session_storage_bypass",r"sessionStorage\.setItem\s*\(\s*[\"']bypassAuth",      "CRITICAL"),
    ("supabase_url_hardcoded",r"https://[a-z]{20}\.supabase\.co",                     "MEDIUM"),
    ("private_key_begin",     r"-----BEGIN (RSA |EC )?PRIVATE KEY-----",               "CRITICAL"),
    ("aws_access_key",        r"AKIA[0-9A-Z]{16}",                                    "CRITICAL"),
]

# ── File extensions to scan ──────────────────────────────────────────────────
EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".py", ".env", ".json", ".yml", ".yaml", ".toml"}
SKIP_DIRS  = {"node_modules", ".git", ".expo", "dist", "build", ".vercel", "automated_test"}

def ts_now():
    return datetime.now(timezone.utc).isoformat()

def scan_file(filepath: Path):
    try:
        text = filepath.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return []

    hits = []
    for line_no, line in enumerate(text.splitlines(), 1):
        for pat_name, pattern, severity in SECRET_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                # Redact the actual secret value before storing
                redacted = re.sub(pattern, f"[REDACTED:{pat_name}]", line, flags=re.IGNORECASE).strip()
                hits.append({
                    "file": str(filepath),
                    "line": line_no,
                    "pattern": pat_name,
                    "severity": severity,
                    "redacted_line": redacted[:200],
                })
    return hits

def run(config):
    records = []
    project_root = Path(__file__).parent.parent  # one level up from automated_test/

    # Explicitly list ONLY the dirs we care about — skip node_modules/dist entirely
    SCAN_DIRS = ["app", "supabase", "components", "hooks", "constants", "scripts", ".github"]
    SCAN_FILES = [".gitignore", "package.json", "vercel.json", "netlify.toml",
                  "eas.json", "app.json", "tsconfig.json"]

    files_to_scan = []
    for d in SCAN_DIRS:
        scan_path = project_root / d
        if scan_path.exists():
            for ext in EXTENSIONS:
                files_to_scan.extend(scan_path.rglob(f"*{ext}"))

    for fname in SCAN_FILES:
        fp = project_root / fname
        if fp.exists():
            files_to_scan.append(fp)

    all_hits = []
    for fpath in files_to_scan:
        hits = scan_file(fpath)
        all_hits.extend(hits)


    if not all_hits:
        r = make_record(
            endpoint="codebase",
            method="SCAN",
            role="static-analysis",
            status=0,
            expected_status=0,
            finding=False,
            severity="INFO",
            response_time_ms=0,
            test_category=CATEGORY,
            note="No hardcoded secrets found in codebase scan.",
        )
        print_result(r)
        records.append(r)
        return records

    # Deduplicate by (file, pattern)
    seen = set()
    for hit in all_hits:
        key = (hit["file"], hit["pattern"], hit["line"])
        if key in seen:
            continue
        seen.add(key)

        rel_path = hit["file"].replace(str(project_root), "").lstrip("/\\")
        note = (
            f"Hardcoded secret [{hit['pattern']}] in {rel_path}:{hit['line']} "
            f"— {hit['redacted_line']}"
        )
        r = {
            "endpoint": f"file://{rel_path}:{hit['line']}",
            "method": "SCAN",
            "role": "static-analysis",
            "status": 0,
            "expected_status": 0,
            "finding": True,
            "severity": hit["severity"],
            "response_time_ms": 0,
            "test_category": CATEGORY,
            "note": note,
            "timestamp": ts_now(),
        }
        print_result(r)
        records.append(r)

    return records
