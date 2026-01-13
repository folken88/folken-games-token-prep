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
 * @param {number} zoomAdjustment - Zoom adjustment factor (1.0 = default, >1.0 = zoom in, <1.0 = zoom out)
 * @param {Object} cropOffset - Manual crop offset {x: number, y: number} for dragging
 * @returns {Object} Token data with canvas
 */
export function createToken(image, faceData, colorScheme, zoomAdjustment = 1.0, cropOffset = {x: 0, y: 0}) {
    const tokenSize = 512; // Standard token size
    const borderWidth = 8;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = tokenSize;
    canvas.height = tokenSize;
    
    // Calculate crop area centered on face with zoom adjustment and offset
    const cropData = calculateCropArea(image, faceData, tokenSize - (borderWidth * 2), zoomAdjustment, cropOffset);
    
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
        colorScheme,
        zoomAdjustment,
        cropOffset,
        cropData // Include crop data for drag calculations
    };
}

/**
 * Calculate crop area using eye distance and nose position for smart cropping
 * @param {HTMLImageElement} image - Source image
 * @param {Object} faceData - Face detection data with landmarks
 * @param {number} targetSize - Target size for the cropped area
 * @param {number} zoomAdjustment - Zoom adjustment factor (1.0 = default, >1.0 = zoom in, <1.0 = zoom out)
 * @param {Object} cropOffset - Manual offset for dragging {x: number, y: number}
 * @returns {Object} Crop coordinates and dimensions
 */
function calculateCropArea(image, faceData, targetSize, zoomAdjustment = 1.0, cropOffset = {x: 0, y: 0}) {
    // Use eye distance to calculate proper crop size
    // Standard interpupillary distance is about 60-65mm, but we'll use it as a reference
    // For token cropping, we want the eye distance to be about 15-20% of the crop width
    // This ensures the face is properly sized with room for head/hair
    
    let cropWidth, cropHeight;
    let centerX, centerY;
    
    if (faceData.eyeDistance && faceData.noseTip) {
        // Smart cropping based on eye distance
        // Target: eye distance should be ~25% of crop width for tighter, better framing
        // Users typically adjust to 135-146%, so we'll make default tighter
        const targetEyeDistanceRatio = 0.25;
        
        // Add padding for head/hair/ears
        // Based on eye distance, calculate how much space we need
        // Reduced multipliers to match user preference (they zoom to ~140% on average)
        // This makes default crop about 1.4x tighter
        const headWidthMultiplier = 3.2;  // Includes ears (reduced from 4.5)
        const headHeightMultiplier = 4.6;  // Includes hair above and chin below (reduced from 6.5)
        
        cropWidth = faceData.eyeDistance * headWidthMultiplier;
        cropHeight = faceData.eyeDistance * headHeightMultiplier;
        
        // Ensure square aspect ratio
        if (cropWidth > cropHeight) {
            cropHeight = cropWidth;
        } else {
            cropWidth = cropHeight;
        }
        
        // Center on nose tip (better than face box center)
        centerX = faceData.noseTip.x;
        // Position nose at ~42% from top to leave room for hair
        const nosePositionFromTop = cropHeight * 0.42;
        centerY = faceData.noseTip.y + nosePositionFromTop - (cropHeight / 2);
    } else {
        // Fallback to face box method if landmarks not available
        const faceCenterX = faceData.x + faceData.width / 2;
        const faceTop = faceData.y;
        
        const expandUp = faceData.height * 3.5;
        const expandDown = faceData.height * 0.3;
        const expandLeft = faceData.width * 1.2;
        const expandRight = faceData.width * 1.2;
        
        const desiredHeight = expandUp + faceData.height + expandDown;
        const desiredWidth = expandLeft + faceData.width + expandRight;
        
        if (desiredWidth > desiredHeight) {
            cropWidth = desiredWidth;
            cropHeight = cropWidth;
        } else {
            cropHeight = desiredHeight;
            cropWidth = cropHeight;
        }
        
        centerX = faceCenterX;
        const facePositionFromTop = cropHeight * 0.40;
        centerY = faceTop - facePositionFromTop + (cropHeight / 2);
    }
    
    // Apply zoom adjustment
    cropWidth = cropWidth / zoomAdjustment;
    cropHeight = cropHeight / zoomAdjustment;
    
    // Apply manual offset from dragging
    centerX += cropOffset.x;
    centerY += cropOffset.y;
    
    // Calculate crop position
    let cropX = centerX - cropWidth / 2;
    let cropY = centerY - cropHeight / 2;
    
    // Ensure we don't go outside image bounds
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
