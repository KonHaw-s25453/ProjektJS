Write-Host "Running setup: installing root and frontend dependencies"

# Install root dependencies
Write-Host "Installing root dependencies..."
npm install

# Install frontend dependencies
Write-Host "Installing frontend dependencies (frontend/)..."
cd frontend
npm install

Write-Host "Setup finished. To start in dev: npm run dev (runs server-next.js)"
