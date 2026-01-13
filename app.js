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

let currentImage = null;
let currentTokenData = null;

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
        
        // Extract color scheme from the image
        const colorScheme = extractColorScheme(image, faceData);
        
        // Generate the token
        const tokenData = createToken(image, faceData, colorScheme);
        currentTokenData = tokenData;
        
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
        
        // Extract color scheme
        const colorScheme = extractColorScheme(image, faceData);
        
        // Generate token
        const tokenData = createToken(image, faceData, colorScheme);
        currentTokenData = tokenData;
        
        displayPreview(tokenData);
        showPreview();
    } catch (error) {
        throw new Error('Failed to process image: ' + error.message);
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
    fileInput.value = '';
    hideError();
    showUpload();
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
