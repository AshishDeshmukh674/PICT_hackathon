'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function DiabeticRetinopathyDetection() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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
            const response = await fetch('http://localhost:8000/api/diabetic_retinopathy/predict', {
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
                confidence: data.confidence
            });
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
            <h1 className="text-3xl font-bold mb-6">Diabetic Retinopathy Detection</h1>

            {/* Information Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-6">About Diabetic Retinopathy</h2>

                {/* Top section with info and first image side by side */}
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    {/* Information section */}
                    <div className="flex-1">
                        <p className="text-gray-600 mb-4">
                            Diabetic retinopathy is a diabetes complication that affects the eyes.
                            It's caused by damage to the blood vessels of the light-sensitive tissue
                            at the back of the eye (retina).
                        </p>
                        <h3 className="text-xl font-semibold mb-2">Severity Levels:</h3>
                        <ul className="list-disc list-inside text-gray-600 mb-4">
                            <li>No DR - Normal retina</li>
                            <li>Mild - Small areas of balloon-like swelling</li>
                            <li>Moderate - More extensive damage</li>
                            <li>Severe - Significant bleeding and vessel damage</li>
                            <li>Proliferative DR - Advanced stage with abnormal vessel growth</li>
                        </ul>
                    </div>

                    {/* First image */}
                    <div className="md:w-1/3 flex flex-col justify-center">
                        <div className="relative">
                            <img
                                src="/ml_model_images/diabetic_retinopathy1.jpg"
                                alt="Normal Retina"
                                className="rounded-lg object-cover w-full h-64 shadow-md"
                            />
                            <p className="text-sm text-center mt-3 font-medium">Diabetic Retinopathy</p>
                        </div>
                    </div>
                </div>

                {/* Second image below, centered and larger */}
                <div className="flex justify-center">
                    <div className="max-w-3xl w-full">
                        <img
                            src="/ml_model_images/diabetic_retinopathy2.png"
                            alt="Severe DR"
                            className="rounded-lg object-contain w-full h-[500px] shadow-lg"
                        />
                        <p className="text-sm text-center mt-4 font-medium">Stages of Diabetic Retinopathy</p>
                    </div>
                </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <p className="text-gray-600 mb-6">
                    Upload a retinal scan image to detect the presence and severity of diabetic retinopathy.
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

                    <div className="space-y-4">
                        {preview && (
                            <div className="relative flex justify-center">
                                <div style={{
                                    maxWidth: '450px',
                                    maxHeight: '450px',
                                    width: '100%',
                                    position: 'relative'
                                }}>
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            maxHeight: '450px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        {prediction && !prediction.error && (
                            <div className={`p-4 rounded-lg ${prediction.prediction !== 'No DR'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                                }`}>
                                <h3 className="font-semibold">
                                    {prediction.prediction}
                                </h3>
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