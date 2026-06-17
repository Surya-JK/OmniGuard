#!/usr/bin/env python3
"""
CATEGORY 1 — Authentication Bypass
===================================
Tests protected endpoints without a token, with a malformed token,
and with an expired/fake JWT.  A 2xx response is a finding.
"""
from dast_helpers import req, auth_headers, make_record, print_result, fn_url, rest_url, auth_url

CATEGORY = "authn_bypass"

# Tokens that should FAIL authentication
BAD_TOKENS = {
    "no_token":       None,
    "malformed":      "not.a.jwt",
    "expired_fake":   (
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        ".eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImV4cCI6MTYwMDAwMDAwMH0"
        ".INVALIDSIGNATURE"
    ),
}

PROTECTED_ENDPOINTS = [
    # (method, url_key, body)
    ("POST", "fn:analyze-threat", {"text": "test payload"}),
    ("POST", "fn:chat",           {"messages": [{"role": "user", "content": "hello"}]}),
    ("GET",  "rest:profiles",     None),
    ("GET",  "rest:user_vaults",  None),
    ("GET",  "rest:payload_logs", None),
    ("GET",  "rest:training_data",None),
    ("GET",  "auth:/user",        None),
]

def run(config):
    base_url  = config["baseUrl"]
    anon_key  = config["anonKey"]
    records   = []

    for token_label, token_value in BAD_TOKENS.items():
        for (method, ep_key, body) in PROTECTED_ENDPOINTS:
            # Resolve URL
            if ep_key.startswith("fn:"):
                url = fn_url(base_url, ep_key[3:])
            elif ep_key.startswith("rest:"):
                url = rest_url(base_url, ep_key[5:])
            else:
                url = auth_url(base_url, ep_key[5:])

            hdrs = auth_headers(anon_key, jwt=token_value)
            status, elapsed, body_text = req(method, url, headers=hdrs, json_body=body)

            is_finding = (200 <= status < 300)
            severity   = "CRITICAL" if is_finding else "INFO"
            note = (
                f"AuthN bypass: {token_label} token returned {status} — endpoint is UNPROTECTED"
                if is_finding
                else f"Correctly rejected ({status}) for {token_label}"
            )
            r = make_record(
                endpoint=url,
                method=method,
                role=f"unauthenticated/{token_label}",
                status=status,
                expected_status=401,
                finding=is_finding,
                severity=severity,
                response_time_ms=elapsed,
                test_category=CATEGORY,
                note=note,
            )
            print_result(r)
            records.append(r)

    return records
