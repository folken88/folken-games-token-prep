/**
 * Border Styles Module
 * Defines available border textures and styles for token customization
 */

import { colorToCSS } from './colorUtils.js';

/**
 * Border texture types
 */
export const BORDER_TEXTURES = {
    SOLID: 'solid',
    GRADIENT: 'gradient',
    METALLIC: 'metallic',
    LEATHER: 'leather',
    WOOD: 'wood',
    STONE: 'stone',
    CRYSTAL: 'crystal',
    GLOW: 'glow'
};

/**
 * Predefined color swatches for quick selection
 */
export const COLOR_SWATCHES = [
    { name: 'Gold', r: 255, g: 215, b: 0 },
    { name: 'Silver', r: 192, g: 192, b: 192 },
    { name: 'Copper', r: 184, g: 115, b: 51 },
    { name: 'Red', r: 220, g: 20, b: 60 },
    { name: 'Blue', r: 30, g: 144, b: 255 },
    { name: 'Green', r: 34, g: 139, b: 34 },
    { name: 'Purple', r: 138, g: 43, b: 226 },
    { name: 'Orange', r: 255, g: 140, b: 0 },
    { name: 'White', r: 255, g: 255, b: 255 },
    { name: 'Black', r: 0, g: 0, b: 0 },
    { name: 'Bronze', r: 205, g: 127, b: 50 },
    { name: 'Platinum', r: 229, g: 228, b: 226 }
];

/**
 * Get texture definition
 * @param {string} textureType - Texture type from BORDER_TEXTURES
 * @returns {Object} Texture configuration
 */
export function getTextureDefinition(textureType) {
    return {
        type: textureType,
        ...TEXTURE_DEFINITIONS[textureType] || TEXTURE_DEFINITIONS[BORDER_TEXTURES.SOLID]
    };
}

/**
 * Texture definitions with drawing functions
 */
const TEXTURE_DEFINITIONS = {
    [BORDER_TEXTURES.SOLID]: {
        draw: drawSolidBorder
    },
    [BORDER_TEXTURES.GRADIENT]: {
        draw: drawGradientBorder
    },
    [BORDER_TEXTURES.METALLIC]: {
        draw: drawMetallicBorder
    },
    [BORDER_TEXTURES.LEATHER]: {
        draw: drawLeatherBorder
    },
    [BORDER_TEXTURES.WOOD]: {
        draw: drawWoodBorder
    },
    [BORDER_TEXTURES.STONE]: {
        draw: drawStoneBorder
    },
    [BORDER_TEXTURES.CRYSTAL]: {
        draw: drawCrystalBorder
    },
    [BORDER_TEXTURES.GLOW]: {
        draw: drawGlowBorder
    }
};

/**
 * Draw solid border
 */
function drawSolidBorder(ctx, size, borderWidth, colors) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    ctx.fillStyle = colorToCSS(colors.primary);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Create border effect
    ctx.fillStyle = 'transparent';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - borderWidth, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
}

/**
 * Draw gradient border (default)
 */
function drawGradientBorder(ctx, size, borderWidth, colors) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // Draw outer circle background
    ctx.fillStyle = colorToCSS(colors.border || colors.primary);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw gradient border
    const gradient = ctx.createRadialGradient(
        centerX, centerY, radius - borderWidth,
        centerX, centerY, radius
    );
    
    gradient.addColorStop(0, colorToCSS(colors.primary));
    gradient.addColorStop(0.5, colorToCSS(colors.secondary || colors.primary));
    gradient.addColorStop(1, colorToCSS(colors.accent || colors.primary));
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Create border effect
    ctx.fillStyle = 'transparent';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - borderWidth, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
}

/**
 * Draw metallic border
 */
function drawMetallicBorder(ctx, size, borderWidth, colors) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // Base metallic color
    ctx.fillStyle = colorToCSS(colors.primary);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add metallic shine with gradient
    const gradient = ctx.createLinearGradient(
        centerX - radius * 0.7, centerY - radius * 0.7,
        centerX + radius * 0.7, centerY + radius * 0.7
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Create border effect
    ctx.fillStyle = 'transparent';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - borderWidth, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
}

/**
 * Draw leather border
 */
function drawLeatherBorder(ctx, size, borderWidth, colors) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // Base leather color
    ctx.fillStyle = colorToCSS(colors.primary);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add leather texture (random noise pattern)
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    const baseColor = colors.primary;
    
    for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % size;
        const y = Math.floor((i / 4) / size);
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= radius && dist > radius - borderWidth) {
            // Add subtle noise for texture
            const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) * 15);
            data[i] = Math.max(0, Math.min(255, baseColor.r + noise));
            data[i + 1] = Math.max(0, Math.min(255, baseColor.g + noise));
            data[i + 2] = Math.max(0, Math.min(255, baseColor.b + noise));
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Create border effect
    ctx.fillStyle = 'transparent';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - borderWidth, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
}

/**
 * Draw wood border
 */
function drawWoodBorder(ctx, size, borderWidth, colors) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // Base wood color
    ctx.fillStyle = colorToCSS(colors.primary);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add wood grain pattern
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    const baseColor = colors.primary;
    
    for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % size;
        const y = Math.floor((i / 4) / size);
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= radius && dist > radius - borderWidth) {
            // Wood grain pattern (horizontal lines with variation)
            const grain = Math.sin(y * 0.05 + Math.sin(x * 0.02) * 2) * 20;
            data[i] = Math.max(0, Math.min(255, baseColor.r + grain));
            data[i + 1] = Math.max(0, Math.min(255, baseColor.g + grain * 0.8));
            data[i + 2] = Math.max(0, Math.min(255, baseColor.b + grain * 0.6));
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Create border effect
    ctx.fillStyle = 'transparent';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - borderWidth, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
}

/**
 * Draw stone border
 */
function drawStoneBorder(ctx, size, borderWidth, colors) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // Base stone color
    ctx.fillStyle = colorToCSS(colors.primary);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add stone texture (mottled pattern)
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    const baseColor = colors.primary;
    
    for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % size;
        const y = Math.floor((i / 4) / size);
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= radius && dist > radius - borderWidth) {
            // Stone mottling pattern
            const noise = (Math.sin(x * 0.15) * Math.cos(y * 0.15) + Math.sin(x * 0.3) * Math.cos(y * 0.3)) * 25;
            data[i] = Math.max(0, Math.min(255, baseColor.r + noise));
            data[i + 1] = Math.max(0, Math.min(255, baseColor.g + noise));
            data[i + 2] = Math.max(0, Math.min(255, baseColor.b + noise));
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Create border effect
    ctx.fillStyle = 'transparent';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - borderWidth, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
}

/**
 * Draw crystal border
 */
function drawCrystalBorder(ctx, size, borderWidth, colors) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // Base crystal color
    ctx.fillStyle = colorToCSS(colors.primary);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add crystal facets
    const gradient = ctx.createRadialGradient(
        centerX, centerY, radius - borderWidth,
        centerX, centerY, radius
    );
    
    gradient.addColorStop(0, colorToCSS(colors.primary));
    gradient.addColorStop(0.3, `rgba(255, 255, 255, 0.4)`);
    gradient.addColorStop(0.6, colorToCSS(colors.accent || colors.primary));
    gradient.addColorStop(1, `rgba(255, 255, 255, 0.6)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Create border effect
    ctx.fillStyle = 'transparent';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - borderWidth, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
}

/**
 * Draw glow border
 */
function drawGlowBorder(ctx, size, borderWidth, colors) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;
    
    // Outer glow
    const outerGradient = ctx.createRadialGradient(
        centerX, centerY, radius - borderWidth * 0.5,
        centerX, centerY, radius + borderWidth * 0.5
    );
    
    outerGradient.addColorStop(0, `rgba(${colors.primary.r}, ${colors.primary.g}, ${colors.primary.b}, 0.8)`);
    outerGradient.addColorStop(1, `rgba(${colors.primary.r}, ${colors.primary.g}, ${colors.primary.b}, 0)`);
    
    ctx.fillStyle = outerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + borderWidth * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Main border
    ctx.fillStyle = colorToCSS(colors.primary);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner glow
    const innerGradient = ctx.createRadialGradient(
        centerX, centerY, radius - borderWidth,
        centerX, centerY, radius - borderWidth * 0.3
    );
    
    innerGradient.addColorStop(0, `rgba(255, 255, 255, 0.5)`);
    innerGradient.addColorStop(1, `rgba(${colors.accent.r || colors.primary.r}, ${colors.accent.g || colors.primary.g}, ${colors.accent.b || colors.primary.b}, 0.3)`);
    
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - borderWidth * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Create border effect
    ctx.fillStyle = 'transparent';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - borderWidth, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
}
