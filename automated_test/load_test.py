#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OmniGuard DAST Load Test Runner
===============================
Simulates 100 concurrent virtual users continuously for 1 minute.
Saves metrics (RPS, Min/Max/Avg Response Time, Success Rate) to an Excel report.
"""
import os
import sys
import json
import time
import pandas as pd
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

def load_config():
    config_path = Path(__file__).parent / "input.json"
    if not config_path.exists():
        print(f"Error: {config_path} does not exist.")
        sys.exit(1)
    with open(config_path) as f:
        return json.load(f)

def run_load_test():
    config = load_config()
    base_url = config["baseUrl"]
    anon_key = config["anonKey"]
    target_url = f"{base_url}/rest/v1/scammers"

    print("\n" + "="*60)
    print("  STARTING BACKEND BASELINE LOAD TESTING")
    print("="*60)
    print(f"Target URL:        {target_url}")
    print("Virtual Users:     100")
    print("Duration:          60 seconds")
    print("-"*60)

    results = []
    stop_time = time.time() + 60.0
    headers = {
        "apikey": anon_key,
        "Content-Type": "application/json"
    }

    def worker_loop(worker_id):
        worker_results = []
        while time.time() < stop_time:
            t0 = time.perf_counter()
            try:
                # Use a short timeout of 5 seconds for load testing
                resp = requests.get(target_url, headers=headers, timeout=5)
                elapsed = (time.perf_counter() - t0) * 1000.0
                worker_results.append({
                    "timestamp": time.time(),
                    "status_code": resp.status_code,
                    "elapsed_ms": elapsed,
                    "success": (200 <= resp.status_code < 300)
                })
            except Exception as e:
                elapsed = (time.perf_counter() - t0) * 1000.0
                worker_results.append({
                    "timestamp": time.time(),
                    "status_code": -1,
                    "elapsed_ms": elapsed,
                    "success": False
                })
        return worker_results

    # Spawn 100 concurrent threads
    with ThreadPoolExecutor(max_workers=100) as executor:
        futures = [executor.submit(worker_loop, i) for i in range(100)]
        for fut in as_completed(futures):
            results.extend(fut.result())

    # ── CALCULATE METRICS ────────────────────────────────────────────────────
    total_requests = len(results)
    if total_requests == 0:
        print("Error: No requests completed successfully.")
        return

    df = pd.DataFrame(results)
    successful_requests = df[df["success"]].shape[0]
    success_rate = (successful_requests / total_requests) * 100.0

    # Calculate exact duration of the test run
    min_time = df["timestamp"].min()
    max_time = df["timestamp"].max()
    test_duration_secs = max_time - min_time if max_time > min_time else 60.0
    rps = total_requests / test_duration_secs

    # Response times
    avg_resp = df["elapsed_ms"].mean()
    min_resp = df["elapsed_ms"].min()
    max_resp = df["elapsed_ms"].max()

    print("\n" + "="*60)
    print("  LOAD TEST RESULTS SUMMARY")
    print("="*60)
    print(f"Total Requests Sent: {total_requests}")
    print(f"Test Duration:       {test_duration_secs:.2f} seconds")
    print(f"Requests per Second: {rps:.2f} RPS")
    print(f"Success Rate:        {success_rate:.2f}%")
    print("-"*60)
    print(f"Response Times:")
    print(f"  • Average:         {avg_resp:.2f} ms")
    print(f"  • Minimum:         {min_resp:.2f} ms")
    print(f"  • Maximum:         {max_resp:.2f} ms")
    print("="*60 + "\n")

    # ── GENERATE EXCEL REPORT ────────────────────────────────────────────────
    report_data = {
        "Metric": [
            "Total Requests Sent",
            "Successful Requests",
            "Success Rate (%)",
            "Requests per Second (RPS)",
            "Average Response Time (ms)",
            "Minimum Response Time (ms)",
            "Maximum Response Time (ms)",
            "Target Endpoint",
            "Concurrent Virtual Users",
            "Configured Duration (s)"
        ],
        "Value": [
            total_requests,
            successful_requests,
            f"{success_rate:.2f}%",
            f"{rps:.2f} RPS",
            f"{avg_resp:.2f} ms",
            f"{min_resp:.2f} ms",
            f"{max_resp:.2f} ms",
            target_url,
            100,
            60
        ]
    }

    df_metrics = pd.DataFrame(report_data)
    
    # Also save raw request logs as a secondary sheet for transparency
    df_raw = df.rename(columns={
        "timestamp": "Timestamp (Unix)",
        "status_code": "HTTP Status",
        "elapsed_ms": "Response Time (ms)",
        "success": "Success Status"
    })

    output_dir = Path(__file__).parent.parent / "reports"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_excel = output_dir / "OmniGuard_Load_Test_Report.xlsx"

    print(f"Saving load test report to {output_excel}...")
    with pd.ExcelWriter(output_excel, engine="openpyxl") as writer:
        df_metrics.to_excel(writer, sheet_name="Load Test Summary", index=False)
        df_raw.to_excel(writer, sheet_name="Raw Response Logs", index=False)

        # Style worksheets
        workbook = writer.book
        for sheet_name in ["Load Test Summary", "Raw Response Logs"]:
            worksheet = writer.sheets[sheet_name]
            for col in worksheet.columns:
                max_len = max(len(str(cell.value or '')) for cell in col)
                col_letter = col[0].column_letter
                worksheet.column_dimensions[col_letter].width = max(max_len + 3, 10)

    print("Load test excel generation successful!")

if __name__ == "__main__":
    run_load_test()
