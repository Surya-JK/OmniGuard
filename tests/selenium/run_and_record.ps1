# Start Python screen recorder in background
$RecorderJob = Start-Job {
    python c:\Users\phalg\OmniGuard\tests\selenium\record_tests.py
}

Write-Host "Started screen recorder (Job ID: $($RecorderJob.Id)). Waiting 3 seconds..."
Start-Sleep -Seconds 3

# Run Selenium Tests (Login and Home)
Write-Host "Triggering Selenium test suite..."
$env:OMNIGUARD_WEB_URL="http://localhost:8081"
Set-Location c:\Users\phalg\OmniGuard\tests\selenium

# Run tests
npm run test:login
npm run test:home

Write-Host "Tests complete. Sending stop signal to recorder..."
New-Item -Path .\stop.txt -ItemType File -Force | Out-Null

Write-Host "Waiting 3 seconds for video file to finalize..."
Start-Sleep -Seconds 3

Write-Host "Recording finalized! You can view the video at tests/selenium/reports/OmniGuard_Test_Recording.avi"
