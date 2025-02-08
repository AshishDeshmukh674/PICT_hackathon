'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function ModelPrediction({ model }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Rest of the component implementation
    // Similar to your existing brain-tumor/page.jsx but using model config
}   