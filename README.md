# Folken Games Token Prep

An automated web application that transforms images into RPG tokens for FoundryVTT and other tabletop RPG applications. Simply drag and drop an image, and the app will automatically detect the face, extract color schemes, and generate a beautifully styled token with a matching border.

## Features

- **Automatic Face Detection**: Uses AI-powered face detection to identify and center on the subject
- **Smart Color Extraction**: Automatically extracts color schemes from the image to create matching borders
- **Beautiful Borders**: Generates gradient borders that complement the image's color palette
- **Drag & Drop Interface**: Simple, intuitive interface - just drag and drop your image
- **High-Quality Output**: Generates 512x512 PNG tokens optimized for tabletop RPG applications
- **Fallback Support**: If face detection fails, intelligently centers on the image's focal point

## How to Use

**⚠️ Important**: This app must be run from a local server (not by opening `index.html` directly) due to browser security restrictions with ES6 modules.

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

3. **Wait for Processing**: The app will automatically:
   - Detect the face in the image
   - Extract the color scheme
   - Generate a styled token with matching border

4. **Download Your Token**: Click the "Download Token" button to save your token as a PNG file

5. **Process Another**: Click "Process Another" to create more tokens

## Technical Details

- **Face Detection**: Powered by face-api.js for accurate face detection
- **Color Analysis**: Extracts dominant colors from the image region around the detected face
- **Canvas Rendering**: Uses HTML5 Canvas for high-quality image processing
- **ES6 Modules**: Modern JavaScript with modular architecture

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
