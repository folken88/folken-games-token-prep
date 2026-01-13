/**
 * Face Detection Module
 * Uses face-api.js for face detection in images
 */

let modelsLoaded = false;

/**
 * Load face-api.js models
 */
export async function loadFaceApiModels() {
    if (modelsLoaded) return;
    
    // Wait for face-api.js to be available
    let attempts = 0;
    while (typeof faceapi === 'undefined' && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    // Check if face-api.js is available
    if (typeof faceapi === 'undefined') {
        throw new Error('face-api.js library not loaded. Please check your internet connection and refresh the page.');
    }
    
    try {
        // Load the models (using CDN models)
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
        
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        
        modelsLoaded = true;
    } catch (error) {
        console.error('Failed to load face-api models:', error);
        throw new Error('Failed to load face detection models. Please check your internet connection.');
    }
}

/**
 * Detect face in an image
 * @param {HTMLImageElement} image - The image to detect faces in
 * @returns {Promise<Object>} Face data with x, y, width, height
 */
export async function detectFace(image) {
    if (!modelsLoaded) {
        await loadFaceApiModels();
    }
    
    try {
        // Create a temporary canvas for face detection
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Limit canvas size for performance (face-api works better with smaller images)
        const maxSize = 512;
        let width = image.width;
        let height = image.height;
        
        if (width > maxSize || height > maxSize) {
            const scale = Math.min(maxSize / width, maxSize / height);
            width = width * scale;
            height = height * scale;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(image, 0, 0, width, height);
        
        // Detect faces
        const detections = await faceapi
            .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();
        
        if (detections.length === 0) {
            throw new Error('No face detected in image');
        }
        
        // Use the largest face (most likely the main subject)
        const largestFace = detections.reduce((prev, current) => {
            const prevArea = prev.detection.box.width * prev.detection.box.height;
            const currentArea = current.detection.box.width * current.detection.box.height;
            return currentArea > prevArea ? current : prev;
        });
        
        const box = largestFace.detection.box;
        
        // Scale back to original image dimensions
        const scaleX = image.width / width;
        const scaleY = image.height / height;
        
        return {
            x: box.x * scaleX,
            y: box.y * scaleY,
            width: box.width * scaleX,
            height: box.height * scaleY,
            landmarks: largestFace.landmarks
        };
    } catch (error) {
        console.error('Face detection error:', error);
        throw error;
    }
}
