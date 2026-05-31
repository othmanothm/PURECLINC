# Quick local API test (requires server on :5000, MySQL up, two patient JWTs).
# Usage: set $patientAToken and $patientBToken from login responses, then run.

$base = "http://localhost:5000/api"
$body = @{
  doctorId = 1
  appointmentDate = "2026-12-15"
  appointmentTime = "12:00"
  treatmentCategory = "skin"
} | ConvertTo-Json

Write-Host "POST /appointments as Patient B (expect 409 if slot taken)..."
# Invoke-RestMethod -Uri "$base/appointments" -Method POST -Headers @{ Authorization = "Bearer $patientBToken" } -Body $body -ContentType "application/json"
