'use client';
import { useState, useRef, useEffect } from 'react';

export default function SkinDiseaseDetection() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const containerRef = useRef(null);

    const drawPrediction = () => {
        if (!prediction || !prediction.points) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const image = imageRef.current;

        // Set canvas dimensions to match displayed image
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate scale factors
        const scaleX = image.width / image.naturalWidth;
        const scaleY = image.height / image.naturalHeight;

        // Draw polygon
        if (prediction.points && prediction.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(
                prediction.points[0].x * scaleX,
                prediction.points[0].y * scaleY
            );

            for (let i = 1; i < prediction.points.length; i++) {
                ctx.lineTo(
                    prediction.points[i].x * scaleX,
                    prediction.points[i].y * scaleY
                );
            }

            ctx.closePath();
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.fill();

            // Draw prediction text
            const text = `${prediction.prediction} (${(prediction.confidence * 100).toFixed(2)}%)`;
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(10, 10, ctx.measureText(text).width + 20, 30);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, 20, 30);
        }
    };

    useEffect(() => {
        if (prediction && preview) {
            drawPrediction();
        }
    }, [prediction, preview]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
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
            const response = await fetch('http://localhost:8000/api/skin_disease/predict', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Prediction failed');
            }

            const data = await response.json();
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

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Skin Disease Detection</h1>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <p className="text-gray-600 mb-6">
                    Upload a skin image to detect potential skin conditions using our AI model.
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
                            <div className="p-4 rounded-lg bg-blue-100 text-blue-800">
                                <h3 className="font-semibold">Detected Condition:</h3>
                                <p>{prediction.prediction}</p>
                                <p>Confidence: {(prediction.confidence * 100).toFixed(2)}%</p>
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