# TKN8R

An automated web application that transforms images into RPG tokens for FoundryVTT and other tabletop RPG applications. Uses advanced face detection with eye distance and nose positioning to automatically crop the perfect token, then lets you fine-tune with intuitive drag and zoom controls.

## Features

- **Smart Face Detection**: Uses AI-powered face detection with eye distance calculation and nose positioning for accurate cropping
- **Intelligent Auto-Crop**: Automatically calculates optimal crop size based on interpupillary distance to include full head, hair, and ears while excluding shoulders
- **Drag to Reposition**: Click and drag the preview to fine-tune the crop position
- **Mouse Wheel Zoom**: Scroll over the token preview to zoom in/out quickly
- **Zoom Slider**: Precise zoom adjustment from 50% to 150%
- **Smart Color Extraction**: Automatically extracts color schemes from the image to create matching borders
- **Customizable Borders**: Choose from 8 border textures (Solid, Gradient, Metallic, Leather, Wood, Stone, Crystal, Glow) and 12 color swatches (Gold, Silver, Copper, Red, Blue, Green, Purple, Orange, White, Black, Bronze, Platinum)
- **Border Thickness Control**: Toggle between thin (8px) and thick (16px) borders
- **Tokens Created Counter**: Tracks how many tokens you’ve created (increments only when you download)
- **Beautiful Default Borders**: Generates gradient borders that complement the image's color palette by default
- **Drag & Drop Interface**: Simple, intuitive interface - just drag and drop your image
- **High-Quality Output**: Generates 512x512 PNG tokens optimized for tabletop RPG applications
- **Adjustment Tracking**: Records user adjustments for future algorithm improvements
- **Fallback Support**: If face detection fails, intelligently centers on the image's focal point

## How to Use

**⚠️ Important**: This app must be run from a local server (not by opening `index.html` directly) due to browser security restrictions with ES6 modules.

### Option 1: Docker (Recommended)

1. **Build and Run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```
   Then open `http://localhost:5001` in your browser.

2. **Or Build and Run with Docker directly**:
   ```bash
   docker build -t folken-games-token-prep .
   docker run -d -p 5001:80 --name token-prep folken-games-token-prep
   ```
   Then open `http://localhost:5001` in your browser.

3. **To Stop the Container**:
   ```bash
   docker-compose down
   # or
   docker stop token-prep && docker rm token-prep
   ```

### Option 2: npm/Node.js

1. **Start a Local Server**: 
   ```bash
   npm install
   npm start
   ```
   Then open `http://localhost:8080` in your browser.

   **Alternative options**: See `START_HERE.md` for other server options (Python, VS Code Live Server, etc.)

2. **Upload an Image**: 
   - Drag and drop an image onto the upload area, or
   - Click the upload area to browse for a file
   - **Tip**: You can drag a new image onto the preview area to replace the current token without clicking "Process Another"

3. **Automatic Processing**: The app will automatically:
   - Detect the face using eye distance and nose position
   - Calculate optimal crop size to include head, hair, and ears
   - Extract the color scheme
   - Generate a styled token with matching border

4. **Fine-Tune (Optional)**: 
   - **Drag to Reposition**: Click and drag the token preview to adjust the crop position
   - **Scroll to Zoom**: Hover over the token and use your mouse wheel to zoom in/out
   - **Use Slider**: Adjust the zoom slider for precise control (50% = zoom out, 150% = zoom in)
   - **Customize Border**: 
     - Click any color swatch on the left to change the border color
     - Click any texture swatch on the right to change the border texture/style
     - Click the "Thin/Thick" button in the texture swatches to toggle border thickness
     - Use the "Auto" button to reset to auto-detected colors
     - Use the "Default" button to reset to gradient texture

5. **Download Your Token**: Click the "Download Token" button to save your token as a PNG file (download count increments here)

6. **Process Another**: Click "Process Another" to create more tokens

## Technical Details

- **Face Detection**: Powered by face-api.js with 68-point facial landmark detection
- **Smart Cropping**: Uses interpupillary distance (eye spacing) to calculate optimal crop size
- **Nose-Centered Positioning**: Centers crop on nose tip for accurate head positioning
- **Proportional Scaling**: Calculates head dimensions based on eye distance (4.6x height, 3.2x width)
- **Color Analysis**: Extracts dominant colors from the image region around the detected face
- **Canvas Rendering**: Uses HTML5 Canvas for high-quality image processing
- **ES6 Modules**: Modern JavaScript with modular architecture
- **Adjustment Analytics**: Stores user adjustments in localStorage for algorithm improvement

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with ES6 module support

## Requirements

- Modern web browser with JavaScript enabled
- Internet connection (for loading face-api.js models on first use)

## Notes

- The first load may take a moment as face detection models are downloaded
- Works best with images containing clear faces
- Supports common image formats (PNG, JPG, GIF, etc.)

## License

MIT License - Feel free to use and modify for your projects.
