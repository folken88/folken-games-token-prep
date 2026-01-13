/**
 * Token Generator Module
 * Creates the final token image with border and proper cropping
 */

import { generateBorder, colorToCSS } from './colorUtils.js';

/**
 * Create a token from an image with face detection and color-based border
 * @param {HTMLImageElement} image - Source image
 * @param {Object} faceData - Face detection data
 * @param {Object} colorScheme - Color scheme object
 * @returns {Object} Token data with canvas
 */
export function createToken(image, faceData, colorScheme) {
    const tokenSize = 512; // Standard token size
    const borderWidth = 8;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = tokenSize;
    canvas.height = tokenSize;
    
    // Calculate crop area centered on face
    const cropData = calculateCropArea(image, faceData, tokenSize - (borderWidth * 2));
    
    // Draw border background (circular)
    drawCircularBorder(ctx, tokenSize, borderWidth, colorScheme);
    
    // Create clipping path for circular token
    ctx.save();
    ctx.beginPath();
    ctx.arc(tokenSize / 2, tokenSize / 2, (tokenSize - borderWidth * 2) / 2, 0, Math.PI * 2);
    ctx.clip();
    
    // Draw the cropped image
    const imageX = borderWidth;
    const imageY = borderWidth;
    const imageSize = tokenSize - (borderWidth * 2);
    
    ctx.drawImage(
        image,
        cropData.x, cropData.y, cropData.width, cropData.height,
        imageX, imageY, imageSize, imageSize
    );
    
    ctx.restore();
    
    return {
        canvas,
        image,
        faceData,
        colorScheme
    };
}

/**
 * Calculate crop area centered on face
 * @param {HTMLImageElement} image - Source image
 * @param {Object} faceData - Face detection data
 * @param {number} targetSize - Target size for the cropped area
 * @returns {Object} Crop coordinates and dimensions
 */
function calculateCropArea(image, faceData, targetSize) {
    // Center the crop on the face
    const faceCenterX = faceData.x + faceData.width / 2;
    const faceCenterY = faceData.y + faceData.height / 2;
    
    // Calculate aspect ratio
    const imageAspect = image.width / image.height;
    const targetAspect = 1; // Square for tokens
    
    let cropWidth, cropHeight;
    
    if (imageAspect > targetAspect) {
        // Image is wider than target
        cropHeight = image.height;
        cropWidth = cropHeight * targetAspect;
    } else {
        // Image is taller than target
        cropWidth = image.width;
        cropHeight = cropWidth / targetAspect;
    }
    
    // Scale to target size (maintain aspect ratio, then scale)
    const scale = Math.max(cropWidth / targetSize, cropHeight / targetSize);
    cropWidth = cropWidth / scale;
    cropHeight = cropHeight / scale;
    
    // Ensure we don't go outside image bounds
    let cropX = faceCenterX - cropWidth / 2;
    let cropY = faceCenterY - cropHeight / 2;
    
    // Adjust if out of bounds
    if (cropX < 0) cropX = 0;
    if (cropY < 0) cropY = 0;
    if (cropX + cropWidth > image.width) cropX = image.width - cropWidth;
    if (cropY + cropHeight > image.height) cropY = image.height - cropHeight;
    
    // Final adjustment: ensure we have valid dimensions
    cropWidth = Math.min(cropWidth, image.width - cropX);
    cropHeight = Math.min(cropHeight, image.height - cropY);
    
    return {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight
    };
}

/**
 * Draw circular border with gradient
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} size - Canvas size
 * @param {number} borderWidth - Border width
 * @param {Object} colorScheme - Color scheme
 */
function drawCircularBorder(ctx, size, borderWidth, colorScheme) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // Draw outer circle (background)
    ctx.fillStyle = colorToCSS(colorScheme.border);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw gradient border
    const gradient = ctx.createRadialGradient(
        centerX, centerY, radius - borderWidth,
        centerX, centerY, radius
    );
    
    gradient.addColorStop(0, colorToCSS(colorScheme.primary));
    gradient.addColorStop(0.5, colorToCSS(colorScheme.secondary));
    gradient.addColorStop(1, colorToCSS(colorScheme.accent));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw inner circle to create border effect
    ctx.fillStyle = 'transparent';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - borderWidth, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
}
