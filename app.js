/**
 * Folken Games Token Prep - Main Application Logic
 * Handles image processing, face detection, color extraction, and token generation
 * Version: 1.1 - Added filename-based download naming
 */

import { detectFace, loadFaceApiModels } from './faceDetection.js';
import { extractColorScheme, generateBorder } from './colorUtils.js';
import { createToken } from './tokenGenerator.js';
import { COLOR_SWATCHES, BORDER_TEXTURES } from './borderStyles.js';

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const processingArea = document.getElementById('processingArea');
const previewArea = document.getElementById('previewArea');
const previewCanvas = document.getElementById('previewCanvas');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const errorMessage = document.getElementById('errorMessage');
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
const colorSwatches = document.getElementById('colorSwatches');
const textureSwatches = document.getElementById('textureSwatches');
const resetColorBtn = document.getElementById('resetColorBtn');
const resetTextureBtn = document.getElementById('resetTextureBtn');
const tokenCountEl = document.getElementById('tokenCount');

const TOKEN_COUNT_STORAGE_KEY = 'tkn8r.tokensCreated';

let currentImage = null;
let currentTokenData = null;
let currentFaceData = null;
let currentColorScheme = null;
let currentZoomAdjustment = 1.0;
let currentCropOffset = {x: 0, y: 0};
let isDragging = false;
let dragStart = {x: 0, y: 0};
let dragStartOffset = {x: 0, y: 0};
let lastCropData = null; // Store last crop dimensions for drag scaling
let currentBorderOptions = { texture: BORDER_TEXTURES.GRADIENT, customColor: null, borderWidth: 8 }; // Border customization state (8 = thin, 16 = thick)
let currentFileName = null; // Store original filename for download naming

/**
 * Read the persisted token count from localStorage.
 * @returns {number} Non-negative integer count
 */
function getTokensCreatedCount() {
    try {
        const raw = localStorage.getItem(TOKEN_COUNT_STORAGE_KEY);
        const parsed = parseInt(raw || '0', 10);
        if (!Number.isFinite(parsed) || parsed < 0) return 0;
        return parsed;
    } catch (_err) {
        return 0;
    }
}

/**
 * Persist and display the token count.
 * @param {number} count
 */
function setTokensCreatedCount(count) {
    const safe = Math.max(0, Math.floor(Number(count) || 0));
    try {
        localStorage.setItem(TOKEN_COUNT_STORAGE_KEY, String(safe));
    } catch (_err) {
        // Ignore storage failures (private mode, quota, etc.)
    }
    if (tokenCountEl) {
        tokenCountEl.textContent = String(safe);
    }
}

/**
 * Increment the token count (only called after a download is triggered).
 */
function incrementTokensCreatedCount() {
    const current = getTokensCreatedCount();
    setTokensCreatedCount(current + 1);
}

// Initialize the application
async function init() {
    // Check if running from file:// protocol (CORS issue)
    if (window.location.protocol === 'file:') {
        showError('This app must be run from a local server due to browser security restrictions. Please use: npm start');
        return;
    }
    
    try {
        // Load face detection models
        await loadFaceApiModels();
        
        // Initialize border customization UI
        initializeBorderCustomization();
        
        // Set up event listeners
        setupEventListeners();
        
        // Set up drag functionality
        setupDragFunctionality();

        // Initialize “tokens created” display
        setTokensCreatedCount(getTokensCreatedCount());
    } catch (error) {
        showError('Failed to initialize application: ' + error.message);
        console.error('Initialization error:', error);
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Click to upload - prevent event bubbling
    uploadArea.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    // Drag and drop - prevent default browser behavior
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // Allow drag and drop on preview area to replace current image
    if (previewArea) {
        previewArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewArea.classList.add('dragover');
        });
        
        previewArea.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewArea.classList.add('dragover');
        });
        
        previewArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewArea.classList.remove('dragover');
        });
        
        previewArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                handleFile(files[0]);
            }
        });
    }
    
    // Prevent default drag behavior on the entire document
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Download button
    downloadBtn.addEventListener('click', downloadToken);
    
    // Reset button
    resetBtn.addEventListener('click', resetApp);
    
    // Reset border customization buttons
    if (resetColorBtn) {
        resetColorBtn.addEventListener('click', resetBorderColor);
    }
    if (resetTextureBtn) {
        resetTextureBtn.addEventListener('click', resetBorderTexture);
    }
    
    // Border thickness toggle (handled in initializeBorderCustomization)
    
    // Zoom slider - use both input and change events for better responsiveness
    if (zoomSlider) {
        zoomSlider.addEventListener('input', handleZoomChange);
        zoomSlider.addEventListener('change', handleZoomChange);
    } else {
        console.warn('Zoom slider not found');
    }
}

// Handle file upload
async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please upload an image file.');
        return;
    }
    
    hideError();
    showProcessing();
    
    try {
        // Store original filename (without extension)
        // Remove extension and sanitize for use in download filename
        let fileNameWithoutExt = file.name || 'image';
        const lastDotIndex = fileNameWithoutExt.lastIndexOf('.');
        if (lastDotIndex > 0) {
            fileNameWithoutExt = fileNameWithoutExt.substring(0, lastDotIndex);
        }
        // Sanitize filename: remove/replace characters that might cause issues in filenames
        // Only keep alphanumeric, underscores, and hyphens
        currentFileName = fileNameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
        // If filename is empty after sanitization, use a default
        if (!currentFileName || currentFileName.trim() === '') {
            currentFileName = 'image';
        }
        console.log('Stored filename:', currentFileName, 'from original:', file.name);
        console.log('currentFileName is now:', currentFileName);
        
        // Load image
        const image = await loadImage(file);
        currentImage = image;
        
        // Process the image
        await processImage(image);
    } catch (error) {
        showError('Failed to process image: ' + error.message);
        console.error('Processing error:', error);
        showUpload();
    }
}

// Load image from file
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Process the image: detect face, extract colors, generate token
async function processImage(image) {
    try {
        // Detect face in the image
        const faceData = await detectFace(image);
        currentFaceData = faceData;
        
        // Extract color scheme from the image
        const colorScheme = extractColorScheme(image, faceData);
        currentColorScheme = colorScheme;
        
        // Reset zoom and offset to default
        currentZoomAdjustment = 1.0;
        currentCropOffset = {x: 0, y: 0};
        zoomSlider.value = 100;
        zoomValue.textContent = '100%';
        
        // Reset border options to default
        currentBorderOptions = { texture: BORDER_TEXTURES.GRADIENT, customColor: null, borderWidth: 8 };
        updateBorderCustomizationUI();
        
        // Generate the token
        const tokenData = createToken(image, faceData, colorScheme, currentZoomAdjustment, currentCropOffset, currentBorderOptions);
        currentTokenData = tokenData;
        
        // Store crop data for drag calculations (set immediately)
        if (tokenData.cropData) {
            lastCropData = tokenData.cropData;
        }
        
        // Display preview
        displayPreview(tokenData);
        
        showPreview();
    } catch (error) {
        // If face detection fails, try fallback approach
        console.warn('Face detection failed, using fallback:', error);
        await processImageFallback(image);
    }
}

// Fallback processing when face detection fails
async function processImageFallback(image) {
    try {
        // Use center of image as focus point
        const faceData = {
            x: image.width * 0.25,
            y: image.height * 0.25,
            width: image.width * 0.5,
            height: image.height * 0.5
        };
        currentFaceData = faceData;
        
        // Extract color scheme
        const colorScheme = extractColorScheme(image, faceData);
        currentColorScheme = colorScheme;
        
        // Reset zoom and offset to default
        currentZoomAdjustment = 1.0;
        currentCropOffset = {x: 0, y: 0};
        zoomSlider.value = 100;
        zoomValue.textContent = '100%';
        
        // Reset border options to default
        currentBorderOptions = { texture: BORDER_TEXTURES.GRADIENT, customColor: null, borderWidth: 8 };
        updateBorderCustomizationUI();
        
        // Generate token
        const tokenData = createToken(image, faceData, colorScheme, currentZoomAdjustment, currentCropOffset, currentBorderOptions);
        currentTokenData = tokenData;
        
        // Store crop data for drag calculations (set immediately)
        if (tokenData.cropData) {
            lastCropData = tokenData.cropData;
        }
        
        displayPreview(tokenData);
        showPreview();
    } catch (error) {
        throw new Error('Failed to process image: ' + error.message);
    }
}

// Handle zoom slider changes
function handleZoomChange(e) {
    if (!currentImage || !currentFaceData || !currentColorScheme) {
        console.warn('Cannot adjust zoom: missing image data');
        return;
    }
    
    // Convert slider value (50-150) to zoom adjustment factor (0.5-1.5)
    // 100 = 1.0 (no adjustment), 50 = 0.5 (zoom out 2x), 150 = 1.5 (zoom in 1.5x)
    const sliderValue = parseFloat(e.target.value);
    currentZoomAdjustment = sliderValue / 100;
    
    // Update display
    if (zoomValue) {
        zoomValue.textContent = `${sliderValue}%`;
    }
    
    // Regenerate token with new zoom adjustment
    regenerateToken();
    
    // Store adjustment data for analysis (throttle to avoid too many writes)
    if (!handleZoomChange.timeout) {
        handleZoomChange.timeout = setTimeout(() => {
            storeAdjustmentData(sliderValue);
            handleZoomChange.timeout = null;
        }, 500); // Store after 500ms of no changes
    }
}

// Regenerate token with current settings
function regenerateToken() {
    if (!currentImage || !currentFaceData || !currentColorScheme) return;
    
    try {
        const tokenData = createToken(currentImage, currentFaceData, currentColorScheme, currentZoomAdjustment, currentCropOffset, currentBorderOptions);
        currentTokenData = tokenData;
        
        // Store crop data for drag calculations (always update this)
        if (tokenData.cropData) {
            lastCropData = tokenData.cropData;
        } else {
            // Fallback: create crop data from token data if not provided
            console.warn('cropData not found in tokenData, drag may not work properly');
        }
        
        // Update preview
        displayPreview(tokenData);
    } catch (error) {
        console.error('Error regenerating token:', error);
    }
}

// Display the generated token preview
function displayPreview(tokenData) {
    const ctx = previewCanvas.getContext('2d');
    
    // Set canvas size (standard token size: 512x512)
    const size = 512;
    previewCanvas.width = size;
    previewCanvas.height = size;
    
    // Draw the token
    ctx.drawImage(tokenData.canvas, 0, 0, size, size);
}

// Set up drag functionality for repositioning the crop
function setupDragFunctionality() {
    if (!previewCanvas) return;
    
    // Mouse down - start drag
    previewCanvas.addEventListener('mousedown', (e) => {
        if (!currentImage || !currentFaceData) return;
        
        isDragging = true;
        const rect = previewCanvas.getBoundingClientRect();
        dragStart.x = e.clientX - rect.left;
        dragStart.y = e.clientY - rect.top;
        dragStartOffset.x = currentCropOffset.x;
        dragStartOffset.y = currentCropOffset.y;
        
        previewCanvas.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    // Mouse move - update position while dragging
    previewCanvas.addEventListener('mousemove', (e) => {
        if (!isDragging || !currentImage || !currentFaceData || !lastCropData) return;
        
        const rect = previewCanvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        // Calculate drag delta in canvas pixels
        const deltaX = currentX - dragStart.x;
        const deltaY = currentY - dragStart.y;
        
        // Convert canvas pixel movement to source image offset
        // The crop area size determines the scale factor
        const tokenSize = 512;
        const borderWidth = 8;
        const imageSize = tokenSize - (borderWidth * 2);
        
        // Use actual crop dimensions from last calculation
        const scaleFactorX = lastCropData.width / imageSize;
        const scaleFactorY = lastCropData.height / imageSize;
        
        // Update crop offset (negative because dragging right should move crop left)
        currentCropOffset.x = dragStartOffset.x - (deltaX * scaleFactorX);
        currentCropOffset.y = dragStartOffset.y - (deltaY * scaleFactorY);
        
        // Regenerate token with new offset
        regenerateToken();
        
        e.preventDefault();
    });
    
    // Mouse up - end drag
    previewCanvas.addEventListener('mouseup', (e) => {
        if (isDragging) {
            isDragging = false;
            previewCanvas.style.cursor = 'grab';
        }
    });
    
    // Mouse leave - end drag if mouse leaves canvas
    previewCanvas.addEventListener('mouseleave', (e) => {
        if (isDragging) {
            isDragging = false;
            previewCanvas.style.cursor = 'grab';
        }
    });
    
    // Mouse wheel - zoom in/out
    previewCanvas.addEventListener('wheel', (e) => {
        if (!currentImage || !currentFaceData) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Determine zoom direction (negative deltaY = scroll up = zoom in)
        const zoomDelta = e.deltaY > 0 ? -5 : 5; // 5% per scroll step
        const currentSliderValue = parseFloat(zoomSlider.value);
        const newSliderValue = Math.max(50, Math.min(150, currentSliderValue + zoomDelta));
        
        // Update slider
        zoomSlider.value = newSliderValue;
        currentZoomAdjustment = newSliderValue / 100;
        
        // Update display
        if (zoomValue) {
            zoomValue.textContent = `${Math.round(newSliderValue)}%`;
        }
        
        // Regenerate token
        regenerateToken();
        
        // Store adjustment data
        if (!handleZoomChange.timeout) {
            handleZoomChange.timeout = setTimeout(() => {
                storeAdjustmentData(newSliderValue);
                handleZoomChange.timeout = null;
            }, 500);
        }
    }, { passive: false }); // passive: false to allow preventDefault
    
    // Set initial cursor style
    previewCanvas.style.cursor = 'grab';
    previewCanvas.style.userSelect = 'none';
    previewCanvas.title = 'Drag to reposition, scroll to zoom';
}

// Download the token as PNG
function downloadToken() {
    if (!currentTokenData) {
        return;
    }
    
    // Determine filename - always use token_ prefix
    let fileName = 'token.png';
    if (currentFileName) {
        const cleanName = String(currentFileName).trim();
        if (cleanName !== '' && cleanName !== 'null' && cleanName !== 'undefined') {
            fileName = `token_${cleanName}.png`;
        }
    }
    
    // Create blob URL for better browser compatibility
    const canvas = currentTokenData.canvas;
    canvas.toBlob(function(blob) {
        if (!blob) {
            // Fallback to data URL if blob creation fails
            const link = document.createElement('a');
            link.download = fileName;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            incrementTokensCreatedCount();
            return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        incrementTokensCreatedCount();
        
        // Clean up the blob URL after a short delay
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }, 'image/png');
}

// Reset the application
function resetApp() {
    currentImage = null;
    currentTokenData = null;
    currentFaceData = null;
    currentColorScheme = null;
    currentZoomAdjustment = 1.0;
    currentCropOffset = {x: 0, y: 0};
    currentBorderOptions = { texture: BORDER_TEXTURES.GRADIENT, customColor: null, borderWidth: 8 };
    currentFileName = null;
    isDragging = false;
    fileInput.value = '';
    zoomSlider.value = 100;
    zoomValue.textContent = '100%';
    hideError();
    showUpload();
}

// Initialize border customization UI
function initializeBorderCustomization() {
    // Initialize color swatches
    const colorSwatchesEl = document.getElementById('colorSwatches');
    if (colorSwatchesEl) {
        // Clear any existing swatches
        colorSwatchesEl.innerHTML = '';
        
        COLOR_SWATCHES.forEach((swatch, index) => {
            const swatchEl = document.createElement('button');
            swatchEl.className = 'color-swatch';
            swatchEl.style.backgroundColor = `rgb(${swatch.r}, ${swatch.g}, ${swatch.b})`;
            swatchEl.title = swatch.name;
            swatchEl.setAttribute('data-color-index', index);
            swatchEl.setAttribute('aria-label', `Select ${swatch.name} color`);
            swatchEl.addEventListener('click', () => selectBorderColor(swatch));
            colorSwatchesEl.appendChild(swatchEl);
        });
    } else {
        console.warn('Color swatches container not found');
    }
    
    // Initialize texture swatches
    const textureSwatchesEl = document.getElementById('textureSwatches');
    if (textureSwatchesEl) {
        // Clear any existing swatches
        textureSwatchesEl.innerHTML = '';
        
        const textureNames = {
            [BORDER_TEXTURES.SOLID]: 'Solid',
            [BORDER_TEXTURES.GRADIENT]: 'Gradient',
            [BORDER_TEXTURES.METALLIC]: 'Metallic',
            [BORDER_TEXTURES.LEATHER]: 'Leather',
            [BORDER_TEXTURES.WOOD]: 'Wood',
            [BORDER_TEXTURES.STONE]: 'Stone',
            [BORDER_TEXTURES.CRYSTAL]: 'Crystal',
            [BORDER_TEXTURES.GLOW]: 'Glow'
        };
        
        Object.entries(BORDER_TEXTURES).forEach(([key, textureType]) => {
            const swatchEl = document.createElement('button');
            swatchEl.className = 'texture-swatch';
            swatchEl.setAttribute('data-texture', textureType);
            swatchEl.textContent = textureNames[textureType].substring(0, 3);
            swatchEl.title = textureNames[textureType];
            swatchEl.setAttribute('aria-label', `Select ${textureNames[textureType]} texture`);
            swatchEl.addEventListener('click', () => selectBorderTexture(textureType));
            textureSwatchesEl.appendChild(swatchEl);
        });
        
        // Add border thickness toggle button to texture swatches container
        const thicknessBtn = document.createElement('button');
        thicknessBtn.className = 'texture-swatch';
        thicknessBtn.id = 'borderThicknessBtn';
        thicknessBtn.setAttribute('data-thickness', 'thin');
        thicknessBtn.title = 'Toggle border thickness';
        thicknessBtn.setAttribute('aria-label', 'Toggle border thickness');
        const thicknessLabel = document.createElement('span');
        thicknessLabel.id = 'borderThicknessLabel';
        thicknessLabel.textContent = 'Thin';
        thicknessBtn.appendChild(thicknessLabel);
        thicknessBtn.addEventListener('click', toggleBorderThickness);
        textureSwatchesEl.appendChild(thicknessBtn);
    } else {
        console.warn('Texture swatches container not found');
    }
    
    updateBorderCustomizationUI();
}

// Update border customization UI to reflect current state
function updateBorderCustomizationUI() {
    // Update texture swatches (excluding thickness button)
    if (textureSwatches) {
        const textureSwatchElements = textureSwatches.querySelectorAll('.texture-swatch[data-texture]');
        textureSwatchElements.forEach(el => {
            if (el.getAttribute('data-texture') === currentBorderOptions.texture) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }
    
    // Update color swatches (only show active if custom color is selected)
    if (colorSwatches) {
        const colorSwatchElements = colorSwatches.querySelectorAll('.color-swatch');
        colorSwatchElements.forEach(el => {
            el.classList.remove('active');
        });
    }
    
    // Update border thickness button
    const thicknessBtn = document.getElementById('borderThicknessBtn');
    const thicknessLabel = document.getElementById('borderThicknessLabel');
    if (thicknessBtn && thicknessLabel) {
        if (currentBorderOptions.borderWidth === 8) {
            thicknessBtn.setAttribute('data-thickness', 'thin');
            thicknessBtn.classList.remove('active');
            thicknessLabel.textContent = 'Thin';
        } else {
            thicknessBtn.setAttribute('data-thickness', 'thick');
            thicknessBtn.classList.add('active');
            thicknessLabel.textContent = 'Thick';
        }
    }
}

// Handle border color selection
function selectBorderColor(color) {
    currentBorderOptions.customColor = color;
    updateBorderCustomizationUI();
    regenerateToken();
}

// Handle border texture selection
function selectBorderTexture(textureType) {
    currentBorderOptions.texture = textureType;
    updateBorderCustomizationUI();
    regenerateToken();
}

// Reset border color to auto-detected
function resetBorderColor() {
    currentBorderOptions.customColor = null;
    updateBorderCustomizationUI();
    regenerateToken();
}

// Reset border texture to default (gradient)
function resetBorderTexture() {
    currentBorderOptions.texture = BORDER_TEXTURES.GRADIENT;
    updateBorderCustomizationUI();
    regenerateToken();
}

// Toggle border thickness between thin (8) and thick (16)
function toggleBorderThickness() {
    if (currentBorderOptions.borderWidth === 8) {
        currentBorderOptions.borderWidth = 16;
        const btn = document.getElementById('borderThicknessBtn');
        const label = document.getElementById('borderThicknessLabel');
        if (btn) {
            btn.setAttribute('data-thickness', 'thick');
            btn.classList.add('active');
        }
        if (label) label.textContent = 'Thick';
    } else {
        currentBorderOptions.borderWidth = 8;
        const btn = document.getElementById('borderThicknessBtn');
        const label = document.getElementById('borderThicknessLabel');
        if (btn) {
            btn.setAttribute('data-thickness', 'thin');
            btn.classList.remove('active');
        }
        if (label) label.textContent = 'Thin';
    }
    regenerateToken();
}

// Store adjustment data for future analysis
function storeAdjustmentData(zoomValue) {
    try {
        // Get existing adjustments or create new array
        const adjustments = JSON.parse(localStorage.getItem('tokenAdjustments') || '[]');
        
        // Add current adjustment with metadata
        const adjustment = {
            timestamp: new Date().toISOString(),
            zoomValue: zoomValue,
            zoomAdjustment: currentZoomAdjustment,
            faceData: {
                width: currentFaceData.width,
                height: currentFaceData.height,
                // Store relative face size as percentage of image
                relativeWidth: (currentFaceData.width / currentImage.width) * 100,
                relativeHeight: (currentFaceData.height / currentImage.height) * 100
            },
            imageSize: {
                width: currentImage.width,
                height: currentImage.height
            }
        };
        
        adjustments.push(adjustment);
        
        // Keep only last 1000 adjustments to prevent localStorage from getting too large
        if (adjustments.length > 1000) {
            adjustments.shift();
        }
        
        // Store back to localStorage
        localStorage.setItem('tokenAdjustments', JSON.stringify(adjustments));
        
        // Also store a summary for quick analysis
        updateAdjustmentSummary(adjustments);
    } catch (error) {
        console.warn('Failed to store adjustment data:', error);
    }
}

// Update adjustment summary statistics
function updateAdjustmentSummary(adjustments) {
    if (adjustments.length === 0) return;
    
    // Calculate average zoom adjustment
    const avgZoom = adjustments.reduce((sum, adj) => sum + adj.zoomValue, 0) / adjustments.length;
    
    // Count how many needed adjustment vs default
    const neededAdjustment = adjustments.filter(adj => adj.zoomValue !== 100).length;
    const adjustmentRate = (neededAdjustment / adjustments.length) * 100;
    
    const summary = {
        totalAdjustments: adjustments.length,
        averageZoom: avgZoom,
        adjustmentRate: adjustmentRate,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('tokenAdjustmentSummary', JSON.stringify(summary));
}

// UI State Management
function showUpload() {
    uploadArea.style.display = 'block';
    processingArea.style.display = 'none';
    previewArea.style.display = 'none';
}

function showProcessing() {
    uploadArea.style.display = 'none';
    processingArea.style.display = 'block';
    previewArea.style.display = 'none';
}

function showPreview() {
    uploadArea.style.display = 'none';
    processingArea.style.display = 'none';
    previewArea.style.display = 'block';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
