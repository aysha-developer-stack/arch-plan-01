Write-Host "Installing client dependencies..."
Set-Location client
npm install @radix-ui/themes @radix-ui/react-slot @radix-ui/react-icons

Write-Host "`nInstalling server dependencies..."
Set-Location ..\server
npm install cors @types/cors @types/cookie-parser @types/jsonwebtoken

Write-Host "`nAll dependencies installed successfully!" -ForegroundColor Green
Read-Host -Prompt "Press Enter to exit"
