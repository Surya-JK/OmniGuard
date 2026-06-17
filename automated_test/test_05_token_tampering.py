#!/usr/bin/env python3
"""
CATEGORY 5 — Token Tampering
==============================
Creates structurally valid JWTs with flipped claims (role, sub, exp)
but WITHOUT a valid signature.  The server MUST reject them (4xx).
A 2xx response means the server is not verifying JWT signatures.
"""
import base64, json, time
from dast_helpers import req, auth_headers, make_record, print_result, fn_url, rest_url

CATEGORY = "token_tampering"

def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    if pad != 4:
        s += "=" * pad
    return base64.urlsafe_b64decode(s)

def forge_jwt(header_overrides=None, payload_overrides=None, fake_sig="FORGED_SIG"):
    """Build a JWT with arbitrary claims but a fake/no signature."""
    header = {"alg": "HS256", "typ": "JWT"}
    if header_overrides:
        header.update(header_overrides)

    payload = {
        "sub": "00000000-0000-0000-0000-000000000001",
        "role": "authenticated",
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
        "iss": "https://yeelfddemddlqktiqhjr.supabase.co/auth/v1",
        "aud": "authenticated",
    }
    if payload_overrides:
        payload.update(payload_overrides)

    h = b64url_encode(json.dumps(header).encode())
    p = b64url_encode(json.dumps(payload).encode())
    s = b64url_encode(fake_sig.encode() if isinstance(fake_sig, str) else fake_sig)
    return f"{h}.{p}.{s}"

TAMPERED_TOKENS = {
    "role_escalation_service_role": forge_jwt(payload_overrides={"role": "service_role"}),
    "role_escalation_postgres":     forge_jwt(payload_overrides={"role": "postgres"}),
    "alg_none":                     forge_jwt(header_overrides={"alg": "none"}, fake_sig=""),
    "exp_far_future":               forge_jwt(payload_overrides={"exp": 9999999999}),
    "sub_admin":                    forge_jwt(payload_overrides={"sub": "00000000-0000-0000-0000-000000000000", "email": "admin@supabase.io"}),
    "empty_sig":                    forge_jwt(fake_sig=""),
}

ENDPOINTS_TO_TEST = [
    ("POST", "fn:analyze-threat", {"text": "tamper test"}),
    ("GET",  "rest:user_vaults",  None),
    ("GET",  "rest:profiles",     None),
]

def run(config):
    base_url = config["baseUrl"]
    anon_key = config["anonKey"]
    records  = []

    for token_label, token in TAMPERED_TOKENS.items():
        for (method, ep_key, body) in ENDPOINTS_TO_TEST:
            if ep_key.startswith("fn:"):
                url = fn_url(base_url, ep_key[3:])
            else:
                url = rest_url(base_url, ep_key[5:])

            hdrs = auth_headers(anon_key, jwt=token)
            status, elapsed, _ = req(method, url, headers=hdrs, json_body=body)

            is_finding = (200 <= status < 300)
            r = make_record(
                endpoint=url,
                method=method,
                role=f"tampered/{token_label}",
                status=status,
                expected_status=401,
                finding=is_finding,
                severity="CRITICAL" if is_finding else "INFO",
                response_time_ms=elapsed,
                test_category=CATEGORY,
                note=(
                    f"CRITICAL: Server accepted tampered JWT ({token_label}) — signature NOT verified!"
                    if is_finding
                    else f"Tampered token '{token_label}' correctly rejected ({status})"
                ),
            )
            print_result(r)
            records.append(r)

    return records
