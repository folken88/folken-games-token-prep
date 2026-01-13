/**
 * Color Utilities Module
 * Handles color extraction and border generation based on image color scheme
 */

/**
 * Extract dominant color scheme from an image
 * @param {HTMLImageElement} image - The source image
 * @param {Object} faceData - Face detection data
 * @returns {Object} Color scheme with primary, secondary, and accent colors
 */
export function extractColorScheme(image, faceData) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    
    // Focus on the face area and surrounding region for color extraction
    const padding = Math.max(faceData.width, faceData.height) * 0.3;
    const x = Math.max(0, faceData.x - padding);
    const y = Math.max(0, faceData.y - padding);
    const width = Math.min(canvas.width - x, faceData.width + padding * 2);
    const height = Math.min(canvas.height - y, faceData.height + padding * 2);
    
    // Sample colors from the region
    const imageData = ctx.getImageData(x, y, width, height);
    const colors = extractColorsFromImageData(imageData);
    
    // Calculate dominant colors
    const dominantColors = getDominantColors(colors);
    
    return {
        primary: dominantColors.primary,
        secondary: dominantColors.secondary,
        accent: dominantColors.accent,
        border: adjustBrightness(dominantColors.primary, -0.2) // Darker for border
    };
}

/**
 * Extract color samples from image data
 * @param {ImageData} imageData - Image data to sample
 * @returns {Array} Array of color objects
 */
function extractColorsFromImageData(imageData) {
    const colors = [];
    const data = imageData.data;
    const step = 10; // Sample every 10th pixel for performance
    
    for (let i = 0; i < data.length; i += step * 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Skip transparent pixels
        if (a < 128) continue;
        
        colors.push({ r, g, b });
    }
    
    return colors;
}

/**
 * Get dominant colors from color samples using k-means clustering
 * @param {Array} colors - Array of color objects
 * @returns {Object} Dominant colors
 */
function getDominantColors(colors) {
    if (colors.length === 0) {
        // Default fallback colors
        return {
            primary: { r: 100, g: 100, b: 150 },
            secondary: { r: 150, g: 150, b: 200 },
            accent: { r: 200, g: 200, b: 255 }
        };
    }
    
    // Simple approach: sort by brightness and pick representative colors
    const sorted = colors.sort((a, b) => {
        const brightnessA = (a.r + a.g + a.b) / 3;
        const brightnessB = (b.r + b.g + b.b) / 3;
        return brightnessB - brightnessA;
    });
    
    // Get primary (brightest), secondary (middle), accent (darker)
    const primary = sorted[Math.floor(sorted.length * 0.1)];
    const secondary = sorted[Math.floor(sorted.length * 0.5)];
    const accent = sorted[Math.floor(sorted.length * 0.9)];
    
    return { primary, secondary, accent };
}

/**
 * Adjust brightness of a color
 * @param {Object} color - Color object with r, g, b
 * @param {number} factor - Brightness adjustment factor (-1 to 1)
 * @returns {Object} Adjusted color
 */
function adjustBrightness(color, factor) {
    return {
        r: Math.max(0, Math.min(255, color.r + (255 * factor))),
        g: Math.max(0, Math.min(255, color.g + (255 * factor))),
        b: Math.max(0, Math.min(255, color.b + (255 * factor)))
    };
}

/**
 * Generate border style based on color scheme
 * @param {Object} colorScheme - Color scheme object
 * @returns {Object} Border configuration
 */
export function generateBorder(colorScheme) {
    return {
        width: 8,
        color: colorScheme.border,
        gradient: {
            start: colorScheme.primary,
            end: colorScheme.accent
        },
        style: 'gradient' // 'solid' or 'gradient'
    };
}

/**
 * Convert color object to CSS color string
 * @param {Object} color - Color object with r, g, b
 * @returns {string} CSS color string
 */
export function colorToCSS(color) {
    return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
}
