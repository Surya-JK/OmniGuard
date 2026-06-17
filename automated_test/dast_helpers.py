#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DAST Helper: shared HTTP utilities and record builder.
"""
import requests, time, json
from datetime import datetime, timezone

DEFAULT_TIMEOUT = 10
THROTTLE_DELAY = 0.3   # seconds between requests

def ts():
    return datetime.now(timezone.utc).isoformat()

def make_record(endpoint, method, role, status, expected_status,
                finding, severity, response_time_ms, test_category, note):
    return {
        "endpoint": endpoint,
        "method": method,
        "role": role,
        "status": status,
        "expected_status": expected_status,
        "finding": finding,
        "severity": severity,
        "response_time_ms": round(response_time_ms, 2),
        "test_category": test_category,
        "note": note,
        "timestamp": ts(),
    }

def req(method, url, headers=None, json_body=None, params=None, timeout=DEFAULT_TIMEOUT):
    """Execute a request and return (status_code, elapsed_ms, response_text)."""
    try:
        t0 = time.monotonic()
        resp = requests.request(
            method, url,
            headers=headers or {},
            json=json_body,
            params=params,
            timeout=timeout,
            allow_redirects=False,
        )
        elapsed = (time.monotonic() - t0) * 1000
        time.sleep(THROTTLE_DELAY)
        return resp.status_code, elapsed, resp.text
    except requests.exceptions.Timeout:
        return -1, timeout * 1000, "TIMEOUT"
    except requests.exceptions.ConnectionError as e:
        return -2, 0, f"CONNECTION_ERROR: {e}"
    except Exception as e:
        return -3, 0, f"ERROR: {e}"

def auth_headers(anon_key, jwt=None):
    h = {
        "apikey": anon_key,
        "Content-Type": "application/json",
    }
    if jwt:
        h["Authorization"] = f"Bearer {jwt}"
    return h

def fn_url(base_url, fn_name):
    """Build Supabase Edge Function URL."""
    return f"{base_url}/functions/v1/{fn_name}"

def rest_url(base_url, table):
    """Build Supabase REST API URL."""
    return f"{base_url}/rest/v1/{table}"

def auth_url(base_url, path):
    """Build Supabase Auth API URL."""
    return f"{base_url}/auth/v1{path}"

def safe_str(s):
    """Return ASCII-safe string."""
    if isinstance(s, str):
        return s.encode("ascii", errors="replace").decode("ascii")
    return str(s)

def print_result(record):
    icon = "[X]" if record["finding"] else "[OK]"
    sev = f"[{record['severity']}]" if record["finding"] else ""
    note = safe_str(record.get("note", ""))[:100]
    ep   = safe_str(record.get("endpoint", ""))[:50]
    try:
        print(f"  {icon} {record['method']:6s} {ep:50s} {record['status']:>4}  {sev} {note}")
    except Exception:
        pass  # never crash on print
