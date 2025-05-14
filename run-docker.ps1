# Make sure Docker is running
Write-Host "Checking if Docker is running..." -ForegroundColor Cyan
try {
    docker info | Out-Null
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "No .env file found. Creating one from example..." -ForegroundColor Yellow
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "Please edit .env with your API keys and try again." -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "No .env.example file found. Please create a .env file with your API keys." -ForegroundColor Red
        exit 1
    }
}

# Build and start the containers in detached mode
Write-Host "Building and starting Docker containers..." -ForegroundColor Cyan
docker-compose up -d --build

Write-Host "🚀 Invoice AI is running at http://localhost:3000" -ForegroundColor Green
Write-Host "To view logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "To stop: docker-compose down" -ForegroundColor Gray 