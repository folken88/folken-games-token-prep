# How to Run Folken Games Token Prep

## Important: You Must Use a Local Server

This app uses ES6 modules which require HTTP/HTTPS protocol. Opening `index.html` directly (file://) will cause CORS errors.

## Quick Start

### Option 1: Using npm (Recommended)

1. Install dependencies (if you haven't already):
   ```powershell
   npm install
   ```

2. Start the local server:
   ```powershell
   npm start
   ```
   Or use `npm run dev` to automatically open in your browser.

3. If using `npm start`, manually open your browser and go to: `http://localhost:8080`

### Option 2: Using Python (if you have Python installed)

1. Navigate to the project folder in PowerShell
2. Run:
   ```powershell
   python -m http.server 8080
   ```
3. Open your browser and go to: `http://localhost:8080`

### Option 3: Using VS Code Live Server

If you use VS Code:
1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Troubleshooting

- **CORS Error**: Make sure you're accessing via `http://localhost:8080` not `file://`
- **Port Already in Use**: Change the port in the command (e.g., `8081` instead of `8080`)
- **Face Detection Not Working**: Ensure you have an internet connection (models load from CDN on first use)
