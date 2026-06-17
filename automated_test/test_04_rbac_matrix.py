#!/usr/bin/env python3
"""
CATEGORY 4 — RBAC Matrix
=========================
Tests each role (anon, authenticated-user) against each endpoint.
Records actual vs expected HTTP status.
"""
from dast_helpers import req, auth_headers, make_record, print_result, fn_url, rest_url

CATEGORY = "rbac_matrix"

# (endpoint_key, method, body, expected_anon, expected_user, label)
MATRIX = [
    # Edge Functions — should require valid JWT (Supabase checks Authorization header)
    ("fn:analyze-threat", "POST", {"text": "hello"}, 401, 200, "AI threat analysis"),
    ("fn:chat",           "POST", {"messages": [{"role":"user","content":"hi"}]}, 401, 200, "AI chat"),

    # REST — scammers is public-read by design? Let's find out
    ("rest:scammers",     "GET",  None,            200, 200, "read scammer DB (public?)"),
    ("rest:scammers",     "POST", {"upi_id": "dast-probe@ybl"}, 401, 401, "write scammers (should block all)"),

    # REST — user-private tables
    ("rest:user_vaults",  "GET",  None,            401, 200, "user vault read"),
    ("rest:profiles",     "GET",  None,            401, 200, "profiles read"),
    ("rest:payload_logs", "GET",  None,            401, 401, "admin payload logs"),
    ("rest:training_data","GET",  None,            401, 401, "admin training data"),
]

def run(config):
    base_url  = config["baseUrl"]
    anon_key  = config["anonKey"]
    user_jwt  = config.get("userToken")
    records   = []

    roles = [("anon", None)]
    if user_jwt and not user_jwt.startswith("__REPLACE"):
        roles.append(("user", user_jwt))

    for (ep_key, method, body, exp_anon, exp_user, label) in MATRIX:
        if ep_key.startswith("fn:"):
            url = fn_url(base_url, ep_key[3:])
        else:
            url = rest_url(base_url, ep_key[5:])

        for (role_label, jwt) in roles:
            expected = exp_anon if role_label == "anon" else exp_user
            hdrs = auth_headers(anon_key, jwt=jwt)
            status, elapsed, _ = req(method, url, headers=hdrs, json_body=body)

            deviation = (status != expected) and not (
                # treat any 4xx as "blocked" for anon expected 401
                expected == 401 and 400 <= status < 500
            )
            is_finding = deviation
            severity = "HIGH" if (is_finding and 200 <= status < 300 and expected >= 400) else \
                       "MEDIUM" if is_finding else "INFO"

            r = make_record(
                endpoint=url,
                method=method,
                role=role_label,
                status=status,
                expected_status=expected,
                finding=is_finding,
                severity=severity,
                response_time_ms=elapsed,
                test_category=CATEGORY,
                note=(
                    f"RBAC deviation on '{label}': expected {expected}, got {status}"
                    if is_finding
                    else f"✓ {label}: {role_label} → {status} (expected {expected})"
                ),
            )
            print_result(r)
            records.append(r)

    return records
