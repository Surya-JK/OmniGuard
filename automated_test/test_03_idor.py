#!/usr/bin/env python3
"""
CATEGORY 3 — IDOR (Insecure Direct Object Reference)
======================================================
Tries to access another user's vault / profile entries by:
 - Querying REST tables with different user IDs in filters
 - Removing filters entirely to dump all rows (mass-IDOR)
Detection only — no real user data extracted.
"""
from dast_helpers import req, auth_headers, make_record, print_result, rest_url

CATEGORY = "idor"

# Fake / probe UUIDs (not real user data)
PROBE_UIDS = [
    "00000000-0000-0000-0000-000000000001",
    "00000000-0000-0000-0000-000000000002",
    "ffffffff-ffff-ffff-ffff-ffffffffffff",
]

def run(config):
    base_url = config["baseUrl"]
    anon_key = config["anonKey"]
    user_jwt = config.get("userToken")  # may be placeholder
    records  = []

    tables_with_user_id = ["user_vaults", "profiles"]

    for table in tables_with_user_id:
        url = rest_url(base_url, table)

        # 1. No filter — try to dump entire table (mass IDOR)
        for role_label, jwt in [("anon", None), ("user", user_jwt)]:
            if jwt and jwt.startswith("__REPLACE"):
                continue
            hdrs = auth_headers(anon_key, jwt=jwt)
            status, elapsed, resp_text = req("GET", url, headers=hdrs)

            try:
                import json as _json
                data = _json.loads(resp_text)
                row_count = len(data) if isinstance(data, list) else "?"
            except Exception:
                row_count = "?"

            is_finding = (200 <= status < 300)
            note = (
                f"IDOR/mass-dump: {role_label} fetched ALL rows from '{table}' ({row_count} rows returned)"
                if is_finding
                else f"Table '{table}' blocked for {role_label} ({status})"
            )
            r = make_record(
                endpoint=f"{url} (no filter)",
                method="GET",
                role=role_label,
                status=status,
                expected_status=401 if role_label == "anon" else 200,
                finding=is_finding and role_label == "anon",   # finding only if anon gets through
                severity="HIGH" if (is_finding and role_label == "anon") else "INFO",
                response_time_ms=elapsed,
                test_category=CATEGORY,
                note=note,
            )
            print_result(r)
            records.append(r)

        # 2. Probe with specific foreign user_id param
        for probe_uid in PROBE_UIDS:
            hdrs = auth_headers(anon_key, jwt=None)
            params = {"user_id": f"eq.{probe_uid}"}
            status, elapsed, _ = req("GET", url, headers=hdrs, params=params)
            is_finding = (200 <= status < 300)
            r = make_record(
                endpoint=f"{url}?user_id=eq.{probe_uid}",
                method="GET",
                role="anon",
                status=status,
                expected_status=401,
                finding=is_finding,
                severity="HIGH" if is_finding else "INFO",
                response_time_ms=elapsed,
                test_category=CATEGORY,
                note=(
                    f"IDOR: anon accessed rows for user_id={probe_uid} — RLS may be missing"
                    if is_finding
                    else f"Blocked ({status})"
                ),
            )
            print_result(r)
            records.append(r)

    return records
