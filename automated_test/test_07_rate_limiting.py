#!/usr/bin/env python3
"""
CATEGORY 7 — Rate Limiting
============================
Sends a bounded burst (~30 requests) to each public/semi-public endpoint.
Flags if NO rate limiting is observed (all 200s, no 429 received).
Respects a hard cap of 30 requests per endpoint.
"""
import time
from dast_helpers import req, auth_headers, make_record, print_result, fn_url, rest_url

CATEGORY = "rate_limiting"
BURST_SIZE = 30
BURST_DELAY = 0.1   # 100 ms between requests — ~10 rps

ENDPOINTS = [
    ("POST", "fn:analyze-threat", {"text": "rate limit test payload"}),
    ("POST", "fn:chat",           {"messages": [{"role": "user", "content": "hi"}]}),
]

def run(config):
    base_url = config["baseUrl"]
    anon_key = config["anonKey"]
    records  = []

    for (method, ep_key, body) in ENDPOINTS:
        if ep_key.startswith("fn:"):
            url = fn_url(base_url, ep_key[3:])
        else:
            url = rest_url(base_url, ep_key[5:])

        statuses = []
        rate_limited = False
        first_429_at = None

        print(f"  [BURST] {method} {url} — sending {BURST_SIZE} requests …")
        for i in range(BURST_SIZE):
            hdrs = auth_headers(anon_key)
            status, elapsed, _ = req(method, url, headers=hdrs, json_body=body, timeout=15)
            statuses.append(status)
            if status == 429:
                rate_limited = True
                first_429_at = i + 1
                break
            time.sleep(BURST_DELAY)

        ok_count  = sum(1 for s in statuses if 200 <= s < 300)
        not_found = (200 not in statuses and not rate_limited)
        no_limit  = (not rate_limited and ok_count >= BURST_SIZE - 2)

        is_finding = no_limit and ok_count > 0
        note = (
            f"NO RATE LIMIT detected: {ok_count}/{len(statuses)} succeeded with no 429 after full burst"
            if is_finding
            else f"Rate limit OK — 429 received at request #{first_429_at}" if rate_limited
            else f"Endpoint returned mixed statuses: {set(statuses)}"
        )

        r = make_record(
            endpoint=url,
            method=method,
            role="anon",
            status=statuses[-1] if statuses else -1,
            expected_status=429,
            finding=is_finding,
            severity="MEDIUM" if is_finding else "INFO",
            response_time_ms=0,
            test_category=CATEGORY,
            note=note,
        )
        print_result(r)
        records.append(r)

    return records
