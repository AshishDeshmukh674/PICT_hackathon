export const healthModels = [
    {
        id: 'brain-tumor',
        name: 'Brain Tumor Detection',
        description: 'Upload brain MRI scans to detect potential tumors',
        endpoint: '/api/brain_tumor/predict',
        icon: '🧠',
        acceptedFileTypes: ['image/*'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
    },
    // {
    //     id: 'pneumonia',
    //     name: 'Pneumonia Detection',
    //     description: 'Upload chest X-rays to detect pneumonia',
    //     endpoint: '/api/pneumonia/predict',
    //     icon: '🫁',
    //     acceptedFileTypes: ['image/*'],
    //     maxFileSize: 5 * 1024 * 1024,
    // },
    {
        id: 'diabetic_retinopathy',
        name: 'Diabetic Retinopathy Detection',
        description: 'Upload retinal images to detect diabetic retinopathy',
        endpoint: '/api/diabetic_retinopathy/predict',
        icon: '👁️',
        acceptedFileTypes: ['image/*'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
    },
    {
        id: 'skin-disease',
        name: 'Skin Disease Detection',
        description: 'Upload skin images to detect potential diseases',
        endpoint: '/api/skin_disease/predict',
        icon: '🔬',
        acceptedFileTypes: ['image/*'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
    },
    {
        id: 'xray-samples',
        name: 'X-Ray Image Analysis',
        description: 'Upload X-ray images for automated analysis and detection',
        endpoint: '/api/xray_samples/predict',
        icon: '🔬',
        acceptedFileTypes: ['image/*'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
    },
    // Add more models here
];
