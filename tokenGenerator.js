/**
 * Token Generator Module
 * Creates the final token image with border and proper cropping
 */

import { generateBorder, colorToCSS } from './colorUtils.js';
import { getTextureDefinition, BORDER_TEXTURES } from './borderStyles.js?v=1.5';

/**
 * Create a token from an image with face detection and color-based border
 * @param {HTMLImageElement} image - Source image
 * @param {Object} faceData - Face detection data
 * @param {Object} colorScheme - Color scheme object
 * @param {number} zoomAdjustment - Zoom adjustment factor (1.0 = default, >1.0 = zoom in, <1.0 = zoom out)
 * @param {Object} cropOffset - Manual crop offset {x: number, y: number} for dragging
 * @param {Object} borderOptions - Border customization options {texture: string, customColor: {r, g, b}}
 * @returns {Object} Token data with canvas
 */
export function createToken(image, faceData, colorScheme, zoomAdjustment = 1.0, cropOffset = {x: 0, y: 0}, borderOptions = null) {
    const tokenSize = 512; // Standard token size
    const borderWidth = borderOptions?.borderWidth || 8; // Default to 8 (thin), can be 16 (thick)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = tokenSize;
    canvas.height = tokenSize;
    
    // Calculate crop area centered on face with zoom adjustment and offset
    const cropData = calculateCropArea(image, faceData, tokenSize - (borderWidth * 2), zoomAdjustment, cropOffset);
    
    // Prepare border colors (use custom color if provided, otherwise use colorScheme)
    const borderColors = borderOptions?.customColor 
        ? {
            primary: borderOptions.customColor,
            secondary: borderOptions.customColor,
            accent: borderOptions.customColor,
            border: borderOptions.customColor
        }
        : colorScheme;
    
    // Draw border background (circular) with texture
    const textureType = borderOptions?.texture || BORDER_TEXTURES.GRADIENT;
    drawCircularBorder(ctx, tokenSize, borderWidth, borderColors, textureType);
    
    // Create clipping path for circular token
    ctx.save();
    ctx.beginPath();
    ctx.arc(tokenSize / 2, tokenSize / 2, (tokenSize - borderWidth * 2) / 2, 0, Math.PI * 2);
    ctx.clip();
    
    // Draw the cropped image
    const imageX = borderWidth;
    const imageY = borderWidth;
    const imageSize = tokenSize - (borderWidth * 2);
    
    // Handle crop that may extend beyond image bounds
    // Use source coordinates if available, otherwise use regular coordinates
    const sourceX = cropData.sourceX !== undefined ? cropData.sourceX : Math.max(0, cropData.x);
    const sourceY = cropData.sourceY !== undefined ? cropData.sourceY : Math.max(0, cropData.y);
    const sourceWidth = cropData.sourceWidth !== undefined ? cropData.sourceWidth : cropData.width;
    const sourceHeight = cropData.sourceHeight !== undefined ? cropData.sourceHeight : cropData.height;
    
    // Calculate how much of the crop extends beyond image bounds
    const offsetX = cropData.x < 0 ? -cropData.x : 0;
    const offsetY = cropData.y < 0 ? -cropData.y : 0;
    const extendRight = (cropData.x + cropData.width) > image.width ? (cropData.x + cropData.width) - image.width : 0;
    const extendBottom = (cropData.y + cropData.height) > image.height ? (cropData.y + cropData.height) - image.height : 0;
    
    // Fill areas that extend beyond image bounds with transparent/background
    if (offsetX > 0 || offsetY > 0 || extendRight > 0 || extendBottom > 0) {
        // Fill extended areas (will show as transparent or border color)
        ctx.fillStyle = 'transparent';
        ctx.fillRect(imageX, imageY, imageSize, imageSize);
    }
    
    // Draw the actual image portion
    if (sourceWidth > 0 && sourceHeight > 0) {
        // Calculate destination position accounting for offsets
        const destX = imageX + (offsetX / cropData.width) * imageSize;
        const destY = imageY + (offsetY / cropData.height) * imageSize;
        const destWidth = imageSize * (sourceWidth / cropData.width);
        const destHeight = imageSize * (sourceHeight / cropData.height);
        
        ctx.drawImage(
            image,
            sourceX, sourceY, sourceWidth, sourceHeight,
            destX, destY, destWidth, destHeight
        );
    }
    
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
        // Use a smaller initial crop for fallback to allow more zoom-in capability
        const faceCenterX = faceData.x + faceData.width / 2;
        const faceTop = faceData.y;
        
        // Start with a smaller crop area so users can zoom in much more
        // This is especially important when face detection fails and we need to manually adjust
        const expandUp = faceData.height * 2.5;      // Less room above (allows more zoom in)
        const expandDown = faceData.height * 0.3;   // Less room below
        const expandLeft = faceData.width * 1.0;     // Less room on sides
        const expandRight = faceData.width * 1.0;
        
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
    
    // Allow crop to extend beyond image bounds (with clamping) to enable more drag range
    // This allows users to drag the crop further to reach subjects near edges
    const maxOffset = Math.max(cropWidth, cropHeight) * 0.5; // Allow 50% extension beyond bounds
    
    // Clamp to allow some extension beyond bounds for better adjustment range
    if (cropX < -maxOffset) cropX = -maxOffset;
    if (cropY < -maxOffset) cropY = -maxOffset;
    if (cropX + cropWidth > image.width + maxOffset) cropX = image.width + maxOffset - cropWidth;
    if (cropY + cropHeight > image.height + maxOffset) cropY = image.height + maxOffset - cropHeight;
    
    // Final adjustment: ensure we have valid dimensions (but allow some overflow for dragging)
    const actualCropX = Math.max(-maxOffset, Math.min(cropX, image.width + maxOffset - cropWidth));
    const actualCropY = Math.max(-maxOffset, Math.min(cropY, image.height + maxOffset - cropHeight));
    
    // Store the actual crop position (may extend beyond image bounds)
    cropX = actualCropX;
    cropY = actualCropY;
    
    // Calculate the actual source area we'll draw from (clamped to image bounds)
    const sourceX = Math.max(0, cropX);
    const sourceY = Math.max(0, cropY);
    const sourceWidth = Math.min(cropWidth, image.width - sourceX);
    const sourceHeight = Math.min(cropHeight, image.height - sourceY);
    
    // Ensure source dimensions are valid
    const finalSourceWidth = Math.max(0, Math.min(sourceWidth, image.width - sourceX));
    const finalSourceHeight = Math.max(0, Math.min(sourceHeight, image.height - sourceY));
    
    // Return both the logical crop position (for dragging) and the actual source area
    return {
        x: cropX,  // Logical position (may be negative, for dragging calculations)
        y: cropY,  // Logical position (may be negative, for dragging calculations)
        width: cropWidth,
        height: cropHeight,
        sourceX: sourceX,  // Actual source area in image (clamped to bounds)
        sourceY: sourceY,
        sourceWidth: finalSourceWidth,
        sourceHeight: finalSourceHeight
    };
    
    return {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight
    };
}

/**
 * Draw circular border with texture
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} size - Canvas size
 * @param {number} borderWidth - Border width
 * @param {Object} colors - Color scheme or custom colors
 * @param {string} textureType - Texture type from BORDER_TEXTURES
 */
function drawCircularBorder(ctx, size, borderWidth, colors, textureType = BORDER_TEXTURES.GRADIENT) {
    const textureDef = getTextureDefinition(textureType);
    if (textureDef && textureDef.draw) {
        textureDef.draw(ctx, size, borderWidth, colors);
    } else {
        // Fallback to gradient
        const fallbackDef = getTextureDefinition(BORDER_TEXTURES.GRADIENT);
        fallbackDef.draw(ctx, size, borderWidth, colors);
    }
}
