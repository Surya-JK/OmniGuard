#!/usr/bin/env python3
"""
CATEGORY 2 — Authorization / Privilege Escalation
===================================================
Tests that a low-privilege (anon) token cannot reach
higher-privilege endpoints (service-role only, admin-only).
Also tests that the hardcoded bypass credentials work (finding!).
"""
import json
from dast_helpers import req, auth_headers, make_record, print_result, fn_url, rest_url, auth_url

CATEGORY = "authz_privesc"

PRIVILEGED_ENDPOINTS = [
    # Supabase admin endpoints (normally service-role only)
    ("GET",  "rest:profiles",          None,  "admin-data"),
    ("GET",  "rest:payload_logs",      None,  "admin-data"),
    ("GET",  "rest:training_data",     None,  "admin-data"),
    ("POST", "rest:scammers",          {"upi_id": "dast-test-probe@ybl"}, "write-scammers"),
    ("POST", "rest:training_data",     {"payload_type": "DAST_PROBE", "raw_payload": "test"}, "write-training"),
]

def run(config):
    base_url = config["baseUrl"]
    anon_key = config["anonKey"]
    user_jwt = config.get("userToken")
    records  = []

    # 1. Anon-only (no JWT) accessing privileged REST tables
    for (method, ep_key, body, label) in PRIVILEGED_ENDPOINTS:
        url = rest_url(base_url, ep_key[5:])
        hdrs = auth_headers(anon_key, jwt=None)
        status, elapsed, _ = req(method, url, headers=hdrs, json_body=body)
        is_finding = (200 <= status < 300)
        r = make_record(
            endpoint=url,
            method=method,
            role="anon",
            status=status,
            expected_status=401,
            finding=is_finding,
            severity="HIGH" if is_finding else "INFO",
            response_time_ms=elapsed,
            test_category=CATEGORY,
            note=f"Anon accessing {label}: {'EXPOSED — no auth required' if is_finding else f'Correctly blocked ({status})'}",
        )
        print_result(r)
        records.append(r)

    # 2. Test hardcoded bypass credentials (CRITICAL finding if login succeeds)
    bypass_url = auth_url(base_url, "/token?grant_type=password")
    bypass_body = {
        "email": config.get("bypassCredentials", {}).get("email", "testuser@omniguard.dev"),
        "password": config.get("bypassCredentials", {}).get("password", "TestPass123!"),
    }
    status, elapsed, resp_text = req("POST", bypass_url,
                                     headers=auth_headers(anon_key),
                                     json_body=bypass_body)
    bypass_works = (200 <= status < 300)
    try:
        resp_json = json.loads(resp_text)
        got_token = bool(resp_json.get("access_token"))
    except Exception:
        got_token = False

    r = make_record(
        endpoint=bypass_url,
        method="POST",
        role="hardcoded_bypass",
        status=status,
        expected_status=400,
        finding=bypass_works or got_token,
        severity="CRITICAL" if (bypass_works or got_token) else "INFO",
        response_time_ms=elapsed,
        test_category=CATEGORY,
        note=(
            "CRITICAL: Hardcoded dev credentials (testuser@omniguard.dev / TestPass123!) are ACTIVE "
            "in production — login succeeded and returned a real session token!"
            if (bypass_works or got_token)
            else "Hardcoded bypass credentials rejected by Supabase auth (credentials not seeded in prod DB)"
        ),
    )
    print_result(r)
    records.append(r)

    # Save the bypass token for downstream tests if it worked
    if got_token:
        try:
            resp_json = json.loads(resp_text)
            # Write to a temp file for other test modules to optionally use
            import pathlib
            tok_file = pathlib.Path(__file__).parent / "_bypass_token.json"
            tok_file.write_text(json.dumps({"access_token": resp_json.get("access_token")}))
        except Exception:
            pass

    return records
