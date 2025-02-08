'use client';
import { useState, useRef, useEffect } from 'react';

export default function BrainTumorDetection() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const containerRef = useRef(null);

    const drawBoundingBox = () => {
        if (prediction?.box && imageRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const image = imageRef.current;

            // Get the actual displayed image dimensions
            const displayedWidth = image.width;
            const displayedHeight = image.height;

            // Set canvas size to match the actual image size
            canvas.width = displayedWidth;
            canvas.height = displayedHeight;

            // Clear previous drawings
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw bounding box
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;

            // Get original image dimensions
            const naturalWidth = image.naturalWidth;
            const naturalHeight = image.naturalHeight;

            // Calculate scaling factors based on the actual image size
            const scaleX = displayedWidth / naturalWidth;
            const scaleY = displayedHeight / naturalHeight;

            // Get YOLO coordinates
            const [x1, y1, x2, y2] = prediction.box;

            // Scale coordinates to match the displayed image size
            const boxX = x1 * scaleX;
            const boxY = y1 * scaleY;
            const boxWidth = (x2 - x1) * scaleX;
            const boxHeight = (y2 - y1) * scaleY;

            // Draw rectangle
            ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

            // Add confidence label with background
            ctx.font = 'bold 16px Arial';
            const confidence = (prediction.confidence * 100).toFixed(1);
            const label = `Tumor ${confidence}%`;

            // Add background for text
            const textMetrics = ctx.measureText(label);
            const padding = 4;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
                boxX,
                boxY - 25,
                textMetrics.width + (padding * 2),
                25
            );

            // Draw text
            ctx.fillStyle = '#00ff00';
            ctx.fillText(label, boxX + padding, boxY - 7);
        }
    };

    useEffect(() => {
        if (imageRef.current && preview) {
            const updateDimensions = () => {
                const container = containerRef.current;
                if (container) {
                    // Set maximum dimensions while maintaining aspect ratio
                    const maxWidth = Math.min(container.offsetWidth, 450);
                    const maxHeight = 450;

                    const img = imageRef.current;
                    const aspectRatio = img.naturalWidth / img.naturalHeight;

                    let width = maxWidth;
                    let height = width / aspectRatio;

                    if (height > maxHeight) {
                        height = maxHeight;
                        width = height * aspectRatio;
                    }

                    setImageDimensions({ width, height });
                }
            };

            imageRef.current.onload = updateDimensions;
            window.addEventListener('resize', updateDimensions);

            return () => window.removeEventListener('resize', updateDimensions);
        }
    }, [preview]);

    useEffect(() => {
        if (prediction?.box && imageDimensions.width > 0) {
            drawBoundingBox();
        }
    }, [prediction, imageDimensions]);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            // Validate file size (e.g., max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size should be less than 5MB');
                return;
            }

            setSelectedImage(file);
            setPreview(URL.createObjectURL(file));
            setPrediction(null);
        }
    };

    const handleSubmit = async () => {
        if (!selectedImage) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', selectedImage);

        try {
            const response = await fetch('http://localhost:8000/api/brain_tumor/predict', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Prediction failed');
            }

            const data = await response.json();
            setPrediction({
                prediction: data.prediction,
                confidence: data.confidence,
                box: data.box
            });
        } catch (error) {
            console.error('Error:', error);
            setPrediction({
                error: 'Failed to process image. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Brain Tumor Detection</h1>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <p className="text-gray-600 mb-6">
                    Upload a brain MRI scan to detect the presence of tumors using our AI model.
                </p>

                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="w-full"
                            />
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedImage || isLoading}
                            className={`w-full py-2 px-4 rounded-lg ${!selectedImage || isLoading
                                ? 'bg-gray-300'
                                : 'bg-blue-500 hover:bg-blue-600'
                                } text-white transition-colors`}
                        >
                            {isLoading ? 'Analyzing...' : 'Analyze Image'}
                        </button>
                    </div>

                    <div ref={containerRef} className="space-y-4">
                        {preview && (
                            <div className="relative flex justify-center">
                                <div style={{
                                    maxWidth: '450px',
                                    maxHeight: '450px',
                                    width: '100%',
                                    position: 'relative'
                                }}>
                                    <img
                                        ref={imageRef}
                                        src={preview}
                                        alt="Preview"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            maxHeight: '450px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            pointerEvents: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        {prediction && !prediction.error && (
                            <div className={`p-4 rounded-lg ${prediction.prediction === 'Tumor Detected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                                }`}>
                                <h3 className="font-semibold">{prediction.prediction}</h3>
                                {prediction.confidence && (
                                    <p>Confidence: {(prediction.confidence * 100).toFixed(2)}%</p>
                                )}
                            </div>
                        )}
                        {prediction?.error && (
                            <div className="p-4 rounded-lg bg-red-100 text-red-800">
                                <h3 className="font-semibold">Error</h3>
                                <p>{prediction.error}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// /Users/sahil_mac/Desktop/PICT-Hackthon-ML_Models/Brain-Tumor-Detection-main/model.h5