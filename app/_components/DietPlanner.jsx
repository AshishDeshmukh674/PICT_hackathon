"use client"
import { useState, useEffect } from 'react';
import ChatInterface from '../components/ChatInterface';
import { Button } from '../../components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'react-toastify';

const DietPlanner = () => {
    // State Management
    const [uiState, setUIState] = useState({
        isFormSubmitted: false,
        formData: null,
        iframeHeight: "800px",
        dietPlan: null,
        isGeneratingPDF: false
    });

    // Constants
    const JOTFORM_ID = "250282260962455";
    const JOTFORM_SCRIPT_URL = "https://cdn.jotfor.ms/js/vendor/imageinfo.js";

    // Handle PDF Download
    const handleDownloadPDF = async () => {
        if (!uiState.dietPlan) {
            toast.error("No diet plan available to download");
            return;
        }

        try {
            setUIState(prev => ({ ...prev, isGeneratingPDF: true }));

            const response = await fetch('/api/generate-diet-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dietPlan: uiState.dietPlan,
                    userInfo: uiState.formData
                }),
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            // Create blob from response
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Create temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = 'diet-plan.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("PDF downloaded successfully!");
        } catch (error) {
            console.error('PDF download error:', error);
            toast.error("Failed to download PDF. Please try again.");
        } finally {
            setUIState(prev => ({ ...prev, isGeneratingPDF: false }));
        }
    };

    // Handle incoming messages from JotForm
    const handleJotFormMessage = (event) => {
        if (!event.origin.includes('jotform.com')) return;
        
        console.log("Received message:", event.data);
        
        // Handle iframe height adjustment
        if (typeof event.data === 'string') {
            const [action, height] = event.data.split(':');
            if (action === 'setHeight') {
                setUIState(prev => ({
                    ...prev,
                    iframeHeight: `${parseInt(height) + 30}px`
                }));
            }
        }

        // Handle form submission
        if (isFormSubmissionComplete(event.data)) {
            handleFormSubmission();
        }
    };

    // Check if form submission is complete
    const isFormSubmissionComplete = (data) => {
        return (
            (typeof data === 'object' && data.action === "submission-completed") ||
            (typeof data === 'string' && data.includes('submission-completed'))
        );
    };

    // Process form submission
    const handleFormSubmission = () => {
        console.log("Form submission detected");
        
        try {
            const submissionData = {
                timestamp: new Date().toISOString(),
                formId: JOTFORM_ID
            };
            
            console.log("Form data:", submissionData);
            
            // Transition to chat interface with delay
            setTimeout(() => {
                setUIState(prev => ({
                    ...prev,
                    formData: submissionData,
                    isFormSubmitted: true
                }));
                console.log("Switching to chat interface");
            }, 2000);
        } catch (error) {
            console.error("Error handling form submission:", error);
        }
    };

    // Initialize JotForm
    const initializeJotForm = () => {
        const script = document.createElement('script');
        script.src = JOTFORM_SCRIPT_URL;
        script.async = true;
        document.body.appendChild(script);
    };

    // Setup effect
    useEffect(() => {
        window.addEventListener('message', handleJotFormMessage);
        initializeJotForm();

        return () => window.removeEventListener('message', handleJotFormMessage);
    }, []);

    // Handle diet plan updates from ChatInterface
    const handleDietPlanUpdate = (plan) => {
        setUIState(prev => ({ ...prev, dietPlan: plan }));
    };

    return (
        <div className="min-h-screen p-6 bg-gray-100">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">
                        {uiState.isFormSubmitted ? 'Your AI Diet Assistant' : 'Diet Planner'}
                    </h1>
                    {uiState.isFormSubmitted && uiState.dietPlan && (
                        <Button
                            onClick={handleDownloadPDF}
                            disabled={uiState.isGeneratingPDF}
                            className="flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            {uiState.isGeneratingPDF ? 'Generating PDF...' : 'Download Diet Plan'}
                        </Button>
                    )}
                </div>
                
                {!uiState.isFormSubmitted ? (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <iframe
                            id={`JotFormIFrame-${JOTFORM_ID}`}
                            title="Diet Consultation Form"
                            allowtransparency="true"
                            allow="geolocation; microphone; camera; fullscreen"
                            src={`https://form.jotform.com/${JOTFORM_ID}`}
                            frameBorder="0"
                            scrolling="yes"
                            style={{
                                width: "100%",
                                height: uiState.iframeHeight,
                                border: "none",
                                margin: 0,
                                padding: 0,
                                overflow: "visible",
                                background: "#fff"
                            }}
                        />
                    </div>
                ) : (
                    <div>
                        <p className="text-center text-gray-600 mb-4">
                            Form submitted successfully! Starting your AI diet consultation...
                        </p>
                        <ChatInterface 
                            formData={uiState.formData} 
                            onDietPlanUpdate={handleDietPlanUpdate}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DietPlanner;