# Vercel Deployment Script for Feature Branch
# Run this from PowerShell

Write-Host "`n🚀 Deploying Your Feature Branch to Vercel...`n" -ForegroundColor Cyan

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Check if logged in
Write-Host "Checking Vercel login..." -ForegroundColor Cyan
$loggedIn = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Vercel..." -ForegroundColor Yellow
    vercel login
}

# Deploy
Write-Host "`nDeploying to Vercel..." -ForegroundColor Green
vercel --prod

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "Check the URL above to see your deployed app.`n" -ForegroundColor Cyan

