'use client';
import { useState, useRef, useEffect } from 'react';

export default function XRaySamplesDetection() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const canvasRef = useRef(null);
    const imageRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

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
            const response = await fetch('http://localhost:8000/api/xray_samples/predict', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Prediction failed');
            }

            const data = await response.json();
            console.log("API Response:", data);  // Debug log
            setPrediction(data);
        } catch (error) {
            console.error('Error:', error);
            setPrediction({
                error: error.message || 'Failed to process image. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const drawBoundingBoxes = () => {
        if (prediction?.predictions && imageRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const image = imageRef.current;

            // Set canvas dimensions to match displayed image
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Color mapping - using lowercase for case-insensitive matching
            const colorMap = {
                'collarbone left': '#FFD700',    // Gold
                'collarbone right': '#FF69B4',   // Hot Pink
                'humeral left': '#32CD32',       // Lime Green
                'humeral right': '#FF4500',      // Orange Red
                // Add more mappings as needed
            };

            // Draw each prediction
            prediction.predictions.forEach((pred, index) => {
                const { bbox, prediction: className, confidence } = pred;

                // Get color from map or cycle through basic colors
                const normalizedClassName = className.toLowerCase();
                const color = colorMap[normalizedClassName] ||
                    `hsl(${(index * 137) % 360}, 70%, 50%)`; // Generate unique color if not in map

                // Set styles for this prediction
                ctx.strokeStyle = color;
                ctx.lineWidth = 3; // Thick border

                // Calculate box coordinates
                const boxX = bbox.x - bbox.width / 2;
                const boxY = bbox.y - bbox.height / 2;

                // Draw only the border rectangle (no fill)
                ctx.strokeRect(boxX, boxY, bbox.width, bbox.height);

                // Add label with background
                const label = `${className} ${(confidence * 100).toFixed(1)}%`;
                ctx.font = 'bold 16px Arial';
                const textMetrics = ctx.measureText(label);
                const padding = 4;

                // Draw label background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(
                    boxX,
                    boxY - 25,
                    textMetrics.width + (padding * 2),
                    25
                );

                // Draw label text
                ctx.fillStyle = color;
                ctx.fillText(label, boxX + padding, boxY - 7);
            });

            // Add legend
            const legendContainer = document.createElement('div');
            legendContainer.className = 'mt-4 p-4 bg-gray-50 rounded-lg';

            const uniquePredictions = [...new Set(prediction.predictions.map(p => p.prediction))];

            legendContainer.innerHTML = `
                <h3 class="text-lg font-semibold mb-2">Detection Legend</h3>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                    ${uniquePredictions.map((className, index) => {
                const normalizedClassName = className.toLowerCase();
                const color = colorMap[normalizedClassName] ||
                    `hsl(${(index * 137) % 360}, 70%, 50%)`;
                return `
                            <div class="flex items-center space-x-2">
                                <div class="w-4 h-4 rounded-sm border-2" 
                                     style="border-color: ${color}">
                                </div>
                                <span class="text-sm">${className}</span>
                            </div>
                        `;
            }).join('')}
                </div>
            `;

            // Update legend in DOM
            const container = canvas.parentElement;
            const existingLegend = container.querySelector('.legend');
            if (existingLegend) {
                existingLegend.remove();
            }
            legendContainer.classList.add('legend');
            container.appendChild(legendContainer);
        }
    };

    // Debug logging
    useEffect(() => {
        if (prediction?.predictions) {
            console.log('Received predictions:', prediction.predictions);
            drawBoundingBoxes();
        }
    }, [prediction]);

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                    <div className="px-6 py-8">
                        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                            X-Ray Image Analysis
                        </h2>

                        <div className="space-y-6">
                            {/* Upload Section */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Upload X-ray Image
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                                    <div className="space-y-1 text-center">
                                        <div className="flex text-sm text-gray-600">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            PNG, JPG, GIF up to 5MB
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Section */}
                            {preview && (
                                <div className="relative">
                                    <div className="relative w-full h-[450px] border rounded-lg overflow-hidden">
                                        <img
                                            ref={imageRef}
                                            src={preview}
                                            alt="Preview"
                                            className="w-full h-full object-contain"
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Analyze Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedImage || isLoading}
                                className={`w-full py-3 px-4 rounded-md text-white font-semibold ${!selectedImage || isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                    } transition-colors duration-200`}
                            >
                                {isLoading ? 'Analyzing...' : 'Analyze Image'}
                            </button>

                            {/* Results Section */}
                            {prediction && !prediction.error && (
                                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                                    <h3 className="text-lg font-semibold text-green-900">
                                        Detection Results
                                    </h3>
                                    <div className="mt-2 space-y-2">
                                        {prediction.predictions.map((pred, index) => (
                                            <div key={index} className="text-sm text-green-800">
                                                <p>Detected: {pred.prediction}</p>
                                                <p>Confidence: {(pred.confidence * 100).toFixed(2)}%</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Error Display */}
                            {prediction?.error && (
                                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                                    <h3 className="text-lg font-semibold text-red-900">Error</h3>
                                    <p className="mt-2 text-sm text-red-800">{prediction.error}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 