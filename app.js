/**
 * Folken Games Token Prep - Main Application Logic
 * Handles image processing, face detection, color extraction, and token generation
 */

import { detectFace, loadFaceApiModels } from './faceDetection.js';
import { extractColorScheme, generateBorder } from './colorUtils.js';
import { createToken } from './tokenGenerator.js';

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
        
        // Set up event listeners
        setupEventListeners();
        
        // Set up drag functionality
        setupDragFunctionality();
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
        
        // Generate the token
        const tokenData = createToken(image, faceData, colorScheme, currentZoomAdjustment, currentCropOffset);
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
        
        // Generate token
        const tokenData = createToken(image, faceData, colorScheme, currentZoomAdjustment, currentCropOffset);
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
        const tokenData = createToken(currentImage, currentFaceData, currentColorScheme, currentZoomAdjustment, currentCropOffset);
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
    if (!currentTokenData) return;
    
    const link = document.createElement('a');
    link.download = 'token.png';
    link.href = currentTokenData.canvas.toDataURL('image/png');
    link.click();
}

// Reset the application
function resetApp() {
    currentImage = null;
    currentTokenData = null;
    currentFaceData = null;
    currentColorScheme = null;
    currentZoomAdjustment = 1.0;
    currentCropOffset = {x: 0, y: 0};
    isDragging = false;
    fileInput.value = '';
    zoomSlider.value = 100;
    zoomValue.textContent = '100%';
    hideError();
    showUpload();
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
