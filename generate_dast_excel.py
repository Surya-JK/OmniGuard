import json
import pandas as pd
from pathlib import Path

def main():
    report_json_path = Path("automated_test/report.json")
    output_excel_path = Path("reports/OmniGuard_DAST_Test_Report_v2.xlsx")

    if not report_json_path.exists():
        print(f"Error: {report_json_path} does not exist. Please run the DAST tests first.")
        return

    print("Reading DAST results from JSON...")
    with open(report_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Convert to pandas DataFrame
    df = pd.DataFrame(data)

    # Reorder/rename columns for readability
    column_mapping = {
        "test_category": "Category",
        "method": "Method",
        "endpoint": "Endpoint",
        "role": "Test Role",
        "status": "Response Status",
        "expected_status": "Expected Status",
        "finding": "Vulnerability Found",
        "severity": "Severity",
        "note": "Description/Note",
        "response_time_ms": "Response Time (ms)"
    }
    
    # Select and rename columns
    df = df[[col for col in column_mapping.keys() if col in df.columns]]
    df = df.rename(columns=column_mapping)

    # Ensure output directory exists
    output_excel_path.parent.mkdir(parents=True, exist_ok=True)

    # Save to Excel
    print(f"Saving DAST report to {output_excel_path}...")
    with pd.ExcelWriter(output_excel_path, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name="DAST Findings", index=False)
        
        # Access the workbook to apply basic styling
        workbook = writer.book
        worksheet = writer.sheets["DAST Findings"]
        
        # Auto-fit columns
        for col in worksheet.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = col[0].column_letter
            worksheet.column_dimensions[col_letter].width = max(max_len + 3, 10)

    print("Successfully generated Excel report!")

if __name__ == "__main__":
    main()
