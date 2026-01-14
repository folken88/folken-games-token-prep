# Changelog

## [Unreleased]

### Added
- **Filename-based downloads**: Downloaded tokens now use the format `token_<original-filename>.png` instead of just `token.png`
- **Drag-to-replace**: You can now drag a new image directly onto the preview area to replace the current token without clicking "Process Another"
- **Border thickness toggle**: Added ability to switch between thin (8px) and thick (16px) borders via a toggle button in the texture swatches area
- **Compact UI indicator**: Added subtle hint text below the canvas showing "Drag to reposition • Scroll to zoom"
- **Tokens created counter**: Adds a global persistent counter (shared across users) that increments only when you download a token

### Changed
- **Layout optimization**: Color swatches are now vertical on the left, texture swatches (including thickness toggle) are vertical on the right, saving vertical space
- **Removed "Preview" heading**: Removed the "Preview" heading to save vertical space
- **Removed duplicate hint text**: Removed redundant "Click and drag to reposition" text that was below the preview area
- **Branding/theme**: Updated header to use `logo_tkn8r.png` with the name **TKN8R** and a black/gold “Norse” glass UI theme

### Technical
- Updated `createToken()` function to accept `borderWidth` from `borderOptions`
- Added border thickness state management to `currentBorderOptions`
- Improved drag-and-drop handling to support dropping new images on preview area
- Enhanced filename sanitization for safe download filenames
- Added backend API (`/api/tokens/*`) with persisted storage in `tokens.json` (Docker volume)
