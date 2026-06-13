import pandas as pd
import os

excel_path = 'reports/OmniGuard_Combined_Test_Report.xlsx'
df_summary = pd.read_excel(excel_path, sheet_name='Summary')
df_details = pd.read_excel(excel_path, sheet_name='Test Details')

os.makedirs('report-build', exist_ok=True)

html_template = f"""
<!DOCTYPE html>
<html>
<head>
    <title>OmniGuard Combined Test Report</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0B1120;
            color: #E5E5EA;
            padding: 40px;
        }}
        h1, h2 {{
            color: #00F0FF;
            text-align: center;
            margin-bottom: 20px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            background-color: #1C1C1E;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            margin-bottom: 50px;
        }}
        th, td {{
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }}
        th {{
            background-color: rgba(28, 28, 30, 0.95);
            color: #8E8E93;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        tr:hover {{
            background-color: rgba(255,255,255,0.02);
        }}
        .status-PASSED {{
            color: #00FF9D !important;
            font-weight: bold;
        }}
        .status-FAILED {{
            color: #EF4444 !important;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <h1>OmniGuard Automated Test Report</h1>
    
    <h2>Summary</h2>
    {df_summary.to_html(index=False, escape=False, classes='table')}
    
    <h2>Test Details</h2>
    {df_details.to_html(index=False, escape=False, classes='table')}
    
    <script>
        document.querySelectorAll('td').forEach(td => {{
            const text = td.innerText.trim();
            if(text === 'PASSED') td.classList.add('status-PASSED');
            if(text === 'FAILED') td.classList.add('status-FAILED');
        }});
    </script>
</body>
</html>
"""

with open('report-build/index.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

print("Successfully converted Excel to HTML in report-build/index.html")
